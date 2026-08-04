import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const OUTPUT_DIR = path.resolve(process.cwd(), 'storage', 'entregas-pdf');
const SIGNATURE_SIZE = 113.4; // 4 cm en puntos
const SIGNATURE_FOOTER_PADDING = 8;
const RESERVED_SIGNATURE_AREA = SIGNATURE_SIZE + SIGNATURE_FOOTER_PADDING;

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

  // Solo formatear cuando llega como numérico "expandido" (>= 10 chars).
  // Si llega como texto numérico corto (< 10 chars), no tocar formato.
  const normalizedRaw = raw.replace(',', '.');
  const isNumericText = /^[+-]?\d*\.?\d+$/.test(normalizedRaw);
  if (isNumericText && normalizedRaw.length < 10) return raw;

  const decimals = Number.parseInt(String(err ?? '').trim(), 10);
  if (Number.isNaN(decimals) || decimals < 0) return raw;

  if (!isNumericText) return raw;

  const num = Number(normalizedRaw);
  if (!Number.isFinite(num)) return raw;

  return num.toFixed(decimals).replace('.', ',');
}

function resolveFieldValue(row, aliases = []) {
  if (!row || typeof row !== 'object') return null;

  const directMatches = aliases.map((alias) => row[alias]).find((value) => value !== undefined && value !== null && value !== '');
  if (directMatches !== undefined) return directMatches;

  const lowerCaseRow = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase(), value])
  );

  const lowerCaseMatches = aliases
    .map((alias) => lowerCaseRow[String(alias).trim().toLowerCase()])
    .find((value) => value !== undefined && value !== null && value !== '');

  return lowerCaseMatches ?? null;
}

function formatDateTimeWithoutTimezone(value) {
  if (!value) return '';

  const pad = (num) => String(num).padStart(2, '0');

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}, ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }

  const asString = String(value).trim();

  const isoMatch = asString.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(?:Z|[+-]\d{2}:?\d{2})?$/);
  if (isoMatch) {
    const [, year, month, day, hours, minutes, seconds] = isoMatch;
    return `${pad(Number(day))}/${pad(Number(month))}/${year}, ${pad(Number(hours))}:${pad(Number(minutes))}:${pad(Number(seconds))}`;
  }

  return '';
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
  const fechaValueRaw = resolveFieldValue(firstRow, ['FechaOrden', 'fechaorden']);

  // Ajuste horario requerido:
  // Se suma +3 horas para mostrar la hora correcta en el PDF.
  const fechaValueForPdf = (() => {
    const raw = fechaValueRaw;
    if (!raw) return '';

    const asString = String(raw).trim();
    const isoMatch = asString.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(?:Z|[+-]\d{2}:?\d{2})?$/);

    if (isoMatch) {
      const [, year, month, day, hours, minutes, seconds] = isoMatch;
      const baseDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes),
        Number(seconds)
      );
      baseDate.setHours(baseDate.getHours() + 3); // +3 para dar la hora correcta
      return formatDateTimeWithoutTimezone(baseDate);
    }

    const parsedDate = raw instanceof Date ? raw : new Date(raw);
    if (!Number.isNaN(parsedDate.getTime())) {
      parsedDate.setHours(parsedDate.getHours() + 3); // +3 para dar la hora correcta
      return formatDateTimeWithoutTimezone(parsedDate);
    }

    return formatDateTimeWithoutTimezone(raw);
  })();

  const fechaValue = fechaValueForPdf;
  const observacionesValue = firstRow?.OBSERVACION ?? '';

  const rows = safeResultados.map((row) => {
    const norValue = String(row?.NOR ?? '').trim().toUpperCase();
    const referenciaEnBlanco = norValue === 'N';
    const referenciaMenorA = norValue === 'V';

    return {
      ana: row.ANA,
      analisis: String(row?.ANALISIS ?? ''),
      metodo: String(row?.METODO ?? ''),
      validadoPor: String(row?.NOMVAL ?? ''),
      descripcion: String(row?.DESCRIPCION_EXAMEN ?? ''),
      resultado: formatNumericByErr(row?.RES, row?.ERR),
      unidades: String(row?.UNIDADES ?? ''),
      minimo: referenciaEnBlanco ? '' : (referenciaMenorA ? 'menor a' : formatNumericByErr(row?.VAF_2, row?.ERR)),
      maximo: referenciaEnBlanco ? '' : formatNumericByErr(row?.VAF_3, row?.ERR),
      fimval: row?.FIMVAL == null ? null : String(row.FIMVAL).trim(),
      txtSupInformativo: row?.TxtSupInformativo == null ? null : String(row.TxtSupInformativo).trim(),
      txtInformatico: row?.TXTINFORMATICO == null ? null : String(row.TXTINFORMATICO),
      textoResultado: row?.Texto_Resultado == null ? null : String(row.Texto_Resultado).trim()
    };
  });

  const signaturePaths = Array.from(new Set(
    rows
      .map((row) => String(row?.fimval ?? '').trim())
      .filter((value) => value !== '')
  ));

  return {
    pacienteValue,
    ordenValue,
    solicitadoPorValue,
    fechaValue,
    observacionesValue,
    rows,
    signaturePaths
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
        txtSupInformativo: row.txtSupInformativo,
        txtInformatico: row.txtInformatico,
        rows: []
      });
    }

    const group = map.get(key);
    group.rows.push(row);

    if (!group.analisis && row.analisis) group.analisis = row.analisis;
    if (!group.metodo && row.metodo) group.metodo = row.metodo;
    if (!group.validadoPor && row.validadoPor) group.validadoPor = row.validadoPor;
    if ((group.txtSupInformativo == null || group.txtSupInformativo === '') && (row.txtSupInformativo != null && row.txtSupInformativo !== '')) {
      group.txtSupInformativo = row.txtSupInformativo;
    }
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

  const headerTop = doc.page.margins.top + 80; //Separacion entre Logo y Header
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
    const headerData = prepareEntregaData({ filtros, resultados });
    const grouped = groupRowsByAna(headerData.rows);

    const pageUsableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const contentBottomY = doc.page.height - doc.page.margins.bottom - RESERVED_SIGNATURE_AREA;
    // Ajuste solicitado:
    // - Dar más ancho al nombre del resultado (columna 1) para textos largos.
    // - Reducir columnas 2..5 y desplazar ese bloque levemente a la derecha.
    const colWidths = [
      pageUsableWidth * 0.43,
      pageUsableWidth * 0.2,
      pageUsableWidth * 0.13,
      pageUsableWidth * 0.16,
      pageUsableWidth * 0.16
    ];
    const resultsColumnsShift = 8;
    const colTitles = ['', 'Resultado', 'Unidad', 'Referencia', ''];

    let y = drawPageHeader(doc, headerData, logoPath, '1 de 1');
    y = drawTableHeader(doc, y, colWidths, colTitles, resultsColumnsShift);

    const getGroupEstimatedHeight = (group) => {
      let estimated = 0;
      estimated += 16;

      const txtSupInformativoRaw = group.txtSupInformativo == null ? '' : String(group.txtSupInformativo);
      if (txtSupInformativoRaw.trim() !== '') {
        const txtSupInfoHeight = doc.heightOfString(txtSupInformativoRaw, { width: colWidths[0] - 8 });
        estimated += Math.max(10, txtSupInfoHeight) + 4;
      }

      group.rows.forEach((row) => {
        const values = [row.descripcion, row.resultado, row.unidades, row.minimo, row.maximo];
        const heights = values.map((val, idx) =>
          doc.heightOfString(String(val ?? ''), { width: colWidths[idx] - 8 })
        );
        const dynamicRowHeight = Math.max(16, ...heights) + 4;
        estimated += dynamicRowHeight;

        const textoResultadoRaw = row.textoResultado == null ? '' : String(row.textoResultado);
        if (textoResultadoRaw.trim() !== '') {
          const textoResultadoHeight = Math.max(
            12,
            doc.heightOfString(textoResultadoRaw, { width: colWidths[1] - 8 }) + 4
          );
          estimated += textoResultadoHeight;
        }
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
      const remainingSpace = contentBottomY - y;
      const estimatedGroupHeight = getGroupEstimatedHeight(group);

      if (
        estimatedGroupHeight <= (doc.page.height - doc.page.margins.top - doc.page.margins.bottom) &&
        remainingSpace < estimatedGroupHeight
      ) {
        doc.addPage();
        y = drawPageHeader(doc, headerData, logoPath, '');
        y = drawTableHeader(doc, y, colWidths, colTitles, resultsColumnsShift);
      }

      if (y + 24 > contentBottomY) {
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

      const txtSupInformativoRaw = group.txtSupInformativo == null ? '' : String(group.txtSupInformativo);
      const hasTxtSupInformativo = txtSupInformativoRaw.trim() !== '';
      const txtSupInformativoHeight = hasTxtSupInformativo
        ? Math.max(10, doc.heightOfString(txtSupInformativoRaw, { width: colWidths[0] - 8 })) + 4
        : 0;

      if (y + txtSupInformativoHeight + 16 > contentBottomY) {
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

      if (hasTxtSupInformativo) {
        doc
          .font('Helvetica')
          .fontSize(8)
          .text(txtSupInformativoRaw, doc.page.margins.left + 4, y + 2, {
            width: colWidths[0] - 8
          });

        y += txtSupInformativoHeight;
      }

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
        const dynamicRowHeight = Math.max(16, ...heights) + 2;

        const textoResultadoRaw = row.textoResultado == null ? '' : String(row.textoResultado);
        const hasTextoResultado = textoResultadoRaw.trim() !== '';
        const textoResultadoHeight = hasTextoResultado
          ? Math.max(12, doc.heightOfString(textoResultadoRaw, { width: colWidths[1] - 8, lineBreak: true }) + 4)
          : 0;

        if (y + dynamicRowHeight + textoResultadoHeight + 16 > contentBottomY) {
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
          const align = idx === 1 ? 'center' : 'left';
          doc
            .font('Helvetica')
            .fontSize(9)  //TAMAÑO DE LETRA LINEA RESULTADOS
            .text(String(val ?? ''), cx + 4 + shiftX, y + 1, {
              width: colWidths[idx] - 8,
              lineBreak: false,
              align
            });
          cx += colWidths[idx];
        });

        y += dynamicRowHeight;

        if (hasTextoResultado) {
          const rowBaseY = y;
          const rowTextOptions = { width: colWidths[1] - 8, lineBreak: true };

          let resultadoX = doc.page.margins.left + colWidths[0];
          doc
            .font('Helvetica')
            .fontSize(7)
            .text(textoResultadoRaw, resultadoX + 4 + resultsColumnsShift, rowBaseY + 1, rowTextOptions);

          y += textoResultadoHeight;
        }
      });

      const txtInformaticoRaw = group.txtInformatico == null ? '' : String(group.txtInformatico);
      const hasTxtInformatico = txtInformaticoRaw.trim() !== '';
      const txtInformaticoWidth = (colWidths[2] + colWidths[3]) - 8;
      const txtInformaticoHeight = hasTxtInformatico
        ? Math.max(10, doc.heightOfString(txtInformaticoRaw, { width: txtInformaticoWidth })) + 4
        : 0;

      const blockHeightBeforeSeparator = txtInformaticoHeight + 10; // txtInformatico (opcional) + "Validado por"
      if (y + blockHeightBeforeSeparator + 4 > contentBottomY) {
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
      const yHeader2 = doc.page.margins.top + 80 + rowHeights2[0] + rowHeights2[1];

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

      const candidateSignaturePaths = (headerData.signaturePaths || [])
        .map((signatureValue) => path.isAbsolute(signatureValue)
          ? signatureValue
          : path.resolve(process.cwd(), signatureValue));

      const validSignaturePaths = candidateSignaturePaths
        .map((resolvedPath) => {
          const ext = path.extname(resolvedPath).toLowerCase();

          if (ext === '.bmp') {
            const jpgPath = resolvedPath.slice(0, -4) + '.jpg';
            if (fs.existsSync(jpgPath)) {
              return jpgPath;
            }

            const jpegPath = resolvedPath.slice(0, -4) + '.jpeg';
            if (fs.existsSync(jpegPath)) {
              return jpegPath;
            }
          }

          return resolvedPath;
        })
        .filter((resolvedPath) => fs.existsSync(resolvedPath));

      const supportedSignaturePaths = validSignaturePaths.filter((resolvedPath) => {
        const ext = path.extname(resolvedPath).toLowerCase();
        return ['.jpg', '.jpeg', '.png'].includes(ext);
      });

      if (supportedSignaturePaths.length > 0) {
        const signatureGap = 20;
        const totalWidth = (supportedSignaturePaths.length * SIGNATURE_SIZE) + ((supportedSignaturePaths.length - 1) * signatureGap);
        const startX = doc.page.margins.left + ((pageUsableWidth2 - totalWidth) / 2);
        const signatureY = doc.page.height - doc.page.margins.bottom - SIGNATURE_SIZE;

        supportedSignaturePaths.forEach((signaturePath, index) => {
          const signatureX = startX + (index * (SIGNATURE_SIZE + signatureGap));
          try {
            doc.image(signaturePath, signatureX, signatureY, {
              fit: [SIGNATURE_SIZE, SIGNATURE_SIZE],
              align: 'left'
            });
          } catch (error) {
            // Ignorar errores de dibujo de firma para no interrumpir la generación del PDF.
          }
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
