

const pacienteQueryMS = `

DECLARE @Fecha DATE = CAST(GETDATE() AS DATE); 

SELECT i.HAB, i.CAM, cp.PAC AS idPaciente, cp.NOM AS Nombre, cp.NDO AS DNI, isec.NOM AS Ubicacion, cp.EGR as alta

FROM INTEST i 
INNER JOIN CLIPAC cp 
    ON i.PAC = cp.PAC AND i.ORI = cp.ORI 
INNER JOIN INTPAT ip 
    ON cp.MOT = ip.PAT
LEFT JOIN INTCAM ic 
    ON i.HAB = ic.HAB AND i.CAM = ic.CAM
LEFT JOIN INTSEC isec 
    ON ic.SEC = isec.SEC
WHERE i.FEC >= @Fecha
    AND i.FEC < DATEADD(DAY, 1, @Fecha)
    AND i.STA = 'O'
    AND DATEPART(HOUR, i.FEC) = 23
ORDER BY i.HAB, i.CAM;`





//Consulta sacada de los programas de rastarter

const pacienteQueryOLDMS = `

DECLARE @Fecha DATE = '2026-01-04';

SELECT 
    i.HAB, i.CAM, cp.PAC AS idPaciente, cp.NOM AS Nombre,
    -- Edad calculada
    CASE 
        WHEN cp.FNA > '1900-01-01' 
        THEN DATEDIFF(YEAR, cp.FNA, GETDATE())
        ELSE NULL 
    END AS Edad, isec.NOM AS Ubicacion, ip.DES AS MotivoIngreso,
    DATEDIFF(DAY, cp.FIN, GETDATE()) AS DiasInternacion
FROM INTEST i 
INNER JOIN CLIPAC cp 
    ON i.PAC = cp.PAC AND i.ORI = cp.ORI 
INNER JOIN INTPAT ip 
    ON cp.MOT = ip.PAT
LEFT JOIN INTCAM ic 
    ON i.HAB = ic.HAB AND i.CAM = ic.CAM
LEFT JOIN INTSEC isec 
    ON ic.SEC = isec.SEC
WHERE i.FEC >= @Fecha
    AND i.FEC < DATEADD(DAY, 1, @Fecha)
    AND i.STA = 'O'
    AND DATEPART(HOUR, i.FEC) = 23
ORDER BY i.HAB, i.CAM;`



const buscarPacienteQueryMS = `
SELECT 
    cp.PAC AS idpaciente,
    cp.NOM AS nombre,
    cp.NDO AS dni,
    cp.FIN AS fechaIngreso,
    cp.FEG AS fechaEgreso
FROM CLIPAC cp
WHERE ORI = 'I'
  AND (@nombre IS NULL OR @nombre = '' OR cp.NOM LIKE '%' + @nombre + '%')
  AND (@dni IS NULL OR @dni = '' OR cp.NDO = @dni)
  AND (@ficha IS NULL OR @ficha = '' OR cp.PAC = @ficha)
  AND (@diasEgreso IS NULL OR 
       cp.FEG IS NULL OR 
       DATEDIFF(DAY, CONVERT(DATETIME, cp.FEG), GETDATE()) <= @diasEgreso
      )
`;


export { pacienteQueryMS, buscarPacienteQueryMS }