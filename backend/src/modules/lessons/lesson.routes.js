const { Router } = require("express");
const { LessonController } = require("./LessonController");
const { ensureAuthenticated } = require("../../shared/middlewares/auth");
const { ensureRole } = require("../../shared/middlewares/role");

const lessonRouter = Router();
const lessonController = new LessonController();

// Protect all lesson endpoints
lessonRouter.use(ensureAuthenticated);

lessonRouter.get("/", (req, res, next) => {
  lessonController.list(req, res).catch(next);
});

lessonRouter.get("/:id", (req, res, next) => {
  lessonController.findById(req, res).catch(next);
});

lessonRouter.post("/", ensureRole(["ADMIN"]), (req, res, next) => {
  lessonController.create(req, res).catch(next);
});

lessonRouter.put("/:id", (req, res, next) => {
  lessonController.update(req, res).catch(next);
});

lessonRouter.post("/:id/attendance", (req, res, next) => {
  lessonController.registerAttendance(req, res).catch(next);
});

module.exports = { lessonRouter };
