const { z } = require("zod");
const { LessonService } = require("./LessonService");
const { AppError } = require("../../shared/errors/AppError");

const createLessonSchema = z.object({
  classId: z.string().uuid("ID da turma inválido."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD"),
  timeStart: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Horário de início inválido (HH:MM)"),
  timeEnd: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Horário de término inválido (HH:MM)"),
  type: z.enum(["REGULAR", "EXPERIMENTAL", "PARTICULAR"]),
});

const attendanceRecordSchema = z.object({
  studentId: z.string().uuid("ID da aluna inválido."),
  status: z.enum(["PRESENT", "ABSENT"]),
});

const registerAttendanceSchema = z.object({
  isDraft: z.boolean().optional().default(false),
  records: z.array(attendanceRecordSchema).min(1, "Lista de frequência não pode estar vazia."),
});

const updateLessonSchema = z.object({
  status: z.enum(["SCHEDULED", "CONCLUDED", "CANCELED"]).optional(),
  substituteTeacherId: z.string().uuid("ID da professora substituta inválido.").optional().nullable(),
  timeStart: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Horário de início inválido").optional(),
  timeEnd: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Horário de término inválido").optional(),
});

class LessonController {
  constructor() {
    this.lessonService = new LessonService();
  }

  async list(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { classId, dateStart, dateEnd } = req.query;

    const lessons = await this.lessonService.list(
      req.user.schoolId,
      req.user.role,
      req.user.id,
      { classId, dateStart, dateEnd }
    );

    return res.status(200).json(lessons);
  }

  async findById(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params;
    const lesson = await this.lessonService.findById(req.user.schoolId, id);

    return res.status(200).json(lesson);
  }

  async create(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const parsed = createLessonSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsed.error.format(),
      });
    }

    const lesson = await this.lessonService.createSingleLesson(
      req.user.schoolId,
      req.user.id,
      parsed.data
    );

    return res.status(201).json(lesson);
  }

  async update(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params;
    const parsed = updateLessonSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsed.error.format(),
      });
    }

    const updated = await this.lessonService.updateLesson(
      req.user.schoolId,
      req.user.id,
      id,
      parsed.data
    );

    return res.status(200).json(updated);
  }

  async registerAttendance(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params; // Lesson ID
    const parsed = registerAttendanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsed.error.format(),
      });
    }

    const result = await this.lessonService.registerAttendance(
      req.user.schoolId,
      req.user.id,
      id,
      parsed.data
    );

    return res.status(200).json(result);
  }
}

module.exports = { LessonController };
