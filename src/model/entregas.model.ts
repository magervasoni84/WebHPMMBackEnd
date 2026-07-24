export interface EntregaRow {
  PTA: string | null;
  NRO: number | string | null;
  GRU: number | null;
  ITE: number | null;
  RES_DET: string | null;
  RES: string | null;
  VRF: string | null;
  TXT: string | null;
  FUM: Date | string | null;
  FCG: Date | string | null;
  'Validado por:': string | null;
  PGM: string | null;
  ANA: string | null;
  ARE: string | null;
  POS: string | null;
  MNE: string | null;
  FEC: Date | string | null;
  ORI: string | null;
  PAC: number | string | null;
  HCL: string | null;
  DESCRIPCION_EXAMEN: string | null;
  UNIDADES: string | null;
  VAM_1: string | null;
  VAM_2: string | null;
  VAM_3: string | null;
  VAM_4: string | null;
  VAF_1: string | null;
  VAF_2: string | null;
  VAF_3: string | null;
  VAF_4: string | null;
  NOR: string | null;
  ERR: string | null;
  IMP: string | null;
  LIB: string | null;
  CAL: string | null;
  IDX: string | null;
  HIS: string | null;
  OPE: string | null;
  NOM: string | null;
}

const entregasColumns: Array<keyof EntregaRow> = [
  'PTA',
  'NRO',
  'GRU',
  'ITE',
  'RES_DET',
  'RES',
  'VRF',
  'TXT',
  'FUM',
  'FCG',
  'Validado por:',
  'PGM',
  'ANA',
  'ARE',
  'POS',
  'MNE',
  'FEC',
  'ORI',
  'PAC',
  'HCL',
  'DESCRIPCION_EXAMEN',
  'UNIDADES',
  'VAM_1',
  'VAM_2',
  'VAM_3',
  'VAM_4',
  'VAF_1',
  'VAF_2',
  'VAF_3',
  'VAF_4',
  'NOR',
  'ERR',
  'IMP',
  'LIB',
  'CAL',
  'IDX',
  'HIS',
  'OPE',
  'NOM'
];

function normalizeEntregaRow(row: Record<string, unknown> = {}): EntregaRow {
  const normalizedRow: Record<string, unknown> = {};

  entregasColumns.forEach((column) => {
    normalizedRow[column] = row[column] ?? null;
  });

  return normalizedRow as unknown as EntregaRow;
}

export { entregasColumns, normalizeEntregaRow };
