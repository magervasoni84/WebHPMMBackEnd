export interface EntregaRow {
  PTA: string | null;
  NRO: number | string | null;
  GRU: number | null;
  ITE: number | null;
  RES_DET: string | null;
  RES: string | null;
  VRF: string | null;
  "Texto_Resultado": string | null;
  FUM: Date | string | null;
  FCG: Date | string | null;
  FechaOrden: Date | string | null;
  FIMVAL: string | null;
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
  PACIENTE: string | null;
  PACNOM: string | null;
  NOMPAC: string | null;
  ANALISIS: string | null;
  VALNOM: string | null;
  NOMVAL: string | null;
  PRC: string | null;
  PROFSOLICITANTE: string | null;
  OBSERVACION: string | null;
  METODO: string | null;
  TxtSupInformativo: string | null;
  TXTINFORMATICO: string | null;
}

const entregasColumns: Array<keyof EntregaRow> = [
  'PTA',
  'NRO',
  'GRU',
  'ITE',
  'RES_DET',
  'RES',
  'VRF',
  'Texto_Resultado',
  'FUM',
  'FCG',
  'FechaOrden',
  'FIMVAL',
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
  'NOM',
  'PACIENTE',
  'PACNOM',
  'NOMPAC',
  'ANALISIS',
  'VALNOM',
  'NOMVAL',
  'PRC',
  'PROFSOLICITANTE',
  'OBSERVACION',
  'METODO',
  'TxtSupInformativo',
  'TXTINFORMATICO'
];

function normalizeEntregaRow(row: Record<string, unknown> = {}): EntregaRow {
  const normalizedRow: Record<string, unknown> = {};
  const sourceRow = row ?? {};

  const getValue = (aliases: string[]) => {
    for (const alias of aliases) {
      const value = sourceRow[alias];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }

    const lowerCaseRow = Object.fromEntries(
      Object.entries(sourceRow).map(([key, value]) => [String(key).trim().toLowerCase(), value])
    );

    for (const alias of aliases) {
      const lowerAlias = alias.toLowerCase();
      if (lowerCaseRow[lowerAlias] !== undefined && lowerCaseRow[lowerAlias] !== null && lowerCaseRow[lowerAlias] !== '') {
        return lowerCaseRow[lowerAlias];
      }
    }

    return null;
  };

  entregasColumns.forEach((column) => {
    if (column === 'FechaOrden') {
      normalizedRow[column] = getValue(['FechaOrden', 'fechaorden']);
      return;
    }

    normalizedRow[column] = sourceRow[column] ?? null;
  });

  return normalizedRow as unknown as EntregaRow;
}

export { entregasColumns, normalizeEntregaRow };
