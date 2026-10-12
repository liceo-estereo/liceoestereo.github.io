import test from "node:test";
import assert from "node:assert/strict";
import { enlacesLegales, esEnlaceSeguro, fechaLarga, inicial, menuPrincipal } from "../js/logica.js";
import { leer } from "./ayudas.js";

const css = leer("css/sitio.css");
const raiz = css.match(/:root\s*\{[^}]*\}/)[0];
const HEX = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

test("variables de color del sistema de diseño", () => {
  const esperadas = {
    "--fondo": "#F7F8F5",
    "--superficie": "#FFFFFF",
    "--borde": "#DDE2D8",
    "--tinta": "#141A14",
    "--tinta-suave": "#55604F",
    "--verde": "#0F470C",
    "--verde-claro": "#E6EFE3",
    "--senal": "#E8B321",
    "--error": "#A12A1B",
  };
  for (const [variable, valor] of Object.entries(esperadas)) {
    assert.ok(raiz.includes(`${variable}: ${valor};`), `${variable} debe ser ${valor}`);
  }
});

test("ningún color literal fuera de :root", () => {
  assert.ok(raiz.match(HEX).length > 0);
  assert.deepEqual(css.replace(raiz, "").match(HEX) || [], []);
});

test("menuPrincipal marca solo la página actual", () => {
  const menu = menuPrincipal("noticias.html");
  assert.deepEqual(menu.map((e) => e.texto), ["Inicio", "Noticias", "Programación", "Nosotros", "Contacto"]);
  assert.deepEqual(menu.filter((e) => e.actual).map((e) => e.texto), ["Noticias"]);
});

test("esEnlaceSeguro solo acepta http y https", () => {
  for (const malo of ["javascript:alert(1)", "", undefined, "data:text/html,x", "//ejemplo.co"]) {
    assert.equal(esEnlaceSeguro(malo), false, String(malo));
  }
  assert.equal(esEnlaceSeguro("https://instagram.com/x"), true);
});

test("el marco y la vista no usan innerHTML y se pueden importar sin DOM", async () => {
  for (const archivo of ["js/marco.js", "js/vista.js"]) {
    const fuente = leer(archivo);
    for (const prohibido of ["innerHTML", "insertAdjacentHTML", "document.write"]) {
      assert.ok(!fuente.includes(prohibido), `${archivo} usa ${prohibido}`);
    }
  }
  const marco = await import("../js/marco.js");
  assert.equal(typeof marco.montarMarco, "function");
});

test("fechaLarga, inicial y enlaces legales", () => {
  assert.ok(fechaLarga("2026-10-12").includes("12 de octubre de 2026"));
  assert.equal(inicial(""), "?");
  assert.equal(inicial(" tomas "), "T");
  assert.equal(enlacesLegales().length, 5);
});
