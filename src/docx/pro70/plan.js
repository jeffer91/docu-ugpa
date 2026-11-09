// PRO-70 · RGI2 · Plan Semestral de Capacitación Docente
const { mesAnio, listaY } = require('../../core/util');
const { carrerasDNC, genericaDNC } = require('../../core/calculos');

module.exports = function plan(d, ctx) {
  const datos = ctx.datos;
  const caps = datos.capacitaciones || [];
  const gen = caps.filter((c) => c.tipo === 'Genérica');
  const esp = caps.filter((c) => c.tipo !== 'Genérica');
  const carreras = carrerasDNC(datos);
  const generica = (gen[0] && gen[0].nombre) || genericaDNC(datos);
  const m = (s) => mesAnio(s, true) || 'Por definir';

  d.sec(1, 'Introducción', 'intro');
  d.sec(2, 'Objetivos', 'objetivos');
  d.sec(2, 'Base legal', 'base_legal');

  d.h(1, 'Referencia a la Detección de Necesidades de Capacitación Docente');
  d.texto('ref_dnc');
  d.p(`El presente Plan se sustenta en la Detección de Necesidades de Capacitación Docente (${ctx.vars.codigo_RGI1}) correspondiente al período ${ctx.vars.periodo}, de la cual se trasladan, sin modificación, la capacitación genérica institucional y las capacitaciones específicas priorizadas por carrera.`);
  if (carreras.length) {
    d.tabla('Síntesis de las necesidades priorizadas en la Detección', ['Carrera', 'Necesidad prioritaria identificada'],
      carreras.map((c) => [c.carrera, c.prioritaria]), { anchos: [3, 4] });
  }

  d.h(1, 'Plan de acción');
  d.sec(2, 'Propósito del Plan de Acción', 'plan_accion');
  d.sec(2, 'Alcance del Plan de Acción', 'alcance_plan');
  d.h(2, 'Estructura del Plan de Acción');
  d.p('El Plan de Acción se organiza a partir de dos componentes estructurales complementarios, que responden a la naturaleza de las necesidades formativas diagnosticadas y al nivel en el que estas inciden dentro de la institución:');
  d.tabla('Organización estructural del Plan', ['Nivel de capacitación', 'Tipo de enfoque', 'Alcance', 'Finalidad'], [
    ['Capacitación genérica institucional', 'Institucional', 'Transversal', 'Fortalecer competencias docentes comunes identificadas en el diagnóstico'],
    ['Capacitaciones específicas por carrera', 'Disciplinar', 'Particular', 'Atender necesidades técnicas propias de cada carrera'],
  ], { anchos: [3, 2, 1.6, 4] });

  d.h(2, 'Capacitación genérica institucional');
  if (generica) {
    d.p(`La capacitación genérica institucional definida en el presente Plan de Acción se denomina **“${generica}”**. Esta denominación se deriva de manera directa de la Detección de Necesidades de Capacitación Docente y responde a brechas formativas transversales identificadas en el conjunto de carreras.`);
    d.p('Su inclusión en el Plan de Acción obedece a criterios de pertinencia institucional y coherencia académica, garantizando que la planificación de la capacitación docente se base en evidencia diagnóstica y mantenga trazabilidad con el proceso que le da origen.');
    const g0 = gen[0] || {};
    d.tabla('Ubicación temporal de la capacitación genérica', ['Capacitación', 'Tipo', 'Inicio previsto', 'Finalización prevista'],
      [[generica, 'Genérica institucional', m(g0.inicio_previsto), m(g0.fin_previsto)]], { anchos: [4, 2, 1.6, 1.6], centrar: [2, 3] });
  }

  d.h(2, 'Capacitaciones específicas por carrera');
  d.p('Las capacitaciones específicas corresponden a necesidades formativas particulares, asociadas a campos disciplinares específicos y a los perfiles profesionales de cada carrera, atendiendo requerimientos técnicos propios del ámbito profesional.');
  for (const c of esp) {
    d.h(3, c.carreras || c.nombre);
    d.p(`**Capacitación:** ${c.nombre}`, { sinSangria: true });
    d.p(`La capacitación específica “${c.nombre}” se deriva de la Detección de Necesidades de Capacitación Docente y responde a brechas formativas identificadas en ${c.carreras && c.carreras.includes(',') ? 'las carreras de ' + listaY(c.carreras.split(',').map((x) => x.trim())) : 'la carrera de ' + (c.carreras || '—')}. Su formulación atiende requerimientos disciplinares propios del perfil profesional y de los resultados de aprendizaje establecidos.`);
    d.p('En coherencia con la planificación del Plan de Acción, la capacitación se ha previsto para su desarrollo dentro de un período común que facilite su organización institucional:');
    d.tabla(null, ['Carrera', 'Capacitación específica', 'Inicio previsto', 'Finalización prevista'],
      [[c.carreras, c.nombre, m(c.inicio_previsto), m(c.fin_previsto)]], { anchos: [3, 4, 1.6, 1.6], centrar: [2, 3] });
  }

  d.h(2, 'Relación entre capacitación genérica y capacitaciones específicas');
  d.p('La relación entre la capacitación genérica institucional y las capacitaciones específicas por carrera se establece desde un enfoque de complementariedad formativa y coherencia institucional: la capacitación genérica atiende brechas transversales comunes, mientras que las específicas responden a brechas disciplinares propias de cada carrera, sin superposición de alcances ni duplicación de acciones formativas.');

  d.h(1, 'Resumen ejecutivo');
  d.p(`El presente Resumen Ejecutivo sintetiza el contenido del Plan de Acción de Capacitación Docente – período ${ctx.vars.periodo}, organizando de manera estructurada ${gen.length ? 'la capacitación genérica institucional y ' : ''}${esp.length} capacitaciones específicas por carrera.`);
  d.tabla('Resumen Ejecutivo del Plan de Acción de Capacitación Docente', ['Tipo de capacitación', 'Carrera', 'Denominación de la capacitación', 'Inicio previsto', 'Finalización prevista'],
    caps.map((c) => [c.tipo === 'Genérica' ? 'Genérica institucional' : 'Específica por carrera', c.carreras, c.nombre, m(c.inicio_previsto), m(c.fin_previsto)]),
    { anchos: [2, 3, 3.6, 1.6, 1.6], centrar: [3, 4] });
  d.p('**Nota técnica:** las fechas consignadas corresponden a referencias temporales generales definidas en el Plan de Acción y no constituyen cronogramas operativos, asignación de recursos ni compromisos de ejecución.');

  d.sec(1, 'Sistema de cadencia, seguimiento, evaluación y rendición de cuentas', 'cadencia');
  d.sec(2, 'Instrumentos de evaluación de capacitación', 'instrumentos');
  d.sec(2, 'Informe final de capacitación', 'informe_final');
  d.sec(2, 'Informe de impacto', 'informe_impacto');
  d.sec(2, 'Seguimiento continuo y retroalimentación', 'seguimiento');
  d.sec(2, 'Ajustes y mejoras del Plan de Capacitación', 'ajustes');
  d.sec(2, 'Seguimiento, evaluación y control del Plan', 'control');
  d.sec(2, 'Planificación a largo plazo', 'largo_plazo');
};
