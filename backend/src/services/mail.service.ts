interface SendForgotPasswordParams {
  email: string;
  token: string;
}

interface SendInviteParams {
  email: string;
  role: 'empresa' | 'cliente';
  token: string;
}

// Função auxiliar para obter o remetente de forma dinâmica com fallback seguro
function getSender() {
  return {
    name: process.env.SENDER_NAME || 'Civix',
    email: process.env.SENDER_EMAIL || 'onboarding@resend.dev',
  };
}

// Função auxiliar genérica para realizar as chamadas à API REST da Brevo
async function sendBrevoEmail(payload: object) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error('BREVO_API_KEY não foi configurada nas variáveis de ambiente.');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Brevo API Error: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

// 1. Envio de Redefinição de Senha
export async function sendForgotPasswordEmail({ email, token }: SendForgotPasswordParams) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;
  const sender = getSender();

  console.log('--- DISPARANDO E-MAIL VIA BREVO ---');
  console.log('API Key presente?:', !!process.env.BREVO_API_KEY);
  console.log('Sender:', sender);
  console.log('Destinatário:', email);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Civix - Redefinição de Senha</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: 'Segoe UI', Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf9f7; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e5e5e5;">
                
                <!-- Detalhe superior em amarelo -->
                <tr>
                  <td style="height: 6px; background-color: #eab308; line-height: 6px; font-size: 6px;">&nbsp;</td>
                </tr>

                <!-- Cabeçalho Principal -->
                <tr>
                  <td align="center" style="background-color: #071b2b; padding: 32px 24px;">
                    <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 1px;">CIVIX</h2>
                  </td>
                </tr>

                <!-- Conteúdo -->
                <tr>
                  <td style="padding: 36px 32px 28px 32px;">
                    <h1 style="margin: 0 0 16px 0; color: #071b2b; font-size: 20px; font-weight: 700; text-align: center;">
                      Recuperação de Senha
                    </h1>
                    
                    <p style="margin: 0 0 24px 0; color: #525252; font-size: 14px; line-height: 1.6; text-align: center;">
                      Recebemos uma solicitação para redefinir a senha da sua conta Civix. Clique no botão abaixo para criar uma nova senha:
                    </p>

                    <!-- Botão CTA -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 28px;">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}" target="_blank" style="background-color: #071b2b; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
                            Redefinir Minha Senha &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Card de Informação -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 12px 16px; color: #64748b; font-size: 12px; line-height: 1.5; text-align: center;">
                          Este link é válido por <strong>1 hora</strong>.<br/>
                          Se você não solicitou a alteração, ignore este e-mail.
                        </td>
                      </tr>
                    </table>

                    <!-- Link alternativo futuro 
                    <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.4; text-align: center; word-break: break-all;">
                      Se o botão não funcionar, acesse:<br/>
                      <a href="${resetUrl}" style="color: #2563eb; text-decoration: underline;">${resetUrl}</a>
                    </p> 
                    !-->
                    
                  </td>
                </tr>

                <!-- Rodapé -->
                <tr>
                  <td style="background-color: #faf9f7; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                      &copy; Civix - Gestão e Construção. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const data = await sendBrevoEmail({
      sender,
      to: [{ email }],
      subject: 'Civix - Redefinição de Senha',
      htmlContent,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar e-mail de redefinição via Brevo API:', error);
    throw new Error('Falha no envio do e-mail de recuperação.');
  }
}

// 2. Envio de Convite para Primeiro Acesso
export async function sendInviteEmail({ email, role, token }: SendInviteParams) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const inviteUrl = `${frontendUrl}/primeiro-acesso?token=${encodeURIComponent(token)}`;
  const roleText = role === 'empresa' ? 'Organização/Empresa' : 'Cliente/Usuário';
  const sender = getSender();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Civix - Ativação de Primeiro Acesso</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: 'Segoe UI', Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf9f7; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e5e5e5;">
                
                <!-- Detalhe superior em amarelo -->
                <tr>
                  <td style="height: 6px; background-color: #eab308; line-height: 6px; font-size: 6px;">&nbsp;</td>
                </tr>

                <!-- Cabeçalho Principal -->
                <tr>
                  <td align="center" style="background-color: #071b2b; padding: 32px 24px;">
                    <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 1px;">CIVIX</h2>
                  </td>
                </tr>

                <!-- Conteúdo -->
                <tr>
                  <td style="padding: 36px 32px 28px 32px;">
                    <h1 style="margin: 0 0 16px 0; color: #071b2b; font-size: 20px; font-weight: 700; text-align: center;">
                      Ativação de Conta
                    </h1>
                    
                    <p style="margin: 0 0 24px 0; color: #525252; font-size: 14px; line-height: 1.6; text-align: center;">
                      Você foi cadastrado na plataforma Civix como <strong>${roleText}</strong>.<br/>
                      Clique no botão abaixo para definir sua senha de acesso e ativar a conta:
                    </p>

                    <!-- Botão CTA -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 28px;">
                      <tr>
                        <td align="center">
                          <a href="${inviteUrl}" target="_blank" style="background-color: #071b2b; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
                            Definir Minha Senha &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Card de Informação -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 12px 16px; color: #64748b; font-size: 12px; line-height: 1.5; text-align: center;">
                          Este link de convite é válido por <strong>24 horas</strong>.<br/>
                          Se você não solicitou este acesso, desconsidere este e-mail.
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.4; text-align: center; word-break: break-all;">
                      Se o botão não funcionar, acesse:<br/>
                      <a href="${inviteUrl}" style="color: #2563eb; text-decoration: underline;">${inviteUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Rodapé -->
                <tr>
                  <td style="background-color: #faf9f7; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                      &copy; Civix - Gestão e Construção. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const data = await sendBrevoEmail({
      sender,
      to: [{ email }],
      subject: 'Bem-vindo ao Civix - Ativação de Conta',
      htmlContent,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar e-mail de convite via Brevo API:', error);
    throw new Error('Falha no envio do e-mail de convite.');
  }
}