
import dotenv from 'dotenv';
import mssql from 'mssql';
import path from 'path';
import { fileURLToPath } from 'url';

// ensure dotenv loads the file from the project root regardless of cwd
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

function requireStr(name) {
    const v = process.env[name];
    if (typeof v !== 'string' || v.length === 0) {
        throw new Error(`Environment variable ${name} must be a non-empty string`);
    }
    return v;
}

function getEnvName(baseName) {
    const isDev = (process.env.NODE_ENV || 'development') === 'development';
    const devName = `${baseName}_DEV`;
    if (isDev && process.env[devName]) return devName;
    return baseName;
}

function getBool(baseName, defaultValue = false) {
    const envName = getEnvName(baseName);
    const raw = process.env[envName];
    if (typeof raw !== 'string') return defaultValue;
    return raw.toLowerCase() === 'true';
}

function buildMsConfig() {
    const userVar = getEnvName('MSSQL_USER');
    const passVar = getEnvName('MSSQL_PASSWORD');
    const serverVar = getEnvName('MSSQL_SERVER');
    const dbVar = getEnvName('MSSQL_DATABASE');

    return {
        user: requireStr(userVar),
        password: requireStr(passVar),
        server: requireStr(serverVar),
        database: requireStr(dbVar),
        options: {
            encrypt: getBool('MSSQL_ENCRYPT', false),
            trustServerCertificate: getBool('MSSQL_TRUST_CERT', true)
        }
    };
}

let msPool;

async function createAndConnectPool() {
    const pool = new mssql.ConnectionPool(buildMsConfig());
    await pool.connect();

    pool.query('SELECT GETDATE() as NOW', (err, res) => {
        if (err) {
            console.log('Error de conexion a la base de datos MSql', err);
        } else {
            console.log('Conexion exitosa a la base de datos MSql', res.recordset);
        }
    });

    pool.on('error', (err) => {
        console.error('Error en pool MSSQL, se reiniciará en próxima solicitud:', err);
    });

    return pool;
}

async function getMsPool() {
    if (!msPool || !msPool.connected) {
        msPool = await createAndConnectPool();
    }
    return msPool;
}

// Compatibilidad temporal con imports existentes.
const msPoolProxy = {
    query: async (...args) => {
        const pool = await getMsPool();
        return pool.query(...args);
    }
};

export { getMsPool, msPoolProxy as msPool };
