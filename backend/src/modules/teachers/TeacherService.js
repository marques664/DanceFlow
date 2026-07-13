const { prisma } = require("../../shared/database/prisma");
const { AppError } = require("../../shared/errors/AppError");
const { emailService } = require("../../shared/services/email");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

class TeacherService {
  async create(schoolId, userId, { name, email }) {
    // 1. Check if email is taken
    const emailExists = await prisma.user.findUnique({
      where: { email }
    });
    if (emailExists) {
      throw new AppError("E-mail address already in use.", 400);
    }

    // 2. Fetch school to get name and slug
    const school = await prisma.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      throw new AppError("School not found.", 404);
    }

    // 3. Create teacher user and token in transaction
    const result = await prisma.$transaction(async (tx) => {
      const teacherUser = await tx.user.create({
        data: {
          name,
          email,
          password: "", // Blank initially, set during activation
          role: "TEACHER",
          schoolId,
          isActive: true // Active for admin management, but login blocked by blank password
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      const tokenRecord = await tx.activationToken.create({
        data: {
          email,
          schoolId,
          token,
          expiresAt
        }
      });

      // Register Audit Log
      await tx.auditLog.create({
        data: {
          schoolId,
          userId,
          action: "CREATE_TEACHER",
          details: JSON.stringify({
            teacherId: teacherUser.id,
            teacherName: name,
            teacherEmail: email
          })
        }
      });

      return { teacherUser, tokenRecord };
    });

    // 4. Build Activation URL
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (school.slug) {
      if (frontendUrl.includes('localhost')) {
        frontendUrl = frontendUrl.replace('localhost', `${school.slug}.localhost`);
      } else {
        frontendUrl = frontendUrl.replace('://', `://${school.slug}.`);
      }
    }
    const activationUrl = `${frontendUrl}/ativar?token=${result.tokenRecord.token}`;

    // 5. Send activation email
    await emailService.sendActivationEmail(email, school.name, activationUrl);

    return {
      ...result.teacherUser,
      activationUrl
    };
  }

  async list(schoolId) {
    const teachers = await prisma.user.findMany({
      where: {
        schoolId,
        role: "TEACHER",
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        name: "asc"
      }
    });

    return teachers;
  }

  async update(schoolId, userId, id, { name, email, password }) {
    const teacher = await prisma.user.findFirst({
      where: { id, schoolId, role: "TEACHER", isActive: true }
    });

    if (!teacher) {
      throw new AppError("Teacher not found.", 404);
    }

    const updateData = { name };

    if (email && email !== teacher.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });
      if (emailExists) {
        throw new AppError("E-mail address already in use.", 400);
      }
      updateData.email = email;
    }

    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 8);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      });

      await tx.auditLog.create({
        data: {
          schoolId,
          userId,
          action: "UPDATE_TEACHER",
          details: JSON.stringify({
            teacherId: id,
            updatedFields: Object.keys(updateData).filter(k => k !== "password")
          })
        }
      });

      return updated;
    });
  }

  async delete(schoolId, userId, id) {
    const teacher = await prisma.user.findFirst({
      where: { id, schoolId, role: "TEACHER", isActive: true }
    });

    if (!teacher) {
      throw new AppError("Teacher not found.", 404);
    }

    return prisma.$transaction(async (tx) => {
      // Soft delete (logical deletion - Spec 9.7)
      await tx.user.update({
        where: { id },
        data: { isActive: false }
      });

      await tx.auditLog.create({
        data: {
          schoolId,
          userId,
          action: "INACTIVATE_TEACHER",
          details: JSON.stringify({
            teacherId: id,
            teacherName: teacher.name
          })
        }
      });
    });
  }
}

module.exports = { TeacherService };
