// Esquema de datos: define qué información variable pide cada proceso.
// De aquí salen automáticamente los formularios, la matriz Excel (descargar/subir)
// y la lista de verificación de cada documento.
//
// Tipos de campo: text, textarea, number, percent, date, month, select, carrera, capacitacion

const TIPOS_NECESIDAD = ['Disciplinar–estratégica', 'Disciplinar–técnica', 'Pedagógica', 'Tecnológica', 'Normativa', 'Investigativa'];
const NIVELES = ['Muy alta', 'Alta', 'Media', 'Baja'];
const NIVEL_ACAD = ['Tecnólogo', 'Tercer nivel', 'Maestría', 'Especialidad', 'Doctorado'];
const ESTADOS_FORM = ['En curso', 'En proceso', 'Proceso de titulación', 'Finalizado', 'Suspendido', 'Retirado'];

const PROCESOS = {
  'PRO-70': {
    codigo: 'PRO-70',
    nombre: 'Capacitación Docente',
    periodicidad: 'Semestral',
    descripcion: 'Detección de necesidades, Plan semestral e Informe de cumplimiento de la capacitación docente.',
    entidades: [
      {
        id: 'general', nombre: 'Datos generales', tipo: 'form',
        ayuda: 'Datos del levantamiento que se usan en los textos del diagnóstico.',
        campos: [
          { k: 'fecha_levantamiento', l: 'Período del levantamiento (ej.: abril y mayo de 2025)', t: 'text' },
          { k: 'docentes_participantes', l: 'N.º de docentes que participaron', t: 'number' },
          { k: 'instrumentos', l: 'Instrumentos aplicados', t: 'text', def: 'encuestas institucionales, reuniones académicas con docentes y criterio del coordinador de carrera' },
        ],
      },
      {
        id: 'necesidades', nombre: 'Necesidades por carrera', tipo: 'tabla',
        ayuda: 'Cinco necesidades por carrera con su recurrencia. La de mayor % se toma como capacitación prioritaria (salvo que indiques otra en "Detalle por carrera").',
        campos: [
          { k: 'carrera', l: 'Carrera', t: 'carrera', req: true, w: 30 },
          { k: 'necesidad', l: 'Necesidad de capacitación', t: 'text', req: true, w: 45 },
          { k: 'tipo', l: 'Tipo de necesidad', t: 'select', op: TIPOS_NECESIDAD, w: 22 },
          { k: 'recurrencia', l: 'Recurrencia (%)', t: 'percent', req: true, w: 14 },
        ],
      },
      {
        id: 'carreras_dnc', nombre: 'Detalle por carrera', tipo: 'tabla',
        ayuda: 'Opcional. Textos propios de cada carrera; si los dejas vacíos se usa una redacción estándar.',
        campos: [
          { k: 'carrera', l: 'Carrera', t: 'carrera', req: true, w: 30 },
          { k: 'prioritaria', l: 'Capacitación prioritaria (si difiere de la de mayor %)', t: 'text', w: 40 },
          { k: 'cualitativo', l: 'Análisis cualitativo', t: 'textarea', w: 60 },
          { k: 'perfil', l: 'Vinculación con el perfil de egreso', t: 'text', w: 40 },
          { k: 'competencias', l: 'Competencias declaradas', t: 'text', w: 40 },
          { k: 'impacto', l: 'Impacto en la docencia', t: 'text', w: 40 },
          { k: 'pertinencia', l: 'Pertinencia curricular', t: 'select', op: ['Alta', 'Media', 'Baja'], w: 14 },
        ],
      },
      {
        id: 'necesidades_inst', nombre: 'Necesidades institucionales', tipo: 'tabla',
        ayuda: 'Necesidades transversales consolidadas. La de mayor % define la capacitación genérica institucional.',
        campos: [
          { k: 'necesidad', l: 'Necesidad identificada', t: 'text', req: true, w: 45 },
          { k: 'presencia', l: 'Presencia institucional', t: 'select', op: NIVELES, w: 16 },
          { k: 'recurrencia', l: 'Recurrencia (%)', t: 'percent', req: true, w: 14 },
        ],
      },
      {
        id: 'generica', nombre: 'Capacitación genérica', tipo: 'form',
        campos: [
          { k: 'nombre', l: 'Denominación de la capacitación genérica institucional', t: 'text', req: true },
          { k: 'enfoque', l: 'Enfoque / brecha que atiende', t: 'textarea', def: 'el diseño, estructuración y mediación de los contenidos de aprendizaje' },
        ],
      },
      {
        id: 'capacitaciones', nombre: 'Capacitaciones (Plan e Informe)', tipo: 'tabla',
        ayuda: 'Se puede llenar automáticamente desde la DNC con el botón "Generar desde la DNC". Las fechas reales y la entidad se completan al ejecutar.',
        autollenar: 'capacitacionesDesdeDNC',
        campos: [
          { k: 'nombre', l: 'Capacitación', t: 'text', req: true, w: 42 },
          { k: 'tipo', l: 'Tipo', t: 'select', op: ['Genérica', 'Específica'], req: true, w: 12 },
          { k: 'carreras', l: 'Carrera(s) / cobertura', t: 'text', req: true, w: 40 },
          { k: 'inicio_previsto', l: 'Inicio previsto', t: 'month', w: 14 },
          { k: 'fin_previsto', l: 'Fin previsto', t: 'month', w: 14 },
          { k: 'inicio', l: 'Fecha de inicio real', t: 'date', w: 14 },
          { k: 'fin', l: 'Fecha de finalización real', t: 'date', w: 14 },
          { k: 'horas', l: 'Duración (horas)', t: 'number', w: 10 },
          { k: 'modalidad', l: 'Modalidad', t: 'select', op: ['Virtual', 'Presencial', 'Híbrida'], w: 12 },
          { k: 'entidad', l: 'Entidad facilitadora', t: 'text', w: 30 },
          { k: 'planificados', l: 'Participantes planificados', t: 'number', w: 12 },
        ],
      },
      {
        id: 'resultados', nombre: 'Resultados por capacitación', tipo: 'tabla',
        ayuda: 'Una fila por capacitación ejecutada. Con estos números se calculan todas las tablas del Informe.',
        campos: [
          { k: 'capacitacion', l: 'Capacitación', t: 'capacitacion', req: true, w: 42 },
          { k: 'inscritos', l: 'Inscritos', t: 'number', req: true, w: 10 },
          { k: 'aprobados', l: 'Certificados de aprobación', t: 'number', req: true, w: 12 },
          { k: 'participacion', l: 'Certificados de participación', t: 'number', w: 12 },
          { k: 'reprobados', l: 'Reprobados', t: 'number', w: 10 },
          { k: 'desertores', l: 'Desertores', t: 'number', w: 10 },
          { k: 'mujeres', l: 'Mujeres', t: 'number', w: 9 },
          { k: 'hombres', l: 'Hombres', t: 'number', w: 9 },
          { k: 'satisfaccion', l: 'Satisfacción general (%)', t: 'percent', w: 12 },
          { k: 'aplicabilidad', l: 'Aplicabilidad práctica (%)', t: 'percent', w: 12 },
          { k: 'relevancia', l: 'Relevancia del contenido (%)', t: 'percent', w: 12 },
          { k: 'interaccion', l: 'Interacción con facilitador (%)', t: 'percent', w: 12 },
        ],
      },
      {
        id: 'participacion_carrera', nombre: 'Participantes por carrera', tipo: 'tabla',
        ayuda: 'Opcional, para capacitaciones dirigidas a varias carreras.',
        campos: [
          { k: 'capacitacion', l: 'Capacitación', t: 'capacitacion', req: true, w: 42 },
          { k: 'carrera', l: 'Carrera', t: 'carrera', req: true, w: 30 },
          { k: 'participantes', l: 'N.º participantes', t: 'number', req: true, w: 12 },
        ],
      },
      {
        id: 'impacto', nombre: 'Indicadores de impacto', tipo: 'tabla',
        ayuda: 'Opcional. Indicadores de impacto reportados por capacitación (ej.: Aplicación del conocimiento 100 %).',
        campos: [
          { k: 'capacitacion', l: 'Capacitación', t: 'capacitacion', req: true, w: 42 },
          { k: 'indicador', l: 'Indicador de impacto', t: 'text', req: true, w: 40 },
          { k: 'resultado', l: 'Resultado', t: 'text', req: true, w: 12 },
        ],
      },
    ],
    documentos: [
      { clave: 'RGI1', nombre: 'Detección de Necesidades de Capacitación', titulo: 'Detección de Necesidades de Capacitación Docente', gen: 'pro70/dnc', textos: 'pro70-dnc', requiere: ['necesidades', 'necesidades_inst', 'generica'] },
      { clave: 'RGI2', nombre: 'Plan Semestral de Capacitación Docente', titulo: 'Plan de Capacitación Docente', gen: 'pro70/plan', textos: 'pro70-plan', requiere: ['capacitaciones'] },
      { clave: 'RGI3', nombre: 'Informe de Cumplimiento del Plan Semestral de Capacitación', titulo: 'Informe de Cumplimiento del Plan de Capacitación Docente', gen: 'pro70/informe', textos: 'pro70-informe', requiere: ['capacitaciones', 'resultados'] },
    ],
  },

  'PRO-31': {
    codigo: 'PRO-31',
    nombre: 'Formación Docente',
    periodicidad: 'Anual',
    descripcion: 'Detección de necesidades de formación (tercer y cuarto nivel), Plan anual e Informe de cumplimiento.',
    entidades: [
      {
        id: 'general', nombre: 'Datos generales', tipo: 'form',
        campos: [
          { k: 'fecha_levantamiento', l: 'Período del levantamiento', t: 'text' },
          { k: 'corte', l: 'Fecha de corte del seguimiento (Informe)', t: 'text', def: '' },
        ],
      },
      {
        id: 'claustro', nombre: 'Caracterización del claustro', tipo: 'tabla',
        ayuda: 'Una fila por docente (matriz del levantamiento). Con esto se calculan las tablas de distribución y brechas.',
        campos: [
          { k: 'docente', l: 'Docente', t: 'text', req: true, w: 34 },
          { k: 'carrera', l: 'Carrera', t: 'carrera', req: true, w: 30 },
          { k: 'nivel', l: 'Nivel académico actual', t: 'select', op: NIVEL_ACAD, w: 16 },
          { k: 'titulo', l: 'Título más alto', t: 'text', w: 36 },
          { k: 'necesidad', l: 'Necesidad de formación identificada', t: 'text', w: 36 },
          { k: 'tipo', l: 'Tipo de formación', t: 'select', op: ['Específica', 'Compartida', 'Genérica'], w: 14 },
          { k: 'nivel_requerido', l: 'Nivel requerido', t: 'select', op: NIVEL_ACAD, w: 16 },
        ],
      },
      {
        id: 'lineas', nombre: 'Líneas de formación por carrera', tipo: 'tabla',
        campos: [
          { k: 'carrera', l: 'Carrera / coordinación', t: 'carrera', req: true, w: 30 },
          { k: 'linea', l: 'Línea de formación específica', t: 'text', req: true, w: 40 },
          { k: 'nivel', l: 'Nivel', t: 'select', op: NIVEL_ACAD, w: 14 },
          { k: 'programas', l: 'Programas de referencia', t: 'text', w: 40 },
        ],
      },
      {
        id: 'universidades', nombre: 'Cobertura por universidad', tipo: 'tabla',
        campos: [
          { k: 'institucion', l: 'Institución', t: 'text', req: true, w: 26 },
          { k: 'especifica', l: 'Formación específica', t: 'text', w: 34 },
          { k: 'generica', l: 'Formación genérica', t: 'text', w: 34 },
          { k: 'niveles', l: 'Niveles', t: 'text', w: 24 },
          { k: 'beneficio', l: 'Convenio / beneficio', t: 'text', w: 30 },
        ],
      },
      {
        id: 'acciones', nombre: 'Acciones del Plan (matriz maestra)', tipo: 'tabla',
        campos: [
          { k: 'componente', l: 'Componente', t: 'text', req: true, w: 24 },
          { k: 'alcance', l: 'Alcance', t: 'text', w: 40 },
          { k: 'fecha', l: 'Fecha / momento', t: 'text', w: 18 },
          { k: 'resultado', l: 'Resultado / evidencia', t: 'text', w: 40 },
        ],
      },
      {
        id: 'en_formacion', nombre: 'Docentes en formación', tipo: 'tabla',
        ayuda: 'Docentes cursando tercer o cuarto nivel. Alimenta el Plan (registro), el Informe y, más adelante, PRO-248 y PRO-251.',
        campos: [
          { k: 'docente', l: 'Docente', t: 'text', req: true, w: 34 },
          { k: 'carrera', l: 'Carrera', t: 'carrera', req: true, w: 26 },
          { k: 'nivel', l: 'Nivel', t: 'select', op: NIVEL_ACAD, req: true, w: 14 },
          { k: 'programa', l: 'Programa académico', t: 'text', req: true, w: 44 },
          { k: 'universidad', l: 'Universidad', t: 'text', w: 24 },
          { k: 'modalidad', l: 'Modalidad', t: 'select', op: ['En línea', 'Presencial', 'Híbrida', 'Semipresencial'], w: 14 },
          { k: 'inicio', l: 'Fecha de inicio/matrícula', t: 'date', w: 14 },
          { k: 'fin_previsto', l: 'Fin previsto', t: 'date', w: 14 },
          { k: 'avance', l: 'Avance declarado (%)', t: 'percent', w: 12 },
          { k: 'estado', l: 'Estado', t: 'select', op: ESTADOS_FORM, req: true, w: 18 },
          { k: 'evidencia', l: 'Evidencia', t: 'text', w: 30 },
          { k: 'observacion', l: 'Observación', t: 'text', w: 36 },
        ],
      },
    ],
    documentos: [
      { clave: 'RGI1', nombre: 'Detección de Necesidades de Formación', titulo: 'Detección de Necesidades de Formación Docente', gen: 'pro31/dnf', textos: 'pro31-dnf', requiere: ['claustro'] },
      { clave: 'RGI2', nombre: 'Plan Anual de Formación Docente', titulo: 'Plan de Formación Docente', gen: 'pro31/plan', textos: 'pro31-plan', requiere: ['lineas'] },
      { clave: 'RGI3', nombre: 'Informe de Cumplimiento del Plan de Formación', titulo: 'Informe de Cumplimiento al Plan de Formación Docente', gen: 'pro31/informe', textos: 'pro31-informe', requiere: ['en_formacion'] },
    ],
  },
};

// Procesos aún no implementados (se muestran como "próximamente")
const PENDIENTES = [
  ['PRO-60', 'Construcción Curricular Continua'],
  ['PRO-134', 'Ejecución de Capacitación Docente'],
  ['PRO-135', 'Medición de Impacto de la Capacitación'],
  ['PRO-251', 'Planificación Individual de Formación y Capacitación'],
  ['PRO-248', 'Seguimiento al Proceso de Formación'],
  ['PRO-321', 'Matriz de Ejecución Curricular'],
];

const ESTADOS_DOC = ['Borrador', 'En revisión', 'Observado', 'Aprobado', 'Archivado'];

const CARRERAS_BASE = [
  'Administración', 'Contabilidad', 'Desarrollo de Software', 'Diseño Multimedia', 'Educación Básica', 'Educación Inicial',
  'Enfermería', 'Estética Integral', 'Gestión del Talento Humano', 'Marketing Digital y Comercio Electrónico',
  'Mecánica Automotriz', 'Pedagogía', 'Procesamiento de Alimentos', 'Redes y Telecomunicaciones',
  'Seguridad Ciudadana y Orden Público', 'Seguridad y Prevención de Riesgos Laborales', 'Ventas',
];

function entidad(proceso, id) {
  return PROCESOS[proceso].entidades.find((e) => e.id === id);
}

module.exports = { PROCESOS, PENDIENTES, ESTADOS_DOC, CARRERAS_BASE, entidad };
