import test from "node:test";
import assert from "node:assert/strict";
import { SECCIONES } from "../js/ajustes.js";
import { bloquesPorSeccion, diasEntre, noticiaDeLaSemana, ultimas } from "../js/logica.js";
import { leer } from "./ayudas.js";

test("noticiaDeLaSemana dura siete días desde que se marca", () => {
  const seis = { id: 1, semana_desde: "2026-10-06" };
  const siete = { id: 2, semana_desde: "2026-10-05" };
  assert.equal(noticiaDeLaSemana([seis], "2026-10-12"), seis);
  assert.equal(noticiaDeLaSemana([siete], "2026-10-12"), null);
  assert.equal(noticiaDeLaSemana([{ id: 3, semana_desde: "2026-10-13" }], "2026-10-12"), null);
  assert.equal(diasEntre("2026-10-05", "2026-10-12"), 7);
});

test("noticiaDeLaSemana elige la marca más reciente, o null si no hay ninguna", () => {
  const vieja = { id: 1, semana_desde: "2026-10-08" };
  const nueva = { id: 2, semana_desde: "2026-10-11" };
  assert.equal(noticiaDeLaSemana([vieja, nueva], "2026-10-12"), nueva);
  assert.equal(noticiaDeLaSemana([{ id: 3 }, { id: 4, semana_desde: null }], "2026-10-12"), null);
});

test("bloquesPorSeccion: solo secciones con noticias, en orden y con tres como máximo", () => {
  const noticias = [
    { id: 1, seccion: "cultura" },
    { id: 2, seccion: "institucional" },
    { id: 3, seccion: "cultura" },
    { id: 4, seccion: "cultura" },
    { id: 5, seccion: "cultura" },
  ];
  const bloques = bloquesPorSeccion(noticias, SECCIONES);
  assert.deepEqual(bloques.map((b) => b.seccion.id), ["institucional", "cultura"]);
  assert.equal(bloques[1].noticias.length, 3);
  assert.deepEqual(bloquesPorSeccion(noticias, SECCIONES, 3, 2).map((b) => b.seccion.id), ["cultura"]);
});

test("ultimas respeta la cantidad y la exclusión", () => {
  const noticias = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
  const resultado = ultimas(noticias, 6, 9);
  assert.equal(resultado.length, 6);
  assert.ok(!resultado.some((n) => n.id === 9));
  assert.ok(!ultimas(noticias, 10, 9).some((n) => n.id === 9));
});

test("index.html sigue el esqueleto del proyecto y ya no carga el código viejo", () => {
  const html = leer("index.html");
  assert.deepEqual([...html.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]), ["js/portada.js"]);
  assert.equal(html.match(/<h1/g).length, 1);
  assert.ok(!html.includes("<header") && !html.includes("<footer"));
  assert.ok(!html.includes("js/app.js"));
});

test("js/portada.js monta el marco antes de pedir noticias y tolera el fallo", () => {
  const fuente = leer("js/portada.js");
  const marco = fuente.indexOf("await montarMarco(");
  const noticias = fuente.indexOf("await leerNoticias(");
  assert.ok(marco > -1 && noticias > marco);
  assert.ok(/try\s*\{/.test(fuente));
  assert.ok(!fuente.includes("innerHTML"));
});
