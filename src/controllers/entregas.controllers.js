import mssql from 'mssql';
import { getMsPool } from '../config/configDBms.js';
import { entregasQueryMS } from '../query/entregasQuery.js';
import { normalizeEntregaRow } from '../model/entregas.model.ts';
import { buildEntregaPdfPayload } from '../services/entregasPdf.service.js';

function parseRequiredNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

export async function getEntregas(req, res) {
  try {
    const source = req.method === 'GET' ? req.query : req.body;
    const puerta = source?.puerta ? String(source.puerta).trim() : '';
    const protocolo = parseRequiredNumber(source?.protocolo);
    const paciente = parseRequiredNumber(source?.paciente);

    if (!puerta) {
      return res.status(400).json({ error: "El campo 'puerta' es obligatorio (texto)." });
    }

    if (protocolo === null) {
      return res.status(400).json({ error: "El campo 'protocolo' es obligatorio (número)." });
    }

    if (paciente === null) {
      return res.status(400).json({ error: "El campo 'paciente' es obligatorio (número)." });
    }

    const msPool = await getMsPool();
    const request = msPool.request();

    request.input('puerta', mssql.VarChar(20), puerta);
    request.input('protocolo', mssql.Int, protocolo);
    request.input('paciente', mssql.Int, paciente);

    const { recordset } = await request.query(entregasQueryMS);
    const data = recordset.map((row) => normalizeEntregaRow(row));

    const pdf = buildEntregaPdfPayload({
      filtros: { puerta, protocolo, paciente },
      resultados: data
    });

    return res.json({
      filtros: { puerta, protocolo, paciente },
      total: data.length,
      data,
      pdf
    });
  } catch (error) {
    console.error('Error en getEntregas controller:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error?.message || 'Error desconocido'
    });
  }
}
