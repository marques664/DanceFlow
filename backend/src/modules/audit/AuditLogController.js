const { AuditLogService } = require("./AuditLogService");

const auditLogService = new AuditLogService();

function getFriendlyText(log) {
  let details = {};
  try {
    details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
  } catch (e) {
    details = {};
  }

  const userName = log.user ? log.user.name : "Operador";

  switch (log.action) {
    case "CREATE_STUDENT":
      return `${userName} cadastrou a aluna ${details.name || "N/A"}.`;
    case "UPDATE_STUDENT":
      return `${userName} atualizou o cadastro de ${details.name || "N/A"}.`;
    case "INACTIVATE_STUDENT":
      return `${userName} inativou a aluna ${details.name || details.studentName || "N/A"}.`;
    case "CONVERT_EXPERIMENTAL_STUDENT":
      return `${userName} converteu a aluna experimental ${details.name || "N/A"} para aluna regular.`;
    case "CREATE_CLASS":
      return `${userName} criou a nova turma ${details.name || details.className || "N/A"}.`;
    case "UPDATE_CLASS":
      return `${userName} atualizou as configurações da turma ${details.name || details.className || "N/A"}.`;
    case "CREATE_TEACHER":
      return `${userName} cadastrou a nova professora ${details.name || details.teacherName || "N/A"}.`;
    case "REGISTER_ATTENDANCE":
      return `${userName} realizou a chamada para a aula de ${details.className || "N/A"} na data ${details.date || "N/A"}.`;
    case "SCHEDULE_LESSON":
      return `${userName} agendou uma nova aula de ${details.className || "N/A"} no dia ${details.date || "N/A"}.`;
    default:
      return `${userName} realizou uma alteração de ${log.action}.`;
  }
}

class AuditLogController {
  async index(req, res) {
    const { schoolId } = req.user;
    const { action, search } = req.query;

    const logs = await auditLogService.listBySchool(schoolId, { action, search });

    // Format logs into friendly, reduced format for local administrators
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      friendlyText: getFriendlyText(log),
      createdAt: log.createdAt,
    }));

    return res.json(formattedLogs);
  }

  async listSchoolLogsGlobal(req, res) {
    // Accessible only by platform administrators
    const { schoolId } = req.params;
    const { action, search } = req.query;

    const logs = await auditLogService.listGlobal({ schoolId, action, search });

    // SuperAdmin gets full detailed logs (with action codes and details JSON)
    return res.json(logs);
  }
}

module.exports = { AuditLogController };
