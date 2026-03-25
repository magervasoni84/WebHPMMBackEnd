import { pool } from './configDBpg.js';
import { msPool as poolSql } from './configDBms.js';

console.log('--- Iniciando pruebas de conexión ---\n');

// Prueba PostgreSQL
console.log('Probando conexión PostgreSQL...');
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.log('❌ Error PostgreSQL:', err.message);
    } else {
        console.log('✅ PostgreSQL OK:', res.rows);
    }
    pool.end();
});

// Prueba SQL Server
console.log('Probando conexión SQL Server...');
poolSql.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.log('❌ Error SQL Server:', err.message);
    } else {
        console.log('✅ SQL Server OK:', res.rows);
    }
    poolSql.close();
});
