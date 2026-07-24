// Modelo de datos que vienen de la consulta de qrcirugia
export interface qrCirugia {
  ID: number | null;
  HCL: string | null;
  PAC: string | null;
  FEC: Date | string | null;
  PQR1: string | null;
  OS: string | null;
  CIR: string | null;
  TIP: string | null;
  INS: string | null;
  CRC: string | null;
  PAT: string | null;
  SAN: number | null;
  ANE: string | null;
  HIN: Date | string | null;
  HTE: Date | string | null;
  PROG: string | null;
  URGE: string | null;
  COS: string | null;
  tipos: string | null;
  PROTO: string | null;
  manual: number | null;
  fcg: Date | string | null;
  opec: string | null;
  fcm: Date | string | null;
  opem: string | null;
  pqr: number | null;
  PQR2: string | null;
  AYU: string | null;
  monitor: string | null;
  cirulista: string | null;
  parteq: number | null;
  AFI: string | null;
  endoscopia: number | null;
}

const qrCirugiaColumns: Array<keyof qrCirugia> = [
  'ID',
  'HCL',
  'PAC',
  'FEC',
  'PQR1',
  'OS',
  'CIR',
  'TIP',
  'INS',
  'CRC',
  'PAT',
  'SAN',
  'ANE',
  'HIN',
  'HTE',
  'PROG',
  'URGE',
  'COS',
  'tipos',
  'PROTO',
  'manual',
  'fcg',
  'opec',
  'fcm',
  'opem',
  'pqr',
  'PQR2',
  'AYU',
  'monitor',
  'cirulista',
  'parteq',
  'AFI',
  'endoscopia'
];

function normalizeQrCirugiaRow(row: Record<string, unknown> = {}): qrCirugia {
  const normalizedRow: Record<string, unknown> = {};

  qrCirugiaColumns.forEach((column) => {
    normalizedRow[column] = row[column] ?? null;
  });

  return normalizedRow as unknown as qrCirugia;
}

function getQrCirugiaDatabaseName(): string {
  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  return env === 'development' ? 'quiroDEV' : 'quiro';
}

export { qrCirugiaColumns, normalizeQrCirugiaRow, getQrCirugiaDatabaseName };
