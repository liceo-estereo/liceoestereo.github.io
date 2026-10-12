import test from "node:test";
import assert from "node:assert/strict";
import { AUDIO, DEPOSITO_FOTOS, conflictoSemana, errorDeFoto, filaNoticia, validarAudio } from "../js/logica.js";
import { leer } from "./ayudas.js";

const HOY = "2026-10-12";
const html = leer("login/index.html");

test("conflictoSemana: otra noticia vigente bloquea, la propia y las vencidas no", () => {
  const vigente = { id: 3, semana_desde: "2026-10-09" };
  assert.equal(conflictoSemana([vigente, { id: 5 }], 5, HOY), vigente);
  assert.equal(conflictoSemana([vigente], 3, HOY), null);
  assert.equal(conflictoSemana([{ id: 3, semana_desde: "2026-10-05" }], 5, HOY), null);
  assert.equal(conflictoSemana([vigente], null, HOY), vigente);
});

test("validarAudio acepta MP3 de hasta 10 MB", () => {
  assert.equal(validarAudio({ type: "audio/mpeg", size: 10485760 }), "");
  assert.notEqual(validarAudio({ type: "audio/mpeg", size: 10485761 }), "");
  assert.notEqual(validarAudio({ type: "video/mp4", size: 1000 }), "");
  assert.notEqual(validarAudio({ type: "audio/mpeg", size: 0 }), "");
});

test("errorDeFoto avisa de HEIC y de archivos que no son imagen", () => {
  assert.notEqual(errorDeFoto({ name: "foto.HEIC", type: "" }), "");
  assert.notEqual(errorDeFoto({ name: "nota.pdf", type: "application/pdf" }), "");
  assert.equal(errorDeFoto({ name: "a.jpg", type: "image/jpeg" }), "");
});

test("filaNoticia recorta, corrige la sección y fecha la noticia de la semana", () => {
  const fila = filaNoticia({ titulo: "  Hola ", seccion: "inventada", semana: true }, HOY);
  assert.equal(fila.titulo, "Hola");
  assert.equal(fila.seccion, "institucional");
  assert.equal(fila.semana_desde, HOY);
  assert.equal(filaNoticia({ titulo: "Hola", seccion: "deportes", semana: false }, HOY).semana_desde, null);
  assert.equal(filaNoticia({ titulo: "Hola", seccion: "deportes" }, HOY).seccion, "deportes");
});

test("depósitos, tope y tipos del audio coinciden con la base de datos y el formulario", () => {
  const sql = leer("supabase/002-rediseno.sql");
  const [, id, tope, tipos] = sql.match(
    /insert into storage\.buckets \(id, name, public, file_size_limit, allowed_mime_types\) values \('([^']+)', '[^']+', true, (\d+), array\[([^\]]*)\]\)/,
  );
  assert.equal(id, AUDIO.deposito);
  assert.equal(Number(tope), AUDIO.maxBytes);
  assert.deepEqual([...tipos.matchAll(/'([^']*)'/g)].map((m) => m[1]), AUDIO.tipos);
  assert.ok(leer("supabase/esquema.sql").includes(`values ('${DEPOSITO_FOTOS}', '${DEPOSITO_FOTOS}', true,`));
  assert.equal(html.match(/id="audio"[^>]*accept="([^"]+)"/)[1], AUDIO.tipos.join(","));
});

test("el formulario y su módulo tienen lo necesario", () => {
  for (const id of ["seccion", "semana", "con-audio", "audio"]) assert.ok(html.includes(`id="${id}"`), id);
  const dialogo = html.match(/<dialog id="aviso-semana">[\s\S]*?<\/dialog>/)[0];
  assert.ok(dialogo.includes("Revisar noticia de la semana"));
  const fuente = leer("js/panel-noticias.js");
  for (const texto of ["conflictoSemana(", "validarAudio(", 'imageOrientation: "from-image"']) {
    assert.ok(fuente.includes(texto), texto);
  }
  assert.ok(!fuente.includes("innerHTML"));
});
