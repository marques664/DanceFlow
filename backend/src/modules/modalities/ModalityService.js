const { prisma } = require("../../shared/database/prisma");
const { AppError } = require("../../shared/errors/AppError");

class ModalityService {
  async create(schoolId, { name, description }) {
    // 1. Check if name is already in use in this school
    const existingModality = await prisma.modality.findUnique({
      where: {
        schoolId_name: {
          schoolId,
          name,
        },
      },
    });

    if (existingModality) {
      if (existingModality.isActive) {
        throw new AppError("A modality with this name already exists.", 400);
      } else {
        // Reactivate soft-deleted modality and update description
        const updated = await prisma.modality.update({
          where: { id: existingModality.id },
          data: {
            isActive: true,
            description: description !== undefined ? description : existingModality.description,
          },
        });
        return updated;
      }
    }

    // 2. Create new modality
    const modality = await prisma.modality.create({
      data: {
        name,
        description,
        schoolId,
        isActive: true,
      },
    });

    return modality;
  }

  async list(schoolId) {
    return prisma.modality.findMany({
      where: {
        schoolId,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async findById(schoolId, id) {
    const modality = await prisma.modality.findFirst({
      where: {
        id,
        schoolId,
        isActive: true,
      },
    });

    if (!modality) {
      throw new AppError("Modality not found.", 404);
    }

    return modality;
  }

  async update(schoolId, id, { name, description }) {
    // 1. Check if modality exists
    const modality = await prisma.modality.findFirst({
      where: {
        id,
        schoolId,
        isActive: true,
      },
    });

    if (!modality) {
      throw new AppError("Modality not found.", 404);
    }

    // 2. Check name conflicts
    if (name !== modality.name) {
      const nameConflict = await prisma.modality.findUnique({
        where: {
          schoolId_name: {
            schoolId,
            name,
          },
        },
      });

      if (nameConflict) {
        if (nameConflict.isActive) {
          throw new AppError("A modality with this name already exists.", 400);
        } else {
          // If conflict is with inactive, clean up the inactive one first to prevent unique constraint conflict
          await prisma.modality.delete({
            where: { id: nameConflict.id },
          });
        }
      }
    }

    // 3. Update modality
    const updatedModality = await prisma.modality.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    return updatedModality;
  }

  async delete(schoolId, id) {
    // 1. Find modality
    const modality = await prisma.modality.findFirst({
      where: {
        id,
        schoolId,
        isActive: true,
      },
    });

    if (!modality) {
      throw new AppError("Modality not found.", 404);
    }

    // 2. Logical delete
    await prisma.modality.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}

module.exports = { ModalityService };
