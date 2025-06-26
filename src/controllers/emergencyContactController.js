const { executeQuery } = require('../config/database');

/**
 * @desc    Obter contatos de emergência do usuário logado
 * @route   GET /api/emergency-contacts
 * @access  Privado
 */
const getEmergencyContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const contacts = await executeQuery(
      `SELECT id, usuario_id, nome_contato, parentesco, telefone_contato
       FROM contatos_emergencia 
       WHERE usuario_id = ? 
       ORDER BY nome_contato ASC`,
      [userId]
    );
    
    res.status(200).json({
      success: true,
      data: contacts || []
    });
    
  } catch (error) {
    console.error('Erro ao obter contatos de emergência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Obter um contato de emergência específico
 * @route   GET /api/emergency-contacts/:id
 * @access  Privado
 */
const getEmergencyContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const contactId = req.params.id;
    
    if (!contactId || isNaN(contactId)) {
      return res.status(400).json({
        success: false,
        message: 'ID do contato inválido'
      });
    }
    
    const contacts = await executeQuery(
      `SELECT id, usuario_id, nome_contato, parentesco, telefone_contato
       FROM contatos_emergencia 
       WHERE id = ? AND usuario_id = ?`,
      [contactId, userId]
    );
    
    if (!contacts || contacts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contato de emergência não encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: contacts[0]
    });
    
  } catch (error) {
    console.error('Erro ao obter contato de emergência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Criar novo contato de emergência
 * @route   POST /api/emergency-contacts
 * @access  Privado
 */
const createEmergencyContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nome_contato, parentesco, telefone_contato } = req.body;
    
    // Validações básicas
    if (!nome_contato || !telefone_contato) {
      return res.status(400).json({
        success: false,
        message: 'Nome do contato e telefone são obrigatórios'
      });
    }
    
    // Validar formato do telefone (básico)
    const telefoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (!telefoneRegex.test(telefone_contato)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de telefone inválido'
      });
    }
    
    // Limitar número de contatos por usuário
    const existingContacts = await executeQuery(
      'SELECT COUNT(*) as total FROM contatos_emergencia WHERE usuario_id = ?',
      [userId]
    );
    
    if (existingContacts[0].total >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Limite máximo de 5 contatos de emergência atingido'
      });
    }
    
    // Verificar se já existe contato com mesmo nome e telefone
    const duplicateCheck = await executeQuery(
      `SELECT id FROM contatos_emergencia 
       WHERE usuario_id = ? AND nome_contato = ? AND telefone_contato = ?`,
      [userId, nome_contato.trim(), telefone_contato.trim()]
    );
    
    if (duplicateCheck && duplicateCheck.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um contato com este nome e telefone'
      });
    }
    
    // Criar contato
    const result = await executeQuery(
      `INSERT INTO contatos_emergencia (usuario_id, nome_contato, parentesco, telefone_contato)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        nome_contato.trim(),
        parentesco ? parentesco.trim() : null,
        telefone_contato.trim()
      ]
    );
    
    if (!result.insertId) {
      throw new Error('Falha ao criar contato de emergência');
    }
    
    // Buscar contato criado
    const newContact = await executeQuery(
      `SELECT id, usuario_id, nome_contato, parentesco, telefone_contato
       FROM contatos_emergencia 
       WHERE id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Contato de emergência criado com sucesso',
      data: newContact[0]
    });
    
  } catch (error) {
    console.error('Erro ao criar contato de emergência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Atualizar contato de emergência
 * @route   PUT /api/emergency-contacts/:id
 * @access  Privado
 */
const updateEmergencyContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const contactId = req.params.id;
    const { nome_contato, parentesco, telefone_contato } = req.body;
    
    if (!contactId || isNaN(contactId)) {
      return res.status(400).json({
        success: false,
        message: 'ID do contato inválido'
      });
    }
    
    // Validações básicas
    if (!nome_contato || !telefone_contato) {
      return res.status(400).json({
        success: false,
        message: 'Nome do contato e telefone são obrigatórios'
      });
    }
    
    // Validar formato do telefone
    const telefoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (!telefoneRegex.test(telefone_contato)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de telefone inválido'
      });
    }
    
    // Verificar se contato existe e pertence ao usuário
    const existingContact = await executeQuery(
      'SELECT id FROM contatos_emergencia WHERE id = ? AND usuario_id = ?',
      [contactId, userId]
    );
    
    if (!existingContact || existingContact.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contato de emergência não encontrado'
      });
    }
    
    // Verificar duplicata (excluindo o próprio contato)
    const duplicateCheck = await executeQuery(
      `SELECT id FROM contatos_emergencia 
       WHERE usuario_id = ? AND nome_contato = ? AND telefone_contato = ? AND id != ?`,
      [userId, nome_contato.trim(), telefone_contato.trim(), contactId]
    );
    
    if (duplicateCheck && duplicateCheck.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Já existe outro contato com este nome e telefone'
      });
    }
    
    // Atualizar contato
    await executeQuery(
      `UPDATE contatos_emergencia 
       SET nome_contato = ?, parentesco = ?, telefone_contato = ?
       WHERE id = ? AND usuario_id = ?`,
      [
        nome_contato.trim(),
        parentesco ? parentesco.trim() : null,
        telefone_contato.trim(),
        contactId,
        userId
      ]
    );
    
    // Buscar contato atualizado
    const updatedContact = await executeQuery(
      `SELECT id, usuario_id, nome_contato, parentesco, telefone_contato
       FROM contatos_emergencia 
       WHERE id = ?`,
      [contactId]
    );
    
    res.status(200).json({
      success: true,
      message: 'Contato de emergência atualizado com sucesso',
      data: updatedContact[0]
    });
    
  } catch (error) {
    console.error('Erro ao atualizar contato de emergência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Excluir contato de emergência
 * @route   DELETE /api/emergency-contacts/:id
 * @access  Privado
 */
const deleteEmergencyContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const contactId = req.params.id;
    
    if (!contactId || isNaN(contactId)) {
      return res.status(400).json({
        success: false,
        message: 'ID do contato inválido'
      });
    }
    
    // Verificar se contato existe e pertence ao usuário
    const existingContact = await executeQuery(
      'SELECT id, nome_contato FROM contatos_emergencia WHERE id = ? AND usuario_id = ?',
      [contactId, userId]
    );
    
    if (!existingContact || existingContact.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contato de emergência não encontrado'
      });
    }
    
    // Deletar contato
    await executeQuery(
      'DELETE FROM contatos_emergencia WHERE id = ? AND usuario_id = ?',
      [contactId, userId]
    );
    
    res.status(200).json({
      success: true,
      message: `Contato "${existingContact[0].nome_contato}" removido com sucesso`
    });
    
  } catch (error) {
    console.error('Erro ao deletar contato de emergência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * @desc    Obter contatos de emergência para perfil público
 * @route   Função helper para publicController
 * @access  Interno
 */
const getEmergencyContactsForPublic = async (userId) => {
  try {
    const contacts = await executeQuery(
      `SELECT nome_contato, parentesco, telefone_contato
       FROM contatos_emergencia 
       WHERE usuario_id = ? 
       ORDER BY nome_contato ASC`,
      [userId]
    );
    
    return contacts || [];
    
  } catch (error) {
    console.error('Erro ao obter contatos de emergência para perfil público:', error);
    throw error;
  }
};

module.exports = {
  getEmergencyContacts,
  getEmergencyContact,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getEmergencyContactsForPublic
}; 