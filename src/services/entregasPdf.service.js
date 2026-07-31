import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const OUTPUT_DIR = path.resolve(process.cwd(), 'storage', 'entregas-pdf');

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function sanitizeForFileName(value) {
  return String(value ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 50);
}

function buildFileName({ puerta, protocolo, paciente }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${sanitizeForFileName(puerta)}_${sanitizeForFileName(protocolo)}_${sanitizeForFileName(paciente)}_${timestamp}.pdf`;
}

function formatNumericByErr(value, err) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const decimals = Number.parseInt(String(err ?? '').trim(), 10);
  if (Number.isNaN(decimals) || decimals < 0) return raw;

  const normalized = raw.replace(',', '.');
  if (!/^[+-]?\d*\.?\d+$/.test(normalized)) return raw;

  const num = Number(normalized);
  if (!Number.isFinite(num)) return raw;

  return num.toFixed(decimals).replace('.', ',');
}

function prepareEntregaData({ filtros, resultados }) {
  const safeResultados = Array.isArray(resultados) ? resultados : [];
  const firstRow = safeResultados.length ? safeResultados[0] : {};

  const pacienteValue = firstRow?.NOMPAC ?? '';
  const puertaValue = String(filtros?.puerta ?? '').trim();
  const protocoloValue = String(filtros?.protocolo ?? '').trim();
  const ordenValue = puertaValue && protocoloValue
    ? `${puertaValue}-${protocoloValue}`
    : (puertaValue || protocoloValue);
  const solicitadoPorValue = firstRow?.PROFSOLICITANTE ?? '';
  const fechaValueRaw = firstRow?.FEC ?? firstRow?.FCG ?? '';
  const fechaValue = fechaValueRaw ? new Date(fechaValueRaw).toLocaleString('es-AR') : '';
  const observacionesValue = firstRow?.OBSERVACION ?? '';

  const rows = safeResultados.map((row) => {
    const norValue = String(row?.NOR ?? '').trim().toUpperCase();
    const referenciaEnBlanco = norValue === 'N';

    return {
      ana: row.ANA,
      analisis: String(row?.ANALISIS ?? ''),
      metodo: String(row?.METODO ?? ''),
      validadoPor: String(row?.NOMVAL ?? ''),
      descripcion: String(row?.DESCRIPCION_EXAMEN ?? ''),
      resultado: formatNumericByErr(row?.RES, row?.ERR),
      unidades: String(row?.UNIDADES ?? ''),
      minimo: referenciaEnBlanco ? '' : formatNumericByErr(row?.VAF_2, row?.ERR),
      maximo: referenciaEnBlanco ? '' : formatNumericByErr(row?.VAF_3, row?.ERR),
      txtInformatico: row?.TXTINFORMATICO == null ? null : String(row.TXTINFORMATICO)
    };
  });

  return {
    pacienteValue,
    ordenValue,
    solicitadoPorValue,
    fechaValue,
    observacionesValue,
    rows
  };
}

function groupRowsByAna(rows) {
  const map = new Map();

  rows.forEach((row) => {
    const key = String(row?.ana ?? '');
    if (!map.has(key)) {
      map.set(key, {
        ana: key,
        analisis: row.analisis,
        metodo: row.metodo,
        validadoPor: row.validadoPor,
        txtInformatico: row.txtInformatico,
        rows: []
      });
    }

    const group = map.get(key);
    group.rows.push(row);

    if (!group.analisis && row.analisis) group.analisis = row.analisis;
    if (!group.metodo && row.metodo) group.metodo = row.metodo;
    if (!group.validadoPor && row.validadoPor) group.validadoPor = row.validadoPor;
    if ((group.txtInformatico == null || group.txtInformatico === '') && (row.txtInformatico != null && row.txtInformatico !== '')) {
      group.txtInformatico = row.txtInformatico;
    }
  });

  return Array.from(map.values());
}

function drawPageHeader(doc, headerData, logoPath, hojaTexto) {
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, doc.page.margins.left, doc.page.margins.top, {
      fit: [480, 120],
      align: 'center'
    });
  }

  const pageUsableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const leftX = doc.page.margins.left;
  const colGap = 6;
  const totalWidth = pageUsableWidth - colGap;

  const labelLeftWidth = 96;
  const labelRightWidth = 42;
  const valueLeftWidth = (totalWidth / 2) - labelLeftWidth;
  const valueRightWidth = (totalWidth / 2) - labelRightWidth;

  const x1 = leftX;
  const x2 = x1 + labelLeftWidth;
  const rightHeaderShift = 18;
  const x3 = leftX + (totalWidth / 2) + (colGap / 2) + rightHeaderShift;
  const x4 = x3 + labelRightWidth;

  const headerTop = doc.page.margins.top + 118;
  const rowHeight = 10;
  const rowHeights = [10, 10, 10];

  const drawSingleLineTextWithHeight = (text, x, y, width, font, fontSize, height) => {
    const safeText = String(text ?? '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    doc
      .font(font)
      .fontSize(fontSize)
      .text(safeText, x, y, {
        width,
        height,
        lineBreak: false,
        ellipsis: true,
        align: 'left'
      });
  };

  const headerRows = [
    ['Paciente:', headerData.pacienteValue, 'Orden:', headerData.ordenValue],
    ['Solicitado por:', headerData.solicitadoPorValue, 'Fecha:', headerData.fechaValue],
    ['Observaciones:', headerData.observacionesValue, 'Hoja:', hojaTexto]
  ];

  let currentY = headerTop;

  headerRows.forEach((row, index) => {
    const currentRowHeight = rowHeights[index] ?? rowHeight;

    drawSingleLineTextWithHeight(row[0], x1, currentY, labelLeftWidth - 4, 'Helvetica-Bold', 9, currentRowHeight);
    drawSingleLineTextWithHeight(row[1], x2, currentY, valueLeftWidth - 2, 'Courier', 9, currentRowHeight);
    drawSingleLineTextWithHeight(row[2], x3, currentY, labelRightWidth - 4, 'Helvetica-Bold', 9, currentRowHeight);
    drawSingleLineTextWithHeight(row[3], x4, currentY, valueRightWidth - 2, 'Courier', 9, currentRowHeight);

    currentY += currentRowHeight;
  });

  const separatorY = currentY + 4;
  doc
    .moveTo(doc.page.margins.left, separatorY)
    .lineTo(doc.page.width - doc.page.margins.right, separatorY)
    .lineWidth(1)
    .stroke();

  return separatorY + 6;
}

function drawTableHeader(doc, y, colWidths, colTitles, resultsColumnsShift = 0) {
  const tableHeaderHeight = 16;
  let x = doc.page.margins.left;

  colTitles.forEach((title, idx) => {
    const shiftX = idx >= 1 ? resultsColumnsShift : 0;
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(title, x + 4 + shiftX, y + 4, {
        width: colWidths[idx] - 8,
        lineBreak: false
      });
    x += colWidths[idx];
  });

  return y + tableHeaderHeight;
}

async function buildEntregaPdfPayload({ filtros, resultados }) {
  ensureOutputDir();

  const fileName = buildFileName(filtros || {});
  const diskPath = path.join(OUTPUT_DIR, fileName);
  // Ruta real en disco donde se escribe el PDF.
  // No hay static mount definido en Express para /downloads/entregas.
  // Por eso se devuelve la ruta física relativa al proyecto.
  const downloadPath = `/storage/entregas-pdf/${fileName}`;

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 35 },
      bufferPages: true
    });

    const stream = fs.createWriteStream(diskPath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.on('error', reject);

    doc.pipe(stream);

    const logoPath = path.resolve(process.cwd(), 'storage', 'images', 'LogoCabeceraInformesLaboratorio.jpeg');
    const signaturePath = path.resolve(process.cwd(), 'storage', 'images', 'FirmaBioquimico.jpg');
    const headerData = prepareEntregaData({ filtros, resultados });
    const grouped = groupRowsByAna(headerData.rows);


    const pageUsableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    // Ajuste solicitado:
    // - Dar más ancho al nombre del resultado (columna 1) para textos largos.
    // - Reducir columnas 2..5 y desplazar ese bloque levemente a la derecha.
    const colWidths = [
      pageUsableWidth * 0.46,
      pageUsableWidth * 0.2,
      pageUsableWidth * 0.11,
      pageUsableWidth * 0.15,
      pageUsableWidth * 0.16
    ];
    const resultsColumnsShift = 8;
    const colTitles = ['', 'Resultado', 'Unidades', 'Referencia', ''];

    let y = drawPageHeader(doc, headerData, logoPath, '1 de 1');
    y = drawTableHeader(doc, y, colWidths, colTitles, resultsColumnsShift);

    const getGroupEstimatedHeight = (group) => {
      let estimated = 0;
      estimated += 16;

      group.rows.forEach((row) => {
        const values = [row.descripcion, row.resultado, row.unidades, row.minimo, row.maximo];
        const heights = values.map((val, idx) =>
          doc.heightOfString(String(val ?? ''), { width: colWidths[idx] - 8 })
        );
        const dynamicRowHeight = Math.max(16, ...heights) + 4;
        estimated += dynamicRowHeight;
      });

      const txtInformaticoRaw = group.txtInformatico == null ? '' : String(group.txtInformatico);
      if (txtInformaticoRaw.trim() !== '') {
        const txtInfoWidth = (colWidths[2] + colWidths[3]) - 8;
        const txtInfoHeight = doc.heightOfString(txtInformaticoRaw, { width: txtInfoWidth });
        estimated += Math.max(10, txtInfoHeight) + 4;
      }

      estimated += 10; // Validado por
      estimated += 14; // separación + línea debug
      return estimated;
    };

    grouped.forEach((group) => {
      const remainingSpace = doc.page.height - doc.page.margins.bottom - y;
      const estimatedGroupHeight = getGroupEstimatedHeight(group);

      if (
        estimatedGroupHeight <= (doc.page.height - doc.page.margins.top - doc.page.margins.bottom) &&
        remainingSpace < estimatedGroupHeight
      ) {
        doc.addPage();
        y = drawPageHeader(doc, headerData, logoPath, '');
        y = drawTableHeader(doc, y, colWidths, colTitles, resultsColumnsShift);
      }

      if (y + 24 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = drawPageHeader(doc, headerData, logoPath, '');
        y = drawTableHeader(doc, y, colWidths, colTitles, resultsColumnsShift);
      }

      doc
        .font('Helvetica')
        .fontSize(9)
        .text(`** ${group.analisis}`, doc.page.margins.left, y, {
          width: pageUsableWidth,
          lineBreak: false
        });
      y += 10;

      doc
        .font('Helvetica')
        .fontSize(8)
        .text(`    Método: ${group.metodo ?? ''}`, doc.page.margins.left, y, {
          width: pageUsableWidth,
          lineBreak: false
        });
      y += 10;

      group.rows.forEach((row) => {
        const values = [
          row.descripcion,
          row.resultado,
          row.unidades,
          row.minimo,
          row.maximo
        ];

        const heights = values.map((val, idx) =>
          doc.heightOfString(String(val ?? ''), { width: colWidths[idx] - 8 })
        );
        const dynamicRowHeight = Math.max(16, ...heights) + 4;

        if (y + dynamicRowHeight + 16 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          y = drawPageHeader(doc, headerData, logoPath, '');
          y = drawTableHeader(doc, y, colWidths, colTitles, resultsColumnsShift);

          doc
            .font('Helvetica')
            .fontSize(9)
            .text(`* ${group.analisis}`, doc.page.margins.left, y, {
              width: pageUsableWidth,
              lineBreak: false
            });
          y += 14;
        }

        let cx = doc.page.margins.left;
        values.forEach((val, idx) => {
          const shiftX = idx >= 1 ? resultsColumnsShift : 0;
          doc
            .font('Helvetica')
            .fontSize(8)
            .text(String(val ?? ''), cx + 4 + shiftX, y + 2, {
              width: colWidths[idx] - 8
            });
          cx += colWidths[idx];
        });

        y += dynamicRowHeight;
      });

      const txtInformaticoRaw = group.txtInformatico == null ? '' : String(group.txtInformatico);
      const hasTxtInformatico = txtInformaticoRaw.trim() !== '';
      const txtInformaticoWidth = (colWidths[2] + colWidths[3]) - 8;
      const txtInformaticoHeight = hasTxtInformatico
        ? Math.max(10, doc.heightOfString(txtInformaticoRaw, { width: txtInformaticoWidth })) + 4
        : 0;

      const blockHeightBeforeSeparator = txtInformaticoHeight + 10; // txtInformatico (opcional) + "Validado por"
      if (y + blockHeightBeforeSeparator + 4 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = drawPageHeader(doc, headerData, logoPath, '');
        y = drawTableHeader(doc, y, colWidths, colTitles, resultsColumnsShift);
      }

      if (hasTxtInformatico) {
        let cxTxt = doc.page.margins.left;
        for (let idx = 0; idx < 2; idx += 1) {
          cxTxt += colWidths[idx];
        }

        doc
          .font('Helvetica')
          .fontSize(8)
          .text(txtInformaticoRaw, cxTxt + 4 + resultsColumnsShift, y + 2, {
            width: txtInformaticoWidth
          });

        y += txtInformaticoHeight;
      }

      doc
        .font('Helvetica')
        .fontSize(8)
        .text(`Validado por: ${group.validadoPor}`, doc.page.margins.left, y, {
          width: pageUsableWidth,
          lineBreak: false
        });
      y += 10;

      doc
        .moveTo(doc.page.margins.left, y)
        .lineTo(doc.page.width - doc.page.margins.right, y)
        .lineWidth(0.5)
        .stroke();

      y += 10;
    });

    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    for (let i = 0; i < totalPages; i += 1) {
      doc.switchToPage(i);
      const hojaTexto = `${i + 1} de ${totalPages}`;

      // Limpia el valor previo de "Hoja" dibujado en el flujo principal
      // (ej: "1 de 1") para evitar superposición con el valor final real.
      const pageUsableWidth2 = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colGap2 = 6;
      const totalWidth2 = pageUsableWidth2 - colGap2;
      const labelRightWidth2 = 42;
      const valueRightWidth2 = (totalWidth2 / 2) - labelRightWidth2;
      const rightHeaderShift2 = 18;
      const x3 = doc.page.margins.left + (totalWidth2 / 2) + (colGap2 / 2) + rightHeaderShift2;
      const x4 = x3 + labelRightWidth2;
      const rowHeights2 = [10, 10, 10];
      const yHeader2 = doc.page.margins.top + 118 + rowHeights2[0] + rowHeights2[1];

      doc
        .save()
        .rect(x4, yHeader2, valueRightWidth2 - 2, rowHeights2[2])
        .fillColor('white')
        .fill()
        .restore();

      doc
        .font('Courier')
        .fontSize(9)
        .text(hojaTexto, x4, yHeader2, {
          width: valueRightWidth2 - 2,
          height: rowHeights2[2],
          lineBreak: false,
          ellipsis: true,
          align: 'left'
        });

      if (fs.existsSync(signaturePath)) {
        const signatureSize = 113.4; // 4 cm en puntos
        const signatureX = doc.page.margins.left;
        const signatureY = doc.page.height - doc.page.margins.bottom - signatureSize;

        doc.image(signaturePath, signatureX, signatureY, {
          fit: [signatureSize, signatureSize],
          align: 'left'
        });
      }
    }

    doc.end();
  });

  return {
    generado: true,
    mensaje: 'PDF generado correctamente',
    filtros,
    totalRegistros: Array.isArray(resultados) ? resultados.length : 0,
    fileName,
    diskPath,
    downloadPath
  };
}

export { buildEntregaPdfPayload, OUTPUT_DIR };
