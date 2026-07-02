const { Router } = require("express");
const { AuthController } = require("./AuthController");

const authRouter = Router();
const authController = new AuthController();

authRouter.post("/login", (req, res, next) => {
  authController.login(req, res).catch(next);
});

module.exports = { authRouter };
