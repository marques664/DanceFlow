const { prisma } = require("../../shared/database/prisma");

class AuditLogService {
  async log(schoolId, userId, action, details = {}) {
    const { contextStorage } = require("../../shared/utils/context");
    const store = contextStorage.getStore() || {};

    const resolvedSchoolId = schoolId || store.schoolId;
    const resolvedUserId = userId || store.userId;

    if (!resolvedSchoolId || !resolvedUserId) {
      console.warn("Could not determine schoolId or userId for audit log:", action);
      return;
    }

    try {
      return await prisma.auditLog.create({
        data: {
          schoolId: resolvedSchoolId,
          userId: resolvedUserId,
          action,
          details: typeof details === "string" ? details : JSON.stringify(details),
        },
      });
    } catch (err) {
      console.error("Error creating audit log:", err);
    }
  }

  async listBySchool(schoolId, { action, search }) {
    const where = { schoolId };

    if (action) {
      where.action = action;
    }

    if (search) {
      where.OR = [
        {
          user: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          details: { contains: search, mode: "insensitive" },
        },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return logs;
  }

  async listGlobal({ schoolId, action, search }) {
    const where = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }
    if (action) {
      where.action = action;
    }
    if (search) {
      where.OR = [
        {
          user: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          details: { contains: search, mode: "insensitive" },
        },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 150,
    });

    return logs;
  }
}

module.exports = { AuditLogService };
