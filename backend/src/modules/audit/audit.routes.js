const { Router } = require("express");
const { AuditLogController } = require("./AuditLogController");
const { ensureAuthenticated } = require("../../shared/middlewares/auth");

const auditRouter = Router();
const auditLogController = new AuditLogController();

auditRouter.get("/", ensureAuthenticated, (req, res, next) => {
  auditLogController.index(req, res).catch(next);
});

module.exports = { auditRouter };
