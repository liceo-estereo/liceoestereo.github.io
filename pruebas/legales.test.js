import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pendientes } from "../herramientas/revisar-lanzamiento.js";
import { enlacesLegales } from "../js/logica.js";
import { RAIZ, existe, leer } from "./ayudas.js";

const ANCLAS = ["terminos", "datos", "responsabilidad", "aclaraciones"];

test("legal.html sigue el esqueleto y tiene las cuatro secciones", () => {
  const html = leer("legal.html");
  assert.equal(html.match(/<h1/g).length, 1);
  assert.deepEqual([...html.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]), ["js/legal.js"]);
  assert.ok(!html.includes("<header") && !html.includes("<footer"));
  for (const ancla of ANCLAS) assert.equal(html.split(`<section id="${ancla}"`).length, 2, ancla);
});

test("mapa.html enlaza todas las páginas públicas", () => {
  const html = leer("mapa.html");
  const destinos = ["index.html", "noticias.html", "programacion.html", "nosotros.html", "contacto.html"];
  for (const destino of [...destinos, ...ANCLAS.map((a) => "legal.html#" + a)]) {
    assert.ok(html.includes(`href="${destino}"`), destino);
  }
});

test("pendientes reconoce solo los marcadores en mayúsculas", () => {
  assert.equal(pendientes("Hola [NOMBRE OFICIAL DEL COLEGIO] y [FECHA]").length, 2);
  assert.deepEqual(pendientes("la nota [1] y el arreglo [a, b]"), []);
});

test("revisar-lanzamiento termina con 1 si hay marcadores y con 0 si no", (t) => {
  const carpeta = mkdtempSync(join(tmpdir(), "legal-"));
  t.after(() => rmSync(carpeta, { recursive: true, force: true }));
  const correr = (nombre, contenido) => {
    writeFileSync(join(carpeta, nombre), contenido);
    return spawnSync(process.execPath, ["herramientas/revisar-lanzamiento.js", join(carpeta, nombre)], { cwd: RAIZ }).status;
  };
  assert.equal(correr("con.html", "<p>Vigente desde [FECHA]</p>"), 1);
  assert.equal(correr("sin.html", "<p>Vigente desde el 12 de octubre</p>"), 0);
});

test("los enlaces legales del pie apuntan a archivos y anclas que existen", () => {
  const legal = leer("legal.html");
  for (const { href } of enlacesLegales()) {
    const [archivo, ancla] = href.split("#");
    assert.ok(existe(archivo), archivo);
    if (ancla) assert.ok(legal.includes(`<section id="${ancla}"`), ancla);
  }
});
