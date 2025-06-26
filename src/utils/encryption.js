const crypto = require('crypto');

// Algoritmo de criptografia
const algorithm = 'aes-256-cbc';

// Chave de criptografia (deve ser obtida da variável de ambiente)
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY não foi definida nas variáveis de ambiente');
  }
  
  // Aceitar chave em formato hex (64 caracteres) ou utf8 (32 caracteres)
  if (key.length === 64) {
    // Chave em formato hexadecimal (64 chars = 32 bytes)
    return Buffer.from(key, 'hex');
  } else if (key.length === 32) {
    // Chave em formato UTF-8 (32 caracteres)
    return Buffer.from(key, 'utf8');
  } else {
    throw new Error('ENCRYPTION_KEY deve ter 32 caracteres (UTF-8) ou 64 caracteres (hex)');
  }
};

/**
 * Criptografa dados sensíveis
 * @param {string} text - Texto a ser criptografado
 * @returns {object} - Objeto com dados criptografados e IV
 */
const encryptData = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      return { encryptedData: null, iv: null };
    }

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // Initialization Vector
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Erro ao criptografar dados:', error.message);
    throw new Error('Falha na criptografia dos dados');
  }
};

/**
 * Descriptografa dados sensíveis
 * @param {string} encryptedData - Dados criptografados
 * @param {string} ivHex - IV em formato hexadecimal
 * @returns {string} - Texto descriptografado
 */
const decryptData = (encryptedData, ivHex) => {
  try {
    if (!encryptedData || !ivHex) {
      return null;
    }

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error.message);
    throw new Error('Falha na descriptografia dos dados');
  }
};

/**
 * Criptografa um array ou objeto JSON
 * @param {Array|Object} data - Dados a serem criptografados
 * @returns {object} - Objeto com dados criptografados e IV
 */
const encryptJSONData = (data) => {
  try {
    if (!data) {
      return { encryptedData: null, iv: null };
    }
    
    const jsonString = JSON.stringify(data);
    return encryptData(jsonString);
  } catch (error) {
    console.error('Erro ao criptografar JSON:', error.message);
    throw new Error('Falha na criptografia dos dados JSON');
  }
};

/**
 * Descriptografa dados JSON
 * @param {string} encryptedData - Dados criptografados
 * @param {string} ivHex - IV em formato hexadecimal
 * @returns {Array|Object} - Dados descriptografados
 */
const decryptJSONData = (encryptedData, ivHex) => {
  try {
    if (!encryptedData || !ivHex) {
      return null;
    }
    
    const decryptedString = decryptData(encryptedData, ivHex);
    
    if (!decryptedString) {
      return null;
    }
    
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Erro ao descriptografar JSON:', error.message);
    throw new Error('Falha na descriptografia dos dados JSON');
  }
};

/**
 * Gera uma chave de criptografia segura
 * @returns {string} - Chave de 32 caracteres
 */
const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex').substring(0, 32);
};

/**
 * Gera um hash SHA-256 para verificação de integridade
 * @param {string} data - Dados para gerar hash
 * @returns {string} - Hash SHA-256
 */
const generateHash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

module.exports = {
  encryptData,
  decryptData,
  encryptJSONData,
  decryptJSONData,
  generateEncryptionKey,
  generateHash
}; 