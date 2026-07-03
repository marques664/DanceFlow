const { Router } = require("express");
const { StudentController } = require("./StudentController");
const { ensureAuthenticated } = require("../../shared/middlewares/auth");
const { ensureRole } = require("../../shared/middlewares/role");

const studentRouter = Router();
const studentController = new StudentController();

// Guard all student endpoints with JWT authentication
studentRouter.use(ensureAuthenticated);

studentRouter.get("/", (req, res, next) => {
  studentController.list(req, res).catch(next);
});

studentRouter.get("/:id", (req, res, next) => {
  studentController.show(req, res).catch(next);
});

studentRouter.post("/", ensureRole(["ADMIN"]), (req, res, next) => {
  studentController.create(req, res).catch(next);
});

studentRouter.put("/:id", ensureRole(["ADMIN"]), (req, res, next) => {
  studentController.update(req, res).catch(next);
});

studentRouter.delete("/:id", ensureRole(["ADMIN"]), (req, res, next) => {
  studentController.delete(req, res).catch(next);
});

module.exports = { studentRouter };
