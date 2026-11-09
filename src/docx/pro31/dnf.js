// PRO-31 · RGI1 · Detección de Necesidades de Formación Docente
const { pct, ratio, agrupar, enLetras } = require('../../core/util');
const { conteo, RANGO_NIVEL } = require('../../core/calculos');

const NIVELES = ['Tecnólogo', 'Tercer nivel', 'Especialidad', 'Maestría', 'Doctorado'];

module.exports = function dnf(d, ctx) {
  const datos = ctx.datos;
  const cl = (datos.claustro || []).filter((x) => x.carrera);
  const N = cl.length;
  const porCarrera = conteo(cl, 'carrera');
  const nCar = porCarrera.length;
  const g = datos.general || {};

  d.h(1, 'Introducción');
  d.texto('intro');
  d.h(1, 'Base legal');
  d.texto('base_legal');
  d.sec(1, 'Alineación estratégica', 'alineacion');
  d.h(1, 'Metodología y enfoque');
  d.texto('metodologia');
  d.sec(2, 'Objetivo general', 'objetivo_general');
  d.sec(2, 'Objetivos específicos', 'objetivos_especificos');
  d.sec(2, 'Alcance del diagnóstico', 'alcance');
  d.sec(2, 'Estrategia de levantamiento de información', 'estrategia');
  if (g.fecha_levantamiento) d.p(`El levantamiento de información se realizó durante ${g.fecha_levantamiento}.`);
  d.sec(2, 'Enfoque cuantitativo', 'enfoque_cuanti');
  d.sec(2, 'Enfoque cualitativo', 'enfoque_cuali');
  d.sec(2, 'Triangulación de la información', 'triangulacion');
  d.sec(2, 'Fases del proceso metodológico', 'fases');

  // 5. Caracterización (calculada)
  d.h(1, 'Caracterización del claustro docente');
  d.p(`Para el período ${ctx.vars.periodo}, el diagnóstico incorpora una matriz cuantitativa de ${N} registros docentes distribuidos entre ${nCar} carreras. La información permite establecer la composición de los registros analizados, identificar su distribución institucional y organizar el estudio de las necesidades de formación académica específica, compartida y transversal.`);
  d.h(2, 'Carreras consideradas en la caracterización');
  d.tabla('Distribución de registros docentes por carrera', ['N.º', 'Carrera', 'Registros docentes', '%'],
    [...porCarrera.map(([c, n], i) => [i + 1, c, n, pct(ratio(n, N))]), ['', 'Total', N, '100,00 %']], { anchos: [0.6, 5, 1.6, 1.4], centrar: [0, 2, 3], total: true });
  const grupos = agrupar(porCarrera, (x) => x[1]);
  d.p(`La distribución comprende ${[...grupos.entries()].sort((a, b) => b[0] - a[0]).map(([n, l]) => `${enLetras(l.length)} ${l.length === 1 ? 'carrera' : 'carreras'} con ${n} ${n === 1 ? 'registro' : 'registros'}`).join(', ')}, cuya suma corresponde a los ${N} registros incorporados en la matriz institucional.`);
  const conNivel = cl.filter((x) => x.nivel);
  if (conNivel.length) {
    const pn = conteo(conNivel, 'nivel', NIVELES);
    d.tabla('Distribución por nivel académico acreditado', ['Nivel académico', 'Docentes', '%'], [...pn.map(([k, n]) => [k, n, pct(ratio(n, conNivel.length))]), ['Total', conNivel.length, '100,00 %']], { anchos: [3, 1.5, 1.5], centrar: [1, 2], total: true });
  }
  d.sec(2, 'Organización del análisis por carrera', 'organizacion');

  // 6. Líneas
  d.h(1, 'Líneas de formación por coordinación académica');
  d.texto('lineas');
  d.h(2, 'Líneas de formación identificadas por coordinación académica');
  d.tabla('Líneas de formación específica por carrera', ['Carrera / coordinación', 'Línea de formación', 'Nivel', 'Programas de referencia'],
    (datos.lineas || []).map((l) => [l.carrera, l.linea, l.nivel || '—', l.programas || '—']), { anchos: [2.6, 3.2, 1.4, 3.2] });
  d.sec(2, 'Criterios para la consolidación y priorización de las líneas de formación', 'priorizacion');
  d.sec(2, 'Vinculación con el Plan de Formación Docente', 'vinculacion_plan');

  // 7. Brechas
  d.h(1, 'Análisis de brechas de formación académica');
  d.texto('brechas');
  d.h(2, 'Brechas de formación específica');
  d.texto('brechas_esp');
  const conBrecha = cl.filter((x) => x.nivel_requerido && (RANGO_NIVEL[x.nivel_requerido] || 0) > (RANGO_NIVEL[x.nivel] || 0));
  if (conBrecha.length) {
    d.tabla('Brechas identificadas entre nivel actual y nivel requerido', ['Docente', 'Carrera', 'Nivel actual', 'Nivel requerido', 'Necesidad / línea'],
      conBrecha.map((x) => [x.docente, x.carrera, x.nivel || '—', x.nivel_requerido, x.necesidad || '—']), { anchos: [2.6, 2.4, 1.4, 1.4, 3] });
    const tb = conteo(conBrecha, 'tipo');
    d.p(`Se identifican ${conBrecha.length} docentes con brecha entre su nivel académico actual y el requerido (${pct(ratio(conBrecha.length, N))} del total de registros)${tb.length ? `, distribuidos por tipo de formación en: ${tb.map(([k, n]) => `${k.toLowerCase()} (${n})`).join(', ')}` : ''}.`);
  }
  d.h(2, 'Brechas de formación genérica');
  d.texto('brechas_gen');
  d.h(2, 'Cobertura por universidad');
  d.texto('cobertura');
  d.tabla('Cobertura de la oferta académica por institución', ['Institución', 'Formación específica', 'Formación genérica', 'Nivel o denominación', 'Convenio / beneficio'],
    (datos.universidades || []).map((u) => [u.institucion, u.especifica, u.generica, u.niveles, u.beneficio || '—']), { anchos: [2, 3, 3, 2.2, 2.2] });

  // 8. Orientaciones
  d.h(1, 'Orientaciones y alternativas para el acceso a la formación académica');
  d.texto('orientaciones');
  d.sec(2, 'Criterios para la selección de programas académicos', 'criterios_sel');
  d.sec(2, 'Modalidades de acceso a las recomendaciones de formación', 'modalidades');
  d.sec(2, 'Orientación para la elección del docente', 'eleccion');
  d.sec(2, 'Criterios de recomendación institucional', 'criterios_rec');
  d.sec(2, 'Resultado esperado', 'resultado_esperado');

  // 9. Resumen ejecutivo
  d.h(1, 'Resumen ejecutivo');
  const res = [
    ['Registros docentes analizados', N], ['Carreras consideradas', nCar],
    ['Docentes con brecha de nivel identificada', conBrecha.length],
    ['Líneas de formación específica', (datos.lineas || []).length], ['Instituciones con cobertura revisada', (datos.universidades || []).length],
  ];
  d.tabla('Síntesis del diagnóstico', ['Indicador', 'Resultado'], res, { anchos: [4, 2], centrar: [1] });
  const tipos = conteo(cl.filter((x) => x.tipo), 'tipo');
  if (tipos.length) d.tabla('Tipos de formación identificados', ['Tipo de formación', 'Registros', '%'], tipos.map(([k, n]) => [k, n, pct(ratio(n, cl.filter((x) => x.tipo).length))]), { anchos: [3, 1.5, 1.5], centrar: [1, 2] });

  d.sec(1, 'Conclusiones', 'conclusiones');
  d.h(1, 'Recomendaciones');
  d.sec(2, 'Recomendaciones institucionales', 'rec_inst');
  d.sec(2, 'Recomendaciones para la formación específica', 'rec_esp');
  d.sec(2, 'Recomendaciones para la formación genérica', 'rec_gen');
  d.sec(2, 'Recomendaciones para el acceso a la formación', 'rec_acc');
  d.sec(1, 'Referencias', 'referencias');
};
