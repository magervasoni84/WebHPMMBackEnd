import mssql from 'mssql';
import { getMsPool } from '../config/configDBms.js';
import { entregasQueryMS, entregasUpdateCliesoStaQueryMS } from '../query/entregasQuery.js';
import { normalizeEntregaRow } from '../model/entregas.model.ts';
import { buildEntregaPdfPayload } from '../services/entregasPdf.service.js';

function parseRequiredNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

const ALLOWED_PUERTAS = new Set(['LBA', 'LBG', 'LBI']);

export async function getEntregas(req, res) {
  try {
    const source = req.method === 'GET' ? req.query : req.body;
    const puerta = source?.puerta ? String(source.puerta).trim().toUpperCase() : '';
    const protocolo = parseRequiredNumber(source?.protocolo);
    const paciente = parseRequiredNumber(source?.paciente);

    if (!puerta) {
      return res.status(400).json({ error: "El campo 'puerta' es obligatorio (texto)." });
    }

    if (!ALLOWED_PUERTAS.has(puerta)) {
      return res.status(400).json({
        error: `Puerta no soportada: '${puerta}'. Puertas permitidas actualmente: LBA, LBG, LBI.`
      });
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

    if (!data.length) {
      return res.json({
        estado: 'ERROR',
        filtros: { puerta, protocolo, paciente },
        total: 0,
        data: []
      });
    }

    const hasNotVerified = data.some((row) => String(row.VRF ?? '').trim().toUpperCase() !== 'S' && String(row.VRF ?? '').trim().toUpperCase() !== 'A');


    if (hasNotVerified) {
      return res.json({
        estado: 'NO VERIFICADO',
        filtros: { puerta, protocolo, paciente },
        total: data.length,
        data
      });
    }

    const pdf = await buildEntregaPdfPayload({
      filtros: { puerta, protocolo, paciente },
      resultados: data
    });

    const uniqueItes = Array.from(
      new Set(
        data
          .map((row) => Number(row?.ITE))
          .filter((ite) => Number.isInteger(ite))
      )
    );

    let updatedCliesoRows = 0;
    for (const ite of uniqueItes) {
      const updateRequest = msPool.request();
      updateRequest.input('puerta', mssql.VarChar(20), puerta);
      updateRequest.input('protocolo', mssql.Int, protocolo);
      updateRequest.input('ite', mssql.Int, ite);

      const updateResult = await updateRequest.query(entregasUpdateCliesoStaQueryMS);
      updatedCliesoRows += Number(updateResult?.rowsAffected?.[0] ?? 0);
    }

    console.log('[entregas][clieso][updated]', {
      puerta,
      protocolo,
      totalItes: uniqueItes.length,
      updatedRows: updatedCliesoRows
    });

    return res.json({
      estado: 'OK',
      filtros: { puerta, protocolo, paciente },
      total: data.length,
      pdf: {
        generado: pdf.generado,
        mensaje: pdf.mensaje,
        fileName: pdf.fileName,
        downloadPath: pdf.downloadPath
      }
    });
  } catch (error) {
    console.error('Error en getEntregas controller:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error?.message || 'Error desconocido'
    });
  }
}
