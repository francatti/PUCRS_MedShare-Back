const { body, param, validationResult } = require('express-validator');

/**
 * Middleware para processar resultados da validação
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      errors: formattedErrors
    });
  }
  
  next();
};

/**
 * Validações para cadastro de usuário
 */
const validateUserRegistration = [
  body('email')
    .isEmail()
    .withMessage('E-mail deve ter um formato válido')
    .normalizeEmail()
    .trim(),
  
  body('senha')
    .isLength({ min: 8, max: 100 })
    .withMessage('Senha deve ter entre 8 e 100 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número'),
  
  body('nome')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[A-Za-zÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços')
    .trim(),
  
  body('sobrenome')
    .isLength({ min: 2, max: 100 })
    .withMessage('Sobrenome deve ter entre 2 e 100 caracteres')
    .matches(/^[A-Za-zÀ-ÿ\s]+$/)
    .withMessage('Sobrenome deve conter apenas letras e espaços')
    .trim(),
  
  body('sexo')
    .optional()
    .isIn(['Masculino', 'Feminino', 'Outro'])
    .withMessage('Sexo deve ser: Masculino, Feminino ou Outro'),
  
  body('data_nascimento')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Data de nascimento deve estar no formato YYYY-MM-DD')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 0 || age > 120) {
        throw new Error('Data de nascimento inválida');
      }
      
      return true;
    }),
  
  body('telefone')
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage('Telefone deve ter entre 10 e 20 caracteres')
    .matches(/^[\d\s\-\(\)\+]+$/)
    .withMessage('Telefone deve conter apenas números, espaços, parênteses, hífen e sinal de mais'),
  
  body('senha_acesso_publico')
    .optional()
    .isLength({ min: 6, max: 50 })
    .withMessage('Senha de acesso público deve ter entre 6 e 50 caracteres'),
  
  body('consentimento')
    .isBoolean()
    .withMessage('Consentimento deve ser verdadeiro ou falso')
    .custom((value) => {
      if (!value) {
        throw new Error('É necessário aceitar os termos de consentimento');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validações para login
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('E-mail deve ter um formato válido')
    .normalizeEmail()
    .trim(),
  
  body('senha')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  
  handleValidationErrors
];

/**
 * Validações para atualização de dados pessoais
 */
const validatePersonalDataUpdate = [
  body('nome')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[A-Za-zÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços')
    .trim(),
  
  body('sobrenome')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Sobrenome deve ter entre 2 e 100 caracteres')
    .matches(/^[A-Za-zÀ-ÿ\s]+$/)
    .withMessage('Sobrenome deve conter apenas letras e espaços')
    .trim(),
  
  body('sexo')
    .optional()
    .isIn(['Masculino', 'Feminino', 'Outro'])
    .withMessage('Sexo deve ser: Masculino, Feminino ou Outro'),
  
  body('data_nascimento')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Data de nascimento deve estar no formato YYYY-MM-DD')
    .custom((value) => {
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 0 || age > 120) {
          throw new Error('Data de nascimento inválida');
        }
      }
      return true;
    }),
  
  body('telefone')
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage('Telefone deve ter entre 10 e 20 caracteres')
    .matches(/^[\d\s\-\(\)\+]+$/)
    .withMessage('Telefone deve conter apenas números, espaços, parênteses, hífen e sinal de mais'),
  
  handleValidationErrors
];

/**
 * Validações para informações médicas
 */
const validateMedicalInfo = [
  body('tipo_sanguineo')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Tipo sanguíneo deve ser válido (A+, A-, B+, B-, AB+, AB-, O+, O-)'),
  
  body('alergias')
    .optional()
    .isArray()
    .withMessage('Alergias deve ser um array'),
  
  body('alergias.*')
    .optional()
    .isString()
    .withMessage('Cada alergia deve ser uma string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Cada alergia deve ter entre 1 e 100 caracteres'),
  
  body('medicamentos')
    .optional()
    .isArray()
    .withMessage('Medicamentos deve ser um array'),
  
  body('medicamentos.*')
    .optional()
    .isString()
    .withMessage('Cada medicamento deve ser uma string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Cada medicamento deve ter entre 1 e 100 caracteres'),
  
  body('doencas')
    .optional()
    .isArray()
    .withMessage('Doenças deve ser um array'),
  
  body('doencas.*')
    .optional()
    .isString()
    .withMessage('Cada doença deve ser uma string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Cada doença deve ter entre 1 e 100 caracteres'),
  
  body('cirurgias')
    .optional()
    .isArray()
    .withMessage('Cirurgias deve ser um array'),
  
  body('cirurgias.*')
    .optional()
    .isString()
    .withMessage('Cada cirurgia deve ser uma string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Cada cirurgia deve ter entre 1 e 100 caracteres'),
  
  handleValidationErrors
];

/**
 * Validações para contato de emergência
 */
const validateEmergencyContact = [
  body('nome_contato')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do contato deve ter entre 2 e 100 caracteres')
    .matches(/^[A-Za-zÀ-ÿ\s]+$/)
    .withMessage('Nome do contato deve conter apenas letras e espaços')
    .trim(),
  
  body('parentesco')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Parentesco deve ter entre 1 e 50 caracteres')
    .trim(),
  
  body('telefone_contato')
    .matches(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/)
    .withMessage('Telefone do contato deve estar no formato (XX) XXXXX-XXXX'),
  
  handleValidationErrors
];

/**
 * Validação para UUID de perfil público
 */
const validatePublicProfileUUID = [
  param('uuid')
    .isUUID(4)
    .withMessage('UUID do perfil inválido'),
  
  handleValidationErrors
];

/**
 * Validação para senha de acesso público
 */
const validatePublicPassword = [
  body('senha_acesso_publico')
    .notEmpty()
    .withMessage('Senha de acesso público é obrigatória')
    .isLength({ min: 1, max: 50 })
    .withMessage('Senha de acesso público deve ter entre 1 e 50 caracteres'),
  
  handleValidationErrors
];

/**
 * Validações para redefinição de senha
 */
const validatePasswordReset = [
  body('email')
    .isEmail()
    .withMessage('E-mail deve ter um formato válido')
    .normalizeEmail()
    .trim(),
  
  handleValidationErrors
];

/**
 * Validações para nova senha
 */
const validateNewPassword = [
  body('token')
    .notEmpty()
    .withMessage('Token é obrigatório'),
  
  body('nova_senha')
    .isLength({ min: 8, max: 100 })
    .withMessage('Nova senha deve ter entre 8 e 100 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número'),
  
  handleValidationErrors
];

/**
 * Middleware para sanitizar dados de entrada
 */
const sanitizeInput = (req, res, next) => {
  // Sanitizar strings removendo espaços desnecessários
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  next();
};

/**
 * Middleware para limitar tamanho do payload
 */
const limitPayloadSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxBytes = parseFloat(maxSize) * 1024 * 1024; // Converter MB para bytes
    
    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        message: `Payload muito grande. Máximo permitido: ${maxSize}`
      });
    }
    
    next();
  };
};

/**
 * Middleware para validar tipos MIME de uploads
 */
const validateFileType = (allowedTypes = []) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Middleware para validar arrays de dados médicos
 */
const validateMedicalArrays = (req, res, next) => {
  const { alergias, medicamentos, doencas, cirurgias } = req.body;
  
  // Validar e limitar tamanho dos arrays
  const maxArrayLength = 50;
  const maxItemLength = 500;
  
  const validateArray = (arr, fieldName) => {
    if (!arr) return true;
    
    if (!Array.isArray(arr)) {
      return `${fieldName} deve ser um array`;
    }
    
    if (arr.length > maxArrayLength) {
      return `${fieldName} não pode ter mais de ${maxArrayLength} itens`;
    }
    
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      
      if (typeof item !== 'string') {
        return `Todos os itens de ${fieldName} devem ser strings`;
      }
      
      if (item.trim().length === 0) {
        return `Itens vazios não são permitidos em ${fieldName}`;
      }
      
      if (item.length > maxItemLength) {
        return `Cada item de ${fieldName} não pode ter mais de ${maxItemLength} caracteres`;
      }
    }
    
    return true;
  };
  
  const arrays = [
    { data: alergias, name: 'alergias' },
    { data: medicamentos, name: 'medicamentos' },
    { data: doencas, name: 'doenças' },
    { data: cirurgias, name: 'cirurgias' }
  ];
  
  for (const { data, name } of arrays) {
    const validation = validateArray(data, name);
    if (validation !== true) {
      return res.status(400).json({
        success: false,
        message: validation
      });
    }
  }
  
  next();
};

/**
 * Middleware para validar formato de telefone brasileiro
 */
const validateBrazilianPhone = (req, res, next) => {
  const { telefone, telefone_contato } = req.body;
  const phoneToValidate = telefone || telefone_contato;
  
  if (!phoneToValidate) {
    return next();
  }
  
  // Regex para telefones brasileiros
  const phoneRegex = /^(?:\+55\s?)?(?:\(?[1-9]{2}\)?\s?)?(?:9\s?)?[0-9]{4}\s?-?\s?[0-9]{4}$/;
  
  if (!phoneRegex.test(phoneToValidate)) {
    return res.status(400).json({
      success: false,
      message: 'Formato de telefone inválido. Use formato brasileiro: (11) 99999-9999'
    });
  }
  
  next();
};

/**
 * Middleware para prevenir ataques de injeção
 */
const preventInjection = (req, res, next) => {
  const checkForInjection = (obj) => {
    if (typeof obj === 'string') {
      // Verificar padrões suspeitos
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /expression\s*\(/i,
        /vbscript:/i,
        /data:text\/html/i
      ];
      
      return suspiciousPatterns.some(pattern => pattern.test(obj));
    }
    
    if (Array.isArray(obj)) {
      return obj.some(checkForInjection);
    }
    
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkForInjection);
    }
    
    return false;
  };
  
  if (req.body && checkForInjection(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Conteúdo suspeito detectado'
    });
  }
  
  next();
};

module.exports = {
  validateUserRegistration,
  validateLogin,
  validatePersonalDataUpdate,
  validateMedicalInfo,
  validateEmergencyContact,
  validatePublicProfileUUID,
  validatePublicPassword,
  validatePasswordReset,
  validateNewPassword,
  validateRequest: handleValidationErrors,
  handleValidationErrors,
  sanitizeInput,
  limitPayloadSize,
  validateFileType,
  validateMedicalArrays,
  validateBrazilianPhone,
  preventInjection
}; 