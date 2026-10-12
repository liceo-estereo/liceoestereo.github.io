# Liceo Tame Stereo

Sitio web de la emisora estudiantil del Liceo Tame: noticias, programación, equipo, contacto y un
panel de administración. Sitio estático sin compilación, publicado en GitHub Pages desde `main`.

## Commands

| Tarea | Comando |
|---|---|
| Todas las pruebas | `npm test` |
| Un archivo de pruebas | `node --test pruebas/logica.test.js` |
| Ver el sitio en local | `npm run servir` (http://localhost:8123) |
| Revisar pendientes antes de publicar | `node herramientas/revisar-lanzamiento.js` |
| Guardar un intento fallido y volver al último commit | `git stash push --include-untracked -m "paso fallido"` |

No hay paso de compilación, ni linter, ni formateador, ni `npm install`: el proyecto no tiene
dependencias. Las pruebas usan el corredor que trae Node.

## Stack

HTML + CSS + JavaScript en módulos ES nativos (sin framework ni empaquetador) · Supabase (Postgres,
Auth, Storage) leído por REST · Pages CMS sobre `datos/emisora.json` · FormSubmit para el correo ·
GitHub Pages. Node solo se usa para las pruebas y el servidor local.

## Architecture

- **Núcleo puro, borde con efectos.** `js/logica.js` solo tiene funciones puras y es lo que cubren
  las pruebas. `js/datos.js` es el único archivo que hace `fetch`. Los módulos de página
  (`js/portada.js`, `js/noticia.js`…) y `js/vista.js` son los únicos que tocan el DOM.
- **Una página, un módulo.** Cada HTML carga `css/sitio.css` y un único
  `<script type="module">`. Ese módulo llama a `montarMarco()` de `js/marco.js`, que inserta la
  cabecera, la franja de «al aire» y el pie. Ningún HTML público lleva cabecera ni pie escritos a mano.
- **Dos fuentes de datos.** `datos/emisora.json` (programación, equipo, redes, videos, pódcast) se
  edita con Pages CMS. Noticias, transmisión en vivo, tickets y pedidos viven en Supabase.
- **El panel** (`login/index.html`) es la única página que carga supabase-js, desde la dirección y
  con el `integrity` de `herramientas/cdn.json`, y la única con un módulo por pestaña
  (`js/panel.js` más `js/panel-*.js`). No usa `montarMarco()`: tiene su propia cabecera mínima. Las páginas públicas leen Supabase con `fetch` y la clave
  pública de `js/ajustes.js`.
- **Los permisos están en la base de datos** (políticas por fila en `supabase/*.sql`), nunca solo en
  el navegador.

## Code rules

- Nombres de archivos, funciones, clases CSS y campos de datos en español; palabras clave en inglés.
- Importaciones siempre relativas y con extensión: `import { hhmm } from "./logica.js"`.
- El contenido que viene de datos se pinta con `textContent` o `el()` de `js/vista.js`. Prohibido
  `innerHTML`, `insertAdjacentHTML` y `document.write`.
- Todo enlace que venga de datos pasa por `esEnlaceSeguro()` antes de asignarse a un `href`.
- Toda función nueva de `js/logica.js` llega con su caso en `pruebas/`.
- Ningún color literal fuera del bloque `:root` de `css/sitio.css`: se usan las variables.
- Una fila de datos incompleta se descarta al cargar (`limpiarEmisora`); nunca debe tumbar la página.

## Design system

Los valores viven en `:root` de `css/sitio.css`. Referencia rápida:

| Variable | Valor | Uso |
|---|---|---|
| `--fondo` | `#F7F8F5` | Fondo de página |
| `--superficie` | `#FFFFFF` | Tarjetas y formularios |
| `--borde` | `#DDE2D8` | Líneas y bordes |
| `--tinta` | `#141A14` | Texto |
| `--tinta-suave` | `#55604F` | Texto secundario |
| `--verde` | `#0F470C` | Marca, enlaces, franja, pie |
| `--verde-claro` | `#E6EFE3` | Fondos de etiqueta y realce |
| `--senal` | `#E8B321` | Punto de «al aire» y «en vivo» |
| `--error` | `#A12A1B` | Errores |

Tipografías: `--f-titulares` Newsreader · `--f-texto` Public Sans · `--f-marca` Jost (solo el nombre
junto al logo). Radio de 4px, sin sombras.

## Environment

No hay variables de entorno ni archivo `.env`. La dirección y la clave pública de Supabase están en
`js/ajustes.js` y son públicas por diseño. La clave `secret` o `service_role` de Supabase no se
escribe en ningún archivo del repositorio.

## Rules

- `.claude/rules/frontend.md` — HTML, CSS y módulos de página.
- `.claude/rules/supabase.md` — SQL y acceso a datos.

## Non-negotiable

1. No publicar: `git push` y la fusión a `main` los hace una persona. `main` es el sitio en vivo.
2. No agregar dependencias, framework ni paso de compilación.
3. No ejecutar SQL contra Supabase: los archivos de `supabase/` los aplica una persona en el panel.
4. No tocar `supabase/esquema.sql` (ya aplicado); los cambios van en un archivo nuevo numerado.
5. No cambiar la ruta `datos/emisora.json` ni renombrar sus campos existentes: Pages CMS los usa.
6. No editar un comando de verificación para que pase; si un criterio parece imposible, detenerse.
