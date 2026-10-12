import test from "node:test";
import assert from "node:assert/strict";
import { parrillaPorDia, separarJornadas } from "../js/logica.js";
import { leer } from "./ayudas.js";

const bloque = (dia, inicio) => ({ dia, inicio, fin: "23:00", programa: `${dia} ${inicio}` });

test("parrillaPorDia ordena los días de lunes a domingo y los bloques por hora", () => {
  const dias = parrillaPorDia([bloque("viernes", "08:00"), bloque("lunes", "9:15"), bloque("lunes", "06:20")]);
  assert.deepEqual(dias.map((d) => d.dia), ["lunes", "viernes"]);
  assert.deepEqual(dias[0].bloques.map((b) => b.inicio), ["06:20", "9:15"]);
});

test("parrillaPorDia omite los días sin bloques", () => {
  assert.deepEqual(parrillaPorDia([]), []);
  assert.equal(parrillaPorDia([bloque("domingo", "10:00"), bloque("domingo", "08:00")]).length, 1);
});

test("separarJornadas agrupa en mañana y tarde, sin grupos vacíos", () => {
  const dos = separarJornadas([bloque("lunes", "09:45"), bloque("lunes", "14:00")]);
  assert.deepEqual(dos.map((g) => g.jornada), ["Mañana", "Tarde"]);
  const una = separarJornadas([bloque("lunes", "06:20"), bloque("lunes", "11:00")]);
  assert.deepEqual(una.map((g) => g.jornada), ["Mañana"]);
  assert.equal(una[0].bloques.length, 2);
});

test("programacion.html sigue el esqueleto del proyecto y ya no carga el código viejo", () => {
  const html = leer("programacion.html");
  assert.deepEqual([...html.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]), ["js/programacion.js"]);
  assert.equal(html.match(/<h1/g).length, 1);
  assert.ok(!html.includes("<header") && !html.includes("<footer"));
  assert.ok(!html.includes("js/app.js"));
});

test("js/programacion.js monta el marco y agrupa con parrillaPorDia, sin innerHTML", () => {
  const fuente = leer("js/programacion.js");
  assert.ok(fuente.includes("montarMarco("));
  assert.ok(fuente.includes("parrillaPorDia("));
  assert.ok(!fuente.includes("innerHTML"));
});
