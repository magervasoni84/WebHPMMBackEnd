import mssql from 'mssql';
import { getMsPool } from '../config/configDBms.js';
import { qrCirugiaQueryMS } from '../query/qrCirugiaQuery.js';
import { normalizeQrCirugiaRow, getQrCirugiaDatabaseName } from '../model/qrCirugia.model.ts';

export async function getQrCirugias(req, res) {
  try {
    const { hcl, fechaDesde, fechaHasta } = req.query;
    const databaseName = getQrCirugiaDatabaseName();

    console.log(`Consultando cirugías en MSSQL DB: ${databaseName}`, { hcl, fechaDesde, fechaHasta });

    const msPool = await getMsPool(databaseName);
    const request = msPool.request();

    if (hcl && String(hcl).trim()) {
      request.input('hcl', mssql.VarChar(50), String(hcl).trim());
    } else {
      request.input('hcl', mssql.VarChar(50), null);
    }

    const parseFecha = (valor) => {
      if (!valor) return null;
      const fecha = new Date(valor);
      if (Number.isNaN(fecha.getTime())) return null;
      return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
    };

    let fechaDesdeParsed = parseFecha(fechaDesde);
    let fechaHastaParsed = parseFecha(fechaHasta);

    if (fechaDesdeParsed && fechaHastaParsed && fechaDesdeParsed > fechaHastaParsed) {
      [fechaDesdeParsed, fechaHastaParsed] = [fechaHastaParsed, fechaDesdeParsed];
    }

    if (fechaDesdeParsed) {
      request.input('fechaDesde', mssql.Date, fechaDesdeParsed);
    } else {
      request.input('fechaDesde', mssql.Date, null);
    }

    if (fechaHastaParsed) {
      request.input('fechaHasta', mssql.Date, fechaHastaParsed);
    } else {
      request.input('fechaHasta', mssql.Date, null);
    }

    const { recordset } = await request.query(qrCirugiaQueryMS);
    const data = recordset.map((row) => normalizeQrCirugiaRow(row));

    return res.json(data);
  } catch (error) {
    console.error('Error en getQrCirugias controller:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error?.message || 'Error desconocido'
    });
  }
}
