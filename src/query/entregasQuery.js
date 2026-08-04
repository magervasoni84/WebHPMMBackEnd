const entregasQueryMS = `
SELECT 
    r.PTA,
    r.NRO,
    r.GRU,
    r.ITE,
    r.DET AS RES_DET,
    r.RES,
    r.VRF,
    r.TXT as Texto_Resultado,
    r.FUM,
    r.FCG,
    e.NOM as NOMVAL,
    cprf.ARC_FIR as FIMVAL,     -- firma, alias firmante
    r.PGM,
    r.ANA,
    r.ARE,
    r.POS,
    r.MNE,
    r.FEC,
    r.ORI,
    r.PAC,
    r.HCL,
    d.DES AS DESCRIPCION_EXAMEN,
    d.UNI AS UNIDADES,
    d.VAM_1,
    d.VAM_2,
    d.VAM_3,
    d.VAM_4,
    d.VAF_1,
    d.VAF_2,
    d.VAF_3,
    d.VAF_4,
    d.NOR,
    d.ERR,
    d.IMP,
    d.LIB,
    d.CAL,
    d.IDX,
    d.HIS,
    e.OPE,
    c.NOM as NOMPAC,
    la.DES as ANALISIS,
    la.MET as METODO,
    cp.NOM as PROFSOLICITANTE,   -- solicitante, alias solicitante
    co.OBS as OBSERVACION,
    co.FCG as FechaOrden,
    lt.TXT_I as TxtSupInformativo,
    lt.TXT_F as TXTINFORMATICO
FROM 
    [hpmsa].[dbo].[LABRES] r
INNER JOIN 
    [hpmsa].[dbo].[LABDET] d 
    ON r.ANA = d.ANA AND r.DET = d.DET
INNER JOIN 
    [hpmsa].[dbo].[SYSOPE] e 
    ON r.OPE = e.OPE
INNER JOIN
    [hpmsa].[dbo].[CLIHCL] c
    ON r.HCL = c.HCL
INNER JOIN
    [hpmsa].[dbo].[LABANA] la
    ON r.ANA = la.ANA
LEFT JOIN (
    SELECT 
        ANA,
        TXT_F,
        TXT_I,
        ROW_NUMBER() OVER (PARTITION BY ANA ORDER BY DET) AS rn
    FROM [hpmsa].[dbo].[LABTXT]
    WHERE DET IS NOT NULL
) lt ON r.ANA = lt.ANA AND lt.rn = 1
INNER JOIN [hpmsa].[dbo].[CLIORD] co 
    ON r.PAC = co.PAC AND r.NRO = co.ORD 
INNER JOIN [hpmsa].[dbo].[CLIPRF] cp   -- para Traer El nombre del Solicitante
    ON co.PRC = cp.PRF
LEFT JOIN [hpmsa].[dbo].[CLIPRF] cprf       -- Para traer la Firma
    ON e.PRF = cprf.PRF
WHERE 
    r.PTA = @puerta
    AND r.NRO = @protocolo
    AND r.PAC = @paciente
ORDER BY 
    r.GRU, 
    r.ITE, 
    r.DET;
`;

const entregasUpdateCliesoStaQueryMS = `
UPDATE CLIESO
SET STA = 'L'
WHERE PTA = @puerta
  AND ORD = @protocolo
  AND ITE = @ite;
`;

export { entregasQueryMS, entregasUpdateCliesoStaQueryMS };
