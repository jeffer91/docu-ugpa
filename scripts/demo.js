// Genera los documentos y las matrices con los datos de ejemplo (sin abrir la app).
// Uso: npm run demo  ->  salida en ./salida-demo
const fs = require('fs');
const path = require('path');
const { vacia } = require('../src/core/db');
const { generar, completitud } = require('../src/docx/generar');
const matriz = require('../src/core/matriz');
const { PROCESOS } = require('../src/core/schema');

(async () => {
  const db = vacia();
  const ej = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'datos-ejemplo', 'ejemplo-2025.json'), 'utf8'));
  db.expedientes = ej.expedientes;
  const out = process.argv[2] || path.join(__dirname, '..', 'salida-demo');
  fs.mkdirSync(out, { recursive: true });
  for (const exp of db.expedientes) {
    for (const d of PROCESOS[exp.proceso].documentos) {
      const c = completitud(db, exp, d.clave);
      const r = await generar(db, exp, d.clave);
      fs.writeFileSync(path.join(out, r.nombre), r.buffer);
      console.log(`${c.ok ? '✔' : '⚠ faltan: ' + c.faltan.join(', ')}  ${r.nombre}`);
    }
    const buf = await matriz.exportar(db, exp);
    const f = path.join(out, `Matriz ${exp.proceso} ${exp.inicio}.xlsx`);
    fs.writeFileSync(f, Buffer.from(buf));
    const imp = await matriz.importar(fs.readFileSync(f), exp.proceso);
    console.log(`   matriz ida y vuelta: ${imp.resumen.join(' · ')}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
