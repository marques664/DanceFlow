const { prisma } = require("../../shared/database/prisma");
const { AppError } = require("../../shared/errors/AppError");

class ClassService {
  generateLessonsForClass(classId, schedules) {
    const lessons = [];
    const start = new Date();
    
    const dayMap = {
      "Domingo": 0,
      "Segunda": 1,
      "Terça": 2,
      "Quarta": 3,
      "Quinta": 4,
      "Sexta": 5,
      "Sábado": 6
    };

    // Generate lessons for the next 30 days
    for (let i = 0; i < 30; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      
      const currentDayName = Object.keys(dayMap).find(key => dayMap[key] === current.getDay());
      const matchedSchedules = schedules.filter(sch => sch.dayOfWeek === currentDayName);
      
      for (const sch of matchedSchedules) {
        lessons.push({
          classId,
          date: new Date(current.toISOString().substring(0, 10) + "T00:00:00.000Z"),
          timeStart: sch.timeStart,
          timeEnd: sch.timeEnd,
          type: "REGULAR",
          status: "SCHEDULED",
          scheduleId: sch.id
        });
      }
    }
    return lessons;
  }

  async create(schoolId, userId, { name, modalityId, mainTeacherId, secondaryTeachers = [], schedules = [] }) {
    // 1. Verify Modality
    const modality = await prisma.modality.findFirst({
      where: { id: modalityId, schoolId, isActive: true }
    });
    if (!modality) {
      throw new AppError("Modality not found.", 404);
    }

    // 2. Verify Main Teacher
    const mainTeacher = await prisma.user.findFirst({
      where: { id: mainTeacherId, schoolId, role: "TEACHER", isActive: true }
    });
    if (!mainTeacher) {
      throw new AppError("Main teacher not found.", 404);
    }

    // Perform transaction
    return prisma.$transaction(async (tx) => {
      // 3. Create Class
      const dbClass = await tx.class.create({
        data: {
          name,
          schoolId,
          modalityId,
          mainTeacherId,
          isActive: true
        }
      });

      // 4. Create Schedules
      const createdSchedules = [];
      for (const sch of schedules) {
        const schedule = await tx.classSchedule.create({
          data: {
            classId: dbClass.id,
            dayOfWeek: sch.dayOfWeek,
            timeStart: sch.timeStart,
            timeEnd: sch.timeEnd
          }
        });
        createdSchedules.push(schedule);
      }

      // 5. Link Secondary Teachers
      for (const secTeacherName of secondaryTeachers) {
        // Look up teacher in school by name
        const teacher = await tx.user.findFirst({
          where: { name: secTeacherName, schoolId, role: "TEACHER", isActive: true }
        });
        if (teacher) {
          await tx.classTeacher.create({
            data: {
              classId: dbClass.id,
              teacherId: teacher.id
            }
          });
        }
      }

      // 6. Generate lessons
      const lessonsData = this.generateLessonsForClass(dbClass.id, createdSchedules);
      if (lessonsData.length > 0) {
        await tx.lesson.createMany({
          data: lessonsData
        });
      }

      await tx.auditLog.create({
        data: {
          schoolId,
          userId,
          action: "CREATE_CLASS",
          details: JSON.stringify({
            classId: dbClass.id,
            className: dbClass.name
          })
        }
      });

      return {
        id: dbClass.id,
        name: dbClass.name,
        modality: modality.name,
        mainTeacher: mainTeacher.name,
        schedules: createdSchedules
      };
    });
  }

  async list(schoolId) {
    const classes = await prisma.class.findMany({
      where: {
        schoolId,
        isActive: true
      },
      include: {
        modality: true,
        mainTeacher: true,
        schedules: true,
        teachers: {
          include: {
            teacher: true
          }
        },
        students: true
      },
      orderBy: {
        name: "asc"
      }
    });

    return classes.map(c => {
      // Format schedule text (e.g. "Segunda e Quarta, 14:00 - 15:00" or "Segunda, 09:00 - 10:00 | Quarta, 17:00 - 18:00")
      let scheduleText = "Sem horário definido";
      if (c.schedules.length > 0) {
        const groups = {};
        for (const s of c.schedules) {
          const timeSlot = `${s.timeStart} - ${s.timeEnd}`;
          if (!groups[timeSlot]) {
            groups[timeSlot] = [];
          }
          groups[timeSlot].push(s.dayOfWeek);
        }
        const parts = Object.entries(groups).map(([timeSlot, days]) => {
          return `${days.join(' e ')}, ${timeSlot}`;
        });
        scheduleText = parts.join(' | ');
      }

      return {
        id: c.id,
        name: c.name,
        modality: c.modality.name,
        schedule: scheduleText,
        mainTeacher: c.mainTeacher.name,
        secondaryTeachers: c.teachers.map(t => t.teacher.name),
        studentCount: c.students.length,
        status: c.isActive ? "Ativa" : "Inativa",
        schedules: c.schedules
      };
    });
  }

  async findById(schoolId, id) {
    const c = await prisma.class.findFirst({
      where: { id, schoolId, isActive: true },
      include: {
        modality: true,
        mainTeacher: true,
        schedules: true,
        teachers: {
          include: { teacher: true }
        },
        students: {
          include: {
            student: true,
            schedules: true
          }
        }
      }
    });

    if (!c) {
      throw new AppError("Class not found.", 404);
    }

    return c;
  }

  async delete(schoolId, userId, id) {
    const c = await prisma.class.findFirst({
      where: { id, schoolId, isActive: true }
    });

    if (!c) {
      throw new AppError("Class not found.", 404);
    }

    return prisma.$transaction(async (tx) => {
      // Soft delete class (logical deletion - Spec 9.7)
      await tx.class.update({
        where: { id },
        data: { isActive: false }
      });

      await tx.auditLog.create({
        data: {
          schoolId,
          userId,
          action: "INACTIVATE_CLASS",
          details: JSON.stringify({
            classId: id,
            className: c.name
          })
        }
      });
    });
  }

  async enrollStudent(schoolId, classId, studentId, scheduleIds = []) {
    const c = await prisma.class.findFirst({
      where: { id: classId, schoolId, isActive: true }
    });
    if (!c) {
      throw new AppError("Class not found.", 404);
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId, isActive: true }
    });
    if (!student) {
      throw new AppError("Student not found.", 404);
    }

    let targetScheduleIds = scheduleIds;
    if (!targetScheduleIds || targetScheduleIds.length === 0) {
      const allSchedules = await prisma.classSchedule.findMany({
        where: { classId }
      });
      targetScheduleIds = allSchedules.map(s => s.id);
    } else {
      // Validate that all scheduleIds belong to this class
      const schedulesCount = await prisma.classSchedule.count({
        where: {
          id: { in: targetScheduleIds },
          classId
        }
      });
      if (schedulesCount !== targetScheduleIds.length) {
        throw new AppError("One or more schedule IDs do not belong to this class.", 400);
      }
    }

    // Check if already enrolled
    const enrollment = await prisma.classStudent.findUnique({
      where: {
        classId_studentId: { classId, studentId }
      }
    });

    if (enrollment) {
      return prisma.classStudent.update({
        where: {
          classId_studentId: { classId, studentId }
        },
        data: {
          schedules: {
            set: targetScheduleIds.map(id => ({ id }))
          }
        },
        include: {
          schedules: true
        }
      });
    }

    // Create enrollment link
    return prisma.classStudent.create({
      data: {
        classId,
        studentId,
        schedules: {
          connect: targetScheduleIds.map(id => ({ id }))
        }
      },
      include: {
        schedules: true
      }
    });
  }

  async listEnrolledStudents(schoolId, classId) {
    const c = await prisma.class.findFirst({
      where: { id: classId, schoolId, isActive: true }
    });
    if (!c) {
      throw new AppError("Class not found.", 404);
    }

    const enrollments = await prisma.classStudent.findMany({
      where: { classId },
      include: {
        student: true,
        schedules: true
      }
    });

    return enrollments.map(e => ({
      id: e.student.id,
      name: e.student.name,
      plan: e.student.plan,
      isActive: e.student.isActive,
      schedules: e.schedules.map(s => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        timeStart: s.timeStart,
        timeEnd: s.timeEnd
      }))
    }));
  }
}

module.exports = { ClassService };
