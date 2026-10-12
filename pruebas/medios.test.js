import test from "node:test";
import assert from "node:assert/strict";
import { REDES_VIVO, estadoEnVivo, mediosVisibles, redesDeTransmision } from "../js/logica.js";
import { leer } from "./ayudas.js";

test("estadoEnVivo con una transmisión válida", () => {
  const vivo = estadoEnVivo({ activa: true, red: "instagram", enlace: "https://instagram.com/x", titulo: "" });
  assert.equal(vivo.red, "instagram");
  assert.equal(vivo.esAudio, false);
  assert.equal(vivo.titulo, "En vivo");
  assert.equal(estadoEnVivo({ activa: true, red: "audio", enlace: "https://radio.co/x" }).esAudio, true);
});

test("estadoEnVivo devuelve null si no hay transmisión fiable", () => {
  const base = { activa: true, red: "instagram", enlace: "https://instagram.com/x" };
  assert.equal(estadoEnVivo(null), null);
  assert.equal(estadoEnVivo({ ...base, activa: false }), null);
  assert.equal(estadoEnVivo({ ...base, enlace: "javascript:alert(1)" }), null);
  assert.equal(estadoEnVivo({ ...base, red: "youtube" }), null);
});

test("redesDeTransmision solo deja las que transmiten y tienen enlace seguro", () => {
  const buena = { nombre: "Instagram", enlace: "https://instagram.com/x", transmite: true };
  const redes = [
    buena,
    { nombre: "Spotify", enlace: "https://spotify.com/x", transmite: false },
    { nombre: "TikTok", enlace: "javascript:x", transmite: true },
  ];
  assert.deepEqual(redesDeTransmision(redes), [buena]);
});

test("mediosVisibles descarta lo que no tiene título o enlace seguro", () => {
  assert.deepEqual(mediosVisibles([{ enlace: "https://a.co" }, { titulo: "Video", enlace: "javascript:x" }]), []);
});

test("la portada tiene los contenedores y pide la transmisión", () => {
  const html = leer("index.html");
  for (const id of ["en-vivo", "videos", "podcasts"]) assert.ok(html.includes(`id="${id}"`), id);
  const fuente = leer("js/portada.js");
  assert.ok(fuente.includes("leerTransmision("));
  assert.ok(!fuente.includes("innerHTML"));
});

test("REDES_VIVO coincide con el check de la base de datos", () => {
  const sql = leer("supabase/002-rediseno.sql");
  const [, dentro] = sql.match(/check \(red in \(([^)]*)\)\)/);
  assert.deepEqual([...dentro.matchAll(/'([^']*)'/g)].map((m) => m[1]), REDES_VIVO);
});
