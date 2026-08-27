// # Função genérica de envio: sendInviteEmail(email, token)

import { Resend } from 'resend';

// Inicializa o SDK do Resend com a chave do arquivo .env
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInviteParams {
  email: string;
  role: 'empresa' | 'cliente';
  token: string;
}

export async function sendInviteEmail({ email, role, token }: SendInviteParams) {
  // Monta a URL para o frontend com o token
  const inviteUrl = `${process.env.FRONTEND_URL}/primeiro-acesso?token=${token}`;

  const roleText = role === 'empresa' ? 'Organização/Empresa' : 'Cliente/Usuário';

  try {
    const data = await resend.emails.send({
      from: 'Civix <nao-responda@seudominio.com>',
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

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw new Error('Falha no envio do e-mail de convite.');
  }
}