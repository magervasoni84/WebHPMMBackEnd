

const pacienteQueryMS = `

DECLARE @Fecha DATE = '2026-02-01'; 

SELECT i.HAB, i.CAM, cp.PAC AS idPaciente, cp.NOM AS Nombre, cp.NDO AS DNI, isec.NOM AS Ubicacion

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


export { pacienteQueryMS}