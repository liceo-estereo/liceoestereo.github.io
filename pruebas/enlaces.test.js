// Cada href y src local de cada página debe apuntar a un archivo que existe.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { RAIZ, leer, paginas } from "./ayudas.js";

const EXTERNO = /^(https?:|mailto:|tel:|data:|#|\/\/)/;

for (const pagina of paginas()) {
  test(`enlaces locales de ${pagina}`, () => {
    const rotos = [];
    for (const [, valor] of leer(pagina).matchAll(/(?:href|src)="([^"]*)"/g)) {
      if (!valor || EXTERNO.test(valor)) continue;
      const ruta = valor.split(/[?#]/)[0];
      if (!ruta) continue;
      let destino = join(RAIZ, dirname(pagina), ruta);
      if (existsSync(destino) && statSync(destino).isDirectory()) destino = join(destino, "index.html");
      if (!existsSync(destino)) rotos.push(valor);
    }
    assert.deepEqual(rotos, []);
  });
}
