// Constructor de documentos Word con el formato institucional:
// encabezado (logo + unidad + título/período + código), portada con firmas, índice,
// títulos numerados automáticamente, tablas numeradas y pie "Página X de Y".
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  HeadingLevel, PageNumber, Footer, Header, BorderStyle, VerticalAlign, TableOfContents, PageBreak, ShadingType,
  LevelFormat, TableLayoutType,
} = require('docx');
const { rellenar } = require('../core/util');

const FUENTE = 'Times New Roman';
const AZUL = '1F3864';
const CELESTE = 'DCE6F2';
const ANCHO_UTIL = 9026; // A4 con márgenes de 2,5 cm aprox. (en twips)

const LOGO = path.join(__dirname, '..', '..', 'assets', 'logo.png');

function run(text, o = {}) {
  return new TextRun({ text: String(text ?? ''), font: FUENTE, size: o.size || 24, bold: o.bold, italics: o.italics, color: o.color });
}

// Permite **negritas** simples dentro de un párrafo
function runs(text, o = {}) {
  const partes = String(text ?? '').split(/(\*\*[^*]+\*\*)/g).filter((x) => x !== '');
  return partes.map((p) => (p.startsWith('**') ? run(p.slice(2, -2), { ...o, bold: true }) : run(p, o)));
}

const bordes = (color = '808080') => {
  const b = { style: BorderStyle.SINGLE, size: 4, color };
  return { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b };
};

class Documento {
  constructor(ctx) {
    this.ctx = ctx; // { db, exp, proc, def, codigo, vars, textos }
    this.cuerpo = [];
    this.n = [0, 0, 0, 0];
    this.nTabla = 0;
  }

  // ---------- Títulos ----------
  h(nivel, titulo) {
    this.n[nivel - 1] += 1;
    for (let i = nivel; i < this.n.length; i++) this.n[i] = 0;
    const numero = this.n.slice(0, nivel).join('.') + '.';
    const heading = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4][nivel - 1];
    this.cuerpo.push(new Paragraph({
      heading,
      children: [run(`${numero} ${nivel === 1 ? titulo.toUpperCase() : titulo}`, { bold: true, size: nivel === 1 ? 26 : 24 })],
      spacing: { before: nivel === 1 ? 360 : 240, after: 160 },
      keepNext: true,
    }));
    return this;
  }

  // ---------- Párrafos ----------
  p(text, o = {}) {
    if (text === undefined || text === null || text === '') return this;
    const t = rellenar(text, this.ctx.vars);
    const vin = /^\s*([-•+o]|\d+\.|[a-h]\))\s+/.exec(t);
    if (vin && !o.sinVineta) {
      const esNum = /\d+\.|[a-h]\)/.test(vin[1]);
      this.cuerpo.push(new Paragraph({
        children: esNum ? runs(t, o) : runs(t.slice(vin[0].length), o),
        numbering: esNum ? undefined : { reference: 'vinetas', level: 0 },
        indent: esNum ? { left: 709, hanging: 357 } : undefined,
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 80 },
      }));
      return this;
    }
    this.cuerpo.push(new Paragraph({
      children: runs(t, o),
      alignment: o.centro ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
      indent: o.sinSangria || o.centro ? undefined : { firstLine: 709 },
      spacing: { line: 360, after: 160 },
      keepNext: o.keepNext,
    }));
    return this;
  }

  ps(arr) { (arr || []).forEach((t) => this.p(t)); return this; }

  vinetas(arr) { (arr || []).filter(Boolean).forEach((t) => this.p('- ' + t)); return this; }

  // Inserta los párrafos fijos de un texto base. Devuelve true si había texto.
  texto(clave) {
    const t = this.ctx.textos[clave];
    if (!t || !t.parrafos || !t.parrafos.length) return false;
    this.ps(t.parrafos);
    return true;
  }

  // Título + texto base
  sec(nivel, titulo, clave) {
    this.h(nivel, titulo);
    if (clave) this.texto(clave);
    return this;
  }

  // ---------- Tablas ----------
  tabla(titulo, encabezados, filas, o = {}) {
    if (!filas || !filas.length) {
      this.p('(Sin datos registrados para esta tabla.)', { italics: true, sinSangria: true });
      return this;
    }
    this.nTabla += 1;
    if (titulo) {
      this.cuerpo.push(new Paragraph({
        children: [run(`Tabla ${this.nTabla}. `, { bold: true, size: 22 }), run(titulo, { italics: true, size: 22 })],
        spacing: { before: 200, after: 80 },
        keepNext: true,
      }));
    }
    const nCol = encabezados.length;
    const anchos = o.anchos || Array(nCol).fill(1);
    const suma = anchos.reduce((a, b) => a + b, 0);
    const tw = anchos.map((a) => Math.round((a / suma) * ANCHO_UTIL));
    const celda = (texto, j, cab, ultima) => new TableCell({
      width: { size: tw[j], type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      shading: cab ? { type: ShadingType.CLEAR, fill: AZUL, color: 'auto' } : (ultima && o.total ? { type: ShadingType.CLEAR, fill: CELESTE, color: 'auto' } : undefined),
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      children: String(texto ?? '').split('\n').map((linea) => new Paragraph({
        children: [run(linea, { size: 20, bold: cab || (ultima && o.total), color: cab ? 'FFFFFF' : undefined })],
        alignment: cab || (o.centrar && o.centrar.includes(j)) ? AlignmentType.CENTER : AlignmentType.LEFT,
      })),
    });
    const rows = [new TableRow({ tableHeader: true, children: encabezados.map((e, j) => celda(e, j, true)) })];
    filas.forEach((f, i) => rows.push(new TableRow({ cantSplit: true, children: f.map((v, j) => celda(v, j, false, i === filas.length - 1)) })));
    this.cuerpo.push(new Table({ rows, width: { size: ANCHO_UTIL, type: WidthType.DXA }, columnWidths: tw, borders: bordes(), layout: TableLayoutType.FIXED }));
    this.cuerpo.push(new Paragraph({
      children: [run(o.fuente ? `Fuente: ${o.fuente}` : '', { size: 18, italics: true })],
      spacing: { after: 200 },
    }));
    return this;
  }

  // Tabla de dos columnas Ítem / Información
  ficha(titulo, pares, enc = ['Ítem', 'Información']) {
    return this.tabla(titulo, enc, pares.filter((x) => x[1] !== undefined && x[1] !== null && x[1] !== ''), { anchos: [2, 3] });
  }

  salto() { this.cuerpo.push(new Paragraph({ children: [new PageBreak()] })); return this; }

  // ---------- Estructura completa ----------
  encabezado() {
    const { cfg, def, codigo, vars } = { cfg: this.ctx.db.config, ...this.ctx };
    const logo = fs.existsSync(cfg.logo || '') ? cfg.logo : LOGO;
    const img = new ImageRun({ type: 'png', data: fs.readFileSync(logo), transformation: { width: 110, height: 37 } });
    const c = (children, o = {}) => new TableCell({ children, verticalAlign: VerticalAlign.CENTER, margins: { top: 40, bottom: 40, left: 80, right: 80 }, ...o });
    const par = (t, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, children: [run(t, { size: o.size || 18, bold: o.bold })] });
    const tabla = new Table({
      width: { size: ANCHO_UTIL, type: WidthType.DXA },
      columnWidths: [2200, 4626, 2200],
      layout: TableLayoutType.FIXED,
      borders: bordes('404040'),
      rows: [
        new TableRow({ children: [
          c([new Paragraph({ alignment: AlignmentType.CENTER, children: [img] })], { rowSpan: 2, width: { size: 2200, type: WidthType.DXA } }),
          c([par(cfg.unidad, { size: 18 })], { width: { size: 4626, type: WidthType.DXA } }),
          c([par('Código:', { size: 16 }), par(codigo, { size: 16, bold: true })], { rowSpan: 2, width: { size: 2200, type: WidthType.DXA } }),
        ] }),
        new TableRow({ children: [c([par(def.titulo, { bold: true }), par(vars.Periodo, { bold: true })])] }),
      ],
    });
    return new Header({ children: [tabla, new Paragraph({ children: [] })] });
  }

  pie() {
    return new Footer({ children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ font: FUENTE, size: 18, children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES] })],
    })] });
  }

  portada() {
    const { db, def, vars } = this.ctx;
    const f = db.config.firmantes || {};
    const out = [];
    for (let i = 0; i < 7; i++) out.push(new Paragraph({ children: [] }));
    out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [run(def.titulo, { bold: true, size: 40 })] }));
    out.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [run(vars.Periodo, { bold: true, size: 32 })] }));
    for (let i = 0; i < 12; i++) out.push(new Paragraph({ children: [] }));
    const col = (rol, p) => new TableCell({
      width: { size: 3008, type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      children: [
        new Paragraph({ children: [run(rol, { bold: true, size: 18 })] }),
        new Paragraph({ children: [] }), new Paragraph({ children: [] }), new Paragraph({ children: [] }),
        new Paragraph({ children: [run('NOMBRE: ', { bold: true, size: 18 }), run((p && p.nombre) || '', { size: 18 })] }),
        new Paragraph({ children: [run('CARGO: ', { bold: true, size: 18 })] }),
        new Paragraph({ children: [run((p && p.cargo) || '', { size: 18 })] }),
      ],
    });
    out.push(new Table({
      width: { size: ANCHO_UTIL, type: WidthType.DXA }, columnWidths: [3009, 3008, 3009], layout: TableLayoutType.FIXED, borders: bordes('404040'),
      rows: [new TableRow({ children: [col('ELABORADO POR:', f.elaborado), col('REVISADO POR:', f.revisado), col('APROBADO POR:', f.aprobado)] })],
    }));
    out.push(new Paragraph({ children: [new PageBreak()] }));
    out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [run('ÍNDICE', { bold: true, size: 26 })] }));
    out.push(new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-3' }));
    out.push(new Paragraph({ children: [run('(Si el índice aparece vacío, haz clic derecho sobre él en Word y elige "Actualizar campos".)', { size: 16, italics: true, color: '808080' })] }));
    out.push(new Paragraph({ children: [new PageBreak()] }));
    return out;
  }

  async generar() {
    const doc = new Document({
      creator: this.ctx.db.config.firmantes?.elaborado?.nombre || 'UGPA',
      title: `${this.ctx.def.titulo} ${this.ctx.vars.Periodo}`,
      features: { updateFields: true },
      styles: {
        default: { document: { run: { font: FUENTE, size: 24 } } },
        paragraphStyles: [
          { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FUENTE, size: 26, bold: true, color: '000000' }, paragraph: { spacing: { before: 360, after: 160 } } },
          { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FUENTE, size: 24, bold: true, color: '000000' }, paragraph: { spacing: { before: 240, after: 120 }, indent: { left: 360 } } },
          { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FUENTE, size: 24, bold: true, color: '000000' }, paragraph: { spacing: { before: 200, after: 120 }, indent: { left: 720 } } },
        ],
      },
      numbering: { config: [{ reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1418, bottom: 1134, left: 1440, right: 1440, header: 567, footer: 567 } } },
        headers: { default: this.encabezado() },
        footers: { default: this.pie() },
        children: [...this.portada(), ...this.cuerpo],
      }],
    });
    return Packer.toBuffer(doc);
  }
}

module.exports = { Documento };
