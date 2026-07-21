const { prisma } = require("../../shared/database/prisma");

class HealthController {
  async check(req, res) {
    const startTime = Date.now();
    let dbStatus = "disconnected";

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "connected";
    } catch (err) {
      dbStatus = "error: " + err.message;
    }

    const isHealthy = dbStatus === "connected";
    const statusCode = isHealthy ? 200 : 503;

    return res.status(statusCode).json({
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: dbStatus,
      responseTimeMs: Date.now() - startTime,
    });
  }
}

module.exports = { HealthController };
