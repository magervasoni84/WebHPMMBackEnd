# TODO - Ajuste TxtSupInformativo en entregas

- [x] 1) Actualizar query en `src/query/entregasQuery.js` para incluir `TXT_I` en subquery de `LABTXT`.
- [x] 2) Actualizar modelo en `src/model/entregas.model.ts` agregando `TxtSupInformativo` en interface y columnas normalizadas.
- [x] 3) Actualizar servicio PDF en `src/services/entregasPdf.service.js` para:
  - [x] mapear `TxtSupInformativo`
  - [x] agrupar `txtSupInformativo` por ANA
  - [x] renderizar texto al comienzo del grupo en primera columna
  - [x] ajustar estimación de alturas y salto de página
- [x] 4) Marcar tareas como completas en este archivo.
