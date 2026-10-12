import test from "node:test";
import assert from "node:assert/strict";
import { existe, leer } from "./ayudas.js";

test("nosotros.html sigue el esqueleto y tiene sus tres contenedores", () => {
  const html = leer("nosotros.html");
  assert.deepEqual([...html.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]), ["js/nosotros.js"]);
  assert.equal(html.match(/<h1/g).length, 1);
  assert.ok(!html.includes("<header") && !html.includes("<footer"));
  for (const id of ["resena", "junta", "miembros"]) assert.ok(html.includes(`id="${id}"`), id);
});

test("equipo.html redirige a nosotros.html sin ejecutar nada", () => {
  const html = leer("equipo.html");
  assert.ok(html.includes('<meta http-equiv="refresh" content="0; url=nosotros.html">'));
  assert.ok(html.includes('href="nosotros.html"'));
  assert.ok(!html.includes("<script"));
});

test("js/nosotros.js monta el marco y usa parrafos e inicial, sin innerHTML", () => {
  const fuente = leer("js/nosotros.js");
  for (const llamada of ["montarMarco(", "parrafos(", "inicial("]) assert.ok(fuente.includes(llamada), llamada);
  assert.ok(!fuente.includes("innerHTML"));
});

test("los enlaces locales de nosotros.html y equipo.html existen", () => {
  for (const pagina of ["nosotros.html", "equipo.html"]) {
    for (const [, destino] of leer(pagina).matchAll(/(?:href|src)="([^"#:?]+)[^"]*"/g)) {
      assert.ok(existe(destino), `${pagina} enlaza a ${destino}, que no existe`);
    }
  }
});
