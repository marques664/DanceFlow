const { Router } = require("express");
const { ModalityController } = require("./ModalityController");
const { ensureAuthenticated } = require("../../shared/middlewares/auth");
const { ensureRole } = require("../../shared/middlewares/role");

const modalityRouter = Router();
const modalityController = new ModalityController();

// Guard all modalities endpoints with JWT authentication
modalityRouter.use(ensureAuthenticated);

modalityRouter.get("/", (req, res, next) => {
  modalityController.list(req, res).catch(next);
});

modalityRouter.get("/:id", (req, res, next) => {
  modalityController.show(req, res).catch(next);
});

modalityRouter.post("/", ensureRole(["ADMIN"]), (req, res, next) => {
  modalityController.create(req, res).catch(next);
});

modalityRouter.put("/:id", ensureRole(["ADMIN"]), (req, res, next) => {
  modalityController.update(req, res).catch(next);
});

modalityRouter.delete("/:id", ensureRole(["ADMIN"]), (req, res, next) => {
  modalityController.delete(req, res).catch(next);
});

module.exports = { modalityRouter };
