const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { isAuthenticated, isAccountActive } = require('../middleware/auth');
const {
  getMedicalInfo,
  updateMedicalInfo,
  clearMedicalInfo
} = require('../controllers/medicalController');

// Aplicar middleware de autenticação a todas as rotas
router.use(isAuthenticated);
router.use(isAccountActive);

/**
 * @route   GET /api/medical/info
 * @desc    Obter informações médicas do usuário
 * @access  Privado
 */
router.get('/info', getMedicalInfo);

/**
 * @route   PUT /api/medical/info
 * @desc    Atualizar informações médicas do usuário
 * @access  Privado
 */
router.put('/info', [
  body('tipo_sanguineo')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Tipo sanguíneo deve ser um dos valores válidos: A+, A-, B+, B-, AB+, AB-, O+, O-'),
  body('alergias')
    .optional()
    .isArray()
    .withMessage('Alergias deve ser um array'),
  body('alergias.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Cada alergia deve ter entre 1 e 500 caracteres'),
  body('medicamentos')
    .optional()
    .isArray()
    .withMessage('Medicamentos deve ser um array'),
  body('medicamentos.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Cada medicamento deve ter entre 1 e 500 caracteres'),
  body('doencas')
    .optional()
    .isArray()
    .withMessage('Doenças deve ser um array'),
  body('doencas.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Cada doença deve ter entre 1 e 500 caracteres'),
  body('cirurgias')
    .optional()
    .isArray()
    .withMessage('Cirurgias deve ser um array'),
  body('cirurgias.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Cada cirurgia deve ter entre 1 e 500 caracteres'),
  validateRequest
], updateMedicalInfo);

/**
 * @route   DELETE /api/medical/info
 * @desc    Limpar todas as informações médicas
 * @access  Privado
 */
router.delete('/info', clearMedicalInfo);

module.exports = router; 