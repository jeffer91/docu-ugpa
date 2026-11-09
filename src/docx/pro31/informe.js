// PRO-31 · RGI3 · Informe de Cumplimiento del Plan de Formación
const { pct, ratio, fechaLarga, enLetras, num } = require('../../core/util');
const { conteo, grupoEstado } = require('../../core/calculos');

module.exports = function informe(d, ctx) {
  const datos = ctx.datos;
  const ef = datos.en_formacion || [];
  const N = ef.length;
  const g = datos.general || {};
  const corte = g.corte ? `, con corte de revisión documental en ${g.corte}` : '';
  const ORD_NIV = ['Doctorado', 'Maestría', 'Especialidad', 'Tercer nivel', 'Tecnólogo'];

  d.h(1, 'Introducción');
  d.texto('intro');
  d.h(2, 'Objetivo general');
  d.p(`Evaluar el cumplimiento del Plan de Formación Docente (${ctx.vars.codigo_RGI2}) del ${ctx.vars.institucion} durante el período ${ctx.vars.periodo}${corte}, mediante el análisis de las acciones planificadas, las evidencias de ejecución y el seguimiento de los docentes vinculados a programas académicos formales.`);
  d.sec(2, 'Objetivos específicos', 'objetivos_especificos');
  d.sec(1, 'Base legal', 'base_legal');
  d.h(1, 'Base de referencia');
  d.texto('base_ref');
  d.sec(2, 'Criterios utilizados para el análisis del cumplimiento', 'criterios');
  d.h(1, 'Alcance del informe');
  d.texto('alcance');
  d.sec(2, 'Alcance académico', 'alcance_acad');
  d.sec(2, 'Alcance institucional', 'alcance_inst');
  d.sec(2, 'Delimitación del informe', 'delimitacion');
  d.sec(2, 'Relación con la acreditación institucional', 'acreditacion');

  // 5. Resultados calculados
  d.h(1, 'Resultados');
  d.sec(2, 'Criterios para la presentación de resultados', 'criterios_res');
  d.h(2, 'Registro general de docentes identificados');
  d.p(`La revisión de las fichas individuales permite consolidar ${enLetras(N)} docentes vinculados a programas de formación académica formal. Este registro constituye la base para las clasificaciones y los cálculos del presente apartado.`);
  d.tabla('Registro general de docentes en formación', ['N.º', 'Docente', 'Carrera o área', 'Formación registrada', 'Estado declarado'],
    ef.map((x, i) => [i + 1, x.docente, x.carrera, x.programa, x.estado]), { anchos: [0.5, 2.6, 2, 4, 1.8], centrar: [0] });
  const obs = ef.filter((x) => x.observacion);
  if (obs.length) d.vinetas(obs.map((x) => `${x.docente}: ${x.observacion}`));

  d.h(2, 'Clasificación de los registros por estado del proceso formativo');
  const est = conteo(ef, (x) => grupoEstado(x.estado));
  d.tabla('Registros por estado del proceso formativo', ['Estado del proceso formativo', 'Número de docentes', 'Porcentaje'],
    [...est.map(([k, n]) => [k, n, pct(ratio(n, N))]), ['Total', N, '100,00 %']], { anchos: [4, 1.6, 1.6], centrar: [1, 2], total: true });

  d.h(2, 'Distribución por nivel de formación');
  const niv = conteo(ef, 'nivel', ORD_NIV);
  d.tabla('Docentes por nivel de formación', ['Nivel de formación', 'Número de docentes', 'Porcentaje'],
    [...niv.map(([k, n]) => [k, n, pct(ratio(n, N))]), ['Total', N, '100,00 %']], { anchos: [4, 1.6, 1.6], centrar: [1, 2], total: true });
  const mayor = [...niv].sort((a, b) => b[1] - a[1])[0];
  if (mayor) d.p(`El nivel de ${mayor[0].toLowerCase()} representa la mayor proporción, con ${mayor[1]} docentes y el ${pct(ratio(mayor[1], N))} de los registros.`);

  d.h(2, 'Distribución por carrera o área académica');
  const car = conteo(ef, 'carrera');
  d.tabla('Docentes en formación por carrera o área', ['Carrera o área académica', 'Número de docentes', 'Porcentaje'],
    [...car.map(([k, n]) => [k, n, pct(ratio(n, N))]), ['Total', N, '100,00 %']], { anchos: [4, 1.6, 1.6], centrar: [1, 2], total: true });
  d.p('Las cantidades no constituyen tasas de participación por carrera, debido a que el análisis no incorpora como denominador el total de docentes de cada área.');

  const dev = ef.filter((x) => grupoEstado(x.estado) === 'En curso o en proceso');
  if (dev.length) {
    d.h(2, 'Resultados de formación en desarrollo');
    d.tabla('Avance declarado de la formación en desarrollo', ['N.º', 'Docente', 'Nivel', 'Avance declarado', 'Estado'],
      dev.map((x, i) => [i + 1, x.docente, x.nivel, x.avance !== '' && x.avance !== undefined ? pct(num(x.avance), 0) : '—', x.estado]), { anchos: [0.5, 3, 1.6, 1.6, 1.6], centrar: [0, 3] });
    const conAv = dev.filter((x) => x.avance !== '' && x.avance !== undefined);
    if (conAv.length) d.p(`El avance promedio declarado de los procesos en desarrollo es de ${pct(conAv.reduce((a, x) => a + num(x.avance), 0) / conAv.length)}. Los porcentajes corresponden a lo declarado en cada registro y describen programas con distinta duración, estructura y modalidad.`);
  }
  const tit = ef.filter((x) => grupoEstado(x.estado) !== 'En curso o en proceso');
  if (tit.length) {
    d.h(2, 'Resultados de procesos de titulación, culminación o novedades');
    d.tabla('Registros en titulación, culminados o con novedad', ['Docente', 'Programa', 'Estado', 'Evidencia'], tit.map((x) => [x.docente, x.programa, x.estado, x.evidencia || '—']), { anchos: [2.6, 4, 1.8, 2.4] });
  }

  // 6. Cumplimiento
  d.h(1, 'Análisis del cumplimiento');
  const acciones = datos.acciones || [];
  if (acciones.length) {
    d.tabla('Cumplimiento de los componentes del Plan', ['Componente', 'Alcance', 'Resultado documental'], acciones.map((a) => [a.componente, a.alcance, a.resultado || 'Sin evidencia registrada']), { anchos: [2, 3.5, 3.5] });
  }
  const conEv = ef.filter((x) => x.evidencia);
  d.tabla('Indicadores de cumplimiento', ['Indicador', 'Resultado'], [
    ['Docentes en formación académica formal', N],
    ['Registros con evidencia documental', `${conEv.length} (${pct(ratio(conEv.length, N))})`],
    ['Procesos en curso o en desarrollo', `${dev.length} (${pct(ratio(dev.length, N))})`],
    ['Procesos en titulación, culminados o con novedad', `${tit.length} (${pct(ratio(tit.length, N))})`],
  ], { anchos: [4, 2], centrar: [1] });

  d.h(1, 'Conclusiones');
  d.p(`El seguimiento institucional permitió identificar ${enLetras(N)} docentes vinculados a programas académicos formales de tercer y cuarto nivel durante el período ${ctx.vars.periodo}${corte}.`);
  d.p(`De los ${N} registros, ${dev.length} corresponden a procesos en curso o en desarrollo (${pct(ratio(dev.length, N))}) y ${tit.length} a procesos de titulación, culminación o con novedad (${pct(ratio(tit.length, N))}).`);
  if (mayor) d.p(`Por nivel de formación predominan los programas de ${mayor[0].toLowerCase()} (${pct(ratio(mayor[1], N))}), y por carrera concentra el mayor número de registros ${car[0] ? car[0][0] : '—'}.`);
  d.sec(1, 'Recomendaciones', 'recomendaciones');
  d.sec(1, 'Bibliografía', 'bibliografia');

  // Anexos: ficha individual por docente
  d.h(1, 'Anexos');
  ef.forEach((x) => {
    d.h(2, x.docente);
    d.ficha('Ficha individual de seguimiento', [
      ['Docente', x.docente], ['Carrera o área', x.carrera], ['Nivel', x.nivel], ['Programa académico', x.programa], ['Universidad', x.universidad],
      ['Modalidad', x.modalidad], ['Fecha de inicio / matrícula', fechaLarga(x.inicio)], ['Fin previsto', fechaLarga(x.fin_previsto)],
      ['Avance declarado', x.avance !== '' && x.avance !== undefined ? pct(num(x.avance), 0) : ''], ['Estado', x.estado], ['Evidencia', x.evidencia], ['Observación', x.observacion],
    ], ['Campo', 'Información']);
  });
};
