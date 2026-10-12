import test from "node:test";
import assert from "node:assert/strict";
import { REDES_VIVO, filaTransmision, validarTransmision } from "../js/logica.js";
import { leer } from "./ayudas.js";

const html = leer("login/index.html");

test("desactivar siempre es válido", () => {
  assert.equal(validarTransmision({ activa: false }).ok, true);
  assert.equal(validarTransmision({ activa: false, red: "youtube", enlace: "x" }).ok, true);
});

test("activar con red conocida y enlace https es válido", () => {
  const resultado = validarTransmision({ activa: true, red: "instagram", enlace: "https://instagram.com/liceo", titulo: "" });
  assert.deepEqual(resultado, { ok: true, errores: [] });
});

test("activar exige https y una red de la lista", () => {
  const base = { activa: true, red: "instagram", enlace: "https://instagram.com/liceo" };
  assert.equal(validarTransmision({ ...base, enlace: "http://x.co" }).ok, false);
  assert.equal(validarTransmision({ ...base, enlace: "javascript:alert(1)" }).ok, false);
  assert.equal(validarTransmision({ ...base, red: "youtube" }).ok, false);
  assert.equal(validarTransmision({ ...base, enlace: "" }).ok, false);
});

test("el audio puede salir al aire sin dirección, pero no con una insegura", () => {
  assert.equal(validarTransmision({ activa: true, red: "audio", enlace: "" }).ok, true);
  assert.equal(validarTransmision({ activa: true, red: "audio", enlace: "http://radio.co" }).ok, false);
});

test("filaTransmision anula los textos vacíos y fecha el cambio", () => {
  const fila = filaTransmision({ activa: true, red: "tiktok", enlace: "https://tiktok.com/@x", titulo: "" }, "2026-10-12T15:00:00.000Z");
  assert.equal(fila.titulo, null);
  assert.equal(fila.actualizada, "2026-10-12T15:00:00.000Z");
  assert.equal(fila.activa, true);
});

test("el formulario y su módulo tienen lo necesario", () => {
  for (const id of ["vivo-activa", "vivo-red", "vivo-enlace", "vivo-titulo"]) assert.ok(html.includes(`id="${id}"`), id);
  const fuente = leer("js/panel-vivo.js");
  assert.ok(fuente.includes("validarTransmision("));
  assert.ok(fuente.includes('from("transmision")'));
  assert.ok(!fuente.includes("innerHTML"));
});

test("las opciones de red son las de REDES_VIVO, en el mismo orden", () => {
  const select = html.match(/<select id="vivo-red"[\s\S]*?<\/select>/)[0];
  assert.deepEqual([...select.matchAll(/<option value="([^"]+)"/g)].map((m) => m[1]), REDES_VIVO);
});
