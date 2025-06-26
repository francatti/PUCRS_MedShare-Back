const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { 
  login, 
  register, 
  forgotPassword, 
  resetPassword,
  verifyResetToken 
} = require('../controllers/authController');

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuário
 * @access  Público
 */
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email válido é obrigatório'),
  body('senha')
    .isLength({ min: 1 })
    .withMessage('Senha é obrigatória'),
  validateRequest
], login);

/**
 * @route   POST /api/auth/register
 * @desc    Registro de novo usuário
 * @access  Público
 */
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email válido é obrigatório'),
  body('senha')
    .isLength({ min: 8 })
    .withMessage('Senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número'),
  body('nome')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
  body('sobrenome')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Sobrenome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Sobrenome deve conter apenas letras e espaços'),
  body('sexo')
    .optional()
    .isIn(['Masculino', 'Feminino', 'Outro'])
    .withMessage('Sexo deve ser: Masculino, Feminino ou Outro'),
  body('data_nascimento')
    .optional()
    .isISO8601()
    .withMessage('Data de nascimento deve estar em formato válido (YYYY-MM-DD)')
    .custom((value) => {
      if (value && new Date(value) >= new Date()) {
        throw new Error('Data de nascimento deve ser anterior à data atual');
      }
      return true;
    }),
  body('telefone')
    .optional()
    .matches(/^[\d\s\-\(\)\+]+$/)
    .withMessage('Formato de telefone inválido'),
  body('consentimento')
    .equals('true')
    .withMessage('É necessário aceitar os termos de uso e política de privacidade'),
  validateRequest
], register);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar redefinição de senha
 * @access  Público
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email válido é obrigatório'),
  validateRequest
], forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Redefinir senha com token
 * @access  Público
 */
router.post('/reset-password', [
  body('token')
    .isLength({ min: 1 })
    .withMessage('Token é obrigatório'),
  body('nova_senha')
    .isLength({ min: 8 })
    .withMessage('Nova senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número'),
  validateRequest
], resetPassword);

/**
 * @route   GET /api/auth/verify-reset-token/:token
 * @desc    Verificar validade do token de redefinição
 * @access  Público
 */
router.get('/verify-reset-token/:token', verifyResetToken);

module.exports = router; 