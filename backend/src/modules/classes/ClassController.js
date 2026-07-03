const { z } = require("zod");
const { ClassService } = require("./ClassService");
const { AppError } = require("../../shared/errors/AppError");

const dayOfWeekSchema = z.enum([
  "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"
], {
  errorMap: () => ({ message: "Dia da semana inválido." }),
});

const scheduleSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  timeStart: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora de início inválido (HH:MM)"),
  timeEnd: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora de término inválido (HH:MM)"),
});

const createClassSchema = z.object({
  name: z.string().trim().min(1, "O nome da turma é obrigatório."),
  modalityId: z.string().uuid("ID da modalidade inválido."),
  mainTeacherId: z.string().uuid("ID da professora principal inválido."),
  secondaryTeachers: z.array(z.string()).optional(),
  schedules: z.array(scheduleSchema).min(1, "É necessário configurar ao menos um horário para a turma."),
});

const enrollStudentSchema = z.object({
  studentId: z.string().uuid("ID da aluna inválido."),
});

class ClassController {
  constructor() {
    this.classService = new ClassService();
  }

  async create(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const parsedData = createClassSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsedData.error.format(),
      });
    }

    const newClass = await this.classService.create(
      req.user.schoolId,
      parsedData.data
    );

    return res.status(201).json(newClass);
  }

  async list(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const classes = await this.classService.list(req.user.schoolId);
    return res.status(200).json(classes);
  }

  async delete(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params;
    await this.classService.delete(req.user.schoolId, id);

    return res.status(204).send();
  }

  async enrollStudent(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params; // Class ID
    const parsedData = enrollStudentSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsedData.error.format(),
      });
    }

    const enrollment = await this.classService.enrollStudent(
      req.user.schoolId,
      id,
      parsedData.data.studentId
    );

    return res.status(201).json(enrollment);
  }

  async listEnrolledStudents(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params; // Class ID
    const students = await this.classService.listEnrolledStudents(
      req.user.schoolId,
      id
    );

    return res.status(200).json(students);
  }
}

module.exports = { ClassController };
