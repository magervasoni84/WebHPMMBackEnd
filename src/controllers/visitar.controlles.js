import { getMsPool } from '../config/configDBms.js';
import { pacienteQueryMS, buscarPacienteQueryMS } from '../query/visitaQuery.js';
import { pool as pgPool } from '../config/configDBpg.js';
import mssql from 'mssql';



let pgTableSegPacienteCreated = false;
let pgTableSegAcompanianteCreated = false;


//actualmente se ejecuta cuando hago click por primera vez, revisar si es mejor hacerlo al iniciar el servidor
async function ensurePgTable() {
	if (pgTableSegPacienteCreated && pgTableSegAcompanianteCreated) return;

	const createSql = `CREATE TABLE IF NOT EXISTS SegPaciente (
		id SERIAL PRIMARY KEY,
		idpaciente INTEGER UNIQUE,
		hab INTEGER,
		cama INTEGER,
		nombre TEXT,
		dni INT,
		ubicacion TEXT,
		observacion TEXT
	)`;
	await pgPool.query(createSql);
	pgTableSegPacienteCreated = true;

	const createSql2 = `CREATE TABLE IF NOT EXISTS SegAcompaniante (
		id SERIAL PRIMARY KEY,
		idpaciente INTEGER REFERENCES SegPaciente(idpaciente) ON DELETE CASCADE,
		nombre TEXT,
		dni INT,
		entrada DATE,
		observacion TEXT
	)`;
	await pgPool.query(createSql2);
	pgTableSegAcompanianteCreated = true;
}




export async function getVisitas(req, res) {
	try {
		const msPool = await getMsPool();
		const { recordset } = await msPool.query(pacienteQueryMS);
		console.log('Datos obtenidos de MS SQL:', recordset);
		// Formatear los datos
		const formateado = recordset.map(r => {
			const obj = {};
			for (const k in r) {
				const v = r[k];
				obj[k] = (typeof v === 'string') ? v.replace(/ {2,}/g, ' ') : v;
			}
			return obj;
		});

		// Crear tabla si no existe Ver de meter al ejecutarse la app, no cada vez que se consulta
		await ensurePgTable();

		// Insertar/actualizar pacientes
		const pacienteIds = [];
		const insertResults = [];

		for (const rec of formateado) {
			const insertText = `
				INSERT INTO SegPaciente (idpaciente, hab, cama, nombre, dni, ubicacion, observacion, alta) 
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (idpaciente) 
				DO UPDATE SET 
					hab = EXCLUDED.hab,
					cama = EXCLUDED.cama,
					nombre = EXCLUDED.nombre,
					dni = EXCLUDED.dni,
					ubicacion = EXCLUDED.ubicacion,
					alta = EXCLUDED.alta
				RETURNING *;
			`;

			const values = [rec.idPaciente, rec.HAB, rec.CAM, rec.Nombre, rec.DNI, rec.Ubicacion, rec.Observacion, rec.alta];
			const r = await pgPool.query(insertText, values);

			if (r.rows.length > 0) {
				insertResults.push(r.rows[0]);
				pacienteIds.push(r.rows[0].idpaciente);
			}
		}

		// Obtener pacientes con sus acompañantes
		const resultados = [];

		if (pacienteIds.length > 0) {
			// Obtener pacientes
			const pacientesQuery = `
				SELECT 
					id, idpaciente, hab, cama, nombre, 
					dni, ubicacion, observacion
				FROM SegPaciente 
				WHERE idpaciente = ANY($1)  AND alta = 'N'
				ORDER BY hab, cama;
			`;
			const pacientesResult = await pgPool.query(pacientesQuery, [pacienteIds]);

			// Para cada paciente, obtener sus acompañantes
			for (const paciente of pacientesResult.rows) {
				const acompaniantesQuery = `
					SELECT id, nombre, dni, entrada, observacion
					FROM SegAcompaniante
					WHERE idpaciente = $1
					ORDER BY entrada DESC
				`;
				const acompaniantesResult = await pgPool.query(acompaniantesQuery, [paciente.idpaciente]);

				// Crear objeto según la estructura que espera el frontend
				const visitaPaciente = {
					id: paciente.id,
					idpaciente: paciente.idpaciente,
					hab: paciente.hab,
					cama: paciente.cama,
					nombre: paciente.nombre,
					dni: paciente.dni,
					ubicacion: paciente.ubicacion,
					observacion: paciente.observacion,
					acompaniantes: acompaniantesResult.rows.map(acomp => ({
						id: acomp.id,
						nombre: acomp.nombre,
						dni: acomp.dni,
						entrada: acomp.entrada,
						observacion: acomp.observacion || ''
					}))
				};

				resultados.push(visitaPaciente);
			}
		}

		return res.json(resultados);

	} catch (err) {
		console.error('Error en getVisitas controller:', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}





export async function updatePacienteObservacion(req, res) {
	try {
		const { idpaciente, observacion } = req.body;
		console.log('updatePacienteObservacion invoked', { idpaciente, observacion });
		const updateQuery = `
            UPDATE SegPaciente 
            SET observacion = $1
            WHERE idpaciente = $2
            RETURNING *;
        `;

		const result = await pgPool.query(updateQuery, [observacion, idpaciente]);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Paciente no encontrado' });
		}

		return res.json(result.rows[0]);
	} catch (error) {
		console.error('Error al actualizar observaciones del paciente:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}




export async function putVisitante(req, res) {
	try {
		console.log('putVisitante invoked', { params: req.params, body: req.body });
		const { idPaciente, nombre, dni, entrada, observacion } = req.body;

		const updateQuery = `
            INSERT INTO SegAcompaniante (idpaciente, nombre, dni, entrada, observacion) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
		`;
		console.log('Insertando acompañante con datos:', { idPaciente, nombre, dni, entrada, observacion });
		const result = await pgPool.query(updateQuery, [idPaciente, nombre, dni, entrada, observacion]);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Paciente no encontrado' });
		}

		return res.json(result.rows[0]);
	} catch (error) {
		console.error('Error Cargar Visitante:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}



export async function getBuscarXPaciente(req, res) {
	try {
		const { nombre, dni, ficha, diasEgreso, egreso } = req.query;
		const diasEgresoValue = diasEgreso || egreso;

		const msPool = await getMsPool();
		const request = msPool.request();

		// Add parameters
		if (nombre) request.input('nombre', mssql.VarChar, nombre);
		else request.input('nombre', mssql.VarChar, null);

		if (dni) request.input('dni', mssql.Int, parseInt(dni));
		else request.input('dni', mssql.Int, null);

		if (ficha) request.input('ficha', mssql.Int, parseInt(ficha));
		else request.input('ficha', mssql.Int, null);

		if (diasEgresoValue) request.input('diasEgreso', mssql.Int, parseInt(diasEgresoValue));
		else request.input('diasEgreso', mssql.Int, null);

		console.log('getBuscarXPaciente SQL query:', buscarPacienteQueryMS);
		console.log('getBuscarXPaciente params:', { nombre, dni, ficha, diasEgreso: diasEgresoValue });

		const { recordset } = await request.query(buscarPacienteQueryMS);

		// Format the data as expected by frontend
		const pacientes = recordset.map(r => ({
			idpaciente: r.idpaciente,
			nombre: r.nombre,
			dni: r.dni,
			fechaIngreso: r.fechaIngreso,
			fechaEgreso: r.fechaEgreso
		}));

		console.log('getBuscarXPaciente response:', pacientes);
		return res.json(pacientes);

	} catch (err) {
		console.error('Error en getBuscarXPaciente controller:', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}
