import test from "node:test";
import assert from "node:assert/strict";
import { limpiarEmisora, normalizarNoticia, urlNoticia, urlNoticias, urlTransmision } from "../js/datos.js";
import { leer } from "./ayudas.js";

const CLAVES_NUEVAS = ["resena", "redes", "videos", "podcasts"];

test("limpiarEmisora descarta la fila sin inicio y no lanza", () => {
  const completa = { dia: "lunes", inicio: "09:00", fin: "10:00", programa: "Recreo" };
  const limpia = limpiarEmisora({ parrilla: [{ dia: "lunes", fin: "10:00", programa: "Sin hora" }, completa, null] });
  assert.deepEqual(limpia.parrilla, [completa]);
});

test("limpiarEmisora de un objeto vacío devuelve arreglos vacíos", () => {
  const limpia = limpiarEmisora({});
  for (const clave of ["parrilla", "especiales", "junta", "miembros", "redes", "videos", "podcasts"]) {
    assert.deepEqual(limpia[clave], [], clave);
  }
  assert.equal(limpia.lema, "");
  assert.deepEqual(limpiarEmisora(null).parrilla, []);
});

test("limpiarEmisora no pierde filas válidas del archivo real", () => {
  const crudo = JSON.parse(leer("datos/emisora.json"));
  const limpia = limpiarEmisora(crudo);
  assert.equal(limpia.parrilla.length, crudo.parrilla.length);
  assert.equal(limpia.miembros.length, crudo.miembros.length);
});

test("urlNoticias solo acepta secciones conocidas y límites enteros", () => {
  const url = urlNoticias({ seccion: "deportes", limite: 5 });
  assert.ok(url.includes("seccion=eq.deportes"));
  assert.ok(url.includes("limit=5"));
  assert.ok(!urlNoticias({ seccion: "x'; drop table" }).includes("seccion="));
  assert.ok(!urlNoticias({ limite: "5; x" }).includes("limit="));
  assert.ok(!urlNoticias().includes("seccion="));
});

test("urlNoticia rechaza ids que no son enteros positivos", () => {
  assert.throws(() => urlNoticia("7; delete"), RangeError);
  assert.throws(() => urlNoticia(0), RangeError);
  assert.ok(urlNoticia("7").endsWith("id=eq.7"));
  assert.ok(urlTransmision().endsWith("transmision?select=*&id=eq.true"));
});

test("una noticia sin sección cuenta como institucional", () => {
  assert.equal(normalizarNoticia({ id: 1 }).seccion, "institucional");
  assert.equal(normalizarNoticia({ id: 1, seccion: "deportes" }).seccion, "deportes");
  assert.deepEqual(normalizarNoticia({ id: 1 }).anexos, []);
});

test("las claves nuevas existen en los datos y en el formulario del CMS", () => {
  const crudo = JSON.parse(leer("datos/emisora.json"));
  const formulario = leer(".pages.yml");
  for (const clave of CLAVES_NUEVAS) {
    assert.ok(clave in crudo, `falta ${clave} en datos/emisora.json`);
    assert.ok(formulario.includes("- name: " + clave + "\n"), `falta el campo ${clave} en .pages.yml`);
  }
});
