const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { isAuthenticated, isAccountActive } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  updatePassword,
  generatePublicLink,
  getQRCode,
  getPublicLinkInfo,
  disablePublicLink,
  deleteAccount
} = require('../controllers/userController');

// Aplicar middleware de autenticação a todas as rotas
router.use(isAuthenticated);
router.use(isAccountActive);

/**
 * @route   GET /api/users/profile
 * @desc    Obter perfil do usuário
 * @access  Privado
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Atualizar perfil do usuário
 * @access  Privado
 */
router.put('/profile', [
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
    .isLength({ min: 10, max: 20 })
    .withMessage('Telefone deve ter entre 10 e 20 caracteres')
    .matches(/^[\d\s\-\(\)\+]+$/)
    .withMessage('Telefone deve conter apenas números, espaços, parênteses, hífen e sinal de mais'),
  validateRequest
], updateProfile);

/**
 * @route   PUT /api/users/password
 * @desc    Atualizar senha do usuário
 * @access  Privado
 */
router.put('/password', [
  body('senha_atual')
    .isLength({ min: 1 })
    .withMessage('Senha atual é obrigatória'),
  body('nova_senha')
    .isLength({ min: 8 })
    .withMessage('Nova senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número'),
  validateRequest
], updatePassword);

/**
 * @route   POST /api/users/generate-public-link
 * @desc    Gerar ou atualizar link público
 * @access  Privado
 */
router.post('/generate-public-link', [
  body('senha_acesso_publico')
    .isLength({ min: 6 })
    .withMessage('Senha de acesso público deve ter pelo menos 6 caracteres'),
  validateRequest
], generatePublicLink);

/**
 * @route   GET /api/users/public-link-info
 * @desc    Obter informações do link público (sem senha)
 * @access  Privado
 */
router.get('/public-link-info', getPublicLinkInfo);

/**
 * @route   DELETE /api/users/public-link
 * @desc    Desativar link público
 * @access  Privado
 */
router.delete('/public-link', disablePublicLink);

/**
 * @route   GET /api/users/qr-code
 * @desc    Obter QR Code do perfil público
 * @access  Privado
 */
router.get('/qr-code', getQRCode);

/**
 * @route   DELETE /api/users/account
 * @desc    Excluir conta permanentemente (LGPD)
 * @access  Privado
 */
router.delete('/account', [
  body('senha')
    .isLength({ min: 1 })
    .withMessage('Senha é obrigatória para excluir a conta'),
  validateRequest
], deleteAccount);

module.exports = router; 