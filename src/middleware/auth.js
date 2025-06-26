const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');

/**
 * Middleware para verificar se o usuário está autenticado
 */
const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso necessário'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar se o usuário ainda existe e está ativo
      const user = await executeQuery(
        'SELECT id, email, nome, sobrenome, is_ativo FROM usuarios WHERE id = ? AND is_ativo = TRUE',
        [decoded.userId]
      );

      if (!user || user.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado ou inativo'
        });
      }

      req.user = {
        id: user[0].id,
        email: user[0].email,
        nome: user[0].nome,
        sobrenome: user[0].sobrenome
      };
      
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Middleware para verificar se o usuário é proprietário do recurso
 */
const isOwner = (resourceParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceParam];
      const userId = req.user.id;

      // Para recursos que pertencem diretamente ao usuário
      if (resourceParam === 'userId' || resourceParam === 'usuario_id') {
        if (parseInt(resourceId) !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Acesso negado. Você não tem permissão para acessar este recurso.'
          });
        }
        return next();
      }

      // Para outros recursos, verificar na tabela correspondente
      let query = '';
      let params = [];

      // Determinar qual tabela verificar baseado na rota
      if (req.baseUrl.includes('emergency-contacts')) {
        query = 'SELECT usuario_id FROM contatos_emergencia WHERE id = ?';
        params = [resourceId];
      } else if (req.baseUrl.includes('medical')) {
        query = 'SELECT usuario_id FROM informacoes_medicas WHERE id = ?';
        params = [resourceId];
      } else {
        // Para recursos de usuário, verificar se o ID é o mesmo
        if (parseInt(resourceId) !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Acesso negado.'
          });
        }
        return next();
      }

      const result = await executeQuery(query, params);

      if (!result || result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Recurso não encontrado'
        });
      }

      if (result[0].usuario_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Você não tem permissão para acessar este recurso.'
        });
      }

      next();
    } catch (error) {
      console.error('Erro no middleware de propriedade:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

/**
 * Middleware para validar senha de acesso público
 */
const validatePublicPassword = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const { senha } = req.body;

    if (!senha) {
      return res.status(400).json({
        success: false,
        message: 'Senha de acesso público é obrigatória'
      });
    }

    // Buscar usuário pela UUID do link público
    const user = await executeQuery(
      'SELECT id, senha_acesso_publico, is_ativo FROM usuarios WHERE link_publico_uuid = ?',
      [uuid]
    );

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Link público não encontrado'
      });
    }

    if (!user[0].is_ativo) {
      return res.status(410).json({
        success: false,
        message: 'Este link público não está mais disponível'
      });
    }

    if (!user[0].senha_acesso_publico) {
      return res.status(403).json({
        success: false,
        message: 'Link público não configurado'
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(senha, user[0].senha_acesso_publico);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Senha de acesso público incorreta'
      });
    }

    req.publicUserId = user[0].id;
    next();
  } catch (error) {
    console.error('Erro na validação da senha pública:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Middleware para verificar se a conta do usuário está ativa
 */
const isAccountActive = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await executeQuery(
      'SELECT is_ativo FROM usuarios WHERE id = ?',
      [userId]
    );

    if (!user || user.length === 0 || !user[0].is_ativo) {
      return res.status(403).json({
        success: false,
        message: 'Conta inativa ou não encontrada'
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar status da conta:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Função helper para gerar JWT
 */
const generateJWT = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * Função helper para hash de senhas
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Função helper para verificar senhas
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  isAuthenticated,
  isOwner,
  validatePublicPassword,
  isAccountActive,
  generateJWT,
  hashPassword,
  verifyPassword
}; 