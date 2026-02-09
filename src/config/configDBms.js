
import mssql from 'mssql';

// Configuración de la conexión
const msPool = new mssql.ConnectionPool({
    user: 'saWeb',
    password: 'SaWebHPMM!2025',
    server: '192.168.1.7',
    database: 'HPMSA', 
    options: {
        encrypt: false,
        trustServerCertificate: true
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
