const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { isAuthenticated, isAccountActive } = require('../middleware/auth');
const {
  getEmergencyContacts,
  getEmergencyContact,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact
} = require('../controllers/emergencyContactController');

// Aplicar middleware de autenticação a todas as rotas
router.use(isAuthenticated);
router.use(isAccountActive);

/**
 * @route   GET /api/emergency-contacts
 * @desc    Listar todos os contatos de emergência do usuário
 * @access  Privado
 */
router.get('/', getEmergencyContacts);

/**
 * @route   GET /api/emergency-contacts/:id
 * @desc    Obter um contato de emergência específico
 * @access  Privado
 */
router.get('/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID do contato deve ser um número inteiro positivo'),
  validateRequest
], getEmergencyContact);

/**
 * @route   POST /api/emergency-contacts
 * @desc    Criar novo contato de emergência
 * @access  Privado
 */
router.post('/', [
  body('nome_contato')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do contato deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome do contato deve conter apenas letras e espaços'),
  body('parentesco')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Parentesco deve ter entre 1 e 50 caracteres'),
  body('telefone_contato')
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage('Telefone deve ter entre 8 e 20 caracteres')
    .matches(/^[\d\s\-\(\)\+]+$/)
    .withMessage('Formato de telefone inválido'),
  validateRequest
], createEmergencyContact);

/**
 * @route   PUT /api/emergency-contacts/:id
 * @desc    Atualizar contato de emergência
 * @access  Privado
 */
router.put('/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID do contato deve ser um número inteiro positivo'),
  body('nome_contato')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do contato deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome do contato deve conter apenas letras e espaços'),
  body('parentesco')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Parentesco deve ter entre 1 e 50 caracteres'),
  body('telefone_contato')
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage('Telefone deve ter entre 8 e 20 caracteres')
    .matches(/^[\d\s\-\(\)\+]+$/)
    .withMessage('Formato de telefone inválido'),
  validateRequest
], updateEmergencyContact);

/**
 * @route   DELETE /api/emergency-contacts/:id
 * @desc    Deletar contato de emergência
 * @access  Privado
 */
router.delete('/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID do contato deve ser um número inteiro positivo'),
  validateRequest
], deleteEmergencyContact);

module.exports = router; 