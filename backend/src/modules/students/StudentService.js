const { prisma } = require("../../shared/database/prisma");
const { AppError } = require("../../shared/errors/AppError");

class StudentService {
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  async create(schoolId, { name, birthDate, phone, notes, plan, guardian }) {
    // Perform operations in a transaction
    return prisma.$transaction(async (tx) => {
      // 1. Create the student
      const student = await tx.student.create({
        data: {
          name,
          birthDate: new Date(birthDate),
          phone,
          notes,
          plan,
          schoolId,
          isActive: true,
        },
      });

      // 2. Find or create the guardian (by name and phone match)
      let dbGuardian = await tx.guardian.findFirst({
        where: {
          name: guardian.name,
          phone: guardian.phone,
        },
      });

      if (!dbGuardian) {
        dbGuardian = await tx.guardian.create({
          data: {
            name: guardian.name,
            phone: guardian.phone,
            email: guardian.email,
          },
        });
      } else if (guardian.email && dbGuardian.email !== guardian.email) {
        // Update email if provided and different
        dbGuardian = await tx.guardian.update({
          where: { id: dbGuardian.id },
          data: { email: guardian.email },
        });
      }

      // 3. Link student and guardian
      await tx.studentGuardian.create({
        data: {
          studentId: student.id,
          guardianId: dbGuardian.id,
          kinship: guardian.kinship,
        },
      });

      return {
        ...student,
        age: this.calculateAge(student.birthDate),
        guardian: {
          id: dbGuardian.id,
          name: dbGuardian.name,
          phone: dbGuardian.phone,
          email: dbGuardian.email,
          kinship: guardian.kinship,
        },
      };
    });
  }

  async list(schoolId) {
    const students = await prisma.student.findMany({
      where: {
        schoolId,
        isActive: true,
      },
      include: {
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return students.map((s) => {
      // Find the primary guardian connection
      const mainLink = s.guardians[0];
      return {
        id: s.id,
        name: s.name,
        birthDate: s.birthDate,
        age: this.calculateAge(s.birthDate),
        phone: s.phone,
        notes: s.notes,
        plan: s.plan,
        status: s.isActive ? "Ativa" : "Inativa",
        guardian: mainLink ? {
          id: mainLink.guardian.id,
          name: mainLink.guardian.name,
          phone: mainLink.guardian.phone,
          email: mainLink.guardian.email,
          kinship: mainLink.kinship,
        } : null,
      };
    });
  }

  async findById(schoolId, id) {
    const student = await prisma.student.findFirst({
      where: {
        id,
        schoolId,
        isActive: true,
      },
      include: {
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
    });

    if (!student) {
      throw new AppError("Student not found.", 404);
    }

    const mainLink = student.guardians[0];
    return {
      id: student.id,
      name: student.name,
      birthDate: student.birthDate,
      age: this.calculateAge(student.birthDate),
      phone: student.phone,
      notes: student.notes,
      plan: student.plan,
      status: student.isActive ? "Ativa" : "Inativa",
      guardian: mainLink ? {
        id: mainLink.guardian.id,
        name: mainLink.guardian.name,
        phone: mainLink.guardian.phone,
        email: mainLink.guardian.email,
        kinship: mainLink.kinship,
      } : null,
    };
  }

  async update(schoolId, id, { name, birthDate, phone, notes, plan, guardian }) {
    return prisma.$transaction(async (tx) => {
      // 1. Check if student exists
      const student = await tx.student.findFirst({
        where: {
          id,
          schoolId,
          isActive: true,
        },
        include: {
          guardians: true,
        },
      });

      if (!student) {
        throw new AppError("Student not found.", 404);
      }

      // 2. Update student fields
      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          name,
          birthDate: birthDate ? new Date(birthDate) : undefined,
          phone,
          notes,
          plan,
        },
      });

      // 3. Update guardian if provided
      let returnGuardian = null;
      if (guardian) {
        const existingLink = student.guardians[0];

        if (existingLink) {
          // Update existing guardian info
          const updatedGuardian = await tx.guardian.update({
            where: { id: existingLink.guardianId },
            data: {
              name: guardian.name,
              phone: guardian.phone,
              email: guardian.email,
            },
          });

          // Update kinship in the connection
          const updatedLink = await tx.studentGuardian.update({
            where: {
              studentId_guardianId: {
                studentId: id,
                guardianId: existingLink.guardianId,
              },
            },
            data: {
              kinship: guardian.kinship,
            },
          });

          returnGuardian = {
            id: updatedGuardian.id,
            name: updatedGuardian.name,
            phone: updatedGuardian.phone,
            email: updatedGuardian.email,
            kinship: updatedLink.kinship,
          };
        } else {
          // Create and link new guardian
          const newGuardian = await tx.guardian.create({
            data: {
              name: guardian.name,
              phone: guardian.phone,
              email: guardian.email,
            },
          });

          await tx.studentGuardian.create({
            data: {
              studentId: id,
              guardianId: newGuardian.id,
              kinship: guardian.kinship,
            },
          });

          returnGuardian = {
            id: newGuardian.id,
            name: newGuardian.name,
            phone: newGuardian.phone,
            email: newGuardian.email,
            kinship: guardian.kinship,
          };
        }
      }

      return {
        ...updatedStudent,
        age: this.calculateAge(updatedStudent.birthDate),
        guardian: returnGuardian,
      };
    });
  }

  async delete(schoolId, id) {
    // 1. Check if student exists
    const student = await prisma.student.findFirst({
      where: {
        id,
        schoolId,
        isActive: true,
      },
    });

    if (!student) {
      throw new AppError("Student not found.", 404);
    }

    // 2. Logical delete (Soft delete - Spec 3.2 & 9.7)
    await prisma.student.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}

module.exports = { StudentService };
