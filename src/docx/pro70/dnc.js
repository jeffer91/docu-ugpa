// PRO-70 · RGI1 · Detección de Necesidades de Capacitación Docente
const { num, pct, listaY, nivelRecurrencia, enLetras } = require('../../core/util');
const { carrerasDNC, genericaDNC } = require('../../core/calculos');

module.exports = function dnc(d, ctx) {
  const datos = ctx.datos;
  const g = datos.general || {};
  const carreras = carrerasDNC(datos);
  const generica = genericaDNC(datos);
  const inst = [...(datos.necesidades_inst || [])].sort((a, b) => num(b.recurrencia) - num(a.recurrencia));
  Object.assign(ctx.vars, { generica, n_carreras: carreras.length });

  // 1. Introducción
  d.h(1, 'Introducción');
  d.texto('intro');
  d.p(`El presente documento recoge la Detección de Necesidades de Capacitación Docente del ${ctx.vars.institucion} (${ctx.vars.siglas}) correspondiente al período ${ctx.vars.periodo}. Su propósito es identificar, analizar y priorizar las necesidades formativas del personal docente de ${carreras.length} carreras, como insumo técnico para la elaboración del Plan de Capacitación Docente.`);
  d.sec(2, 'Justificación', 'justificacion');
  d.sec(2, 'Alcance temporal y cobertura', 'alcance');
  if (g.fecha_levantamiento || g.docentes_participantes) {
    d.p(`El levantamiento de información se desarrolló durante ${g.fecha_levantamiento || 'el período señalado'}${g.docentes_participantes ? `, con la participación de ${g.docentes_participantes} docentes` : ''}, mediante ${g.instrumentos || 'los instrumentos institucionales definidos'}.`);
  }
  d.sec(2, 'Contexto institucional y transformaciones educativas', 'contexto');
  d.sec(2, 'Objetivos', 'objetivos');

  // 2-4. Marco fijo
  d.sec(1, 'Base legal', 'base_legal');
  d.sec(1, 'Alineación institucional', 'alineacion');
  d.sec(1, 'Metodología', 'metodologia');
  d.sec(2, 'Fuentes de información', 'fuentes');
  d.sec(2, 'Criterios para la identificación y priorización de necesidades', 'criterios');

  // 5. Resultados
  d.h(1, 'Resultados');
  d.texto('resultados');
  d.h(2, 'Necesidades de capacitación a nivel institucional');
  d.p('A partir del análisis consolidado por carrera, se identificaron necesidades con presencia transversal. Las principales necesidades consideradas en la fase de consolidación institucional se presentan en la siguiente tabla:');
  d.tabla('Necesidades a nivel institucional', ['Necesidad de capacitación identificada', 'Presencia institucional', 'Porcentaje de recurrencia'],
    inst.map((n) => [n.necesidad, n.presencia || nivelRecurrencia(num(n.recurrencia)), pct(num(n.recurrencia), 0)]), { anchos: [5, 2, 2], centrar: [1, 2] });
  if (inst.length) {
    d.p(`**Interpretación técnica:** la necesidad relacionada con ${inst[0].necesidad.toLowerCase()} presenta el mayor nivel de recurrencia institucional (${pct(num(inst[0].recurrencia), 0)})${inst[1] ? `, seguida de ${inst[1].necesidad.toLowerCase()} (${pct(num(inst[1].recurrencia), 0)})` : ''}. Esto evidencia que la brecha no es únicamente disciplinar, sino estructural y pedagógica, por lo que se justifica una respuesta formativa de alcance institucional.`);
  }

  d.h(2, 'Capacitación genérica institucional');
  d.p(`Como resultado del proceso de consolidación, análisis comparativo y priorización, se define como capacitación genérica institucional para el período ${ctx.vars.periodo}: **${generica || '(por definir)'}**.`);
  if (datos.generica && datos.generica.enfoque) d.p(`Esta capacitación atiende de manera prioritaria la brecha relacionada con ${datos.generica.enfoque}, identificada de forma recurrente en las distintas carreras.`);
  d.h(3, 'Justificación de la capacitación genérica institucional');
  d.texto('just_generica');
  d.h(3, 'Alcance institucional de la capacitación genérica');
  d.texto('alcance_generica');
  d.h(3, 'Relación de la capacitación genérica con la mejora de la docencia');
  d.texto('mejora_generica');

  d.h(2, 'Resultados del diagnóstico por carrera');
  d.texto('por_carrera');
  for (const c of carreras) {
    const det = c.detalle || {};
    d.h(3, c.carrera);
    d.p(`El diagnóstico de necesidades de capacitación docente en la carrera de ${c.carrera} evidencia un conjunto de requerimientos formativos orientados a mejorar la calidad del proceso de enseñanza-aprendizaje. A partir del análisis de las fuentes de información, se identificaron ${enLetras(c.necesidades.length)} necesidades de capacitación docente, presentadas a continuación.`);
    d.tabla(`Necesidades de capacitación identificadas – ${c.carrera}`, ['N.º', 'Necesidad de capacitación identificada', 'Tipo de necesidad', 'Nivel de recurrencia'],
      c.necesidades.map((n, i) => [i + 1, n.necesidad, n.tipo || '—', nivelRecurrencia(num(n.recurrencia))]), { anchos: [0.6, 5, 2.4, 1.8], centrar: [0, 3] });
    d.tabla('Análisis de recurrencia', ['Necesidad', 'Porcentaje de recurrencia'],
      c.necesidades.map((n) => [n.necesidad, pct(num(n.recurrencia), 0)]), { anchos: [5, 2], centrar: [1] });
    const top = c.necesidades[0];
    d.p(`**Interpretación:** la necesidad relacionada con ${top.necesidad.toLowerCase()} presenta el mayor nivel de recurrencia (${pct(num(top.recurrencia), 0)}) dentro de la carrera.`);
    if (det.cualitativo) { d.p('**Análisis cualitativo**', { sinSangria: true }); d.p(det.cualitativo); }
    d.p(`Con base en los criterios de recurrencia, impacto académico y pertinencia curricular, la capacitación prioritaria para la carrera de ${c.carrera} corresponde a: **${c.prioritaria}**.`);
    d.tabla('Vinculación de la capacitación prioritaria con la carrera', ['Aspecto', 'Vinculación con la carrera'], [
      ['Perfil de egreso', det.perfil || 'Fortalece las competencias profesionales del perfil de egreso de la carrera'],
      ['Competencias declaradas', det.competencias || `Competencias disciplinares asociadas a ${c.prioritaria.toLowerCase()}`],
      ['Impacto en la docencia', det.impacto || 'Mejora la claridad y profundidad del abordaje disciplinar'],
      ['Pertinencia curricular', det.pertinencia || 'Alta'],
      ['Alineación institucional', 'Coherente con objetivos académicos y de calidad'],
    ], { anchos: [2, 5] });
    if (generica) {
      d.p(`La capacitación prioritaria de la carrera se articula con la capacitación genérica institucional ${generica}: mientras la primera profundiza el contenido disciplinar, la segunda fortalece la capacidad docente para estructurar, organizar y mediar dichos contenidos, generando una sinergia que impacta positivamente en la calidad del proceso formativo.`);
    }
  }

  // 6. Resumen ejecutivo
  d.h(1, 'Resumen ejecutivo');
  d.h(2, 'Capacitación genérica institucional');
  d.p(`La capacitación genérica institucional definida para el período es **${generica || '(por definir)'}**, de alcance transversal para todas las carreras.`);
  d.h(2, 'Resultados de capacitación específica por carrera');
  d.tabla('Consolidado ejecutivo de capacitaciones específicas por carrera', ['Carrera', 'Capacitación priorizada', 'Recurrencia'],
    carreras.map((c) => {
      const n = c.necesidades.find((x) => x.necesidad === c.prioritaria) || c.necesidades[0];
      return [c.carrera, c.prioritaria, n ? pct(num(n.recurrencia), 0) : '—'];
    }), { anchos: [3, 4, 1.5], centrar: [2] });
  const tipos = new Map();
  carreras.forEach((c) => {
    const n = c.necesidades.find((x) => x.necesidad === c.prioritaria) || c.necesidades[0];
    const t = (n && n.tipo) || 'Sin clasificar';
    tipos.set(t, (tipos.get(t) || 0) + 1);
  });
  d.tabla('Caracterización de las capacitaciones específicas', ['Tipo de capacitación', 'Carreras', 'Porcentaje'],
    [...tipos.entries()].map(([t, n]) => [t, n, pct((n / carreras.length) * 100, 0)]), { anchos: [3, 1.5, 1.5], centrar: [1, 2] });
  const compartidas = new Map();
  carreras.forEach((c) => { const k = c.prioritaria; compartidas.set(k, [...(compartidas.get(k) || []), c.carrera]); });
  const grupos = [...compartidas.entries()].filter(([, v]) => v.length > 1);
  if (grupos.length) {
    d.p(`Se identificaron capacitaciones compartidas entre carreras: ${grupos.map(([k, v]) => `${k} (${listaY(v)})`).join('; ')}. Esta coincidencia permite optimizar la planificación mediante cursos conjuntos.`);
  }
  d.h(2, 'Priorización final de necesidades de capacitación');
  d.tabla('Priorización final institucional', ['Nivel', 'Tipo de capacitación', 'Características'], [
    ['Nivel 1', 'Capacitación genérica institucional', 'Transversal, estructural, base pedagógica común'],
    ['Nivel 2', 'Capacitaciones específicas por carrera', 'Disciplinar, contextualizada, complementaria'],
  ], { anchos: [1, 3, 4] });

  d.sec(1, 'Conclusiones', 'conclusiones');
  d.sec(1, 'Recomendaciones para la elaboración del Plan de Capacitación Docente', 'recomendaciones');
  d.sec(1, 'Bibliografía', 'bibliografia');
};
