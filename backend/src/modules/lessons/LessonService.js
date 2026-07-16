const { prisma } = require("../../shared/database/prisma");
const { AppError } = require("../../shared/errors/AppError");

class LessonService {
  async list(schoolId, userRole, userId, { classId, dateStart, dateEnd }) {
    // If querying a single class on a single day, check if we need to auto-create scheduled lessons on-demand
    if (classId && dateStart && dateStart === dateEnd) {
      const existingLessons = await prisma.lesson.findMany({
        where: {
          classId,
          date: new Date(dateStart + "T00:00:00.000Z"),
        },
      });

      if (existingLessons.length === 0) {
        const dbClass = await prisma.class.findFirst({
          where: { id: classId, schoolId, isActive: true },
          include: { schedules: true },
        });

        if (dbClass) {
          const dayMap = {
            0: "Domingo",
            1: "Segunda",
            2: "Terça",
            3: "Quarta",
            4: "Quinta",
            5: "Sexta",
            6: "Sábado",
          };
          const dateObj = new Date(dateStart + "T12:00:00");
          const dayOfWeekName = dayMap[dateObj.getDay()];

          const matchedSchedules = dbClass.schedules.filter(
            (s) => s.dayOfWeek === dayOfWeekName
          );

          if (matchedSchedules.length > 0) {
            const newLessonsData = matchedSchedules.map((sch) => ({
              classId,
              date: new Date(dateStart + "T00:00:00.000Z"),
              timeStart: sch.timeStart,
              timeEnd: sch.timeEnd,
              type: "REGULAR",
              status: "SCHEDULED",
              scheduleId: sch.id,
            }));

            await prisma.lesson.createMany({
              data: newLessonsData,
            });
          }
        }
      }
    }

    const where = {
      class: {
        schoolId,
      },
    };

    // Filter by classId if provided
    if (classId) {
      where.classId = classId;
    }

    // Filter by date range if provided
    if (dateStart || dateEnd) {
      where.date = {};
      if (dateStart) {
        where.date.gte = new Date(dateStart);
      }
      if (dateEnd) {
        where.date.lte = new Date(dateEnd);
      }
    }

    // Filter for teachers: access only associated classes (Rule 3.1 & 3.6)
    if (userRole === "TEACHER") {
      where.OR = [
        { class: { mainTeacherId: userId } },
        { class: { teachers: { some: { teacherId: userId } } } },
        { substituteTeacherId: userId },
      ];
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        class: {
          include: {
            modality: true,
            mainTeacher: true,
            teachers: {
              include: { teacher: true },
            },
          },
        },
        substituteTeacher: true,
      },
      orderBy: [
        { date: "asc" },
        { timeStart: "asc" },
      ],
    });

    return lessons.map((l) => ({
      id: l.id,
      className: l.class.name,
      classId: l.classId,
      modality: l.class.modality.name,
      date: l.date.toISOString().split("T")[0],
      timeStart: l.timeStart,
      timeEnd: l.timeEnd,
      type: l.type,
      status: l.status,
      mainTeacher: l.class.mainTeacher.name,
      substituteTeacher: l.substituteTeacher ? l.substituteTeacher.name : null,
      secondaryTeachers: l.class.teachers.map((t) => t.teacher.name),
    }));
  }

  async findById(schoolId, id) {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id,
        class: { schoolId },
      },
      include: {
        class: {
          include: {
            modality: true,
            mainTeacher: true,
            teachers: {
              include: { teacher: true },
            },
            students: {
              include: {
                student: {
                  include: {
                    guardians: {
                      include: { guardian: true }
                    }
                  }
                },
                schedules: true
              }
            }
          },
        },
        substituteTeacher: true,
        attendances: true,
      },
    });

    if (!lesson) {
      throw new AppError("Lesson not found.", 404);
    }

    // Get list of all enrolled students in the class, filtered by schedule if REGULAR
    const eligibleStudents = lesson.class.students
      .filter((cs) => {
        if (lesson.type === "REGULAR" && lesson.scheduleId) {
          return cs.schedules.some((s) => s.id === lesson.scheduleId);
        }
        return true;
      })
      .map((cs) => {
        const att = lesson.attendances.find((a) => a.studentId === cs.student.id);
        return {
          id: cs.student.id,
          name: cs.student.name,
          plan: cs.student.plan,
          isActive: cs.student.isActive,
          attendanceStatus: att ? att.status : null, // "PRESENT" | "ABSENT" | null
          attendanceIsDraft: att ? att.isDraft : false,
        };
      });

    return {
      id: lesson.id,
      className: lesson.class.name,
      classId: lesson.classId,
      modality: lesson.class.modality.name,
      date: lesson.date.toISOString().split("T")[0],
      timeStart: lesson.timeStart,
      timeEnd: lesson.timeEnd,
      type: lesson.type,
      status: lesson.status,
      mainTeacher: lesson.class.mainTeacher.name,
      substituteTeacher: lesson.substituteTeacher ? lesson.substituteTeacher.name : null,
      students: eligibleStudents,
    };
  }

  async registerAttendance(schoolId, userId, lessonId, { isDraft = false, records = [] }) {
    // 1. Verify lesson belongs to the school
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        class: { schoolId },
      },
      include: {
        class: true,
      },
    });

    if (!lesson) {
      throw new AppError("Lesson not found.", 404);
    }

    return prisma.$transaction(async (tx) => {
      // 2. Insert or update attendance records
      for (const rec of records) {
        await tx.attendance.upsert({
          where: {
            lessonId_studentId: {
              lessonId,
              studentId: rec.studentId,
            },
          },
          update: {
            status: rec.status,
            isDraft,
          },
          create: {
            lessonId,
            studentId: rec.studentId,
            status: rec.status,
            isDraft,
          },
        });
      }

      // 3. Update lesson status to CONCLUDED if not draft
      const newStatus = isDraft ? "SCHEDULED" : "CONCLUDED";
      await tx.lesson.update({
        where: { id: lessonId },
        data: { status: newStatus },
      });

      // 4. Create Audit Log (Rule 3.7)
      await tx.auditLog.create({
        data: {
          schoolId,
          userId,
          action: "REGISTER_ATTENDANCE",
          details: JSON.stringify({
            lessonId,
            className: lesson.class.name,
            date: lesson.date.toISOString().split("T")[0],
            isDraft,
            recordsCount: records.length,
          }),
        },
      });

      return {
        lessonId,
        status: newStatus,
        recordsUpdated: records.length,
      };
    });
  }

  async createSingleLesson(schoolId, userId, { classId, date, timeStart, timeEnd, type }) {
    // Verify class
    const c = await prisma.class.findFirst({
      where: { id: classId, schoolId, isActive: true }
    });
    if (!c) {
      throw new AppError("Class not found.", 404);
    }

    return prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.create({
        data: {
          classId,
          date: new Date(date),
          timeStart,
          timeEnd,
          type,
          status: "SCHEDULED"
        }
      });

      await tx.auditLog.create({
        data: {
          schoolId,
          userId,
          action: "SCHEDULE_LESSON",
          details: JSON.stringify({
            lessonId: lesson.id,
            className: c.name,
            date: date,
            type,
          }),
        },
      });

      return lesson;
    });
  }

  async updateLesson(schoolId, userId, id, { status, substituteTeacherId, timeStart, timeEnd }) {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id,
        class: { schoolId },
      },
    });

    if (!lesson) {
      throw new AppError("Lesson not found.", 404);
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (timeStart) updateData.timeStart = timeStart;
    if (timeEnd) updateData.timeEnd = timeEnd;
    
    if (substituteTeacherId) {
      // Verify substitute teacher exists and is in the school
      const teacher = await prisma.user.findFirst({
        where: { id: substituteTeacherId, schoolId, role: "TEACHER", isActive: true }
      });
      if (!teacher) {
        throw new AppError("Substitute teacher not found in school.", 404);
      }
      updateData.substituteTeacherId = substituteTeacherId;
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.lesson.update({
        where: { id },
        data: updateData,
        include: { substituteTeacher: true }
      });

      await tx.auditLog.create({
        data: {
          schoolId,
          userId,
          action: "UPDATE_LESSON",
          details: JSON.stringify({
            lessonId: id,
            updates: Object.keys(updateData),
          }),
        },
      });

      return updated;
    });
  }
}

module.exports = { LessonService };
