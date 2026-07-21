const { Router } = require("express");
const { HealthController } = require("./HealthController");

const healthRouter = Router();
const healthController = new HealthController();

healthRouter.get("/", (req, res, next) => {
  healthController.check(req, res).catch(next);
});

module.exports = { healthRouter };
