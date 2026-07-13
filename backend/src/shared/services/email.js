const { logger } = require("../utils/logger");

class EmailService {
  async sendActivationEmail(email, schoolName, activationUrl) {
    const message = `
=======================================================
EMAIL SENT TO: ${email}
SUBJECT: Convite para ativação da conta: ${schoolName}
BODY:
Olá! Sua escola "${schoolName}" foi cadastrada com sucesso no DanceFlow.
Para definir sua senha de acesso e ativar sua conta administradora,
clique no link a seguir:

${activationUrl}

Este link expira em 48 horas.
=======================================================
`;
    logger.info("Sending activation email", { email, schoolName, activationUrl });
    console.log(message);
    return true;
  }
}

module.exports = { emailService: new EmailService() };
