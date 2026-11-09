/* Interfaz de Docu UGPA (sin frameworks). */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const mesAnio = (s) => { const m = /^(\d{4})-(\d{1,2})/.exec(s || ''); return m ? `${MESES[+m[2] - 1]} ${m[1]}` : ''; };
const periodo = (e) => `${mesAnio(e.inicio)} – ${mesAnio(e.fin)}`.replace(/^\w/, (c) => c.toUpperCase());
const hoy = () => new Date().toISOString().slice(0, 10);

const S = { db: null, schema: null, info: null, vista: 'inicio', proceso: null, expId: null, pestana: 'datos', entidad: null, textoDoc: null, ultimos: {} };

// ---------------- utilidades de interfaz ----------------
let tAviso;
function aviso(msg, error = false) {
  const a = $('#aviso');
  a.textContent = msg;
  a.className = error ? 'error' : '';
  a.hidden = false;
  clearTimeout(tAviso);
  tAviso = setTimeout(() => { a.hidden = true; }, error ? 7000 : 3500);
}
async function intentar(fn) {
  try { return await fn(); } catch (e) { aviso(e.message, true); return undefined; }
}
function modal(html, alMontar) {
  $('#modal-caja').innerHTML = html;
  $('#modal').hidden = false;
  if (alMontar) alMontar($('#modal-caja'));
}
const cerrarModal = () => { $('#modal').hidden = true; };
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') cerrarModal(); });
function confirmar(texto) {
  return new Promise((ok) => {
    modal(`<p>${texto}</p><div class="fila"><span class="espacio"></span><button class="btn" id="no">Cancelar</button><button class="btn prim" id="si">Aceptar</button></div>`, (c) => {
      $('#no', c).onclick = () => { cerrarModal(); ok(false); };
      $('#si', c).onclick = () => { cerrarModal(); ok(true); };
    });
  });
}

let tGuardar;
function guardar(inmediato = false) {
  clearTimeout(tGuardar);
  const f = () => intentar(() => window.api.llamar('db:guardar', S.db));
  if (inmediato) return f();
  tGuardar = setTimeout(f, 500);
  return undefined;
}

const expActual = () => S.db.expedientes.find((e) => e.id === S.expId);
const procActual = () => S.schema.PROCESOS[S.proceso];

// ---------------- menú ----------------
function pintarMenu() {
  const P = S.schema.PROCESOS;
  const b = (vista, texto, extra = '', proc = '') => `<button data-vista="${vista}" data-proc="${proc}" class="${S.vista === vista && (proc === '' || S.proceso === proc) ? 'activo' : ''}">${texto}${extra}</button>`;
  let h = b('inicio', 'Tablero');
  h += '<div class="grupo">Procesos</div>';
  for (const k of Object.keys(P)) h += b('proceso', `${k} · ${P[k].nombre}`, '', k);
  for (const [k, n] of S.schema.PENDIENTES) h += `<button disabled>${k} · ${n}<small>pronto</small></button>`;
  h += '<div class="grupo">Ajustes</div>';
  h += b('textos', 'Textos base');
  h += b('config', 'Configuración');
  $('#nav').innerHTML = h;
  $$('#nav button[data-vista]').forEach((x) => {
    x.onclick = () => {
      S.vista = x.dataset.vista;
      if (x.dataset.proc) {
        S.proceso = x.dataset.proc;
        const exps = S.db.expedientes.filter((e) => e.proceso === S.proceso).sort((a, c) => c.inicio.localeCompare(a.inicio));
        if (!exps.find((e) => e.id === S.expId)) S.expId = exps[0] ? exps[0].id : null;
        S.entidad = null;
      }
      render();
    };
  });
  $('#pie-menu').textContent = S.info ? `Datos: ${S.info.archivo}` : '';
}

function render() {
  pintarMenu();
  const v = { inicio: vInicio, proceso: vProceso, textos: vTextos, config: vConfig }[S.vista];
  v($('#vista'));
}

// ---------------- tablero ----------------
function vInicio(el) {
  const P = S.schema.PROCESOS;
  const exps = [...S.db.expedientes].sort((a, b) => b.inicio.localeCompare(a.inicio));
  let h = `<h1>Tablero</h1><p class="sub">Estado de tus documentos por proceso y período.</p>`;
  if (!exps.length) {
    h += `<div class="tarjeta"><h2>Empieza aquí</h2><p>Aún no hay períodos registrados. Puedes crear uno desde un proceso del menú o cargar los datos de ejemplo del período 2025 (tomados de tus documentos reales) para ver cómo funciona.</p>
      <div class="fila"><button class="btn prim" id="ej">Cargar datos de ejemplo 2025</button></div></div>`;
  }
  h += '<div class="rejilla">';
  for (const e of exps) {
    const p = P[e.proceso];
    if (!p) continue;
    h += `<div class="tarjeta"><div class="fila"><h3>${e.proceso} · ${esc(p.nombre)}</h3></div><div class="muted">${periodo(e)}</div><ul class="lista-pend" style="margin-top:8px">`;
    for (const d of p.documentos) {
      const st = (e.docs && e.docs[d.clave] && e.docs[d.clave].estado) || 'Borrador';
      h += `<li><span>${esc(d.nombre)}</span><span class="espacio"></span><span class="chip ${st === 'En revisión' ? 'revision' : st}">${st}</span></li>`;
    }
    h += `</ul><div class="fila" style="margin-top:10px"><button class="btn mini" data-ir="${e.id}" data-proc="${e.proceso}">Abrir</button></div></div>`;
  }
  h += '</div>';
  el.innerHTML = h;
  if ($('#ej', el)) $('#ej', el).onclick = cargarEjemplo;
  $$('[data-ir]', el).forEach((b) => { b.onclick = () => { S.vista = 'proceso'; S.proceso = b.dataset.proc; S.expId = b.dataset.ir; S.pestana = 'documentos'; render(); }; });
}

async function cargarEjemplo() {
  const ej = await intentar(() => window.api.llamar('ejemplo:cargar'));
  if (!ej) return;
  for (const e of ej) {
    const i = S.db.expedientes.findIndex((x) => x.id === e.id);
    if (i >= 0) S.db.expedientes[i] = e; else S.db.expedientes.push(e);
  }
  await guardar(true);
  aviso('Datos de ejemplo cargados.');
  render();
}

// ---------------- proceso ----------------
function vProceso(el) {
  const p = procActual();
  const exps = S.db.expedientes.filter((e) => e.proceso === S.proceso).sort((a, b) => b.inicio.localeCompare(a.inicio));
  let h = `<div class="fila"><div><h1>${p.codigo} · ${esc(p.nombre)}</h1><p class="sub" style="margin:0">${esc(p.descripcion)}</p></div><span class="espacio"></span>`;
  if (exps.length) {
    h += `<label class="muted">Período&nbsp;<select id="selexp" style="width:auto">${exps.map((e) => `<option value="${e.id}" ${e.id === S.expId ? 'selected' : ''}>${periodo(e)}</option>`).join('')}</select></label>`;
  }
  h += `<button class="btn" id="nuevo">+ Nuevo período</button></div>`;
  if (!exps.length || !expActual()) {
    h += `<div class="tarjeta" style="margin-top:18px"><h2>Sin períodos</h2><p>Crea el primer período de ${esc(p.nombre)} para empezar a cargar datos.</p></div>`;
    el.innerHTML = h;
    $('#nuevo', el).onclick = nuevoPeriodo;
    return;
  }
  const tabs = [['datos', 'Datos'], ['documentos', 'Documentos'], ['matriz', 'Matriz Excel']];
  h += `<div class="pestanas">${tabs.map(([k, t]) => `<button data-tab="${k}" class="${S.pestana === k ? 'activo' : ''}">${t}</button>`).join('')}</div><div id="cuerpo"></div>`;
  el.innerHTML = h;
  $('#nuevo', el).onclick = nuevoPeriodo;
  $('#selexp', el).onchange = (e) => { S.expId = e.target.value; render(); };
  $$('[data-tab]', el).forEach((b) => { b.onclick = () => { S.pestana = b.dataset.tab; render(); }; });
  ({ datos: pDatos, documentos: pDocumentos, matriz: pMatriz })[S.pestana]($('#cuerpo', el));
}

function nuevoPeriodo() {
  const p = procActual();
  const d = new Date();
  const anio = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  const fin = p.periodicidad === 'Anual' ? `${anio + 1}-09` : `${anio + 1}-03`;
  modal(`<h2>Nuevo período · ${p.codigo}</h2>
    <div class="dos"><label class="campo"><span>Inicio (mes)</span><input type="month" id="ini" value="${anio}-10"></label>
    <label class="campo"><span>Fin (mes)</span><input type="month" id="fin" value="${fin}"></label></div>
    <label class="campo"><span>Copiar datos de otro período (opcional)</span><select id="copia"><option value="">— No copiar —</option>
    ${S.db.expedientes.filter((e) => e.proceso === S.proceso).map((e) => `<option value="${e.id}">${periodo(e)}</option>`).join('')}</select></label>
    <p class="muted">Copiar sirve para reutilizar catálogos (universidades, líneas, docentes en formación) y solo actualizar lo que cambió.</p>
    <div class="fila"><span class="espacio"></span><button class="btn" id="c">Cancelar</button><button class="btn prim" id="ok">Crear</button></div>`, (c) => {
    $('#c', c).onclick = cerrarModal;
    $('#ok', c).onclick = () => {
      const inicio = $('#ini', c).value; const fn = $('#fin', c).value;
      if (!inicio || !fn || fn < inicio) { aviso('Revisa las fechas del período.', true); return; }
      const id = `${S.proceso.toLowerCase()}-${inicio}-${Date.now().toString(36)}`;
      const base = S.db.expedientes.find((e) => e.id === $('#copia', c).value);
      S.db.expedientes.push({ id, proceso: S.proceso, inicio, fin: fn, datos: base ? JSON.parse(JSON.stringify(base.datos)) : {}, docs: {} });
      S.expId = id; S.pestana = 'datos';
      guardar(true); cerrarModal(); render();
    };
  });
}

// ---------- pestaña Datos ----------
function cuenta(ent, v) {
  if (ent.tipo === 'form') return v ? ent.campos.filter((c) => v[c.k] !== undefined && v[c.k] !== '').length + '/' + ent.campos.length : '0/' + ent.campos.length;
  return (v || []).length;
}

function pDatos(el) {
  const p = procActual(); const e = expActual();
  e.datos = e.datos || {};
  if (!S.entidad || !p.entidades.find((x) => x.id === S.entidad)) S.entidad = p.entidades[0].id;
  let h = `<div class="datos"><div class="entidades">`;
  for (const ent of p.entidades) h += `<button data-ent="${ent.id}" class="${S.entidad === ent.id ? 'activo' : ''}"><span>${esc(ent.nombre)}</span><span class="chip">${cuenta(ent, e.datos[ent.id])}</span></button>`;
  h += `<p class="muted" style="margin-top:10px">Los cambios se guardan solos. Para cargar muchos datos usa la pestaña <b>Matriz Excel</b> o pega celdas copiadas de Excel en la tabla.</p></div><div id="editor"></div></div>`;
  el.innerHTML = h;
  $$('[data-ent]', el).forEach((b) => { b.onclick = () => { S.entidad = b.dataset.ent; render(); }; });
  editorEntidad($('#editor', el), p.entidades.find((x) => x.id === S.entidad), e);
}

function opciones(c, e) {
  if (c.t === 'select') return c.op;
  if (c.t === 'carrera') return S.db.config.carreras;
  if (c.t === 'capacitacion') return (e.datos.capacitaciones || []).map((x) => x.nombre).filter(Boolean);
  return null;
}

function control(c, v, e, attrs) {
  const ops = opciones(c, e);
  if (ops) {
    const lista = ops.includes(v) || v === '' || v === undefined ? ops : [v, ...ops];
    return `<select ${attrs}><option value=""></option>${lista.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  }
  if (c.t === 'textarea') return `<textarea ${attrs}>${esc(v)}</textarea>`;
  const tipo = { number: 'number', percent: 'number', date: 'date', month: 'month' }[c.t] || 'text';
  return `<input type="${tipo}" ${c.t === 'percent' ? 'min="0" max="100" step="0.01"' : ''} value="${esc(v)}" ${attrs}>`;
}

function valorDe(c, raw) {
  if (c.t === 'number' || c.t === 'percent') return raw === '' ? '' : Number(raw);
  return raw;
}

function editorEntidad(el, ent, e) {
  let h = `<div class="tarjeta"><div class="fila"><h2 style="margin:0">${esc(ent.nombre)}</h2><span class="espacio"></span>`;
  if (ent.autollenar) h += `<button class="btn" id="auto">Generar desde la DNC</button>`;
  if (ent.tipo === 'tabla') h += `<button class="btn" id="add">+ Fila</button><button class="btn peligro" id="vaciar">Vaciar</button>`;
  h += `</div>${ent.ayuda ? `<p class="muted">${esc(ent.ayuda)}</p>` : ''}`;
  if (ent.tipo === 'form') {
    const v = e.datos[ent.id] = e.datos[ent.id] || {};
    for (const c of ent.campos) {
      if (v[c.k] === undefined && c.def) v[c.k] = c.def;
      h += `<label class="campo"><span>${esc(c.l)}${c.req ? ' *' : ''}</span>${control(c, v[c.k] ?? '', e, `data-k="${c.k}"`)}</label>`;
    }
    h += '</div>';
    el.innerHTML = h;
    $$('[data-k]', el).forEach((inp) => {
      inp.oninput = () => { v[inp.dataset.k] = valorDe(ent.campos.find((c) => c.k === inp.dataset.k), inp.value); guardar(); };
    });
    return;
  }
  const filas = e.datos[ent.id] = e.datos[ent.id] || [];
  h += `<div class="tabla-wrap"><table class="editable"><thead><tr><th>#</th>${ent.campos.map((c) => `<th style="min-width:${Math.max(90, (c.w || 18) * 7)}px">${esc(c.l)}${c.req ? ' *' : ''}</th>`).join('')}<th></th></tr></thead><tbody>`;
  filas.forEach((f, i) => {
    h += `<tr><td class="n">${i + 1}</td>${ent.campos.map((c, j) => `<td>${control(c, f[c.k] ?? '', e, `data-r="${i}" data-c="${j}"`)}</td>`).join('')}<td><button class="btn mini peligro" data-del="${i}" title="Eliminar fila">✕</button></td></tr>`;
  });
  h += `</tbody></table></div>${filas.length ? '' : '<p class="muted">Sin filas. Usa “+ Fila”, pega desde Excel o sube la matriz.</p>'}</div>`;
  el.innerHTML = h;
  $$('[data-r]', el).forEach((inp) => {
    inp.oninput = () => { const c = ent.campos[+inp.dataset.c]; filas[+inp.dataset.r][c.k] = valorDe(c, inp.value); guardar(); };
    inp.onpaste = (ev) => {
      const t = ev.clipboardData.getData('text');
      if (!t.includes('\t') && !t.includes('\n')) return;
      ev.preventDefault();
      const r0 = +inp.dataset.r, c0 = +inp.dataset.c;
      t.replace(/\r/g, '').replace(/\n$/, '').split('\n').forEach((linea, i) => {
        if (!filas[r0 + i]) filas[r0 + i] = {};
        linea.split('\t').forEach((val, j) => { const c = ent.campos[c0 + j]; if (c) filas[r0 + i][c.k] = valorDe(c, val.trim()); });
      });
      guardar(); render();
    };
  });
  $$('[data-del]', el).forEach((b) => { b.onclick = () => { filas.splice(+b.dataset.del, 1); guardar(); render(); }; });
  $('#add', el).onclick = () => { filas.push({}); guardar(); render(); setTimeout(() => { const x = $$('.tabla-wrap', document)[0]; if (x) x.scrollTop = x.scrollHeight; }, 0); };
  $('#vaciar', el).onclick = async () => { if (await confirmar(`¿Vaciar todas las filas de “${esc(ent.nombre)}”?`)) { e.datos[ent.id] = []; guardar(); render(); } };
  if ($('#auto', el)) {
    $('#auto', el).onclick = async () => {
      const lista = await intentar(() => window.api.llamar('calc:capacitacionesDesdeDNC', e.datos));
      if (!lista) return;
      if (!lista.length) { aviso('Primero registra las necesidades de la DNC.', true); return; }
      if (filas.length && !(await confirmar(`Se reemplazará la lista por ${lista.length} capacitaciones derivadas de la DNC (se conservan fechas y datos de las que coincidan por nombre). ¿Continuar?`))) return;
      e.datos[ent.id] = lista; guardar(); render(); aviso(`${lista.length} capacitaciones generadas desde la DNC.`);
    };
  }
}

// ---------- pestaña Documentos ----------
async function pDocumentos(el) {
  const p = procActual(); const e = expActual();
  e.docs = e.docs || {};
  el.innerHTML = '<div class="rejilla" id="docs"></div><p class="muted">Los documentos se guardan en: <a href="#" id="carpeta"></a></p>';
  $('#carpeta', el).textContent = S.info.salida;
  $('#carpeta', el).onclick = (ev) => { ev.preventDefault(); window.api.llamar('sistema:abrirSalida'); };
  const cont = $('#docs', el);
  for (const d of p.documentos) {
    const info = e.docs[d.clave] = e.docs[d.clave] || { nn: '01', fecha: hoy(), estado: 'Borrador', historial: [] };
    const comp = await intentar(() => window.api.llamar('doc:completitud', e.id, d.clave)) || { ok: true, faltan: [] };
    const [a, m] = (info.fecha || hoy()).split('-');
    const codigo = `UGPA-${d.clave}-${String(info.nn || '01').padStart(2, '0')}-${e.proceso}-${a}-${m}`;
    const div = document.createElement('div');
    div.className = 'tarjeta doc';
    div.innerHTML = `<div class="fila"><h3 style="margin:0">${esc(d.nombre)}</h3></div>
      <div class="codigo">${codigo}</div>
      <div class="fila" style="margin-top:10px">
        <label class="campo" style="width:70px;margin:0"><span>N.º</span><input data-f="nn" value="${esc(info.nn || '01')}"></label>
        <label class="campo" style="width:150px;margin:0"><span>Fecha de elaboración</span><input type="date" data-f="fecha" value="${esc(info.fecha || hoy())}"></label>
        <label class="campo" style="flex:1 1 100%;margin:0"><span>Estado</span><select data-f="estado">${S.schema.ESTADOS_DOC.map((s) => `<option ${s === info.estado ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      </div>
      <p style="margin:10px 0 0">${comp.ok ? '<span class="chip ok">Datos completos</span>' : `<span class="chip falta">Faltan: ${esc(comp.faltan.join(', '))}</span>`}</p>
      ${(info.historial || []).length ? `<ul class="historial">${info.historial.slice(-4).map((x) => `<li>${esc(x.fecha)} · ${esc(x.estado)}${x.nota ? ' — ' + esc(x.nota) : ''}</li>`).join('')}</ul>` : ''}
      <div class="acciones"><button class="btn prim" data-gen>Generar Word</button><button class="btn" data-obs>Registrar observación</button>
      ${S.ultimos[e.id + d.clave] ? '<button class="btn" data-abrir>Abrir</button><button class="btn" data-mostrar>Mostrar en carpeta</button>' : ''}</div>`;
    cont.appendChild(div);
    $$('[data-f]', div).forEach((inp) => {
      inp.onchange = () => {
        const k = inp.dataset.f; const prev = info[k];
        info[k] = inp.value;
        if (k === 'estado' && prev !== inp.value) (info.historial = info.historial || []).push({ fecha: hoy(), estado: inp.value });
        guardar(); render();
      };
    });
    $('[data-gen]', div).onclick = async (ev) => {
      ev.target.disabled = true; ev.target.textContent = 'Generando…';
      await guardar(true);
      const r = await intentar(() => window.api.llamar('doc:generar', e.id, d.clave));
      ev.target.disabled = false; ev.target.textContent = 'Generar Word';
      if (r) { S.ultimos[e.id + d.clave] = r.ruta; aviso(`Documento generado: ${r.codigo}`); render(); }
    };
    $('[data-obs]', div).onclick = () => {
      modal(`<h2>Observación · ${esc(d.nombre)}</h2><label class="campo"><span>Nuevo estado</span><select id="st">${S.schema.ESTADOS_DOC.map((s) => `<option ${s === 'Observado' ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <label class="campo"><span>Observación (ej.: lo que pidió corregir el Vicerrector)</span><textarea id="nt"></textarea></label>
        <div class="fila"><span class="espacio"></span><button class="btn" id="c">Cancelar</button><button class="btn prim" id="ok">Guardar</button></div>`, (c) => {
        $('#c', c).onclick = cerrarModal;
        $('#ok', c).onclick = () => { info.estado = $('#st', c).value; (info.historial = info.historial || []).push({ fecha: hoy(), estado: info.estado, nota: $('#nt', c).value }); guardar(); cerrarModal(); render(); };
      });
    };
    if ($('[data-abrir]', div)) {
      $('[data-abrir]', div).onclick = () => window.api.llamar('sistema:abrir', S.ultimos[e.id + d.clave]);
      $('[data-mostrar]', div).onclick = () => window.api.llamar('sistema:mostrar', S.ultimos[e.id + d.clave]);
    }
  }
}

// ---------- pestaña Matriz ----------
function pMatriz(el) {
  const p = procActual(); const e = expActual();
  el.innerHTML = `<div class="tarjeta"><h2>1. Descargar la matriz</h2>
    <p>Se genera un Excel con una hoja por cada grupo de datos (${p.entidades.map((x) => esc(x.nombre)).join(', ')}), con listas desplegables y los datos que ya tengas cargados.</p>
    <button class="btn prim" id="exp">Descargar matriz Excel</button></div>
    <div class="tarjeta"><h2>2. Subir la matriz llena</h2>
    <p>Los datos de cada hoja reemplazan a los de la app. Las hojas que borres del archivo no se tocan.</p>
    <button class="btn prim" id="imp">Subir matriz Excel</button><div id="res"></div></div>`;
  $('#exp', el).onclick = async () => { await guardar(true); const r = await intentar(() => window.api.llamar('matriz:exportar', e.id)); if (r) aviso('Matriz guardada en ' + r); };
  $('#imp', el).onclick = async () => {
    const r = await intentar(() => window.api.llamar('matriz:importar', e.id));
    if (!r) return;
    if (!Object.keys(r.datos).length) { aviso('El archivo no tiene hojas reconocibles para este proceso.', true); return; }
    const ok = await confirmar(`Se cargará:<ul>${r.resumen.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>¿Reemplazar los datos de estas hojas?`);
    if (!ok) return;
    Object.assign(e.datos, r.datos);
    await guardar(true);
    aviso('Datos cargados desde la matriz.');
    S.pestana = 'datos'; render();
  };
}

// ---------------- textos base ----------------
async function vTextos(el) {
  const docs = [];
  for (const [k, p] of Object.entries(S.schema.PROCESOS)) for (const d of p.documentos) docs.push({ clave: d.textos, nombre: `${k} · ${d.nombre}` });
  if (!S.textoDoc) S.textoDoc = docs[0].clave;
  const def = await intentar(() => window.api.llamar('textos:defecto', S.textoDoc)) || {};
  const pers = (S.db.textos && S.db.textos[S.textoDoc]) || {};
  let h = `<h1>Textos base</h1><p class="sub">Es el texto fijo de cada documento (introducción, base legal, metodología…). Edítalo una vez y se reutiliza en todos los períodos.
    Marcadores disponibles: <code>{{periodo}}</code>, <code>{{periodo_corto}}</code>, <code>{{institucion}}</code>, <code>{{siglas}}</code>, <code>{{n_registros}}</code>, <code>{{n_carreras}}</code>, <code>{{n_formacion_letras}}</code>, <code>{{corte}}</code>. Separa los párrafos con una línea en blanco; empieza con “- ” para viñetas.</p>
    <div class="tarjeta"><label class="campo" style="max-width:520px"><span>Documento</span><select id="doc">${docs.map((d) => `<option value="${d.clave}" ${d.clave === S.textoDoc ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}</select></label>`;
  for (const [k, v] of Object.entries(def)) {
    const actual = pers[k] ? pers[k].parrafos : v.parrafos;
    h += `<div class="seccion-texto"><div class="fila"><h3 style="margin:0">${esc(v.titulo || k)}</h3>${pers[k] ? '<span class="chip Aprobado">personalizado</span>' : ''}<span class="espacio"></span>
      ${pers[k] ? `<button class="btn mini" data-rest="${k}">Restaurar original</button>` : ''}</div>
      <textarea data-t="${k}">${esc((actual || []).join('\n\n'))}</textarea></div>`;
  }
  h += '</div>';
  el.innerHTML = h;
  $('#doc', el).onchange = (ev) => { S.textoDoc = ev.target.value; render(); };
  $$('[data-t]', el).forEach((t) => {
    t.oninput = () => {
      S.db.textos = S.db.textos || {};
      S.db.textos[S.textoDoc] = S.db.textos[S.textoDoc] || {};
      S.db.textos[S.textoDoc][t.dataset.t] = { parrafos: t.value.split(/\n\s*\n/).map((x) => x.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean) };
      guardar();
    };
  });
  $$('[data-rest]', el).forEach((b) => { b.onclick = () => { delete S.db.textos[S.textoDoc][b.dataset.rest]; guardar(); render(); }; });
}

// ---------------- configuración ----------------
function vConfig(el) {
  const c = S.db.config;
  const f = c.firmantes;
  const fir = (rol, t) => `<div><h3>${t}</h3><label class="campo"><span>Nombre</span><input data-fir="${rol}.nombre" value="${esc(f[rol].nombre)}"></label><label class="campo"><span>Cargo</span><input data-fir="${rol}.cargo" value="${esc(f[rol].cargo)}"></label></div>`;
  el.innerHTML = `<h1>Configuración</h1><p class="sub">Datos institucionales que aparecen en todos los documentos.</p>
  <div class="tarjeta"><h2>Institución</h2><div class="dos">
    <label class="campo"><span>Institución</span><input data-c="institucion" value="${esc(c.institucion)}"></label>
    <label class="campo"><span>Siglas</span><input data-c="siglas" value="${esc(c.siglas)}"></label>
    <label class="campo"><span>Unidad (encabezado)</span><input data-c="unidad" value="${esc(c.unidad)}"></label>
    <label class="campo"><span>Logo del encabezado</span><div class="fila"><input readonly value="${esc(c.logo || 'Logo ITSQMET (incluido)')}" style="flex:1"><button class="btn" id="logo">Cambiar</button></div></label></div></div>
  <div class="tarjeta"><h2>Firmas de la portada</h2><div class="rejilla">${fir('elaborado', 'Elaborado por')}${fir('revisado', 'Revisado por')}${fir('aprobado', 'Aprobado por')}</div></div>
  <div class="tarjeta"><h2>Carreras</h2><p class="muted">Una por línea. Se usan en las listas desplegables y en la matriz Excel.</p><textarea id="carreras" style="min-height:220px">${esc(c.carreras.join('\n'))}</textarea></div>
  <div class="tarjeta"><h2>Archivos</h2>
    <label class="campo"><span>Carpeta donde se guardan los documentos</span><div class="fila"><input readonly value="${esc(S.info.salida)}" style="flex:1"><button class="btn" id="carp">Cambiar</button></div></label>
    <div class="fila"><button class="btn" id="resp">Guardar respaldo</button><button class="btn" id="rest">Restaurar respaldo</button><button class="btn" id="ej">Cargar datos de ejemplo 2025</button></div>
    <p class="muted">Tus datos se guardan en ${esc(S.info.archivo)}</p></div>`;
  $$('[data-c]', el).forEach((i) => { i.oninput = () => { c[i.dataset.c] = i.value; guardar(); }; });
  $$('[data-fir]', el).forEach((i) => { i.oninput = () => { const [r, k] = i.dataset.fir.split('.'); f[r][k] = i.value; guardar(); }; });
  $('#carreras', el).oninput = (ev) => { c.carreras = ev.target.value.split('\n').map((x) => x.trim()).filter(Boolean); guardar(); };
  $('#logo', el).onclick = async () => { const r = await intentar(() => window.api.llamar('config:elegirLogo')); if (r) { c.logo = r; await guardar(true); render(); } };
  $('#carp', el).onclick = async () => { const r = await intentar(() => window.api.llamar('config:elegirCarpeta')); if (r) { c.carpetaSalida = r; await guardar(true); S.info = await window.api.llamar('app:info'); render(); } };
  $('#resp', el).onclick = async () => { await guardar(true); const r = await intentar(() => window.api.llamar('respaldo:exportar')); if (r) aviso('Respaldo guardado en ' + r); };
  $('#rest', el).onclick = async () => { if (!(await confirmar('Esto reemplaza todos los datos actuales por los del respaldo. ¿Continuar?'))) return; const r = await intentar(() => window.api.llamar('respaldo:importar')); if (r) { S.db = r; aviso('Respaldo restaurado.'); render(); } };
  $('#ej', el).onclick = cargarEjemplo;
}

// ---------------- arranque ----------------
(async () => {
  try {
    S.schema = await window.api.llamar('schema');
    S.db = await window.api.llamar('db:cargar');
    S.info = await window.api.llamar('app:info');
    render();
  } catch (e) {
    document.body.innerHTML = `<p style="padding:30px;color:#b42318">No se pudo iniciar: ${esc(e.message)}</p>`;
  }
})();
