// Almacenamiento local en un archivo JSON (sin dependencias nativas).
const fs = require('fs');
const path = require('path');
const { CARRERAS_BASE } = require('./schema');

function vacia() {
  return {
    version: 1,
    config: {
      institucion: 'Instituto Superior Tecnológico Quito Metropolitano',
      siglas: 'ITSQMET',
      unidad: 'Unidad de Gestión de Procesos Académicos',
      carpetaSalida: '',
      firmantes: {
        elaborado: { nombre: 'MSc. Jefferson Villarreal', cargo: 'Gestor de Procesos Académicos' },
        revisado: { nombre: 'Ing. Martha Tomalá', cargo: 'Coordinadora General de Carreras' },
        aprobado: { nombre: 'Dr. Alex León', cargo: 'Vicerrector' },
      },
      carreras: [...CARRERAS_BASE],
    },
    textos: {}, // personalizaciones de los textos base: { 'pro70-dnc': { intro: {parrafos:[...]}} }
    expedientes: [], // { id, proceso, inicio:'2025-10', fin:'2026-03', datos:{}, docs:{RGI1:{nn,fecha,estado,historial}} }
  };
}

function cargar(archivo) {
  try {
    if (fs.existsSync(archivo)) {
      const d = JSON.parse(fs.readFileSync(archivo, 'utf8'));
      const base = vacia();
      return { ...base, ...d, config: { ...base.config, ...(d.config || {}) } };
    }
  } catch (e) {
    // Si el archivo está dañado, se guarda una copia y se empieza de nuevo
    try { fs.copyFileSync(archivo, archivo + '.danado-' + Date.now()); } catch (_) { /* nada */ }
  }
  return vacia();
}

function guardar(archivo, db) {
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  const tmp = archivo + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 1), 'utf8');
  if (fs.existsSync(archivo)) {
    try { fs.copyFileSync(archivo, archivo + '.bak'); } catch (_) { /* nada */ }
  }
  fs.renameSync(tmp, archivo);
}

module.exports = { vacia, cargar, guardar };
