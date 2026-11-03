import type { UserRole } from '../entities/user.entity.js';
import { logger } from '../shared/logging/log.context.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
// # Funções de envio de e-mail transacional

import { Resend } from 'resend';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import { saveLocalMail } from '../persistence/json/mail.outbox.js';

// Inicializa o SDK do Resend com a chave do arquivo .env
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY não está configurada.');
  }

  return new Resend(apiKey);
}

function getMailFrom() {
  const mailFrom = process.env.MAIL_FROM;

  if (!mailFrom) {
    throw new Error('MAIL_FROM não está configurada.');
  }

  return mailFrom;
}

interface SendInviteParams {
  email: string;
  role: UserRole;
  token: string;
}

export async function sendInviteEmail({ email, role, token }: SendInviteParams) {
  // Monta a URL para o frontend com o token
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const inviteUrl = `${frontendUrl.replace(/\/$/, '')}/primeiro-acesso?token=${encodeURIComponent(token)}`;

  if (USE_MOCK_DATA) {
    const result = await saveLocalMail('invite', email, inviteUrl);

    logger().info({
      event: 'mail.outbox.saved',
      module: 'mail',
      message: 'E-mail salvo na caixa de saída local',
      context: { mailType: 'invite', persistenceMode: 'json' },
    });

    return result;
  }

  const roleText = role === 'super_admin' ? 'Administrador da plataforma' : role === 'atendente' ? 'Atendente' : 'Administrador da empresa';

  try {
    const result = await getResendClient().emails.send({
      from: getMailFrom(),
      to: [email],
      subject: 'Bem-vindo ao Civix - Ativação de Conta',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #faf9f7; margin: 0; padding: 20px; }
              .container { max-width: 500px; background-color: #ffffff; border-radius: 8px; padding: 32px; margin: 0 auto; border: 1px solid #e5e5e5; }
              .title { color: #071b2b; font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 8px; }
              .text { color: #626262; font-size: 14px; line-height: 1.5; text-align: center; margin-bottom: 24px; }
              .button-container { text-align: center; margin-bottom: 24px; }
              .button { background-color: #061c2c; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; display: inline-block; }
              .footer { color: #999999; font-size: 11px; text-align: center; margin-top: 16px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="title">Ativação de Primeiro Acesso</h1>
              <p class="text">
                Você foi cadastrado na plataforma Civix como <strong>${roleText}</strong>.<br/>
                Para acessar o sistema, crie sua senha utilizando o botão abaixo:
              </p>
              
              <div class="button-container">
                <a href="${inviteUrl}" class="button">Definir Minha Senha</a>
              </div>

              <p class="text" style="font-size: 12px; color: #888;">
                Se você não solicitou este acesso, desconsidere este e-mail.<br/>
                Este link é válido por 24 horas.
              </p>

              <div class="footer">
                &copy; Civix - Todos os direitos reservados.
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    logger().info({
      event: 'mail.provider.accepted',
      module: 'mail',
      message: 'E-mail aceito pelo provedor',
      context: { mailType: 'invite' },
    });

    return { success: true, data: result.data };
  } catch (error) {
    throw new AppError({
      status: 500,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Erro interno do servidor',
      details: { message: 'Falha no envio do e-mail de convite.' },
      cause: error,
    });
  }
}

interface SendResetPasswordParams {
  email: string;
  resetUrl: string;
}

export async function sendResetPasswordEmail({ email, resetUrl }: SendResetPasswordParams) {
  if (USE_MOCK_DATA) {
    const result = await saveLocalMail('password-reset', email, resetUrl);

    logger().info({
      event: 'mail.outbox.saved',
      module: 'mail',
      message: 'E-mail salvo na caixa de saída local',
      context: { mailType: 'password-reset', persistenceMode: 'json' },
    });

    return result;
  }

  try {
    const result = await getResendClient().emails.send({
      from: getMailFrom(),
      to: [email],
      subject: 'Civix - Redefinição de senha',
      html: `
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p><a href="${resetUrl}">Redefinir minha senha</a></p>
        <p>Este link é válido por 1 hora e só pode ser usado uma vez.</p>
      `,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    logger().info({
      event: 'mail.provider.accepted',
      module: 'mail',
      message: 'E-mail aceito pelo provedor',
      context: { mailType: 'password-reset' },
    });

    return { success: true, data: result.data };
  } catch (error) {
    throw new AppError({
      status: 500,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Erro interno do servidor',
      details: { message: 'Falha no envio do e-mail de redefinição.' },
      cause: error,
    });
  }
}

export async function sendForgotPasswordEmail({ email, token }: { email: string; token: string }) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl.replace(/\/$/, '')}/redefinir-senha?token=${encodeURIComponent(token)}`;

  return sendResetPasswordEmail({ email, resetUrl });
}
