import test from "node:test";
import assert from "node:assert/strict";
import { SECCIONES } from "../js/ajustes.js";
import { enlacesCompartir, nombreSeccion, relacionadas, tiempoLectura } from "../js/logica.js";
import { leer } from "./ayudas.js";

test("tiempoLectura redondea hacia arriba y nunca baja de uno", () => {
  assert.equal(tiempoLectura(Array(450).fill("palabra").join(" ")), 3);
  assert.equal(tiempoLectura(""), 1);
  assert.equal(tiempoLectura(null), 1);
});

test("enlacesCompartir codifica el título y la dirección", () => {
  const enlaces = enlacesCompartir("https://ejemplo.co/noticia.html?id=7", "Título & más");
  for (const clave of ["whatsapp", "facebook", "x"]) assert.ok(enlaces[clave].startsWith("https://"), clave);
  assert.ok(enlaces.x.includes("T%C3%ADtulo%20%26%20m%C3%A1s"));
  assert.ok(enlaces.facebook.includes(encodeURIComponent("https://ejemplo.co/noticia.html?id=7")));
});

test("relacionadas: misma sección, sin la propia, recientes primero, máximo tres", () => {
  const noticia = { id: 1, seccion: "deportes", fecha: "2026-10-10" };
  const todas = [
    noticia,
    { id: 2, seccion: "deportes", fecha: "2026-10-01" },
    { id: 3, seccion: "cultura", fecha: "2026-10-09" },
    { id: 4, seccion: "deportes", fecha: "2026-10-08" },
    { id: 5, seccion: "deportes", fecha: "2026-09-01" },
    { id: 6, seccion: "deportes", fecha: "2026-10-05" },
  ];
  assert.deepEqual(relacionadas(noticia, todas).map((n) => n.id), [4, 6, 2]);
});

test("nombreSeccion", () => {
  assert.equal(nombreSeccion("opinion", SECCIONES), "Opinión");
  assert.equal(nombreSeccion("inventada", SECCIONES), "");
});

test("noticia.html sigue el esqueleto del proyecto", () => {
  const html = leer("noticia.html");
  assert.ok(html.includes('<link rel="stylesheet" href="css/sitio.css">'));
  assert.deepEqual([...html.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]), ["js/noticia.js"]);
  assert.equal(html.match(/<h1/g).length, 1);
  assert.ok(!html.includes("<header") && !html.includes("<footer"));
});

test("js/noticia.js monta el marco, lee la noticia y no usa innerHTML", () => {
  const fuente = leer("js/noticia.js");
  assert.ok(fuente.includes("montarMarco("));
  assert.ok(fuente.includes("leerNoticia("));
  assert.ok(!fuente.includes("innerHTML"));
});
