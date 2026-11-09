// Utilidades compartidas: períodos, códigos, fechas, porcentajes y marcadores de texto.
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// '2025-10' -> {anio:2025, mes:10}
function ym(s) {
  const m = /^(\d{4})-(\d{1,2})/.exec(s || '');
  return m ? { anio: +m[1], mes: +m[2] } : null;
}

function mesAnio(s, mayus = false) {
  const p = ym(s);
  if (!p) return '';
  const t = `${MESES[p.mes - 1]} ${p.anio}`;
  return mayus ? cap(t) : t;
}

// Texto del período: "octubre 2025 – marzo 2026"
function periodoTexto(exp, mayus = false) {
  if (!exp) return '';
  return `${mesAnio(exp.inicio, mayus)} – ${mesAnio(exp.fin, mayus)}`;
}

function periodoCorto(exp) {
  const a = ym(exp.inicio), b = ym(exp.fin);
  return a && b ? `${a.anio}–${b.anio}` : '';
}

function fechaLarga(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return iso || '';
  return `${+m[3]} de ${MESES[+m[2] - 1]} de ${m[1]}`;
}

function fechaCorta(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso || '';
}

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Código institucional: UGPA-RGI1-01-PRO-70-2025-10
function codigoDocumento(proceso, clave, doc) {
  const nn = String((doc && doc.nn) || '01').padStart(2, '0');
  const p = ym((doc && doc.fecha) || hoyISO());
  return `UGPA-${clave}-${nn}-${proceso}-${p.anio}-${String(p.mes).padStart(2, '0')}`;
}

const num = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v).replace('%', '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

// 84.375 -> "84,38 %"
function pct(n, dec = 2) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return `${Number(n).toFixed(dec).replace('.', ',')} %`;
}
const ratio = (a, b) => (b ? (a / b) * 100 : 0);

function listaY(arr) {
  const a = arr.filter(Boolean);
  if (a.length <= 1) return a.join('');
  return `${a.slice(0, -1).join(', ')} y ${a[a.length - 1]}`;
}

const NUMEROS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
const enLetras = (n) => (n >= 0 && n <= 20 ? NUMEROS[n] : String(n));

// Reemplaza {{marcadores}} en los textos base
function rellenar(texto, vars) {
  return String(texto).replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m));
}

function agrupar(arr, key) {
  const m = new Map();
  for (const x of arr) {
    const k = typeof key === 'function' ? key(x) : x[key];
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
}

function nivelRecurrencia(p) {
  if (p >= 60) return 'Alta';
  if (p >= 40) return 'Media';
  return 'Baja';
}

module.exports = {
  MESES, cap, ym, mesAnio, periodoTexto, periodoCorto, fechaLarga, fechaCorta, hoyISO, codigoDocumento,
  num, pct, ratio, listaY, enLetras, rellenar, agrupar, nivelRecurrencia,
};
