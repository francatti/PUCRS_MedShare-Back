const mysql = require('mysql2/promise');

let connection = null;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medshare',
  charset: 'utf8mb4',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

const connectDB = async () => {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao MySQL com sucesso');
    
    // Testar a conexão
    await connection.execute('SELECT 1');
    console.log('✅ Teste de conexão MySQL: OK');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:', error.message);
    
    // Em desenvolvimento, tentar novamente em 5 segundos
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Tentando reconectar em 5 segundos...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

const getConnection = () => {
  if (!connection) {
    throw new Error('Conexão com banco de dados não estabelecida');
  }
  return connection;
};

const closeConnection = async () => {
  if (connection) {
    await connection.end();
    console.log('🔌 Conexão MySQL encerrada');
  }
};

// Função helper para executar queries com tratamento de erro
const executeQuery = async (query, params = []) => {
  try {
    const conn = getConnection();
    const [results] = await conn.execute(query, params);
    return results;
  } catch (error) {
    console.error('❌ Erro ao executar query:', error.message);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
};

// Função helper para transações
const executeTransaction = async (queries) => {
  const conn = getConnection();
  await conn.beginTransaction();
  
  try {
    const results = [];
    
    for (const { query, params } of queries) {
      const [result] = await conn.execute(query, params);
      results.push(result);
    }
    
    await conn.commit();
    return results;
  } catch (error) {
    await conn.rollback();
    throw error;
  }
};

module.exports = {
  connectDB,
  getConnection,
  closeConnection,
  executeQuery,
  executeTransaction
}; 