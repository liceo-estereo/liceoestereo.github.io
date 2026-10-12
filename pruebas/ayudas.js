// Utilidades compartidas por las pruebas. No es una prueba: su nombre no termina en .test.js.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const leer = (ruta) => readFileSync(join(RAIZ, ruta), "utf8");
export const existe = (ruta) => existsSync(join(RAIZ, ruta));

// Páginas del sitio: las de la raíz y la del panel. Nunca las del plan en blueprints/.
export function paginas() {
  const html = (carpeta) =>
    existsSync(join(RAIZ, carpeta))
      ? readdirSync(join(RAIZ, carpeta))
          .filter((archivo) => archivo.endsWith(".html"))
          .map((archivo) => (carpeta === "." ? archivo : `${carpeta}/${archivo}`))
      : [];
  return [...html("."), ...html("login")];
}
