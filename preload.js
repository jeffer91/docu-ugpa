// Puente seguro entre la interfaz y el proceso principal (solo canales permitidos).
const { contextBridge, ipcRenderer } = require('electron');

const CANALES = [
  'app:info', 'schema', 'db:cargar', 'db:guardar', 'textos:defecto', 'calc:capacitacionesDesdeDNC', 'doc:completitud', 'doc:generar',
  'matriz:exportar', 'matriz:importar', 'sistema:abrir', 'sistema:mostrar', 'sistema:abrirSalida', 'config:elegirCarpeta',
  'config:elegirLogo', 'ejemplo:cargar', 'respaldo:exportar', 'respaldo:importar',
];

contextBridge.exposeInMainWorld('api', {
  async llamar(canal, ...args) {
    if (!CANALES.includes(canal)) throw new Error('Canal no permitido: ' + canal);
    const r = await ipcRenderer.invoke(canal, ...args);
    if (!r.ok) throw new Error(r.error);
    return r.valor;
  },
});
