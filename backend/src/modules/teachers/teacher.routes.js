const { Router } = require("express");
const { TeacherController } = require("./TeacherController");
const { ensureAuthenticated } = require("../../shared/middlewares/auth");
const { ensureRole } = require("../../shared/middlewares/role");

const teacherRouter = Router();
const teacherController = new TeacherController();

// Guard all teacher endpoints with JWT authentication
teacherRouter.use(ensureAuthenticated);

teacherRouter.get("/", (req, res, next) => {
  teacherController.list(req, res).catch(next);
});

teacherRouter.post("/", ensureRole(["ADMIN"]), (req, res, next) => {
  teacherController.create(req, res).catch(next);
});

teacherRouter.put("/:id", ensureRole(["ADMIN"]), (req, res, next) => {
  teacherController.update(req, res).catch(next);
});

teacherRouter.delete("/:id", ensureRole(["ADMIN"]), (req, res, next) => {
  teacherController.delete(req, res).catch(next);
});

module.exports = { teacherRouter };
