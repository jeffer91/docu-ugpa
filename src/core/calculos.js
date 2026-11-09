// Cálculos derivados de los datos (los usan los generadores y la app).
const { num, agrupar, ratio } = require('./util');

// ---------------- PRO-70 ----------------

// Necesidades agrupadas por carrera, ordenadas por recurrencia, con la prioritaria marcada
function carrerasDNC(datos) {
  const nec = (datos.necesidades || []).filter((n) => n.carrera && n.necesidad);
  const det = new Map((datos.carreras_dnc || []).map((c) => [c.carrera, c]));
  const out = [];
  for (const [carrera, lista] of agrupar(nec, 'carrera')) {
    const orden = [...lista].sort((a, b) => num(b.recurrencia) - num(a.recurrencia));
    const d = det.get(carrera) || {};
    const prioritaria = d.prioritaria || (orden[0] && orden[0].necesidad);
    out.push({ carrera, necesidades: orden, prioritaria, detalle: d });
  }
  return out;
}

function genericaDNC(datos) {
  const g = (datos.generica && datos.generica.nombre) || '';
  if (g) return g;
  const inst = [...(datos.necesidades_inst || [])].sort((a, b) => num(b.recurrencia) - num(a.recurrencia));
  return inst[0] ? inst[0].necesidad : '';
}

// Propuesta de capacitaciones a partir de la DNC (genérica + una por capacitación prioritaria)
function capacitacionesDesdeDNC(datos) {
  const out = [];
  const g = genericaDNC(datos);
  if (g) out.push({ nombre: g, tipo: 'Genérica', carreras: 'Todas las carreras' });
  const porNombre = new Map();
  for (const c of carrerasDNC(datos)) {
    const k = c.prioritaria.trim().toLowerCase();
    if (!porNombre.has(k)) porNombre.set(k, { nombre: c.prioritaria, tipo: 'Específica', carreras: [] });
    porNombre.get(k).carreras.push(c.carrera);
  }
  for (const v of porNombre.values()) out.push({ ...v, carreras: v.carreras.join(', ') });
  // conservar fechas/datos ya ingresados
  const previas = new Map((datos.capacitaciones || []).map((c) => [String(c.nombre).trim().toLowerCase(), c]));
  return out.map((c) => ({ ...(previas.get(c.nombre.trim().toLowerCase()) || {}), ...c }));
}

// Resultados de una capacitación con totales calculados
function resultadoDe(datos, nombre) {
  const r = (datos.resultados || []).find((x) => String(x.capacitacion).trim().toLowerCase() === String(nombre).trim().toLowerCase());
  if (!r) return null;
  const inscritos = num(r.inscritos);
  const aprobados = num(r.aprobados);
  const reprobados = num(r.reprobados);
  const desertores = num(r.desertores);
  return {
    ...r, inscritos, aprobados, reprobados, desertores,
    participacion: num(r.participacion), mujeres: num(r.mujeres), hombres: num(r.hombres),
    pAprob: ratio(aprobados, inscritos),
  };
}

// ---------------- PRO-31 ----------------
function conteo(arr, key, orden) {
  const m = new Map();
  for (const x of arr) {
    const k = (typeof key === 'function' ? key(x) : x[key]) || 'Sin registrar';
    m.set(k, (m.get(k) || 0) + 1);
  }
  let ent = [...m.entries()];
  if (orden) ent.sort((a, b) => orden.indexOf(a[0]) - orden.indexOf(b[0]));
  else ent.sort((a, b) => b[1] - a[1]);
  return ent;
}

const RANGO_NIVEL = { 'Tecnólogo': 1, 'Tercer nivel': 2, 'Especialidad': 3, 'Maestría': 4, 'Doctorado': 5 };

function grupoEstado(e) {
  const s = String(e || '').toLowerCase();
  if (s.includes('titul') || s.includes('formaliz')) return 'Proceso de titulación o formalización del título';
  if (s.includes('finaliz') || s.includes('culmin')) return 'Finalizado';
  if (s.includes('suspend') || s.includes('retir')) return 'Suspendido o retirado';
  return 'En curso o en proceso';
}

module.exports = { carrerasDNC, genericaDNC, capacitacionesDesdeDNC, resultadoDe, conteo, RANGO_NIVEL, grupoEstado };
