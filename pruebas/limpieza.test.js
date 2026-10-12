// Cierre del rediseño: impide que vuelvan el código viejo y las cabeceras escritas a mano.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path/posix";
import { RAIZ, existe, leer, paginas } from "./ayudas.js";

const VIEJOS = ["js/app.js", "js/admin.js", "js/config.js", "css/estilo.css"];
const publicas = paginas().filter((pagina) => pagina !== "equipo.html" && pagina !== "login/index.html");
const modulos = readdirSync(join(RAIZ.replaceAll("\\", "/"), "js")).filter((archivo) => archivo.endsWith(".js"));

test("los archivos viejos ya no existen", () => {
  for (const archivo of VIEJOS) assert.ok(!existe(archivo), archivo);
});

test("ninguna página carga los archivos viejos", () => {
  for (const pagina of paginas()) {
    const html = leer(pagina);
    for (const nombre of ["app.js", "admin.js", "config.js", "estilo.css"]) {
      assert.ok(!html.includes(nombre), `${pagina} todavía menciona ${nombre}`);
    }
  }
});

test("cada página pública tiene un h1, ninguna cabecera propia y un módulo que monta el marco", () => {
  assert.ok(publicas.length >= 8);
  for (const pagina of publicas) {
    const html = leer(pagina);
    assert.equal(html.match(/<h1/g)?.length, 1, `${pagina}: debe tener un solo h1`);
    assert.ok(!html.includes("<header") && !html.includes("<footer"), `${pagina}: cabecera o pie a mano`);
    const cargados = [...html.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(cargados.length, 1, `${pagina}: debe cargar un solo módulo`);
    assert.ok(leer(join(dirname(pagina), cargados[0])).includes("montarMarco("), `${pagina}: su módulo no monta el marco`);
  }
});

test("ningún módulo usa innerHTML ni sus parientes", () => {
  for (const archivo of modulos) {
    const fuente = leer("js/" + archivo);
    for (const prohibido of ["innerHTML", "insertAdjacentHTML", "document.write"]) {
      assert.ok(!fuente.includes(prohibido), `js/${archivo} usa ${prohibido}`);
    }
  }
});

test("la dirección de Supabase solo está en js/ajustes.js", () => {
  const conDireccion = modulos.filter((archivo) => leer("js/" + archivo).includes("supabase.co"));
  assert.deepEqual(conDireccion, ["ajustes.js"]);
});
