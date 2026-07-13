const nodemailer = require('nodemailer');
const { logger } = require("../utils/logger");

class EmailService {
  async sendActivationEmail(email, schoolName, activationUrl) {
    const message = `
=======================================================
EMAIL SENT TO: ${email}
SUBJECT: Convite para ativação da conta: ${schoolName}
BODY:
🎉

Olá! Sua escola "${schoolName}" foi cadastrada com sucesso no DanceFlow.
Para definir sua senha de acesso e ativar sua conta administradora,
clique no link a seguir:

${activationUrl}

Este link expira em 48 horas.
=======================================================
`;
    // Standard console output for development/test reading
    console.log(message);
    logger.info("Generated activation email invitation link", { email, schoolName, activationUrl });

    // Read SMTP variables
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT) || 587,
          secure: Number(SMTP_PORT) === 465,
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: EMAIL_FROM || '"DanceFlow" <nao-responder@danceflow.com>',
          to: email,
          subject: `Convite para ativação de conta: ${schoolName}`,
          text: `Olá! Sua escola "${schoolName}" foi cadastrada com sucesso no DanceFlow.\n\nPara definir sua senha de acesso e ativar sua conta administradora, acesse o link a seguir:\n\n${activationUrl}\n\nEste link expira em 48 horas.`,
          html: `<p>Olá!</p><p>Sua escola <strong>"${schoolName}"</strong> foi cadastrada com sucesso no DanceFlow.</p><p>Para definir sua senha de acesso e ativar sua conta administradora, clique no link a seguir:</p><p><a href="${activationUrl}" target="_blank">${activationUrl}</a></p><p>Este link expira em 48 horas.</p>`
        });

        logger.info("Real SMTP activation email sent successfully", { email, schoolName });
      } catch (err) {
        logger.error("Failed to send real SMTP activation email", { error: err.message, email, schoolName });
      }
    }

    return true;
  }
}

module.exports = { emailService: new EmailService() };
