import pg from 'pg';


const pool = new pg.Pool({
    user: "postgres",
    password: "postgres",
    host: "192.168.1.11",
    database: "webhpmm",
    port: 5432
})

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.log('Error de conexion a la base de datos pgSql', err);
    } else {
        console.log('Conexion exitosa a la base de datos pgSql', res.rows);
    }
})

export { pool }