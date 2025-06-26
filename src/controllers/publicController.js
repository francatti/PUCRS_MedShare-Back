const { executeQuery } = require('../config/database');
const { getMedicalInfoForPublicAccess } = require('./medicalController');
const { getEmergencyContactsForPublic } = require('./emergencyContactController');

/**
 * Obter perfil público com validação de senha
 * Esta é a função principal para acesso aos dados públicos
 */
const getPublicProfile = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { senha } = req.body;

    if (!uuid) {
      return res.status(400).json({
        success: false,
        message: 'UUID do link público é obrigatório'
      });
    }

    if (!senha) {
      return res.status(400).json({
        success: false,
        message: 'Senha de acesso público é obrigatória'
      });
    }

    // O middleware validatePublicPassword já validou a senha
    // e definiu req.publicUserId
    const userId = req.publicUserId;

    // Buscar dados básicos do usuário
    const userData = await executeQuery(
      `SELECT nome, sobrenome, sexo, data_nascimento, telefone
       FROM usuarios 
       WHERE id = ? AND is_ativo = TRUE`,
      [userId]
    );

    if (!userData || userData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Perfil não encontrado'
      });
    }

    const user = userData[0];

    // Obter informações médicas
    const medicalInfo = await getMedicalInfoForPublicAccess(userId);

    // Obter contatos de emergência
    const emergencyContacts = await getEmergencyContactsForPublic(userId);

    // Formatar data de nascimento se existir
    let dataFormatada = null;
    if (user.data_nascimento) {
      const data = new Date(user.data_nascimento);
      dataFormatada = data.toLocaleDateString('pt-BR');
    }

    // Calcular idade se data de nascimento existir
    let idade = null;
    if (user.data_nascimento) {
      const hoje = new Date();
      const nascimento = new Date(user.data_nascimento);
      idade = hoje.getFullYear() - nascimento.getFullYear();
      const mes = hoje.getMonth() - nascimento.getMonth();
      if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }
    }

    const publicProfile = {
      nome: user.nome,
      sobrenome: user.sobrenome,
      nome_completo: `${user.nome} ${user.sobrenome}`,
      sexo: user.sexo,
      data_nascimento: dataFormatada,
      idade: idade,
      telefone: user.telefone,
      informacoes_medicas: {
        tipo_sanguineo: medicalInfo.tipo_sanguineo,
        alergias: medicalInfo.alergias || [],
        medicamentos: medicalInfo.medicamentos || [],
        doencas: medicalInfo.doencas || [],
        cirurgias: medicalInfo.cirurgias || []
      },
      contatos_emergencia: emergencyContacts,
      data_acesso: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: publicProfile
    });

  } catch (error) {
    console.error('Erro ao obter perfil público:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Verificar se link público existe (sem senha)
 * Usado para verificar se o UUID é válido antes de solicitar senha
 */
const checkPublicLink = async (req, res) => {
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.status(400).json({
        success: false,
        message: 'UUID do link público é obrigatório'
      });
    }

    // Buscar usuário pelo UUID
    const users = await executeQuery(
      `SELECT nome, sobrenome, senha_acesso_publico IS NOT NULL as has_password
       FROM usuarios 
       WHERE link_publico_uuid = ? AND is_ativo = TRUE`,
      [uuid]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Link público não encontrado ou indisponível'
      });
    }

    const user = users[0];

    if (!user.has_password) {
      return res.status(403).json({
        success: false,
        message: 'Link público não configurado'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        exists: true,
        owner_name: `${user.nome} ${user.sobrenome}`,
        has_password: true
      }
    });

  } catch (error) {
    console.error('Erro ao verificar link público:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obter estatísticas básicas do perfil público (sem dados sensíveis)
 * Pode ser usado para mostrar um preview antes do acesso completo
 */
const getPublicProfileStats = async (req, res) => {
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.status(400).json({
        success: false,
        message: 'UUID do link público é obrigatório'
      });
    }

    // Buscar dados básicos
    const users = await executeQuery(
      `SELECT u.id, u.nome, u.sobrenome, u.data_nascimento,
              (SELECT COUNT(*) FROM contatos_emergencia WHERE usuario_id = u.id) as total_contatos,
              (SELECT COUNT(*) FROM informacoes_medicas WHERE usuario_id = u.id) as has_medical_info
       FROM usuarios u
       WHERE u.link_publico_uuid = ? AND u.is_ativo = TRUE AND u.senha_acesso_publico IS NOT NULL`,
      [uuid]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Link público não encontrado ou indisponível'
      });
    }

    const user = users[0];

    // Calcular idade se data de nascimento existir
    let idade = null;
    if (user.data_nascimento) {
      const hoje = new Date();
      const nascimento = new Date(user.data_nascimento);
      idade = hoje.getFullYear() - nascimento.getFullYear();
      const mes = hoje.getMonth() - nascimento.getMonth();
      if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        nome: user.nome,
        sobrenome: user.sobrenome,
        nome_completo: `${user.nome} ${user.sobrenome}`,
        idade: idade,
        total_contatos_emergencia: user.total_contatos,
        tem_informacoes_medicas: user.has_medical_info > 0,
        necessita_senha: true
      }
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas do perfil público:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getPublicProfile,
  checkPublicLink,
  getPublicProfileStats
};