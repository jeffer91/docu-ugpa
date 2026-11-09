// PRO-70 · RGI3 · Informe de Cumplimiento del Plan Semestral de Capacitación
const { num, pct, ratio, fechaCorta, fechaLarga, mesAnio, enLetras } = require('../../core/util');
const { resultadoDe } = require('../../core/calculos');

module.exports = function informe(d, ctx) {
  const datos = ctx.datos;
  const caps = datos.capacitaciones || [];
  const filas = caps.map((c) => ({ c, r: resultadoDe(datos, c.nombre) }));
  const ejecutadas = filas.filter((x) => x.r);
  const T = ejecutadas.reduce((a, { r }) => ({
    ins: a.ins + r.inscritos, apr: a.apr + r.aprobados, rep: a.rep + r.reprobados, des: a.des + r.desertores,
    par: a.par + r.participacion, muj: a.muj + r.mujeres, hom: a.hom + r.hombres,
  }), { ins: 0, apr: 0, rep: 0, des: 0, par: 0, muj: 0, hom: 0 });
  const cumplimiento = ratio(ejecutadas.length, caps.length);

  // 1-3: marco
  d.h(1, 'Introducción');
  d.texto('intro');
  d.h(1, 'Base legal y alineación institucional');
  d.sec(2, 'Marco normativo aplicable', 'marco_normativo');
  d.sec(2, 'Alineación con el Plan Estratégico de Desarrollo Institucional (PEDI)', 'pedi');
  d.sec(2, 'Articulación con el Plan Operativo Anual (POA)', 'poa');
  d.sec(2, 'Coherencia con el Manual de Procesos Académicos', 'manual');
  d.sec(2, 'Cumplimiento del Modelo de Evaluación Externa del CACES', 'caces');
  d.h(1, 'Metodología de evaluación del cumplimiento');
  d.sec(2, 'Enfoque de evaluación', 'enfoque');
  d.sec(2, 'Fuentes de información y evidencias', 'fuentes');
  d.sec(2, 'Criterios de valoración del cumplimiento', 'criterios');

  // 4. Evaluación del cumplimiento
  d.h(1, 'Evaluación del cumplimiento del Plan de Capacitación Docente');
  d.h(2, 'Cumplimiento del cronograma de ejecución');
  d.p(`El Plan de Capacitación Docente (${ctx.vars.codigo_RGI2}) previó ${caps.length} capacitaciones para el período ${ctx.vars.periodo}, de las cuales se registran ${ejecutadas.length} ejecutadas, lo que representa un cumplimiento del ${pct(cumplimiento)} respecto de lo planificado.`);
  d.tabla('Capacitaciones ejecutadas y cumplimiento del cronograma', ['N.º', 'Carrera / Cobertura', 'Curso de capacitación', 'Previsto', 'Inicio', 'Finalización', 'Duración'],
    caps.map((c, i) => [i + 1, c.carreras, c.nombre, `${mesAnio(c.inicio_previsto, true)}${c.fin_previsto ? ' – ' + mesAnio(c.fin_previsto, true) : ''}`, fechaCorta(c.inicio) || 'No ejecutada', fechaCorta(c.fin), c.horas ? `${c.horas} horas` : '']),
    { anchos: [0.5, 2.6, 3, 2, 1.4, 1.4, 1.1], centrar: [0, 4, 5, 6] });
  d.h(2, 'Cumplimiento de los objetivos del plan');
  d.sec(3, 'Objetivo general – verificación de cumplimiento', 'objetivo_general');
  d.sec(3, 'Verificación de cumplimiento de los objetivos específicos', 'objetivos_especificos');
  d.h(2, 'Contribución al cumplimiento del PEDI y del Modelo de Acreditación del CACES');
  d.texto('pedi_impacto');
  d.sec(3, 'Contribución al criterio “Profesores”', 'caces_profesores');
  d.sec(3, 'Contribución al criterio “Docencia”', 'caces_docencia');

  // 5. Resultados por capacitación
  d.h(1, 'Resultados');
  d.h(2, `Capacitaciones ejecutadas período ${ctx.vars.periodo}`);
  for (const { c, r } of ejecutadas) {
    d.h(3, c.nombre);
    d.ficha('Datos generales de ejecución', [
      ['Nombre de la capacitación', c.nombre],
      ['Unidad responsable', ctx.vars.unidad],
      ['Entidad facilitadora', c.entidad],
      ['Fecha de inicio', fechaLarga(c.inicio)],
      ['Fecha de finalización', fechaLarga(c.fin)],
      ['Duración total', c.horas ? `${c.horas} horas` : ''],
      ['Modalidad', c.modalidad],
      ['Tipo', c.tipo],
      ['Cobertura', c.carreras],
      ['Función sustantiva vinculada', 'Docencia'],
      ['Número total de participantes', r.inscritos],
    ]);
    const pc = (datos.participacion_carrera || []).filter((x) => String(x.capacitacion).toLowerCase() === c.nombre.toLowerCase());
    if (pc.length) d.tabla('Participantes por carrera', ['Carrera', 'N.º participantes'], [...pc.map((x) => [x.carrera, num(x.participantes)]), ['Total', pc.reduce((a, x) => a + num(x.participantes), 0)]], { anchos: [4, 2], centrar: [1], total: true });
    if (r.mujeres || r.hombres) {
      const tot = r.mujeres + r.hombres;
      d.tabla('Participación por sexo', ['Sexo', 'Número', '%'], [
        ['Femenino', r.mujeres, pct(ratio(r.mujeres, tot))], ['Masculino', r.hombres, pct(ratio(r.hombres, tot))], ['Total', tot, '100 %'],
      ], { anchos: [3, 2, 2], centrar: [1, 2], total: true });
    }
    const plan = num(c.planificados) || r.inscritos;
    d.tabla('Cobertura y cumplimiento', ['Indicador', 'Resultado'], [
      ['Total de participantes planificados', plan], ['Total de participantes ejecutados', r.inscritos],
      ['% de cobertura', pct(ratio(r.inscritos, plan))], ['Meta planificada', '100 %'], ['Nivel de cumplimiento', pct(Math.min(100, ratio(r.inscritos, plan)))],
    ], { anchos: [4, 2], centrar: [1] });
    d.tabla('Resultados académicos', ['Indicador', 'Resultado'], [
      ['Total inscritos', r.inscritos], ['Certificados de aprobación', r.aprobados], ['Certificados de participación', r.participacion],
      ['Reprobados', r.reprobados], ['Desertores', r.desertores], ['% de aprobación', pct(r.pAprob)],
    ], { anchos: [4, 2], centrar: [1] });
    const sat = [['Satisfacción general', r.satisfaccion], ['Aplicabilidad práctica', r.aplicabilidad], ['Relevancia del contenido', r.relevancia], ['Interacción con facilitador', r.interaccion]].filter((x) => x[1] !== '' && x[1] !== undefined);
    if (sat.length) d.tabla('Percepción de los participantes', ['Indicador', 'Resultado'], sat.map(([k, v]) => [k, pct(num(v), 0)]), { anchos: [4, 2], centrar: [1] });
    const imp = (datos.impacto || []).filter((x) => String(x.capacitacion).toLowerCase() === c.nombre.toLowerCase());
    if (imp.length) d.tabla('Indicadores de impacto', ['Indicador de impacto', 'Resultado'], imp.map((x) => [x.indicador, /^\d+([.,]\d+)?$/.test(String(x.resultado)) ? pct(num(x.resultado), 0) : x.resultado]), { anchos: [4, 2], centrar: [1] });
    d.p(`La capacitación registró ${r.inscritos} participantes, de los cuales ${r.aprobados} obtuvieron certificado de aprobación (${pct(r.pAprob)})${r.reprobados ? `, ${r.reprobados} no aprobaron` : ''}${r.desertores ? ` y ${r.desertores} desertaron` : ''}.`);
  }

  // 6. Resumen ejecutivo (todo calculado)
  d.h(1, 'Resumen ejecutivo');
  d.h(2, 'Síntesis del cumplimiento del plan');
  d.tabla('Indicadores generales del Plan', ['Indicador', 'Resultado'], [
    ['Capacitaciones planificadas', caps.length], ['Capacitaciones ejecutadas', ejecutadas.length], ['Cumplimiento de la programación', pct(cumplimiento)],
    ['Participaciones registradas', T.ins], ['Aprobados', T.apr], ['Reprobados', T.rep], ['Desertores', T.des], ['Tasa global de aprobación', pct(ratio(T.apr, T.ins))],
  ], { anchos: [4, 2], centrar: [1] });
  d.h(2, 'Resultados individuales por capacitación');
  d.tabla('Resultados por capacitación', ['N.º', 'Capacitación', 'Inscritos', 'Aprob.', 'Reprob.', 'Desert.', 'Aprobación'],
    [...ejecutadas.map(({ c, r }, i) => [i + 1, c.nombre, r.inscritos, r.aprobados, r.reprobados, r.desertores, pct(r.pAprob)]), ['', 'TOTAL', T.ins, T.apr, T.rep, T.des, pct(ratio(T.apr, T.ins))]],
    { anchos: [0.5, 4.5, 1, 1, 1, 1, 1.3], centrar: [0, 2, 3, 4, 5, 6], total: true });
  if (T.muj || T.hom) {
    d.h(2, 'Cobertura y participación por sexo');
    const t = T.muj + T.hom;
    d.tabla('Participaciones por sexo', ['Sexo', 'Participaciones', 'Porcentaje'], [['Femenino', T.muj, pct(ratio(T.muj, t))], ['Masculino', T.hom, pct(ratio(T.hom, t))], ['Total', t, '100 %']], { anchos: [3, 2, 2], centrar: [1, 2], total: true });
  }
  d.h(2, 'Análisis comparativo del desempeño académico');
  const rangos = [['100 %', (p) => p === 100], ['50 % a menos de 100 %', (p) => p >= 50 && p < 100], ['Mayor que 0 % y menor que 50 %', (p) => p > 0 && p < 50], ['0 %', (p) => p === 0]];
  const rf = rangos.map(([n, f]) => {
    const g = ejecutadas.filter(({ r }) => f(Math.round(r.pAprob * 100) / 100));
    const s = (k) => g.reduce((a, { r }) => a + r[k], 0);
    return [n, g.length, s('inscritos'), s('aprobados'), s('reprobados'), s('desertores')];
  });
  d.tabla('Distribución de capacitaciones según rango de aprobación', ['Rango de aprobación del curso', 'Capacitaciones', 'Participaciones', 'Aprobados', 'Reprobados', 'Desertores'],
    [...rf, ['Total', ejecutadas.length, T.ins, T.apr, T.rep, T.des]], { anchos: [3, 1.3, 1.3, 1.2, 1.2, 1.2], centrar: [1, 2, 3, 4, 5], total: true });
  const altos = ejecutadas.filter(({ r }) => r.pAprob >= 90).map(({ c }) => c.nombre);
  const bajos = ejecutadas.filter(({ r }) => r.pAprob < 50).map(({ c }) => c.nombre);
  if (altos.length) d.p(`Las capacitaciones con aprobación igual o superior al 90 % fueron: ${altos.join('; ')}.`);
  if (bajos.length) d.p(`Requieren análisis de causas y acciones de mejora las capacitaciones con aprobación inferior al 50 %: ${bajos.join('; ')}.`);
  if (T.rep) d.p(`Conforme al Manual de Procesos (UGPA-PRO-134, actividad 6), corresponde notificar a la Unidad de Talento Humano los ${T.rep} casos de docentes que no aprobaron la capacitación.`);
  d.sec(2, 'Principales fortalezas y aspectos de mejora', 'fortalezas');
  d.sec(2, 'Articulación con la planificación y el aseguramiento de la calidad', 'articulacion');

  // 7-8
  d.h(1, 'Conclusiones');
  d.p(`El Plan de Capacitación Docente del período ${ctx.vars.periodo} alcanzó un cumplimiento del ${pct(cumplimiento)} en la ejecución de las capacitaciones previstas (${ejecutadas.length} de ${caps.length}).`);
  d.p(`Se registraron ${T.ins} participaciones docentes, con ${T.apr} aprobaciones y una tasa global de aprobación del ${pct(ratio(T.apr, T.ins))}${T.des ? `; la deserción alcanzó ${T.des} casos (${pct(ratio(T.des, T.ins))})` : ''}.`);
  d.texto('conclusiones');
  d.sec(1, 'Recomendaciones', 'recomendaciones');
  d.sec(2, 'Prioridades de intervención', 'prioridades');
  void enLetras;
};
