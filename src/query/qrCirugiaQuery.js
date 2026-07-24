const qrCirugiaQueryMS = `
SELECT
    [ID],
    [HCL],
    [PAC],
    [FEC],
    [PQR1],
    [OS],
    [CIR],
    [TIP],
    [INS],
    [CRC],
    [PAT],
    [SAN],
    [ANE],
    [HIN],
    [HTE],
    [PROG],
    [URGE],
    [COS],
    [tipos],
    [PROTO],
    [manual],
    [fcg],
    [opec],
    [fcm],
    [opem],
    [pqr],
    [PQR2],
    [AYU],
    [monitor],
    [cirulista],
    [parteq],
    [AFI],
    [endoscopia]
FROM [dbo].[libcir]
WHERE (@hcl IS NULL OR @hcl = '' OR [HCL] LIKE '%' + @hcl + '%')
  AND (
    (@fechaDesde IS NULL OR CONVERT(date, [FEC]) >= CONVERT(date, @fechaDesde))
    AND
    (@fechaHasta IS NULL OR CONVERT(date, [FEC]) <= CONVERT(date, @fechaHasta))
  )
ORDER BY [FEC] DESC;
`;

export { qrCirugiaQueryMS };
