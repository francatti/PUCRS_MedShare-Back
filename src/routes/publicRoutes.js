const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { validatePublicPassword } = require('../middleware/auth');
const {
  getPublicProfile,
  checkPublicLink,
  getPublicProfileStats
} = require('../controllers/publicController');

/**
 * @route   GET /api/public/check/:uuid
 * @desc    Verificar se link público existe (sem senha)
 * @access  Público
 */
router.get('/check/:uuid', [
  param('uuid')
    .isUUID(4)
    .withMessage('UUID inválido'),
  validateRequest
], checkPublicLink);

/**
 * @route   GET /api/public/stats/:uuid
 * @desc    Obter estatísticas básicas do perfil (sem dados sensíveis)
 * @access  Público
 */
router.get('/stats/:uuid', [
  param('uuid')
    .isUUID(4)
    .withMessage('UUID inválido'),
  validateRequest
], getPublicProfileStats);

/**
 * @route   POST /api/public/profile/:uuid
 * @desc    Obter perfil público com validação de senha
 * @access  Público
 */
router.post('/profile/:uuid', [
  param('uuid')
    .isUUID(4)
    .withMessage('UUID inválido'),
  body('senha')
    .isLength({ min: 1 })
    .withMessage('Senha de acesso público é obrigatória'),
  validateRequest,
  validatePublicPassword
], getPublicProfile);

module.exports = router; 