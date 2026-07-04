const { prisma } = require("../../shared/database/prisma");
const { AppError } = require("../../shared/errors/AppError");
const bcrypt = require("bcryptjs");

class TeacherService {
  async create(schoolId, { name, email, password }) {
    // 1. Check if email is taken
    const emailExists = await prisma.user.findUnique({
      where: { email }
    });
    if (emailExists) {
      throw new AppError("E-mail address already in use.", 400);
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 8);

    // 3. Create teacher user
    const teacher = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "TEACHER",
        schoolId,
        isActive: true
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

    return teacher;
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
