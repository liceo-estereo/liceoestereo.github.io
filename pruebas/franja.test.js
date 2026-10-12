import test from "node:test";
import assert from "node:assert/strict";
import { crearServidor } from "../herramientas/servidor.js";
import { audioDeFranja, estadoEnVivo, estadoFranja } from "../js/logica.js";
import { RAIZ, leer } from "./ayudas.js";

// Lunes 12 de octubre de 2026 a las 10:00, hora local.
const AHORA = new Date(2026, 9, 12, 10, 0);
const EMISORA = {
  stream: "",
  especiales: [],
  parrilla: [
    { dia: "lunes", inicio: "09:45", fin: "11:00", programa: "Música salsa" },
    { dia: "lunes", inicio: "14:00", fin: "15:00", programa: "Conexión Tarde" },
  ],
};
const VIVO = { activa: true, red: "instagram", enlace: "https://instagram.com/liceo", titulo: "Entrevista" };

test("sin transmisión activada la franja no dice «al aire»", () => {
  const estado = estadoFranja(EMISORA, { activa: false }, AHORA);
  assert.equal(estado.alAire, false);
  assert.equal(estado.texto, "En la programación: Música salsa, hasta las 11:00");
  assert.equal(estadoFranja(EMISORA, null, AHORA).alAire, false);
});

test("fuera de un bloque anuncia el siguiente, o que ya no hay más", () => {
  assert.equal(estadoFranja(EMISORA, null, new Date(2026, 9, 12, 12, 0)).texto, "Sigue en la programación: Conexión Tarde a las 14:00");
  assert.equal(estadoFranja(EMISORA, null, new Date(2026, 9, 12, 20, 0)).texto, "Sin más programas por hoy");
});

test("con la transmisión activada desde el panel dice «al aire»", () => {
  const estado = estadoFranja(EMISORA, VIVO, AHORA);
  assert.equal(estado.alAire, true);
  assert.equal(estado.texto, "Al aire: Entrevista");
  assert.equal(estadoFranja(EMISORA, { ...VIVO, titulo: "" }, AHORA).texto, "Al aire");
  assert.equal(estadoFranja(null, VIVO, AHORA).alAire, true);
  assert.equal(estadoFranja(null, null, AHORA).texto, "");
});

test("audioDeFranja: solo hay reproductor mientras se está al aire", () => {
  const social = estadoEnVivo(VIVO);
  const audio = estadoEnVivo({ activa: true, red: "audio", enlace: "https://radio.ejemplo.co/vivo" });
  assert.equal(audioDeFranja(null, "https://radio.ejemplo.co/fijo"), "");
  assert.equal(audioDeFranja(audio, ""), "https://radio.ejemplo.co/vivo");
  assert.equal(audioDeFranja(social, "https://radio.ejemplo.co/fijo"), "https://radio.ejemplo.co/fijo");
  assert.equal(audioDeFranja(social, "javascript:alert(1)"), "");
  assert.equal(audioDeFranja(social, ""), "");
});

test("el marco consulta la transmisión y no precarga el audio", () => {
  const marco = leer("js/marco.js");
  assert.ok(marco.includes("estadoFranja(") && marco.includes("leerTransmision("));
  assert.ok(marco.includes('preload = "none"'));
});

test("lo que no existe responde 404 con la página 404.html", async (t) => {
  const servidor = crearServidor(RAIZ);
  await new Promise((listo) => servidor.listen(0, "127.0.0.1", listo));
  t.after(() => servidor.close());
  const respuesta = await fetch(`http://127.0.0.1:${servidor.address().port}/carpeta/no-existe.html`);
  assert.equal(respuesta.status, 404);
  const html = await respuesta.text();
  assert.ok(html.includes("Página no encontrada"));
  assert.ok(html.includes('href="index.html"'));
  assert.ok(html.includes('document.createElement("base")'));
});
