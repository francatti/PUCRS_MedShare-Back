const nodemailer = require('nodemailer');

// Configurar transporter
let transporter = null;

const createTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
};

/**
 * Função para enviar emails
 * @param {Object} options - Opções do email
 * @param {string} options.to - Email do destinatário
 * @param {string} options.subject - Assunto do email
 * @param {string} options.template - Nome do template
 * @param {Object} options.data - Dados para o template
 * @returns {boolean} - True se enviado com sucesso
 */
const sendEmail = async ({ to, subject, template, data }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Configurações de email não encontradas. Email não será enviado.');
      console.log('📧 Email simulado:', { to, subject, template, data });
      return true; // Simular sucesso em desenvolvimento
    }

    const transporter = createTransporter();
    
    // Gerar HTML do template
    const html = generateEmailHTML(template, data);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'MedShare <noreply@medshare.com>',
      to,
      subject,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email enviado:', info.messageId);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    return false;
  }
};

/**
 * Gerar HTML do template de email
 * @param {string} template - Nome do template
 * @param {Object} data - Dados para o template
 * @returns {string} - HTML do email
 */
const generateEmailHTML = (template, data) => {
  const baseStyle = `
    <style>
      body { 
        font-family: Arial, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        max-width: 600px; 
        margin: 0 auto; 
        padding: 20px; 
      }
      .header { 
        background: #2563eb; 
        color: white; 
        padding: 20px; 
        text-align: center; 
        border-radius: 10px 10px 0 0; 
      }
      .content { 
        background: #f8f9fa; 
        padding: 30px; 
        border-radius: 0 0 10px 10px; 
      }
      .button { 
        display: inline-block; 
        background: #2563eb; 
        color: white; 
        padding: 12px 25px; 
        text-decoration: none; 
        border-radius: 5px; 
        margin: 20px 0; 
      }
      .footer { 
        text-align: center; 
        font-size: 12px; 
        color: #666; 
        margin-top: 30px; 
      }
      .warning { 
        background: #fff3cd; 
        border: 1px solid #ffeaa7; 
        color: #856404; 
        padding: 15px; 
        border-radius: 5px; 
        margin: 20px 0; 
      }
    </style>
  `;

  switch (template) {
    case 'password-reset':
      return `
        ${baseStyle}
        <div class="header">
          <h1>🏥 MedShare</h1>
        </div>
        <div class="content">
          <h2>Redefinição de Senha</h2>
          <p>Olá, ${data.nome}!</p>
          <p>Você solicitou a redefinição de sua senha no MedShare. Clique no botão abaixo para criar uma nova senha:</p>
          <div style="text-align: center;">
            <a href="${data.resetUrl}" class="button">Redefinir Senha</a>
          </div>
          <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul>
              <li>Este link é válido até ${data.validUntil}</li>
              <li>Se você não solicitou esta redefinição, ignore este email</li>
              <li>Nunca compartilhe este link com outras pessoas</li>
            </ul>
          </div>
          <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">
            ${data.resetUrl}
          </p>
        </div>
        <div class="footer">
          <p>Este é um email automático, não responda.</p>
          <p>&copy; 2025 MedShare - Sistema de Compartilhamento de Informações Clínicas</p>
        </div>
      `;

    case 'password-changed':
      return `
        ${baseStyle}
        <div class="header">
          <h1>🏥 MedShare</h1>
        </div>
        <div class="content">
          <h2>Senha Alterada com Sucesso</h2>
          <p>Olá, ${data.nome}!</p>
          <p>✅ Sua senha foi alterada com sucesso em ${data.changeTime}.</p>
          <p>Se você não fez esta alteração, entre em contato conosco imediatamente.</p>
          <div style="text-align: center; margin: 30px 0;">
            <p>🔒 Sua conta está segura</p>
          </div>
        </div>
        <div class="footer">
          <p>Este é um email automático, não responda.</p>
          <p>&copy; 2025 MedShare - Sistema de Compartilhamento de Informações Clínicas</p>
        </div>
      `;

    case 'welcome':
      return `
        ${baseStyle}
        <div class="header">
          <h1>🏥 MedShare</h1>
        </div>
        <div class="content">
          <h2>Bem-vindo ao MedShare!</h2>
          <p>Olá, ${data.nome}!</p>
          <p>🎉 Parabéns! Sua conta foi criada com sucesso no MedShare.</p>
          <p>Agora você pode:</p>
          <ul>
            <li>📋 Gerenciar suas informações médicas de forma segura</li>
            <li>🔗 Compartilhar dados médicos através de link público</li>
            <li>📱 Gerar QR Code para acesso rápido</li>
            <li>👥 Cadastrar contatos de emergência</li>
          </ul>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/login" class="button">Acessar Minha Conta</a>
          </div>
        </div>
        <div class="footer">
          <p>Este é um email automático, não responda.</p>
          <p>&copy; 2025 MedShare - Sistema de Compartilhamento de Informações Clínicas</p>
        </div>
      `;

    default:
      return `
        ${baseStyle}
        <div class="header">
          <h1>🏥 MedShare</h1>
        </div>
        <div class="content">
          <h2>Notificação do Sistema</h2>
          <p>Este é um email automático do sistema MedShare.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 MedShare - Sistema de Compartilhamento de Informações Clínicas</p>
        </div>
      `;
  }
};

/**
 * Verificar configuração do email
 * @returns {boolean} - True se configurado corretamente
 */
const verifyEmailConfig = async () => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return false;
    }
    
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Configuração de email verificada com sucesso');
    return true;
    
  } catch (error) {
    console.error('❌ Erro na configuração de email:', error.message);
    return false;
  }
};

/**
 * Envia email de recuperação de senha
 * @param {string} email - Email do destinatário
 * @param {string} token - Token de recuperação
 * @param {string} nome - Nome do usuário
 */
const sendPasswordResetEmail = async (email, token, nome) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@medshare.com',
      to: email,
      subject: 'MedShare - Redefinição de Senha',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinição de Senha - MedShare</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              background-color: #f9fafb;
            }
            .container {
              background-color: white;
              margin: 20px;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              color: #0ea5e9;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .title {
              color: #1f2937;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .content {
              color: #4b5563;
              font-size: 16px;
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background-color: #0ea5e9;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              text-align: center;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #0284c7;
            }
            .warning {
              background-color: #fef3c7;
              color: #92400e;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              border-left: 4px solid #f59e0b;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            .link {
              color: #0ea5e9;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏥 MedShare</div>
              <h1 class="title">Redefinição de Senha</h1>
            </div>
            
            <div class="content">
              <p>Olá, <strong>${nome}</strong>!</p>
              
              <p>Recebemos uma solicitação para redefinir a senha da sua conta MedShare.</p>
              
              <p>Para criar uma nova senha, clique no botão abaixo:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
              </div>
              
              <p>Ou copie e cole este link no seu navegador:</p>
              <p class="link">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Este link é válido por <strong>1 hora</strong></li>
                  <li>Só pode ser usado uma única vez</li>
                  <li>Se você não solicitou esta redefinição, ignore este email</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p>Este é um email automático do sistema MedShare.</p>
              <p>Se você tiver dúvidas, entre em contato com nosso suporte.</p>
              <p>&copy; 2024 MedShare - Projeto Acadêmico PUCRS</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        MedShare - Redefinição de Senha
        
        Olá, ${nome}!
        
        Recebemos uma solicitação para redefinir a senha da sua conta MedShare.
        
        Para criar uma nova senha, acesse o link abaixo:
        ${resetUrl}
        
        IMPORTANTE:
        - Este link é válido por 1 hora
        - Só pode ser usado uma única vez
        - Se você não solicitou esta redefinição, ignore este email
        
        Este é um email automático do sistema MedShare.
        © 2024 MedShare - Projeto Acadêmico PUCRS
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email de recuperação enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Erro ao enviar email de recuperação:', error);
    throw new Error('Falha no envio do email de recuperação');
  }
};

/**
 * Envia email de confirmação de cadastro
 * @param {string} email - Email do destinatário
 * @param {string} nome - Nome do usuário
 */
const sendWelcomeEmail = async (email, nome) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@medshare.com',
      to: email,
      subject: 'Bem-vindo ao MedShare!',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo ao MedShare</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              background-color: #f9fafb;
            }
            .container {
              background-color: white;
              margin: 20px;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              color: #0ea5e9;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .title {
              color: #1f2937;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .content {
              color: #4b5563;
              font-size: 16px;
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background-color: #0ea5e9;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              text-align: center;
              margin: 20px 0;
            }
            .features {
              background-color: #f0f9ff;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏥 MedShare</div>
              <h1 class="title">Bem-vindo ao MedShare!</h1>
            </div>
            
            <div class="content">
              <p>Olá, <strong>${nome}</strong>!</p>
              
              <p>Seja bem-vindo ao <strong>MedShare</strong>! Sua conta foi criada com sucesso.</p>
              
              <div class="features">
                <h3>O que você pode fazer no MedShare:</h3>
                <ul>
                  <li>🔒 Armazenar suas informações médicas com segurança</li>
                  <li>📱 Gerar QR Code para acesso em emergências</li>
                  <li>👥 Cadastrar contatos de emergência</li>
                  <li>🔗 Compartilhar informações através de link público</li>
                  <li>🔐 Controlar quem tem acesso aos seus dados</li>
                </ul>
              </div>
              
              <p>Comece agora mesmo preenchendo seu perfil e informações médicas.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Acessar Dashboard</a>
              </div>
            </div>
            
            <div class="footer">
              <p>Este é um email automático do sistema MedShare.</p>
              <p>&copy; 2024 MedShare - Projeto Acadêmico PUCRS</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        MedShare - Bem-vindo!
        
        Olá, ${nome}!
        
        Seja bem-vindo ao MedShare! Sua conta foi criada com sucesso.
        
        O que você pode fazer no MedShare:
        - Armazenar suas informações médicas com segurança
        - Gerar QR Code para acesso em emergências
        - Cadastrar contatos de emergência
        - Compartilhar informações através de link público
        - Controlar quem tem acesso aos seus dados
        
        Acesse seu dashboard: ${process.env.FRONTEND_URL}/dashboard
        
        © 2024 MedShare - Projeto Acadêmico PUCRS
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email de boas-vindas enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    // Não falhar o cadastro se o email não for enviado
    return { success: false, error: error.message };
  }
};

/**
 * Testa a configuração de email
 */
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Conexão com servidor de email: OK');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com servidor de email:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  verifyEmailConfig,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  testEmailConnection
}; 