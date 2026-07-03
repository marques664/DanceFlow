const { Router } = require("express");
const { prisma } = require("../../shared/database/prisma");
const { ensureAuthenticated } = require("../../shared/middlewares/auth");

const dashboardRouter = Router();

dashboardRouter.get("/stats", ensureAuthenticated, async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;

    // 1. Get counts
    const activeStudentsCount = await prisma.student.count({
      where: { schoolId, isActive: true }
    });

    const activeClassesCount = await prisma.class.count({
      where: { schoolId, isActive: true }
    });

    const concludedLessonsCount = await prisma.lesson.count({
      where: {
        class: { schoolId },
        status: "CONCLUDED"
      }
    });

    // 2. Compute attendance rate warnings for each student
    const activeStudents = await prisma.student.findMany({
      where: { schoolId, isActive: true },
      include: {
        attendances: {
          where: { isDraft: false }
        }
      }
    });

    const warnings = [];
    let totalPresents = 0;
    let totalRecords = 0;

    for (const student of activeStudents) {
      const records = student.attendances;
      if (records.length === 0) continue;

      const presents = records.filter(r => r.status === "PRESENT").length;
      const total = records.length;
      
      totalPresents += presents;
      totalRecords += total;

      const rate = Math.round((presents / total) * 100);

      if (rate < 80) {
        warnings.push({
          id: student.id,
          name: student.name,
          plan: student.plan,
          attendanceRate: rate,
          classification: rate < 50 ? "Crítica" : "Atenção",
          presents,
          totalLessons: total
        });
      }
    }

    const averageAttendance = totalRecords > 0 ? Math.round((totalPresents / totalRecords) * 100) : 100;

    // Sort by rate asc (critical first)
    warnings.sort((a, b) => a.attendanceRate - b.attendanceRate);

    return res.status(200).json({
      activeStudents: activeStudentsCount,
      activeClasses: activeClassesCount,
      concludedLessons: concludedLessonsCount,
      averageAttendance,
      lowAttendanceWarnings: warnings
    });
  } catch (err) {
    next(err);
  }
});

module.exports = { dashboardRouter };
