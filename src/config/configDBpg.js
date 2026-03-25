import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

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

const pool = new pg.Pool({
    user: requireStr('PG_USER'),
    password: requireStr('PG_PASSWORD'),
    host: requireStr('PG_HOST'),
    database: requireStr('PG_DATABASE'),
    port: parseInt(process.env.PG_PORT, 10) || 5432
})

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.log('Error de conexion a la base de datos pgSql', err);
    } else {
        console.log('Conexion exitosa a la base de datos pgSql', res.rows);
    }
})

export { pool }