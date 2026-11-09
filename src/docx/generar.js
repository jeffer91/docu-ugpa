// Punto único de generación de documentos (se usa desde Electron y desde scripts/demo.js).
const { PROCESOS } = require('../core/schema');
const textos = require('../core/textos');
const { periodoTexto, periodoCorto, codigoDocumento, cap, hoyISO } = require('../core/util');
const { Documento } = require('./base');

const GENERADORES = {
  'pro70/dnc': require('./pro70/dnc'),
  'pro70/plan': require('./pro70/plan'),
  'pro70/informe': require('./pro70/informe'),
  'pro31/dnf': require('./pro31/dnf'),
  'pro31/plan': require('./pro31/plan'),
  'pro31/informe': require('./pro31/informe'),
};

function contexto(db, exp, clave) {
  const proc = PROCESOS[exp.proceso];
  const def = proc.documentos.find((d) => d.clave === clave);
  const docInfo = (exp.docs && exp.docs[clave]) || {};
  const codigo = codigoDocumento(exp.proceso, clave, { nn: docInfo.nn, fecha: docInfo.fecha || hoyISO() });
  const cfg = db.config;
  const vars = {
    periodo: periodoTexto(exp),
    Periodo: periodoTexto(exp, true),
    periodo_corto: periodoCorto(exp),
    institucion: cfg.institucion,
    siglas: cfg.siglas,
    unidad: cfg.unidad,
    documento: def.titulo,
    codigo,
  };
  // Cifras que aparecen dentro de los textos base
  const datos = exp.datos || {};
  const { enLetras } = require('../core/util');
  const cl = datos.claustro || [];
  vars.n_registros = cl.length;
  vars.n_carreras = new Set(cl.map((x) => x.carrera).filter(Boolean)).size;
  vars.n_formacion = (datos.en_formacion || []).length;
  vars.n_formacion_letras = enLetras(vars.n_formacion);
  vars.corte = (datos.general && datos.general.corte) || 'la fecha de corte';
  // Códigos de los otros documentos del mismo expediente (para referencias cruzadas)
  for (const d of proc.documentos) {
    const di = (exp.docs && exp.docs[d.clave]) || {};
    vars['codigo_' + d.clave] = codigoDocumento(exp.proceso, d.clave, { nn: di.nn, fecha: di.fecha || hoyISO() });
  }
  return { db, exp, proc, def, codigo, vars, textos: textos.obtener(db, def.textos), datos: exp.datos || {} };
}

// Revisa qué datos faltan antes de generar
function completitud(db, exp, clave) {
  const proc = PROCESOS[exp.proceso];
  const def = proc.documentos.find((d) => d.clave === clave);
  const faltan = [];
  for (const id of def.requiere || []) {
    const ent = proc.entidades.find((e) => e.id === id);
    const v = (exp.datos || {})[id];
    const vacio = ent.tipo === 'form' ? !v || !ent.campos.filter((c) => c.req).every((c) => v[c.k]) : !v || !v.length;
    if (vacio) faltan.push(ent.nombre);
  }
  return { ok: faltan.length === 0, faltan };
}

async function generar(db, exp, clave) {
  const ctx = contexto(db, exp, clave);
  const doc = new Documento(ctx);
  GENERADORES[ctx.def.gen](doc, ctx);
  const buffer = await doc.generar();
  return { buffer, nombre: `${ctx.codigo} ${ctx.def.nombre}.docx`, codigo: ctx.codigo };
}

module.exports = { generar, completitud, contexto, cap };
