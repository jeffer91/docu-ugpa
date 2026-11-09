// Proceso principal de Electron: ventana, almacenamiento y generación de archivos.
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const dbm = require('./src/core/db');
const schema = require('./src/core/schema');
const textos = require('./src/core/textos');
const matriz = require('./src/core/matriz');
const calculos = require('./src/core/calculos');
const { generar, completitud } = require('./src/docx/generar');

// Permite usar otra carpeta de datos (pruebas): DOCU_UGPA_DATOS=/ruta npm start
if (process.env.DOCU_UGPA_DATOS) app.setPath('userData', process.env.DOCU_UGPA_DATOS);

let win;
let db;
const archivoDatos = () => path.join(app.getPath('userData'), 'docu-ugpa-datos.json');

function carpetaSalida() {
  return db.config.carpetaSalida || path.join(app.getPath('documents'), 'Docu UGPA');
}

function exp(id) {
  const e = db.expedientes.find((x) => x.id === id);
  if (!e) throw new Error('No se encontró el período seleccionado.');
  return e;
}

function crearVentana() {
  win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1000,
    minHeight: 640,
    title: 'Docu UGPA',
    icon: path.join(__dirname, 'assets', 'logo.png'),
    backgroundColor: '#f4f6fa',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  db = dbm.cargar(archivoDatos());
  registrarIPC();
  crearVentana();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) crearVentana(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

function registrarIPC() {
  const h = (canal, fn) => ipcMain.handle(canal, async (_e, ...a) => {
    try { return { ok: true, valor: await fn(...a) }; } catch (err) { return { ok: false, error: err.message || String(err) }; }
  });

  h('app:info', () => ({ archivo: archivoDatos(), salida: carpetaSalida(), version: app.getVersion() }));
  h('schema', () => ({ PROCESOS: schema.PROCESOS, PENDIENTES: schema.PENDIENTES, ESTADOS_DOC: schema.ESTADOS_DOC }));
  h('db:cargar', () => db);
  h('db:guardar', (nuevo) => { db = nuevo; dbm.guardar(archivoDatos(), db); return true; });

  h('textos:defecto', (clave) => textos.porDefecto(clave));
  h('calc:capacitacionesDesdeDNC', (datos) => calculos.capacitacionesDesdeDNC(datos));
  h('doc:completitud', (id, clave) => completitud(db, exp(id), clave));

  h('doc:generar', async (id, clave) => {
    const e = exp(id);
    const r = await generar(db, e, clave);
    const dir = path.join(carpetaSalida(), e.proceso, `${e.inicio} a ${e.fin}`);
    fs.mkdirSync(dir, { recursive: true });
    const destino = path.join(dir, r.nombre);
    try {
      fs.writeFileSync(destino, r.buffer);
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EPERM') throw new Error('El archivo está abierto en Word. Ciérralo y vuelve a generar.');
      throw err;
    }
    return { ruta: destino, codigo: r.codigo };
  });

  h('matriz:exportar', async (id) => {
    const e = exp(id);
    const r = await dialog.showSaveDialog(win, {
      title: 'Guardar matriz de datos',
      defaultPath: path.join(app.getPath('downloads'), `Matriz ${e.proceso} ${e.inicio} a ${e.fin}.xlsx`),
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });
    if (r.canceled) return null;
    fs.writeFileSync(r.filePath, Buffer.from(await matriz.exportar(db, e)));
    return r.filePath;
  });

  h('matriz:importar', async (id) => {
    const e = exp(id);
    const r = await dialog.showOpenDialog(win, { title: 'Subir matriz de datos', filters: [{ name: 'Excel', extensions: ['xlsx'] }], properties: ['openFile'] });
    if (r.canceled || !r.filePaths[0]) return null;
    return matriz.importar(fs.readFileSync(r.filePaths[0]), e.proceso);
  });

  h('sistema:abrir', (ruta) => shell.openPath(ruta));
  h('sistema:mostrar', (ruta) => { shell.showItemInFolder(ruta); return true; });
  h('sistema:abrirSalida', () => { fs.mkdirSync(carpetaSalida(), { recursive: true }); return shell.openPath(carpetaSalida()); });

  h('config:elegirCarpeta', async () => {
    const r = await dialog.showOpenDialog(win, { title: 'Carpeta donde se guardan los documentos', properties: ['openDirectory', 'createDirectory'] });
    return r.canceled ? null : r.filePaths[0];
  });
  h('config:elegirLogo', async () => {
    const r = await dialog.showOpenDialog(win, { title: 'Logo para el encabezado (PNG)', filters: [{ name: 'Imagen PNG', extensions: ['png'] }], properties: ['openFile'] });
    return r.canceled ? null : r.filePaths[0];
  });

  h('ejemplo:cargar', () => JSON.parse(fs.readFileSync(path.join(__dirname, 'datos-ejemplo', 'ejemplo-2025.json'), 'utf8')).expedientes);

  h('respaldo:exportar', async () => {
    const r = await dialog.showSaveDialog(win, { title: 'Guardar respaldo', defaultPath: path.join(app.getPath('documents'), `respaldo-docu-ugpa-${new Date().toISOString().slice(0, 10)}.json`), filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (r.canceled) return null;
    fs.writeFileSync(r.filePath, JSON.stringify(db, null, 1));
    return r.filePath;
  });
  h('respaldo:importar', async () => {
    const r = await dialog.showOpenDialog(win, { title: 'Restaurar respaldo', filters: [{ name: 'JSON', extensions: ['json'] }], properties: ['openFile'] });
    if (r.canceled || !r.filePaths[0]) return null;
    const nuevo = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8'));
    if (!nuevo.config || !Array.isArray(nuevo.expedientes)) throw new Error('El archivo no es un respaldo válido de Docu UGPA.');
    db = nuevo;
    dbm.guardar(archivoDatos(), db);
    return db;
  });
}
