const { Router } = require("express");
const { TenantController } = require("./TenantController");
const { AuditLogController } = require("../audit/AuditLogController");

const tenantRouter = Router();
const tenantController = new TenantController();
const auditLogController = new AuditLogController();

tenantRouter.post("/provision", (req, res, next) => {
  tenantController.provision(req, res).catch(next);
});

tenantRouter.get("/activate", (req, res, next) => {
  tenantController.getActivationDetails(req, res).catch(next);
});

tenantRouter.get("/info", (req, res, next) => {
  tenantController.getTenantInfo(req, res).catch(next);
});

tenantRouter.post("/activate", (req, res, next) => {
  tenantController.activate(req, res).catch(next);
});

tenantRouter.get("/", (req, res, next) => {
  tenantController.listSchools(req, res).catch(next);
});

tenantRouter.get("/:schoolId/audit-logs", (req, res, next) => {
  auditLogController.listSchoolLogsGlobal(req, res).catch(next);
});

module.exports = { tenantRouter };
