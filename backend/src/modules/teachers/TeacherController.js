const { z } = require("zod");
const { TeacherService } = require("./TeacherService");
const { AppError } = require("../../shared/errors/AppError");

const createTeacherSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório."),
  email: z.string().trim().email("Formato de e-mail inválido."),
  password: z.string().min(6, "A senha deve conter no mínimo 6 caracteres."),
});

const updateTeacherSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório."),
  email: z.string().trim().email("Formato de e-mail inválido.").optional(),
  password: z.string().min(6, "A senha deve conter no mínimo 6 caracteres.").optional().nullable(),
});

class TeacherController {
  constructor() {
    this.teacherService = new TeacherService();
  }

  async create(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const parsed = createTeacherSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsed.error.format(),
      });
    }

    const teacher = await this.teacherService.create(
      req.user.schoolId,
      parsed.data
    );

    return res.status(201).json(teacher);
  }

  async list(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const teachers = await this.teacherService.list(req.user.schoolId);
    return res.status(200).json(teachers);
  }

  async update(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params;
    const parsed = updateTeacherSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsed.error.format(),
      });
    }

    const updated = await this.teacherService.update(
      req.user.schoolId,
      req.user.id,
      id,
      parsed.data
    );

    return res.status(200).json(updated);
  }

  async delete(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params;
    await this.teacherService.delete(req.user.schoolId, req.user.id, id);

    return res.status(204).send();
  }
}

module.exports = { TeacherController };
