import pg from 'pg';


const pool = new pg.Pool({
    user: "postgres",
    host: "localhost",
    password: "postgres",
    database: "dbhpmm",
    port: 5432
})

pool.query('SELECT NOW()', (err, res) => {
    if(err){
        console.log('Error de conexion a la base de datos', err);
    } else {
        console.log('Conexion exitosa a la base de datos', res.rows);
    }
})

export { pool}