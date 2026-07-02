const { compare } = require("bcryptjs");
const { sign } = require("jsonwebtoken");
const { prisma } = require("../../shared/database/prisma");
const { AppError } = require("../../shared/errors/AppError");

class AuthService {
  async execute({ email, password }) {
    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError("Incorrect email or password combination.", 401);
    }

    // 2. Check status
    if (!user.isActive) {
      throw new AppError("User account is inactive.", 401);
    }

    // 3. Compare password
    const passwordMatched = await compare(password, user.password);

    if (!passwordMatched) {
      throw new AppError("Incorrect email or password combination.", 401);
    }

    // 4. Generate token
    const secret = process.env.JWT_SECRET || "df_secret_key_2026_jwt_token_sign";
    const token = sign(
      {
        role: user.role,
        schoolId: user.schoolId,
      },
      secret,
      {
        subject: user.id,
        expiresIn: "1d",
      }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}

module.exports = { AuthService };
