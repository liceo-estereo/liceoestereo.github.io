import test from "node:test";
import assert from "node:assert/strict";
import { pestanasPara } from "../js/logica.js";
import { leer } from "./ayudas.js";

const html = leer("login/index.html");
const panel = leer("js/panel.js");

test("pestanasPara: Tickets solo para administradores", () => {
  assert.deepEqual(pestanasPara(false), ["noticias", "vivo", "mensajes"]);
  assert.deepEqual(pestanasPara(true), ["noticias", "vivo", "tickets", "mensajes"]);
});

test("supabase-js se carga con la dirección y el integrity de herramientas/cdn.json", () => {
  const { supabase } = JSON.parse(leer("herramientas/cdn.json"));
  const etiqueta = html.match(/<script src="https:\/\/cdn\.jsdelivr\.net[^>]*>/)[0];
  assert.ok(etiqueta.includes(`src="${supabase.url}"`));
  assert.ok(etiqueta.includes(`integrity="${supabase.integrity}"`));
  assert.ok(etiqueta.includes('crossorigin="anonymous"'));
});

test("la sesión vive en sessionStorage", () => {
  assert.ok(panel.includes("storage: sessionStorage"));
  assert.ok(!panel.includes("localStorage"));
});

test("el panel tiene sus cuatro pestañas y ya no carga el código viejo", () => {
  assert.ok(html.includes('role="tablist"'));
  for (const id of ["pestana-noticias", "pestana-vivo", "pestana-tickets", "pestana-mensajes"]) {
    assert.ok(html.includes(`id="${id}"`), id);
  }
  assert.ok(html.includes('<meta name="robots" content="noindex">'));
  assert.ok(!html.includes("js/admin.js") && !html.includes("js/config.js"));
});

test("el rol sale de la base de datos y no hay innerHTML", () => {
  assert.ok(panel.includes('rpc("es_admin")'));
  assert.ok(panel.includes("pestanasPara("));
  assert.ok(!panel.includes("innerHTML"));
  assert.ok(leer("supabase/002-rediseno.sql").includes("function es_admin()"));
});

test("css/panel.css no tiene colores literales", () => {
  assert.deepEqual(leer("css/panel.css").match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) || [], []);
});
