const { Router } = require("express");
const { prisma } = require("../../shared/database/prisma");
const { ensureAuthenticated } = require("../../shared/middlewares/auth");

const userRouter = Router();

userRouter.get("/", ensureAuthenticated, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        schoolId: req.user.schoolId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        role: true
      }
    });
    return res.status(200).json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = { userRouter };
