const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Gerador de chaves criptograficamente seguras para o MedShare
 */

console.log('🔐 Gerando chaves criptograficamente seguras...\n');

// Gerar JWT Secret (64 bytes = 512 bits)
const jwtSecret = crypto.randomBytes(64).toString('hex');

// Gerar chave de criptografia AES-256 (32 bytes = 256 bits)
const encryptionKey = crypto.randomBytes(32).toString('hex');

// Gerar chave adicional para cookies/sessions (opcional)
const sessionSecret = crypto.randomBytes(32).toString('hex');

console.log('✅ Chaves geradas com sucesso!\n');

console.log('📋 COPIE AS CHAVES ABAIXO PARA SEU ARQUIVO .env:\n');
console.log('=' * 60);
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log('=' * 60);
console.log();

// Verificar se já existe arquivo .env
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (fs.existsSync(envPath)) {
  console.log('⚠️  Arquivo .env já existe!');
  console.log('📝 Substitua manualmente as linhas das chaves no arquivo .env');
} else if (fs.existsSync(envExamplePath)) {
  console.log('📄 Criando arquivo .env a partir do env.example...');
  
  try {
    let envContent = fs.readFileSync(envExamplePath, 'utf8');
    
    // Substituir as chaves no template
    envContent = envContent.replace(
      /JWT_SECRET=.*/,
      `JWT_SECRET=${jwtSecret}`
    );
    
    envContent = envContent.replace(
      /ENCRYPTION_KEY=.*/,
      `ENCRYPTION_KEY=${encryptionKey}`
    );
    
    // Adicionar chave de session se não existir
    if (!envContent.includes('SESSION_SECRET=')) {
      envContent += `\n# Chave de Session\nSESSION_SECRET=${sessionSecret}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Arquivo .env criado com chaves seguras!');
    console.log('🔧 Lembre-se de configurar a senha do MySQL (DB_PASSWORD)');
    
  } catch (error) {
    console.error('❌ Erro ao criar arquivo .env:', error.message);
    console.log('📝 Copie as chaves manualmente para seu arquivo .env');
  }
} else {
  console.log('⚠️  Arquivo env.example não encontrado!');
  console.log('📝 Copie as chaves manualmente para seu arquivo .env');
}

console.log('\n🔒 IMPORTANTE:');
console.log('• Essas chaves são ÚNICAS e SECRETAS');
console.log('• NUNCA compartilhe essas chaves publicamente');
console.log('• NUNCA commite o arquivo .env no Git');
console.log('• Em produção, use variáveis de ambiente do servidor');
console.log('• Guarde essas chaves em local seguro como backup');

console.log('\n🚀 Próximos passos:');
console.log('1. Configure a senha do MySQL no .env (DB_PASSWORD)');
console.log('2. Execute o script SQL no MySQL Workbench');
console.log('3. Inicie o servidor: npm start'); 