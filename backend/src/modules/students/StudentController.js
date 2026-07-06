const { z } = require("zod");
const { StudentService } = require("./StudentService");
const { AppError } = require("../../shared/errors/AppError");

const studentPlanSchema = z.enum(["Mensal", "Semestral", "Anual"], {
  errorMap: () => ({ message: "O plano deve ser Mensal, Semestral ou Anual." }),
});

const kinshipSchema = z.enum(["Mãe", "Pai", "Avó/Avô", "Tio/Tia", "Outro"], {
  errorMap: () => ({ message: "Parentesco inválido." }),
});

const guardianSchema = z.object({
  name: z.string().trim().min(1, "O nome do responsável é obrigatório."),
  phone: z.string().trim().min(1, "O telefone do responsável é obrigatório."),
  email: z.string().trim().email("Formato de e-mail inválido.").optional().or(z.literal("")),
  kinship: kinshipSchema,
});

const createStudentSchema = z.object({
  name: z.string().trim().min(1, "O nome da aluna é obrigatório."),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data de nascimento inválida.",
  }),
  phone: z.string().trim().min(1, "O telefone é obrigatório."),
  notes: z.string().trim().optional(),
  plan: studentPlanSchema,
  guardian: guardianSchema.optional().nullable(),
});

const updateStudentSchema = z.object({
  name: z.string().trim().min(1, "O nome da aluna é obrigatório.").optional(),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data de nascimento inválida.",
  }).optional(),
  phone: z.string().trim().min(1, "O telefone é obrigatório.").optional(),
  notes: z.string().trim().optional(),
  plan: studentPlanSchema.optional(),
  guardian: guardianSchema.optional().nullable(),
});

class StudentController {
  constructor() {
    this.studentService = new StudentService();
  }

  async create(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const parsedData = createStudentSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsedData.error.format(),
      });
    }

    const student = await this.studentService.create(
      req.user.schoolId,
      parsedData.data
    );

    return res.status(201).json(student);
  }

  async list(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const students = await this.studentService.list(req.user.schoolId);
    return res.status(200).json(students);
  }

  async show(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params;
    const student = await this.studentService.findById(req.user.schoolId, id);

    return res.status(200).json(student);
  }

  async update(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params;
    const parsedData = updateStudentSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsedData.error.format(),
      });
    }

    const student = await this.studentService.update(
      req.user.schoolId,
      req.user.id,
      id,
      parsedData.data
    );

    return res.status(200).json(student);
  }

  async delete(req, res) {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { id } = req.params;
    await this.studentService.delete(req.user.schoolId, req.user.id, id);

    return res.status(204).send();
  }
}

module.exports = { StudentController };
