const entregasQueryMS = `
SELECT 
    r.PTA,
    r.NRO,
    r.GRU,
    r.ITE,
    r.DET AS RES_DET,
    r.RES,
    r.VRF,
    r.TXT,
    r.FUM,
    r.FCG,
    e.NOM AS [Validado por:],
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
    e.NOM
FROM 
    [hpmsa].[dbo].[LABRES] r
INNER JOIN 
    [hpmsa].[dbo].[LABDET] d 
    ON r.ANA = d.ANA 
    AND r.DET = d.DET
INNER JOIN 
    [hpmsa].[dbo].[SYSOPE] e 
    ON r.OPE = e.OPE
WHERE 
    r.PTA = @puerta
    AND r.NRO = @protocolo
    AND r.PAC = @paciente
ORDER BY 
    r.GRU, 
    r.ITE, 
    r.DET;
`;

export { entregasQueryMS };
