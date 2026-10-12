// Estructura mínima y accesibilidad básica que toda página del sitio debe cumplir, y el contrato
// de ids entre cada página y los módulos que carga.
import test from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path/posix";
import { existe, leer, paginas } from "./ayudas.js";

const SELECTOR_POR_ID = /(?:querySelector(?:All)?\(\s*["'`]#([\w-]+)["'`]\s*\)|getElementById\(\s*["'`]([\w-]+)["'`]\s*\))/g;

for (const pagina of paginas()) {
  test(`estructura de ${pagina}`, () => {
    const html = leer(pagina);
    assert.match(html, /<html lang="es">/, "falta lang=\"es\"");
    assert.match(html, /<meta charset="utf-8">/, "falta el charset");
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/, "falta el viewport");
    assert.match(html, /<title>[^<]+<\/title>/, "falta el título");
    assert.equal(html.match(/<main[\s>]/g)?.length, 1, "debe haber exactamente un <main>");
    for (const [imagen] of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(imagen, /\salt="/, `imagen sin atributo alt: ${imagen}`);
    }
  });

  // Un módulo cargado por la página solo puede consultar por id elementos que están en su HTML.
  test(`ids que usan los módulos de ${pagina}`, () => {
    const html = leer(pagina);
    const faltan = [];
    for (const [, src] of html.matchAll(/<script type="module" src="([^"]+)"/g)) {
      const modulo = join(dirname(pagina), src);
      if (!existe(modulo)) continue; // el enlace roto lo reporta pruebas/enlaces.test.js
      for (const [, conNumeral, sinNumeral] of leer(modulo).matchAll(SELECTOR_POR_ID)) {
        const id = conNumeral || sinNumeral;
        if (!html.includes(`id="${id}"`)) faltan.push(`${modulo}: #${id}`);
      }
    }
    assert.deepEqual(faltan, []);
  });
}
