import { Sequelize } from 'sequelize';
import pg from 'pg'; // 1. IMPORTAÇÃO OBRIGATÓRIA PARA VERCEL
import 'dotenv/config'; 

// --- LINHA DE DEBUG ---
console.log(`[Debug] Tentando conectar com a URL: ${process.env.DATABASE_URL ? 'URL encontrada!' : 'URL NÃO ENCONTRADA'}`);
// ----------------------

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg, // 2. CONFIGURAÇÃO OBRIGATÓRIA PARA VERCEL
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false 
        }
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Testa a conexão
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('>>> CONEXÃO COM O SUPABASE (POSTGRESQL) ESTABELECIDA COM SUCESSO.');
    } catch (error) {
        console.error(`>>> ERRO: Não foi possível conectar ao Supabase: ${error.name}`);
    }
};

testConnection();

export default sequelize;