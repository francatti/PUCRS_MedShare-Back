const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { executeQuery, executeTransaction } = require('../config/database');
const { generateJWT, hashPassword, verifyPassword } = require('../middleware/auth');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/emailService');

/**
 * @desc    Fazer login do usuário
 * @route   POST /api/auth/login
 * @access  Público
 */
const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validações básicas
    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário por email
    const users = await executeQuery(
      'SELECT id, email, senha, nome, sobrenome, is_ativo FROM usuarios WHERE email = ?',
      [email.toLowerCase()]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    const user = users[0];

    // Verificar se a conta está ativa
    if (!user.is_ativo) {
      return res.status(403).json({
        success: false,
        message: 'Conta inativa. Entre em contato com o suporte.'
      });
    }

    // Verificar senha
    const isValidPassword = await verifyPassword(senha, user.senha);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Gerar JWT
    const token = generateJWT(user.id);

    // Retornar sucesso com token
    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        sobrenome: user.sobrenome
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Registrar novo usuário
 * @route   POST /api/auth/register
 * @access  Público
 */
const register = async (req, res) => {
  try {
    const { 
      email, 
      senha, 
      nome, 
      sobrenome, 
      sexo, 
      data_nascimento, 
      telefone,
      consentimento 
    } = req.body;

    // Validações básicas
    if (!email || !senha || !nome || !sobrenome) {
      return res.status(400).json({
        success: false,
        message: 'Email, senha, nome e sobrenome são obrigatórios'
      });
    }

    if (!consentimento) {
      return res.status(400).json({
        success: false,
        message: 'É necessário aceitar os termos de uso e política de privacidade'
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Validar força da senha
    if (senha.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 8 caracteres'
      });
    }

    // Verificar se email já existe
    const existingUsers = await executeQuery(
      'SELECT id FROM usuarios WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email já cadastrado no sistema'
      });
    }

    // Hash da senha
    const hashedPassword = await hashPassword(senha);

    // Criar usuário
    const result = await executeQuery(
      `INSERT INTO usuarios (
        email, senha, nome, sobrenome, sexo, data_nascimento, telefone
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        email.toLowerCase(),
        hashedPassword,
        nome.trim(),
        sobrenome.trim(),
        sexo || null,
        data_nascimento || null,
        telefone || null
      ]
    );

    if (!result.insertId) {
      throw new Error('Falha ao criar usuário');
    }

    // Criar registro de informações médicas vazio
    await executeQuery(
      'INSERT INTO informacoes_medicas (usuario_id) VALUES (?)',
      [result.insertId]
    );

    // Enviar email de boas-vindas (não bloquear se falhar)
    try {
      await sendWelcomeEmail(email, nome);
    } catch (emailError) {
      console.error('Erro ao enviar email de boas-vindas:', emailError);
    }

    // Gerar JWT para login automático
    const token = generateJWT(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      token,
      user: {
        id: result.insertId,
        email: email.toLowerCase(),
        nome: nome.trim(),
        sobrenome: sobrenome.trim()
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Solicitar redefinição de senha
 * @route   POST /api/auth/forgot-password
 * @access  Público
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    // Buscar usuário por email
    const users = await executeQuery(
      'SELECT id, email, nome, is_ativo FROM usuarios WHERE email = ?',
      [email.toLowerCase()]
    );

    // Sempre retornar sucesso para não expor se o email existe
    const successResponse = {
      success: true,
      message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha'
    };

    if (!users || users.length === 0) {
      return res.status(200).json(successResponse);
    }

    const user = users[0];

    if (!user.is_ativo) {
      return res.status(200).json(successResponse);
    }

    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Invalidar tokens anteriores do usuário
    await executeQuery(
      'UPDATE tokens_recuperacao_senha SET usado = TRUE WHERE usuario_id = ? AND usado = FALSE',
      [user.id]
    );

    // Salvar novo token
    await executeQuery(
      'INSERT INTO tokens_recuperacao_senha (usuario_id, token, expira_em) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    // Enviar email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.nome);
    } catch (emailError) {
      console.error('Erro ao enviar email de recuperação:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar email de recuperação. Tente novamente.'
      });
    }

    res.status(200).json(successResponse);

  } catch (error) {
    console.error('Erro em forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Redefinir senha com token
 * @route   POST /api/auth/reset-password
 * @access  Público
 */
const resetPassword = async (req, res) => {
  try {
    const { token, nova_senha } = req.body;

    if (!token || !nova_senha) {
      return res.status(400).json({
        success: false,
        message: 'Token e nova senha são obrigatórios'
      });
    }

    // Validar força da nova senha
    if (nova_senha.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A nova senha deve ter pelo menos 8 caracteres'
      });
    }

    // Buscar token válido
    const tokens = await executeQuery(
      `SELECT tr.id, tr.usuario_id, tr.expira_em, tr.usado, u.is_ativo 
       FROM tokens_recuperacao_senha tr
       JOIN usuarios u ON tr.usuario_id = u.id
       WHERE tr.token = ?`,
      [token]
    );

    if (!tokens || tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    const tokenData = tokens[0];

    // Verificar se token já foi usado
    if (tokenData.usado) {
      return res.status(400).json({
        success: false,
        message: 'Token já foi utilizado'
      });
    }

    // Verificar se token não expirou
    if (new Date() > new Date(tokenData.expira_em)) {
      return res.status(400).json({
        success: false,
        message: 'Token expirado'
      });
    }

    // Verificar se usuário está ativo
    if (!tokenData.is_ativo) {
      return res.status(400).json({
        success: false,
        message: 'Conta inativa'
      });
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(nova_senha);

    // Atualizar senha e marcar token como usado
    await executeTransaction([
      {
        query: 'UPDATE usuarios SET senha = ? WHERE id = ?',
        params: [hashedPassword, tokenData.usuario_id]
      },
      {
        query: 'UPDATE tokens_recuperacao_senha SET usado = TRUE WHERE id = ?',
        params: [tokenData.id]
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });

  } catch (error) {
    console.error('Erro em reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Verificar validade de token de recuperação
 */
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token é obrigatório'
      });
    }

    // Buscar token
    const tokens = await executeQuery(
      `SELECT tr.expira_em, tr.usado, u.is_ativo 
       FROM tokens_recuperacao_senha tr
       JOIN usuarios u ON tr.usuario_id = u.id
       WHERE tr.token = ?`,
      [token]
    );

    if (!tokens || tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido'
      });
    }

    const tokenData = tokens[0];

    // Verificar validade
    const isValid = !tokenData.usado && 
                   new Date() <= new Date(tokenData.expira_em) && 
                   tokenData.is_ativo;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token válido'
    });

  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
  verifyResetToken
}; 