const { z } = require("zod");
const { AuthService } = require("./AuthService");

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

class AuthController {
  async login(req, res) {
    const parsedData = loginSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsedData.error.format(),
      });
    }

    const { email, password } = parsedData.data;

    const authService = new AuthService();
    const result = await authService.execute({ email, password });

    return res.status(200).json(result);
  }
}

module.exports = { AuthController };
