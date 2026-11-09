// Textos base (fijos) de cada documento. Los valores por defecto vienen de los documentos
// institucionales y se pueden personalizar desde la app (se guardan en db.textos).
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, '..', 'textos');
const cache = {};

function porDefecto(clave) {
  if (!cache[clave]) {
    const f = path.join(DIR, clave + '.json');
    cache[clave] = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
  }
  return cache[clave];
}

function listaDocumentos() {
  return fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
}

// Fusiona los textos por defecto con los personalizados por el usuario
function obtener(db, clave) {
  const base = porDefecto(clave);
  const pers = (db.textos && db.textos[clave]) || {};
  const out = {};
  for (const k of new Set([...Object.keys(base), ...Object.keys(pers)])) {
    out[k] = { ...(base[k] || {}), ...(pers[k] || {}), personalizado: !!pers[k] };
  }
  return out;
}

module.exports = { porDefecto, obtener, listaDocumentos };
