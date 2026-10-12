# Liceo Tame Stereo

Sitio estático de la emisora estudiantil del Liceo Tame (HTML, CSS y módulos ES nativos), con
noticias en Supabase y el resto de datos en `datos/emisora.json`. Se publica en GitHub Pages desde
`main`. La fuente de verdad para trabajar aquí es `CLAUDE.md`.

## Commands

- `npm test` — todas las pruebas (corredor de Node, sin dependencias).
- `node --test pruebas/<archivo>.test.js` — un solo archivo.
- `npm run servir` — sitio en http://localhost:8123.

## Non-negotiable

1. No hacer `git push` ni fusionar a `main`: lo hace una persona.
2. Sin dependencias, sin framework, sin compilación.
3. El contenido de datos se pinta con `textContent`; nunca `innerHTML`.
4. Los permisos se aplican en la base de datos; el SQL lo ejecuta una persona en Supabase.

Detalles de arquitectura, reglas de código y sistema de diseño: `CLAUDE.md`.
