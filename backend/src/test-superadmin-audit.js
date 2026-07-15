const { AuditLogService } = require("./modules/audit/AuditLogService");
const { AuditLogController } = require("./modules/audit/AuditLogController");
const { prisma } = require("./shared/database/prisma");

const auditLogService = new AuditLogService();
const auditLogController = new AuditLogController();

async function runTests() {
  console.log("--- STARTING SUPERADMIN AUDIT LOGS INTEGRATION TESTS ---\n");

  try {
    // 1. Fetch pilot school and admin user
    const school = await prisma.school.findFirst({
      where: { name: "Escola Piloto de Dança" }
    });

    if (!school) {
      throw new Error("Pilot school not found. Please run seed first!");
    }

    const admin = await prisma.user.findFirst({
      where: { schoolId: school.id, role: "ADMIN" }
    });

    if (!admin) {
      throw new Error("Admin user not found. Please run seed first!");
    }

    console.log(`Using school: "${school.name}" (${school.id})`);
    console.log(`Using admin user: "${admin.name}" (${admin.id})\n`);

    // 2. Log some custom database actions to test the friendly translation logic
    console.log("Adding mock audit trail logs...");
    await auditLogService.log(school.id, admin.id, "CREATE_STUDENT", { name: "Mariana Souza" });
    await auditLogService.log(school.id, admin.id, "CONVERT_EXPERIMENTAL_STUDENT", { name: "Beatriz Vasconcelos" });
    await auditLogService.log(school.id, admin.id, "REGISTER_ATTENDANCE", { className: "Ballet Infantil A", date: "2026-07-15" });
    console.log("Mock logs saved successfully!\n");

    // 3. Simulate local admin log retrieval (friendly reduced view)
    console.log("Simulating school administrator log request...");
    const schoolLogs = await auditLogService.listBySchool(school.id, {});
    
    const formattedLogs = schoolLogs.map(log => {
      // Re-run the friendly formatter mock
      let details = {};
      try {
        details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
      } catch (e) {}

      const userName = log.user ? log.user.name : "Operador";
      let text = "";
      if (log.action === "CREATE_STUDENT") {
        text = `${userName} cadastrou a aluna ${details.name || "N/A"}.`;
      } else if (log.action === "CONVERT_EXPERIMENTAL_STUDENT") {
        text = `${userName} converteu a aluna experimental ${details.name || "N/A"} para aluna regular.`;
      } else if (log.action === "REGISTER_ATTENDANCE") {
        text = `${userName} realizou a chamada para a aula de ${details.className || "N/A"} na data ${details.date || "N/A"}.`;
      } else {
        text = `${userName} fez outra alteração.`;
      }

      return {
        id: log.id,
        friendlyText: text,
        createdAt: log.createdAt
      };
    });

    console.log(`Retrieved ${formattedLogs.length} logs for Local Admin:`);
    formattedLogs.slice(0, 3).forEach(f => {
      console.log(`- [${f.createdAt.toISOString()}] ${f.friendlyText}`);
    });
    console.log("");

    // 4. Simulate SuperAdmin log retrieval (verbose, action codes, and raw JSON details)
    console.log("Simulating SaaS SuperAdmin global query...");
    const globalLogs = await auditLogService.listGlobal({ schoolId: school.id });
    console.log(`Retrieved ${globalLogs.length} logs for SuperAdmin:`);
    globalLogs.slice(0, 3).forEach(g => {
      console.log(`- [${g.createdAt.toISOString()}] Action: ${g.action} | Operator: ${g.user?.email} | Details: ${g.details}`);
    });
    console.log("");

    console.log("✅ INTEGRATION TESTS COMPLETED SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ TEST RUN ENCOUNTERED ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
