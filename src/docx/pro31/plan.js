// PRO-31 · RGI2 · Plan Anual de Formación Docente
const { pct, ratio, fechaCorta } = require('../../core/util');
const { conteo } = require('../../core/calculos');

module.exports = function plan(d, ctx) {
  const datos = ctx.datos;
  const ef = datos.en_formacion || [];
  const cl = datos.claustro || [];

  d.sec(1, 'Introducción', 'intro');
  d.h(1, 'Antecedentes y articulación con la detección');
  d.texto('antecedentes');
  d.p(`El presente Plan se elabora a partir de la Detección de Necesidades de Formación Docente (${ctx.vars.codigo_RGI1}) del período ${ctx.vars.periodo}${cl.length ? `, que analizó ${cl.length} registros docentes de ${conteo(cl, 'carrera').length} carreras` : ''}.`);
  d.sec(2, 'Relación entre la detección y el plan', 'relacion');
  d.sec(2, 'Información que se traslada al plan', 'traslado');
  d.sec(2, 'Trazabilidad y límites de uso de la información', 'trazabilidad');
  d.h(1, 'Sustento normativo e institucional');
  d.texto('sustento');
  d.sec(2, 'Reglamento de Formación y Capacitación', 'reglamento');
  d.sec(2, 'PEDI, POA y aseguramiento de la calidad', 'pedi');
  d.sec(2, 'Manual de Procesos de la UGPA', 'manual');
  d.h(1, 'Objetivos del plan');
  d.sec(2, 'Objetivo general', 'objetivo_general');
  d.sec(2, 'Objetivos específicos', 'objetivos_especificos');
  d.h(1, 'Alcance y criterios de incorporación');
  d.sec(2, 'Alcance', 'alcance');
  d.sec(2, 'Criterios de incorporación', 'criterios');
  d.sec(2, 'Exclusiones del plan', 'exclusiones');
  d.h(1, 'Modelo de planificación y fases');
  d.sec(2, 'Ruta de planificación', 'ruta');
  d.sec(2, 'Estados de una acción de formación', 'estados');

  d.h(1, 'Líneas y prioridades de formación');
  d.texto('lineas');
  d.h(2, 'Orientaciones específicas por carrera');
  d.tabla('Líneas de formación específica priorizadas', ['Carrera / coordinación', 'Línea de formación', 'Nivel', 'Programas de referencia'],
    (datos.lineas || []).map((l) => [l.carrera, l.linea, l.nivel || '—', l.programas || '—']), { anchos: [2.6, 3.2, 1.4, 3.2] });
  d.sec(2, 'Activación de una línea dentro del Plan', 'activacion');

  d.h(1, 'Selección de programas y cobertura');
  d.sec(2, 'Criterios de selección', 'criterios_sel');
  d.h(2, 'Cobertura institucional disponible');
  d.tabla('Cobertura de la oferta académica por institución', ['Institución', 'Formación específica', 'Formación genérica', 'Niveles', 'Convenio / beneficio'],
    (datos.universidades || []).map((u) => [u.institucion, u.especifica, u.generica, u.niveles, u.beneficio || '—']), { anchos: [2, 3, 3, 2.2, 2.2] });
  d.sec(2, 'Convenios y alternativas externas', 'convenios');

  d.h(1, 'Planificación operativa de acciones');
  d.texto('operativa');
  d.h(2, 'Matriz maestra del plan');
  d.tabla('Componentes de ejecución y seguimiento del Plan', ['Componente', 'Alcance', 'Fecha / momento', 'Resultado documental'],
    (datos.acciones || []).map((a) => [a.componente, a.alcance, a.fecha || '—', a.resultado || '—']), { anchos: [2, 3.4, 1.6, 3.4] });
  if (ef.length) {
    const niv = conteo(ef, 'nivel');
    d.p(`El registro institucional identifica ${ef.length} docentes vinculados a procesos de formación académica formal (${niv.map(([k, n]) => `${n} en ${k.toLowerCase()}`).join(', ')}).`);
    d.tabla('Registro consolidado de docentes en formación académica formal', ['N.º', 'Docente', 'Carrera', 'Programa académico', 'Estado'],
      [...ef.map((x, i) => [i + 1, x.docente, x.carrera, x.programa, x.estado]), ['', `${ef.length} docentes`, '', niv.map(([k, n]) => `${n} ${k.toLowerCase()}`).join(', '), '']],
      { anchos: [0.5, 2.6, 2, 4, 1.6], centrar: [0], total: true });
  }
  d.sec(2, 'Apoyo institucional y viabilidad', 'apoyo');
  d.sec(1, 'Cronograma de implementación', 'cronograma');
  d.sec(1, 'Roles y responsabilidades', 'roles');
  d.h(1, 'Seguimiento académico');
  d.texto('seguimiento');
  d.sec(2, 'Evidencias de seguimiento', 'evidencias');
  if (ef.length) {
    d.h(2, 'Matriz de seguimiento');
    d.tabla('Matriz consolidada de seguimiento académico del personal docente', ['N.º', 'Docente', 'Nivel', 'Universidad', 'Inicio', 'Avance', 'Estado'],
      ef.map((x, i) => [i + 1, x.docente, x.nivel, x.universidad || '—', fechaCorta(x.inicio) || '—', x.avance !== '' && x.avance !== undefined ? pct(+x.avance, 0) : '—', x.estado]),
      { anchos: [0.5, 2.6, 1.4, 2, 1.3, 1, 1.8], centrar: [0, 4, 5] });
  }
  d.sec(1, 'Indicadores y evaluación del plan', 'indicadores');
  d.sec(1, 'Gestión de novedades y cambios', 'novedades');
  d.sec(1, 'Resultados esperados', 'resultados_esp');
  d.sec(1, 'Consideraciones finales', 'consideraciones');
  d.sec(1, 'Referencias', 'referencias');
  d.sec(1, 'Anexos operativos', 'anexos');
  void ratio;
};
