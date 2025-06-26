require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { connectDB } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Conectar ao banco de dados
connectDB();

// Middleware de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Aumentar limite para desenvolvimento
  message: {
    error: 'Muitas tentativas realizadas. Tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Ignorar rate limiting em desenvolvimento
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

app.use(limiter);

// CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Em desenvolvimento, permitir localhost e IPs da rede local
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || 
          origin.includes('127.0.0.1') || 
          origin.includes('192.168.') || 
          origin.includes('172.17.')) {
        return callback(null, true);
      }
    }
    
    // Verificar origins permitidos
    const corsOrigins = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const allowedOrigins = [
      ...corsOrigins.split(',').map(origin => origin.trim()),
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://172.17.160.1:3000',
      'http://192.168.15.16:3000'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Para suportar browsers legados
};

app.use(cors(corsOptions));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compressão
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Rotas principais
app.use('/api', routes);

// Middleware de erro - 404
app.use(notFound);

// Middleware de tratamento de erros
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido. Encerrando servidor graciosamente...');
  process.exit(0);
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor MedShare rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err, promise) => {
  console.error('Erro não tratado:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app; 