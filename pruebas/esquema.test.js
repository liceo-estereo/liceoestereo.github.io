// Revisa la migración como texto. Ninguna prueba se conecta a Supabase.
import test from "node:test";
import assert from "node:assert/strict";
import { SECCIONES } from "../js/ajustes.js";
import { leer } from "./ayudas.js";

const sql = leer("supabase/002-rediseno.sql");
const lineas = sql.split("\n");

// "check (columna in ('a', 'b'))" -> ["a", "b"]
function listaDelCheck(columna) {
  const [, dentro] = sql.match(new RegExp("check \\(" + columna + " in \\(([^)]*)\\)\\)"));
  return [...dentro.matchAll(/'([^']*)'/g)].map(([, valor]) => valor);
}

test("columnas nuevas, agregadas de forma repetible", () => {
  for (const columna of ["seccion", "semana_desde", "audio"]) {
    assert.ok(sql.includes(`alter table noticias add column if not exists ${columna} `), columna);
  }
  assert.ok(sql.includes("alter table editores add column if not exists admin "));
});

test("las secciones del check son las de js/ajustes.js, en el mismo orden", () => {
  assert.deepEqual(listaDelCheck("seccion"), SECCIONES.map((s) => s.id));
});

test("tablas nuevas con seguridad por fila", () => {
  for (const tabla of ["transmision", "tickets", "pedidos"]) {
    assert.ok(sql.includes(`create table if not exists ${tabla} (`), tabla);
    assert.ok(sql.includes(`alter table ${tabla} enable row level security;`), tabla);
  }
});

test("cada create policy va precedido por su drop policy if exists", () => {
  const politicas = lineas.map((linea, i) => [linea, i]).filter(([linea]) => linea.startsWith("create policy"));
  assert.ok(politicas.length > 0);
  for (const [linea, i] of politicas) {
    const [, nombre, tabla] = linea.match(/^create policy ("[^"]+") on ([\w.]+) /);
    assert.equal(lineas[i - 1], `drop policy if exists ${nombre} on ${tabla};`);
  }
});

test("nadie sin sesión puede leer tickets ni pedidos", () => {
  const lecturas = lineas.filter((linea) => /^create policy .* on (tickets|pedidos) for select /.test(linea));
  assert.ok(lecturas.length >= 2);
  for (const linea of lecturas) assert.ok(linea.includes(" to authenticated "), linea);
});
