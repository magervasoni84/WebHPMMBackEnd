
import dotenv from 'dotenv';
import mssql from 'mssql';

dotenv.config();

// Configuración de la conexión
const msPool = new mssql.ConnectionPool({
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE, 
    options: {
        encrypt: process.env.MSSQL_ENCRYPT === 'true',
        trustServerCertificate: process.env.MSSQL_TRUST_CERT === 'true'
    }
});

// Conectar al pool y ejecutar test
msPool.connect().then(() => {
    msPool.query('SELECT GETDATE() as NOW', (err, res) => {
        if (err) {
            console.log('Error de conexion a la base de datos MSql', err);
        } else {
            console.log('Conexion exitosa a la base de datos MSql', res.recordset);
        }
    })
}).catch(err => {
    console.log('Error al conectar a la base de datos', err);
});

export { msPool };
