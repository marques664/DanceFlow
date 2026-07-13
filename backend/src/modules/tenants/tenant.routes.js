const { Router } = require("express");
const { TenantController } = require("./TenantController");

const tenantRouter = Router();
const tenantController = new TenantController();

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

module.exports = { tenantRouter };
