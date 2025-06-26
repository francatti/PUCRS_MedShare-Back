/**
 * Middleware para tratar erros 404 - Not Found
 */
const notFound = (req, res, next) => {
  const error = new Error(`Rota não encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Middleware para tratamento de erros gerais
 */
const errorHandler = (err, req, res, next) => {
  // Se o status já foi definido, usa ele, senão usa 500
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Erro específico do MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 400;
    if (err.message.includes('email')) {
      message = 'Este e-mail já está cadastrado no sistema';
    } else if (err.message.includes('link_publico_uuid')) {
      message = 'Erro interno ao gerar link único. Tente novamente';
    } else {
      message = 'Dados duplicados encontrados';
    }
  }

  // Erro de conexão com banco
  if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Serviço temporariamente indisponível. Tente novamente mais tarde';
  }

  // Erro de validação do express-validator
  if (err.type === 'validation') {
    statusCode = 400;
    message = 'Dados de entrada inválidos';
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token de acesso inválido';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token de acesso expirado';
  }

  // Erro de criptografia
  if (err.message.includes('criptografia') || err.message.includes('descriptografia')) {
    statusCode = 500;
    message = 'Erro interno no processamento de dados';
  }

  // Log do erro em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 Erro capturado:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
  }

  // Resposta de erro
  const errorResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar erros assíncronos
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Função para criar erros customizados
 */
const createError = (message, statusCode = 500, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

/**
 * Middleware para validar Content-Type JSON
 */
const validateJsonContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!req.is('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type deve ser application/json'
      });
    }
  }
  next();
};

/**
 * Middleware para log de requisições em desenvolvimento
 */
const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📝 ${req.method} ${req.originalUrl}`, {
      body: req.body,
      params: req.params,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  }
  next();
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
  createError,
  validateJsonContentType,
  requestLogger
}; 