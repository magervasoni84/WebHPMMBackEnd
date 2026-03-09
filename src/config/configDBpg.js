import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    port: parseInt(process.env.PG_PORT) || 5432
})

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.log('Error de conexion a la base de datos pgSql', err);
    } else {
        console.log('Conexion exitosa a la base de datos pgSql', res.rows);
    }
})

export { pool }