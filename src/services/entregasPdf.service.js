/**
 * Servicio placeholder para futura generación de PDF de entregas.
 * En esta etapa no se instala ninguna librería; sólo se centraliza la lógica.
 */
function buildEntregaPdfPayload({ filtros, resultados }) {
  return {
    generado: false,
    mensaje: 'Generación de PDF pendiente de implementación',
    filtros,
    totalRegistros: Array.isArray(resultados) ? resultados.length : 0
  };
}

export { buildEntregaPdfPayload };
