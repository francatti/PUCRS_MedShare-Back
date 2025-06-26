const { executeQuery } = require('../config/database');
const { encryptJSONData, decryptJSONData } = require('../utils/encryption');

/**
 * @desc    Obter informações médicas do usuário logado
 * @route   GET /api/medical
 * @access  Privado
 */
const getMedicalInfo = async (req, res) => {
  try {
    console.log('🔍 DEBUG - Iniciando getMedicalInfo');
    const userId = req.user.id;
    console.log('📝 DEBUG - UserId:', userId);
    
    const medicalData = await executeQuery(
      `SELECT id, usuario_id, tipo_sanguineo, 
              dados_alergias_cripto, iv_alergias,
              dados_medicamentos_cripto, iv_medicamentos,
              dados_doencas_cripto, iv_doencas,
              dados_cirurgias_cripto, iv_cirurgias,
              data_atualizacao
       FROM informacoes_medicas 
       WHERE usuario_id = ?`,
      [userId]
    );
    
    console.log('🔍 DEBUG - Dados encontrados no banco:', medicalData?.length || 0);
    
    if (!medicalData || medicalData.length === 0) {
      console.log('➕ DEBUG - Criando registro vazio para usuário');
      // Criar registro vazio se não existir
      await executeQuery(
        'INSERT INTO informacoes_medicas (usuario_id) VALUES (?)',
        [userId]
      );

      return res.status(200).json({
        success: true,
        data: {
          id: null,
          usuario_id: userId,
          tipo_sanguineo: null,
          alergias: [],
          medicamentos: [],
          doencas: [],
          cirurgias: [],
          data_atualizacao: null
        }
      });
    }
    
    const data = medicalData[0];
    console.log('🔓 DEBUG - Iniciando descriptografia dos dados...');
    
    // Descriptografar dados sensíveis
    let alergias, medicamentos, doencas, cirurgias;
    
    try {
      alergias = decryptJSONData(data.dados_alergias_cripto, data.iv_alergias) || [];
      console.log('✅ DEBUG - Alergias descriptografadas:', alergias.length);
      
      medicamentos = decryptJSONData(data.dados_medicamentos_cripto, data.iv_medicamentos) || [];
      console.log('✅ DEBUG - Medicamentos descriptografados:', medicamentos.length);
      
      doencas = decryptJSONData(data.dados_doencas_cripto, data.iv_doencas) || [];
      console.log('✅ DEBUG - Doenças descriptografadas:', doencas.length);
      
      cirurgias = decryptJSONData(data.dados_cirurgias_cripto, data.iv_cirurgias) || [];
      console.log('✅ DEBUG - Cirurgias descriptografadas:', cirurgias.length);
      
    } catch (decryptError) {
      console.error('❌ DEBUG - Erro na descriptografia:', decryptError);
      return res.status(500).json({
        success: false,
        message: 'Erro na descriptografia dos dados: ' + decryptError.message
      });
    }
    
    console.log('✅ DEBUG - getMedicalInfo concluído com sucesso');
    
    res.status(200).json({
      success: true,
      data: {
        id: data.id,
        usuario_id: data.usuario_id,
        tipo_sanguineo: data.tipo_sanguineo,
        alergias: alergias,
        medicamentos: medicamentos,
        doencas: doencas,
        cirurgias: cirurgias,
        data_atualizacao: data.data_atualizacao
      }
    });
    
  } catch (error) {
    console.error('❌ DEBUG - Erro geral no getMedicalInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor: ' + error.message
    });
  }
};

/**
 * @desc    Atualizar informações médicas do usuário logado
 * @route   PUT /api/medical
 * @access  Privado
 */
const updateMedicalInfo = async (req, res) => {
  try {
    console.log('🔍 DEBUG - Iniciando updateMedicalInfo');
    const userId = req.user.id;
    const { tipo_sanguineo, alergias, medicamentos, doencas, cirurgias } = req.body;
    
    console.log('📝 DEBUG - Dados recebidos:', {
      userId,
      tipo_sanguineo,
      alergias: alergias?.length,
      medicamentos: medicamentos?.length,
      doencas: doencas?.length,
      cirurgias: cirurgias?.length
    });
    
    // Validar tipo sanguíneo se fornecido
    const tiposSanguineosValidos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (tipo_sanguineo && !tiposSanguineosValidos.includes(tipo_sanguineo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo sanguíneo inválido'
      });
    }
    
    // Validar e normalizar arrays
    const alergiasArray = Array.isArray(alergias) ? alergias : [];
    const medicamentosArray = Array.isArray(medicamentos) ? medicamentos : [];
    const doencasArray = Array.isArray(doencas) ? doencas : [];
    const cirurgiasArray = Array.isArray(cirurgias) ? cirurgias : [];
    
    console.log('🔒 DEBUG - Iniciando criptografia...');
    
    // Criptografar dados sensíveis
    let alergiasEncrypted, medicamentosEncrypted, doencasEncrypted, cirurgiasEncrypted;
    
    try {
      alergiasEncrypted = encryptJSONData(alergiasArray);
      console.log('✅ DEBUG - Alergias criptografadas');
      
      medicamentosEncrypted = encryptJSONData(medicamentosArray);
      console.log('✅ DEBUG - Medicamentos criptografados');
      
      doencasEncrypted = encryptJSONData(doencasArray);
      console.log('✅ DEBUG - Doenças criptografadas');
      
      cirurgiasEncrypted = encryptJSONData(cirurgiasArray);
      console.log('✅ DEBUG - Cirurgias criptografadas');
      
    } catch (encryptError) {
      console.error('❌ DEBUG - Erro na criptografia:', encryptError);
      return res.status(500).json({
        success: false,
        message: 'Erro na criptografia dos dados: ' + encryptError.message
      });
    }
    
    // Verificar se registro já existe
    const existingRecord = await executeQuery(
      'SELECT id FROM informacoes_medicas WHERE usuario_id = ?',
      [userId]
    );
    
    console.log('🔍 DEBUG - Registro existente:', existingRecord?.length > 0);
    
    if (existingRecord && existingRecord.length > 0) {
      // Atualizar registro existente
      console.log('🔄 DEBUG - Atualizando registro existente');
      await executeQuery(
        `UPDATE informacoes_medicas 
         SET tipo_sanguineo = ?,
             dados_alergias_cripto = ?, iv_alergias = ?,
             dados_medicamentos_cripto = ?, iv_medicamentos = ?,
             dados_doencas_cripto = ?, iv_doencas = ?,
             dados_cirurgias_cripto = ?, iv_cirurgias = ?
         WHERE usuario_id = ?`,
        [
          tipo_sanguineo || null,
          alergiasEncrypted.encryptedData, alergiasEncrypted.iv,
          medicamentosEncrypted.encryptedData, medicamentosEncrypted.iv,
          doencasEncrypted.encryptedData, doencasEncrypted.iv,
          cirurgiasEncrypted.encryptedData, cirurgiasEncrypted.iv,
          userId
        ]
      );
    } else {
      // Criar novo registro
      console.log('➕ DEBUG - Criando novo registro');
      await executeQuery(
        `INSERT INTO informacoes_medicas 
         (usuario_id, tipo_sanguineo, 
          dados_alergias_cripto, iv_alergias,
          dados_medicamentos_cripto, iv_medicamentos,
          dados_doencas_cripto, iv_doencas,
          dados_cirurgias_cripto, iv_cirurgias)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          tipo_sanguineo || null,
          alergiasEncrypted.encryptedData, alergiasEncrypted.iv,
          medicamentosEncrypted.encryptedData, medicamentosEncrypted.iv,
          doencasEncrypted.encryptedData, doencasEncrypted.iv,
          cirurgiasEncrypted.encryptedData, cirurgiasEncrypted.iv
        ]
      );
    }
    
    console.log('✅ DEBUG - Dados salvos no banco');
    
    // Buscar dados atualizados
    const updatedData = await executeQuery(
      `SELECT id, usuario_id, tipo_sanguineo, 
              dados_alergias_cripto, iv_alergias,
              dados_medicamentos_cripto, iv_medicamentos,
              dados_doencas_cripto, iv_doencas,
              dados_cirurgias_cripto, iv_cirurgias,
              data_atualizacao
       FROM informacoes_medicas 
       WHERE usuario_id = ?`,
      [userId]
    );
    
    const data = updatedData[0];
    
    console.log('🔓 DEBUG - Iniciando descriptografia...');
    
    // Descriptografar dados para retorno
    const alergiasDescriptografadas = decryptJSONData(data.dados_alergias_cripto, data.iv_alergias) || [];
    const medicamentosDescriptografados = decryptJSONData(data.dados_medicamentos_cripto, data.iv_medicamentos) || [];
    const doencasDescriptografadas = decryptJSONData(data.dados_doencas_cripto, data.iv_doencas) || [];
    const cirurgiasDescriptografadas = decryptJSONData(data.dados_cirurgias_cripto, data.iv_cirurgias) || [];
    
    console.log('✅ DEBUG - Operação concluída com sucesso');
    
    res.status(200).json({
      success: true,
      message: 'Informações médicas atualizadas com sucesso',
      data: {
        id: data.id,
        usuario_id: data.usuario_id,
        tipo_sanguineo: data.tipo_sanguineo,
        alergias: alergiasDescriptografadas,
        medicamentos: medicamentosDescriptografados,
        doencas: doencasDescriptografadas,
        cirurgias: cirurgiasDescriptografadas,
        data_atualizacao: data.data_atualizacao
      }
    });
    
  } catch (error) {
    console.error('❌ DEBUG - Erro geral no updateMedicalInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor: ' + error.message
    });
  }
};

/**
 * @desc    Obter informações médicas para perfil público (descriptografadas)
 * @route   Função helper para publicController
 * @access  Interno
 */
const getMedicalInfoForPublic = async (userId) => {
  try {
    const query = `
      SELECT tipo_sanguineo, dados_alergias_cripto, iv_alergias,
             dados_medicamentos_cripto, iv_medicamentos,
             dados_doencas_cripto, iv_doencas,
             dados_cirurgias_cripto, iv_cirurgias
      FROM informacoes_medicas 
      WHERE usuario_id = ?
    `;
    
    const results = await executeQuery(query, [userId]);
    
    if (!results || results.length === 0) {
      return {
        tipo_sanguineo: null,
        alergias: [],
        medicamentos: [],
        doencas: [],
        cirurgias: []
      };
    }
    
    const medicalData = results[0];
    
    // Descriptografar dados sensíveis
    let alergias = [];
    let medicamentos = [];
    let doencas = [];
    let cirurgias = [];
    
    try {
      if (medicalData.dados_alergias_cripto && medicalData.iv_alergias) {
        alergias = decryptJSONData(medicalData.dados_alergias_cripto, medicalData.iv_alergias) || [];
      }
      
      if (medicalData.dados_medicamentos_cripto && medicalData.iv_medicamentos) {
        medicamentos = decryptJSONData(medicalData.dados_medicamentos_cripto, medicalData.iv_medicamentos) || [];
      }
      
      if (medicalData.dados_doencas_cripto && medicalData.iv_doencas) {
        doencas = decryptJSONData(medicalData.dados_doencas_cripto, medicalData.iv_doencas) || [];
      }
      
      if (medicalData.dados_cirurgias_cripto && medicalData.iv_cirurgias) {
        cirurgias = decryptJSONData(medicalData.dados_cirurgias_cripto, medicalData.iv_cirurgias) || [];
      }
      
    } catch (decryptError) {
      console.error('Erro ao descriptografar dados médicos para perfil público:', decryptError.message);
      // Em caso de erro, retornar dados vazios
      alergias = [];
      medicamentos = [];
      doencas = [];
      cirurgias = [];
    }
    
    return {
      tipo_sanguineo: medicalData.tipo_sanguineo,
      alergias,
      medicamentos,
      doencas,
      cirurgias
    };
    
  } catch (error) {
    console.error('Erro ao obter informações médicas para perfil público:', error.message);
    return {
      tipo_sanguineo: null,
      alergias: [],
      medicamentos: [],
      doencas: [],
      cirurgias: []
    };
  }
};

/**
 * Limpar todas as informações médicas do usuário
 */
const clearMedicalInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    await executeQuery(
      `UPDATE informacoes_medicas 
       SET tipo_sanguineo = NULL,
           dados_alergias_cripto = NULL, iv_alergias = NULL,
           dados_medicamentos_cripto = NULL, iv_medicamentos = NULL,
           dados_doencas_cripto = NULL, iv_doencas = NULL,
           dados_cirurgias_cripto = NULL, iv_cirurgias = NULL
       WHERE usuario_id = ?`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Informações médicas removidas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao limpar informações médicas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getMedicalInfo,
  updateMedicalInfo,
  getMedicalInfoForPublicAccess: getMedicalInfoForPublic,
  clearMedicalInfo
}; 