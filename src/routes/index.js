const express = require('express');
const router = express.Router();

// Importar rotas específicas
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const medicalRoutes = require('./medicalRoutes');
const emergencyContactRoutes = require('./emergencyContactRoutes');
const publicRoutes = require('./publicRoutes');

// Definir rotas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/medical', medicalRoutes);
router.use('/emergency-contacts', emergencyContactRoutes);
router.use('/public', publicRoutes);

// Rota de informações da API
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API MedShare funcionando',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password'
      },
      users: {
        profile: 'GET /api/users/profile',
        updateProfile: 'PUT /api/users/profile',
        updatePassword: 'PUT /api/users/password',
        generatePublicLink: 'POST /api/users/generate-public-link',
        getQRCode: 'GET /api/users/qr-code',
        deleteAccount: 'DELETE /api/users/account'
      },
      medical: {
        get: 'GET /api/medical',
        update: 'PUT /api/medical'
      },
      emergencyContacts: {
        list: 'GET /api/emergency-contacts',
        create: 'POST /api/emergency-contacts',
        update: 'PUT /api/emergency-contacts/:id',
        delete: 'DELETE /api/emergency-contacts/:id'
      },
      public: {
        getProfile: 'POST /api/public/profile/:uuid'
      }
    }
  });
});

module.exports = router; 