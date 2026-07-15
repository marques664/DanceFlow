const crypto = require('crypto');
const { hash } = require('bcryptjs');
const { sign } = require('jsonwebtoken');
const { basePrisma } = require('../../shared/database/prisma');
const { AppError } = require('../../shared/errors/AppError');
const { emailService } = require('../../shared/services/email');

class TenantController {
  async provision(req, res) {
    const { schoolName, adminEmail } = req.body;

    if (!schoolName || !adminEmail) {
      throw new AppError("School name and admin email are required.", 400);
    }

    // 1. Generate slug
    const slug = schoolName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // 2. Create School and ActivationToken (using basePrisma to bypass tenancy context)
    const result = await basePrisma.$transaction(async (tx) => {
      // Check if school with slug already exists
      const existingSchool = await tx.school.findFirst({
        where: { slug }
      });
      if (existingSchool) {
        throw new AppError("A school with this name already exists.", 400);
      }

      // Check if email already has a pending or completed activation
      const existingUser = await tx.user.findUnique({
        where: { email: adminEmail }
      });
      if (existingUser) {
        throw new AppError("An administrator with this email is already registered.", 400);
      }

      // Delete any existing activation tokens for this email to avoid unique constraint violations on re-invites
      await tx.activationToken.deleteMany({
        where: { email: adminEmail }
      });

      const school = await tx.school.create({
        data: {
          name: schoolName,
          slug
        }
      });

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      const activationToken = await tx.activationToken.create({
        data: {
          email: adminEmail,
          schoolId: school.id,
          token,
          expiresAt
        }
      });

      return { school, tokenRecord: activationToken };
    });

    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (result.school.slug) {
      if (frontendUrl.includes('localhost')) {
        // Use lvh.me for local subdomain resolution (points to 127.0.0.1 on Windows automatically)
        frontendUrl = frontendUrl.replace('localhost', `${result.school.slug}.lvh.me`);
      } else {
        frontendUrl = frontendUrl.replace('://', `://${result.school.slug}.`);
      }
    }
    const activationUrl = `${frontendUrl}/ativar?token=${result.tokenRecord.token}`;

    // 3. Send email convite
    await emailService.sendActivationEmail(adminEmail, schoolName, activationUrl);

    return res.status(201).json({
      status: "success",
      message: "School provisioned successfully. Activation email sent.",
      data: {
        schoolId: result.school.id,
        slug: result.school.slug,
        token: result.tokenRecord.token,
        activationUrl
      }
    });
  }

  async getActivationDetails(req, res) {
    const { token } = req.query;

    if (!token) {
      throw new AppError("Activation token is missing.", 400);
    }

    const tokenRecord = await basePrisma.activationToken.findUnique({
      where: { token },
      include: { school: true }
    });

    if (!tokenRecord) {
      throw new AppError("Invalid activation token.", 404);
    }

    if (tokenRecord.isUsed) {
      throw new AppError("This activation link has already been used.", 400);
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new AppError("This activation link has expired.", 400);
    }

    return res.status(200).json({
      status: "success",
      data: {
        email: tokenRecord.email,
        schoolName: tokenRecord.school.name
      }
    });
  }

  async activate(req, res) {
    const { token, adminName, password } = req.body;

    if (!token || !adminName || !password) {
      throw new AppError("Token, admin name, and password are required.", 400);
    }

    const tokenRecord = await basePrisma.activationToken.findUnique({
      where: { token }
    });

    if (!tokenRecord || tokenRecord.isUsed || new Date() > tokenRecord.expiresAt) {
      throw new AppError("Invalid, expired, or already used activation token.", 400);
    }

    const passwordHash = await hash(password, 8);

    const user = await basePrisma.$transaction(async (tx) => {
      // Check if user already exists
      const existingUser = await tx.user.findUnique({
        where: { email: tokenRecord.email }
      });

      let activeUser;
      if (existingUser) {
        // Activate existing user (e.g. invited teacher)
        activeUser = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: adminName,
            password: passwordHash,
            isActive: true
          }
        });
      } else {
        // Create new school admin user
        activeUser = await tx.user.create({
          data: {
            name: adminName,
            email: tokenRecord.email,
            password: passwordHash,
            role: "ADMIN",
            schoolId: tokenRecord.schoolId,
            isActive: true
          }
        });
      }

      // Mark token as used
      await tx.activationToken.update({
        where: { id: tokenRecord.id },
        data: { isUsed: true }
      });

      return activeUser;
    });

    // Generate session JWT
    const secret = process.env.JWT_SECRET || "df_secret_key_2026_jwt_token_sign";
    const jwtToken = sign(
      {
        role: user.role,
        schoolId: user.schoolId
      },
      secret,
      {
        subject: user.id,
        expiresIn: "1d"
      }
    );

    return res.status(200).json({
      status: "success",
      message: "Account activated successfully.",
      data: {
        token: jwtToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  }

  async getTenantInfo(req, res) {
    const { slug } = req.query;

    if (!slug) {
      throw new AppError("Tenant slug is missing.", 400);
    }

    const school = await basePrisma.school.findFirst({
      where: { slug, isActive: true }
    });

    if (!school) {
      throw new AppError("School not found.", 404);
    }

    return res.status(200).json({
      status: "success",
      data: {
        name: school.name
      }
    });
  }

  async listSchools(req, res) {
    const schools = await basePrisma.school.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true
      }
    });

    return res.status(200).json({
      status: "success",
      data: schools
    });
  }
}

module.exports = { TenantController };
