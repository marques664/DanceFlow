const { Router } = require("express");
const { ClassController } = require("./ClassController");
const { ensureAuthenticated } = require("../../shared/middlewares/auth");
const { ensureRole } = require("../../shared/middlewares/role");

const classRouter = Router();
const classController = new ClassController();

// Guard all class endpoints with JWT authentication
classRouter.use(ensureAuthenticated);

classRouter.get("/", (req, res, next) => {
  classController.list(req, res).catch(next);
});

classRouter.post("/", ensureRole(["ADMIN"]), (req, res, next) => {
  classController.create(req, res).catch(next);
});

classRouter.delete("/:id", ensureRole(["ADMIN"]), (req, res, next) => {
  classController.delete(req, res).catch(next);
});

classRouter.post("/:id/students", ensureRole(["ADMIN"]), (req, res, next) => {
  classController.enrollStudent(req, res).catch(next);
});

classRouter.get("/:id/students", (req, res, next) => {
  classController.listEnrolledStudents(req, res).catch(next);
});

module.exports = { classRouter };
