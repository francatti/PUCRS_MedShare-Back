const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { executeQuery, executeTransaction } = require('../config/database');
const { hashPassword, verifyPassword } = require('../middleware/auth');

/**
 * @desc    Obter perfil do usuário logado
 * @route   GET /api/users/profile
 * @access  Privado
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar dados do usuário
    const userQuery = `
      SELECT id, email, nome, sobrenome, sexo, data_nascimento, 
             telefone, link_publico_uuid, data_cadastro, data_atualizacao
      FROM usuarios 
      WHERE id = ? AND is_ativo = true
    `;
    
    const users = await executeQuery(userQuery, [userId]);
    
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    const user = users[0];
    
    // Verificar se tem senha de acesso público configurada
    const publicAccessQuery = `
      SELECT senha_acesso_publico IS NOT NULL as has_public_password
      FROM usuarios 
      WHERE id = ?
    `;
    
    const publicAccess = await executeQuery(publicAccessQuery, [userId]);
    const hasPublicPassword = publicAccess[0]?.has_public_password || false;
    
    // Formatar data de nascimento
    if (user.data_nascimento) {
      user.data_nascimento = user.data_nascimento.toISOString().split('T')[0];
    }
    
    res.json({
      success: true,
      message: 'Perfil obtido com sucesso',
      data: {
        ...user,
        has_public_password: hasPublicPassword,
        public_url: user.link_publico_uuid 
          ? `${process.env.FRONTEND_URL}/perfil-publico/${user.link_publico_uuid}`
          : null
      }
    });
    
  } catch (error) {
    console.error('Erro ao obter perfil:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Atualizar perfil do usuário logado
 * @route   PUT /api/users/profile
 * @access  Privado
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nome, sobrenome, sexo, data_nascimento, telefone } = req.body;
    
    // Validações básicas
    if (!nome || !sobrenome) {
      return res.status(400).json({
        success: false,
        message: 'Nome e sobrenome são obrigatórios'
      });
    }
    
    // Validar sexo se fornecido
    if (sexo && !['Masculino', 'Feminino', 'Outro'].includes(sexo)) {
      return res.status(400).json({
        success: false,
        message: 'Sexo deve ser: Masculino, Feminino ou Outro'
      });
    }
    
    // Validar data de nascimento se fornecida
    if (data_nascimento) {
      const birthDate = new Date(data_nascimento);
      const today = new Date();
      
      if (birthDate >= today) {
        return res.status(400).json({
          success: false,
          message: 'Data de nascimento deve ser anterior à data atual'
        });
      }
    }
    
    // Atualizar dados do usuário
    const updateQuery = `
      UPDATE usuarios 
      SET nome = ?, sobrenome = ?, sexo = ?, data_nascimento = ?, telefone = ?
      WHERE id = ? AND is_ativo = true
    `;
    
    const result = await executeQuery(updateQuery, [
      nome.trim(),
      sobrenome.trim(), 
      sexo || null,
      data_nascimento || null,
      telefone || null,
      userId
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Buscar dados atualizados
    const updatedUser = await executeQuery(
      `SELECT id, email, nome, sobrenome, sexo, data_nascimento, telefone, 
              link_publico_uuid, data_cadastro, data_atualizacao
       FROM usuarios 
       WHERE id = ?`,
      [userId]
    );
    
    const user = updatedUser[0];
    
    // Formatar data de nascimento
    if (user.data_nascimento) {
      user.data_nascimento = user.data_nascimento.toISOString().split('T')[0];
    }
    
    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: user
    });
    
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Atualizar senha do usuário logado
 * @route   PUT /api/users/password
 * @access  Privado
 */
const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { senha_atual, nova_senha } = req.body;
    
    if (!senha_atual || !nova_senha) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }
    
    // Validar força da nova senha
    if (nova_senha.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A nova senha deve ter pelo menos 8 caracteres'
      });
    }
    
    // Buscar senha atual
    const userQuery = 'SELECT senha FROM usuarios WHERE id = ? AND is_ativo = true';
    const users = await executeQuery(userQuery, [userId]);
    
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar senha atual
    const isValidCurrentPassword = await verifyPassword(senha_atual, users[0].senha);
    
    if (!isValidCurrentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }
    
    // Hash da nova senha
    const hashedNewPassword = await hashPassword(nova_senha);
    
    // Atualizar senha
    const updateQuery = 'UPDATE usuarios SET senha = ? WHERE id = ?';
    await executeQuery(updateQuery, [hashedNewPassword, userId]);
    
    res.json({
      success: true,
      message: 'Senha atualizada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar senha:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Gerar/atualizar link público e senha de acesso
 * @route   POST /api/users/generate-public-link
 * @access  Privado
 */
const generatePublicLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const { senha_acesso_publico } = req.body;
    
    if (!senha_acesso_publico) {
      return res.status(400).json({
        success: false,
        message: 'Senha de acesso público é obrigatória'
      });
    }
    
    // Validar força da senha de acesso público
    if (senha_acesso_publico.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha de acesso público deve ter pelo menos 6 caracteres'
      });
    }
    
    // Hash da senha de acesso público
    const hashedPublicPassword = await hashPassword(senha_acesso_publico);
    
    // Gerar novo UUID se ainda não existir
    const userQuery = 'SELECT link_publico_uuid FROM usuarios WHERE id = ?';
    const users = await executeQuery(userQuery, [userId]);
    
    let linkPublicoUuid = users[0]?.link_publico_uuid;
    
    if (!linkPublicoUuid) {
      linkPublicoUuid = uuidv4();
    }
    
    // Atualizar UUID e senha pública
    const updateQuery = `
      UPDATE usuarios 
      SET link_publico_uuid = ?, senha_acesso_publico = ?
      WHERE id = ? AND is_ativo = true
    `;
    
    await executeQuery(updateQuery, [linkPublicoUuid, hashedPublicPassword, userId]);
    
    const publicUrl = `${process.env.FRONTEND_URL}/perfil-publico/${linkPublicoUuid}`;
    
    res.json({
      success: true,
      message: 'Link público gerado com sucesso',
      data: {
        link_publico_uuid: linkPublicoUuid,
        public_url: publicUrl
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar link público:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Obter QR code do perfil público
 * @route   GET /api/users/qr-code
 * @access  Privado
 */
const getQRCode = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar UUID do usuário
    const userQuery = `
      SELECT link_publico_uuid, nome, sobrenome 
      FROM usuarios 
      WHERE id = ? AND is_ativo = true
    `;
    
    const users = await executeQuery(userQuery, [userId]);
    
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    const user = users[0];
    
    if (!user.link_publico_uuid) {
      return res.status(400).json({
        success: false,
        message: 'Link público não configurado. Configure primeiro a senha de acesso público.'
      });
    }
    
    const publicUrl = `${process.env.FRONTEND_URL}/perfil-publico/${user.link_publico_uuid}`;
    
    // Gerar QR Code como buffer PNG
    const qrCodeOptions = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256,
      errorCorrectionLevel: 'M'
    };
    
    const qrCodeBuffer = await QRCode.toBuffer(publicUrl, qrCodeOptions);
    
    // Retornar como imagem PNG
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="medshare-qrcode.png"');
    res.setHeader('Content-Length', qrCodeBuffer.length);
    
    res.send(qrCodeBuffer);
    
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Excluir conta do usuário
 * @route   DELETE /api/users/account
 * @access  Privado
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { senha } = req.body;
    
    if (!senha) {
      return res.status(400).json({
        success: false,
        message: 'Senha é obrigatória para exclusão da conta'
      });
    }
    
    // Verificar senha
    const userQuery = 'SELECT senha FROM usuarios WHERE id = ? AND is_ativo = true';
    const users = await executeQuery(userQuery, [userId]);
    
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    const isValidPassword = await verifyPassword(senha, users[0].senha);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha incorreta'
      });
    }
    
    // Excluir dados relacionados e desativar usuário
    const queries = [
      {
        query: 'DELETE FROM contatos_emergencia WHERE usuario_id = ?',
        params: [userId]
      },
      {
        query: 'DELETE FROM informacoes_medicas WHERE usuario_id = ?',
        params: [userId]
      },
      {
        query: 'DELETE FROM tokens_recuperacao_senha WHERE usuario_id = ?',
        params: [userId]
      },
      {
        query: 'UPDATE usuarios SET is_ativo = false, link_publico_uuid = NULL WHERE id = ?',
        params: [userId]
      }
    ];
    
    await executeTransaction(queries);
    
    res.json({
      success: true,
      message: 'Conta excluída com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao excluir conta:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Obter informações do link público (sem senha)
 * @route   GET /api/users/public-link-info
 * @access  Privado
 */
const getPublicLinkInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar informações do link público
    const userQuery = `
      SELECT link_publico_uuid, 
             senha_acesso_publico IS NOT NULL as has_public_password,
             CONCAT(nome, ' ', sobrenome) as owner_name
      FROM usuarios 
      WHERE id = ? AND is_ativo = true
    `;
    
    const users = await executeQuery(userQuery, [userId]);
    
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    const user = users[0];
    
    res.json({
      success: true,
      data: {
        has_public_link: !!user.link_publico_uuid,
        has_public_password: user.has_public_password,
        link_url: user.link_publico_uuid 
          ? `${process.env.FRONTEND_URL}/perfil-publico/${user.link_publico_uuid}`
          : null,
        owner_name: user.owner_name
      }
    });
    
  } catch (error) {
    console.error('Erro ao obter informações do link público:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Desativar link público
 * @route   DELETE /api/users/public-link
 * @access  Privado
 */
const disablePublicLink = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Remover UUID e senha do link público
    const updateQuery = `
      UPDATE usuarios 
      SET link_publico_uuid = NULL, senha_acesso_publico = NULL
      WHERE id = ? AND is_ativo = true
    `;
    
    const result = await executeQuery(updateQuery, [userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Link público desativado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao desativar link público:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  generatePublicLink,
  getPublicLinkInfo,
  disablePublicLink,
  getQRCode,
  deleteAccount
}; 