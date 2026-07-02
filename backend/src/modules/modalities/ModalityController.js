const { z } = require("zod");
const { ModalityService } = require("./ModalityService");
const { AppError } = require("../../shared/errors/AppError");

const createModalitySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().trim().optional(),
});

const updateModalitySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().trim().optional(),
});

class ModalityController {
  constructor() {
    this.modalityService = new ModalityService();
  }

  async create(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const parsedData = createModalitySchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsedData.error.format(),
      });
    }

    const modality = await this.modalityService.create(
      req.user.schoolId,
      parsedData.data
    );

    return res.status(201).json(modality);
  }

  async list(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const modalities = await this.modalityService.list(req.user.schoolId);
    return res.status(200).json(modalities);
  }

  async show(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params;
    const modality = await this.modalityService.findById(req.user.schoolId, id);

    return res.status(200).json(modality);
  }

  async update(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params;
    const parsedData = updateModalitySchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsedData.error.format(),
      });
    }

    const modality = await this.modalityService.update(
      req.user.schoolId,
      id,
      parsedData.data
    );

    return res.status(200).json(modality);
  }

  async delete(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params;
    await this.modalityService.delete(req.user.schoolId, id);

    return res.status(204).send();
  }
}

module.exports = { ModalityController };
