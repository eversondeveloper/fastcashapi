const { Pool } = require('pg');

const credenciais = {
    user: process.env.DB_USER || '559c5dc48dec4355843231dd6a54bc8a',
    host: process.env.DB_HOST || 'postgres.shardatabases.app', 
    database: process.env.DB_NAME || 'database',
    password: process.env.DB_PASS || '48344834', 
    port: parseInt(process.env.DB_PORT) || 5432,
    ssl: {
        rejectUnauthorized: false
    }
};

const pool = new Pool(credenciais);

pool.on('connect', () => {
    console.log('Conectado ao PostgreSQL no NoShard');
});

pool.on('error', (err) => {
    console.error('Erro na conexão PostgreSQL:', err);
});

module.exports = {
    ...credenciais,
    pool
};