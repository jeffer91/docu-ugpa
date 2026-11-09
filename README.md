# Docu UGPA

App de escritorio (Electron) para generar más rápido la documentación de la **Unidad de Gestión de Procesos Académicos (UGPA)** del ITSQMET, según el *Manual de Procesos de la UGPA*.

La idea: **el texto fijo (introducción, base legal, metodología…) ya está escrito**; tú solo cargas lo que cambia en cada período (formulario o matriz Excel), y la app arma el Word con el formato institucional: encabezado con logo y código, portada con firmas, índice, títulos numerados, tablas numeradas y "Página X de Y".

## Cómo usarla

```bash
npm install
npm start
```

Requisitos: Node.js 18 o superior.

Para probar sin abrir la app (genera los 6 documentos y las matrices con los datos de ejemplo en `salida-demo/`):

```bash
npm run demo
```

## Flujo de trabajo

1. **Configuración**: revisa la institución, las firmas de la portada y la lista de carreras.
2. **Proceso → + Nuevo período**: crea el período (puedes copiar los datos de otro período y solo actualizar lo que cambió).
3. **Datos**: llena cada grupo de datos en la app, pega celdas desde Excel, o usa la pestaña **Matriz Excel**: *Descargar matriz* → llénala → *Subir matriz*.
4. **Documentos**: revisa que diga "Datos completos" y pulsa **Generar Word**. Registra el estado (Borrador → En revisión → Observado → Aprobado → Archivado) y las observaciones del Vicerrector.
5. **Textos base**: si quieres cambiar el texto fijo de un documento, edítalo una vez y queda para todos los períodos.

> Al abrir el Word, si el índice aparece vacío: clic derecho sobre el índice → *Actualizar campos*.

## Procesos implementados

| Proceso | Documentos | Estado |
|---|---|---|
| PRO-70 Capacitación Docente | RGI1 Detección de Necesidades de Capacitación · RGI2 Plan Semestral · RGI3 Informe de Cumplimiento | ✅ |
| PRO-31 Formación Docente | RGI1 Detección de Necesidades de Formación · RGI2 Plan Anual · RGI3 Informe de Cumplimiento | ✅ |
| PRO-60, PRO-134, PRO-135, PRO-251, PRO-248, PRO-321 | — | Pendiente |

## Estructura

```
main.js / preload.js        Proceso principal de Electron y puente seguro
src/core/schema.js          Qué datos pide cada proceso (de aquí salen formularios y matriz Excel)
src/core/calculos.js        Cálculos (prioritarias, totales, porcentajes, estados)
src/core/matriz.js          Descargar / subir matriz Excel
src/textos/*.json           Textos base extraídos de los documentos institucionales
src/docx/base.js            Formato Word institucional
src/docx/pro70|pro31/*.js   Un generador por documento (texto fijo + partes variables)
src/renderer/               Interfaz
datos-ejemplo/              Datos reales del período 2025 para probar
```

### Agregar un proceso nuevo

1. Declarar sus grupos de datos y documentos en `src/core/schema.js`.
2. Crear `src/textos/<proceso>-<doc>.json` con los textos base.
3. Crear el generador en `src/docx/<proceso>/<doc>.js` y registrarlo en `src/docx/generar.js`.

Los datos del usuario se guardan en la carpeta de datos de la app (se muestra en el pie del menú) y se pueden respaldar desde *Configuración*.
