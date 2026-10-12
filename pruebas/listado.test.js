import test from "node:test";
import assert from "node:assert/strict";
import { SECCIONES } from "../js/ajustes.js";
import { agruparPorMes, filtrarPorSeccion, hayMas, tanda } from "../js/logica.js";
import { leer } from "./ayudas.js";

test("filtrarPorSeccion: una sección desconocida devuelve todas", () => {
  const noticias = [
    { id: 1, seccion: "deportes" },
    { id: 2, seccion: "cultura" },
    { id: 3, seccion: "deportes" },
  ];
  assert.deepEqual(filtrarPorSeccion(noticias, "deportes", SECCIONES).map((n) => n.id), [1, 3]);
  assert.equal(filtrarPorSeccion(noticias, "inventada", SECCIONES).length, 3);
  assert.equal(filtrarPorSeccion(noticias, "", SECCIONES).length, 3);
});

test("tanda y hayMas", () => {
  const noticias = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
  assert.deepEqual(tanda(noticias, 2, 10).map((n) => n.id), noticias.slice(0, 20).map((n) => n.id));
  assert.equal(hayMas(noticias, 2, 10), true);
  assert.equal(hayMas(noticias, 3, 10), false);
});

test("agruparPorMes abre un grupo cada vez que cambia el mes", () => {
  const grupos = agruparPorMes([{ fecha: "2026-10-05" }, { fecha: "2026-10-01" }, { fecha: "2026-09-20" }]);
  assert.equal(grupos.length, 2);
  assert.equal(grupos[0].noticias.length, 2);
  assert.ok(grupos[0].mes.includes("octubre de 2026"));
  assert.equal(grupos[1].noticias.length, 1);
});

test("agruparPorMes de una lista vacía", () => {
  assert.deepEqual(agruparPorMes([]), []);
});

test("noticias.html sigue el esqueleto del proyecto", () => {
  const html = leer("noticias.html");
  assert.deepEqual([...html.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]), ["js/noticias.js"]);
  assert.equal(html.match(/<h1/g).length, 1);
  assert.ok(!html.includes("<header") && !html.includes("<footer"));
});

test("js/noticias.js monta el marco, lee y filtra, sin innerHTML", () => {
  const fuente = leer("js/noticias.js");
  for (const llamada of ["montarMarco(", "leerNoticias(", "filtrarPorSeccion("]) assert.ok(fuente.includes(llamada), llamada);
  assert.ok(!fuente.includes("innerHTML"));
});
