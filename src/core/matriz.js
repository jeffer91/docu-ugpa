// Matriz Excel: se descarga con una hoja por cada grupo de datos, se llena y se vuelve a subir.
const ExcelJS = require('exceljs');
const { PROCESOS } = require('./schema');
const { periodoTexto } = require('./util');

const AZUL = 'FF1F3864';

function nombreHoja(nombre) {
  return nombre.replace(/[:\\/?*[\]]/g, '-').slice(0, 31);
}

function opcionesDe(campo, db, exp) {
  if (campo.t === 'select') return campo.op || [];
  if (campo.t === 'carrera') return db.config.carreras || [];
  if (campo.t === 'capacitacion') return ((exp.datos && exp.datos.capacitaciones) || []).map((c) => c.nombre).filter(Boolean);
  return null;
}

async function exportar(db, exp) {
  const proc = PROCESOS[exp.proceso];
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Docu UGPA';

  const ins = wb.addWorksheet('Instrucciones');
  ins.columns = [{ width: 110 }];
  const lineas = [
    `Matriz de datos — ${proc.codigo} ${proc.nombre}`,
    `Período: ${periodoTexto(exp, true)}`,
    '',
    '1. Cada hoja corresponde a un grupo de datos de la app. No cambies el nombre de las hojas ni los encabezados.',
    '2. Llena una fila por registro. Las columnas con lista desplegable solo aceptan los valores de la lista.',
    '3. Porcentajes: escribe solo el número (ej.: 72 para 72 %). Fechas: usa el formato de fecha de Excel. Meses: AAAA-MM (ej.: 2026-02).',
    '4. Las hojas de "Datos generales" y "Capacitación genérica" se llenan en la columna "Valor".',
    '5. Guarda el archivo y súbelo en la app con el botón "Subir matriz". Los datos de cada hoja reemplazan a los existentes.',
  ];
  lineas.forEach((t, i) => {
    const c = ins.getCell(i + 1, 1);
    c.value = t;
    if (i === 0) c.font = { bold: true, size: 14, color: { argb: AZUL } };
    c.alignment = { wrapText: true };
  });

  const listas = wb.addWorksheet('Listas', { state: 'veryHidden' });
  let colLista = 1;
  const rangoLista = (ops) => {
    const col = colLista++;
    ops.forEach((o, i) => { listas.getCell(i + 1, col).value = o; });
    const letra = listas.getColumn(col).letter;
    return `Listas!$${letra}$1:$${letra}$${Math.max(ops.length, 1)}`;
  };

  for (const ent of proc.entidades) {
    const ws = wb.addWorksheet(nombreHoja(ent.nombre));
    const datos = (exp.datos && exp.datos[ent.id]) || (ent.tipo === 'form' ? {} : []);
    if (ent.tipo === 'form') {
      ws.columns = [{ header: 'Campo', width: 55 }, { header: 'Valor', width: 70 }, { header: 'clave', width: 4 }];
      ent.campos.forEach((c, i) => {
        const r = ws.getRow(i + 2);
        r.getCell(1).value = c.l;
        const v = datos[c.k] !== undefined ? datos[c.k] : c.def || '';
        r.getCell(2).value = v;
        r.getCell(2).alignment = { wrapText: true, vertical: 'top' };
        r.getCell(3).value = c.k;
        const ops = opcionesDe(c, db, exp);
        if (ops && ops.length) r.getCell(2).dataValidation = { type: 'list', allowBlank: true, formulae: [rangoLista(ops)] };
      });
      ws.getColumn(3).hidden = true;
    } else {
      ws.columns = ent.campos.map((c) => ({ header: c.l + (c.req ? ' *' : ''), key: c.k, width: c.w || 20 }));
      (Array.isArray(datos) ? datos : []).forEach((row) => {
        ws.addRow(ent.campos.map((c) => (row[c.k] === undefined ? null : row[c.k])));
      });
      const filas = 500;
      ent.campos.forEach((c, i) => {
        const col = ws.getColumn(i + 1);
        if (c.t === 'month' || c.t === 'text' || c.t === 'textarea') col.numFmt = '@';
        if (c.t === 'date') col.numFmt = 'dd/mm/yyyy';
        const ops = opcionesDe(c, db, exp);
        if (ops && ops.length) {
          const f = rangoLista(ops);
          for (let r = 2; r <= filas; r++) ws.getCell(r, i + 1).dataValidation = { type: 'list', allowBlank: true, formulae: [f], showErrorMessage: c.t === 'select', errorTitle: 'Valor no válido', error: 'Elige un valor de la lista.' };
        }
      });
      ws.views = [{ state: 'frozen', ySplit: 1 }];
    }
    const h = ws.getRow(1);
    h.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    h.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } };
    h.alignment = { wrapText: true, vertical: 'middle' };
    h.height = 32;
    if (ent.ayuda) ws.getCell(1, 1).note = ent.ayuda;
  }
  return wb.xlsx.writeBuffer();
}

function aISO(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function valorCelda(cell, campo) {
  let v = cell.value;
  if (v && typeof v === 'object') {
    if (v instanceof Date) {
      if (campo && campo.t === 'month') return aISO(v).slice(0, 7);
      return aISO(v);
    }
    if (v.richText) v = v.richText.map((t) => t.text).join('');
    else if (v.result !== undefined) v = v.result;
    else if (v.text) v = v.text;
  }
  if (v === null || v === undefined) return '';
  if (campo && campo.t === 'percent' && typeof v === 'number' && v > 0 && v <= 1 && !Number.isInteger(v)) return Math.round(v * 10000) / 100;
  if (campo && (campo.t === 'number' || campo.t === 'percent')) {
    const n = parseFloat(String(v).replace('%', '').replace(',', '.'));
    return isNaN(n) ? '' : n;
  }
  if (campo && campo.t === 'date' && typeof v === 'string') {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v.trim());
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return String(v).trim();
}

const normal = (s) => String(s || '').replace(/\s*\*$/, '').trim().toLowerCase();

// Devuelve { datos: {entidad: valor}, resumen: [texto] }
async function importar(buffer, proceso) {
  const proc = PROCESOS[proceso];
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const datos = {};
  const resumen = [];
  for (const ent of proc.entidades) {
    const ws = wb.getWorksheet(nombreHoja(ent.nombre));
    if (!ws) continue;
    if (ent.tipo === 'form') {
      const obj = {};
      ws.eachRow((row, n) => {
        if (n === 1) return;
        const k = valorCelda(row.getCell(3));
        const campo = ent.campos.find((c) => c.k === k) || ent.campos.find((c) => normal(c.l) === normal(valorCelda(row.getCell(1))));
        if (campo) obj[campo.k] = valorCelda(row.getCell(2), campo);
      });
      datos[ent.id] = obj;
      resumen.push(`${ent.nombre}: ${Object.values(obj).filter((v) => v !== '').length} campos`);
    } else {
      const cols = {};
      ws.getRow(1).eachCell((cell, col) => {
        const campo = ent.campos.find((c) => normal(c.l) === normal(valorCelda(cell)));
        if (campo) cols[col] = campo;
      });
      const filas = [];
      ws.eachRow((row, n) => {
        if (n === 1) return;
        const o = {};
        let vacia = true;
        for (const [col, campo] of Object.entries(cols)) {
          const v = valorCelda(row.getCell(+col), campo);
          if (v !== '') vacia = false;
          o[campo.k] = v;
        }
        if (!vacia) filas.push(o);
      });
      datos[ent.id] = filas;
      resumen.push(`${ent.nombre}: ${filas.length} filas`);
    }
  }
  return { datos, resumen };
}

module.exports = { exportar, importar, nombreHoja };
