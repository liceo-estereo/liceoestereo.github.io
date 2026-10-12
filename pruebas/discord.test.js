// Revisa como texto el reenvío de pedidos a Discord. Ninguna prueba se conecta a Supabase ni a Discord.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, leer } from "./ayudas.js";

const sql = leer("supabase/003-discord.sql");

test("ningún archivo del repositorio trae una dirección real de webhook", () => {
  const real = /discord(?:app)?\.com\/api\/webhooks\/\d/;
  for (const carpeta of ["supabase", "js", "pruebas", "herramientas"]) {
    for (const archivo of readdirSync(join(RAIZ, carpeta))) {
      assert.ok(!real.test(leer(`${carpeta}/${archivo}`)), `${carpeta}/${archivo} contiene un webhook`);
    }
  }
  for (const archivo of ["README.md", "CLAUDE.md"]) assert.ok(!real.test(leer(archivo)), archivo);
});

test("el secreto vive en una tabla sin acceso desde el navegador", () => {
  assert.ok(sql.includes("create table if not exists secretos ("));
  assert.ok(sql.includes("alter table secretos enable row level security;"));
  assert.ok(!/create policy [^;]* on secretos/.test(sql), "secretos no debe tener políticas");
});

test("el aviso sale solo de pedidos, no menciona a nadie y no impide guardar", () => {
  assert.ok(sql.includes("after insert on pedidos for each row execute function avisar_pedido_discord();"));
  assert.ok(!/after insert on tickets/.test(sql), "los tickets no se envían a Discord");
  assert.ok(sql.includes("'allowed_mentions', jsonb_build_object('parse', jsonb_build_array())"));
  assert.ok(sql.includes("exception when others then"));
});

test("el archivo se puede ejecutar dos veces", () => {
  assert.ok(sql.includes("create extension if not exists pg_net"));
  assert.ok(sql.includes("create or replace function avisar_pedido_discord()"));
  assert.ok(sql.includes("drop trigger if exists pedidos_a_discord on pedidos;"));
});

test("el formulario de pedidos ya no depende de WhatsApp", () => {
  const contacto = leer("js/contacto.js");
  assert.ok(!contacto.includes("wa.me") && !contacto.toLowerCase().includes("whatsapp"));
  assert.ok(!leer(".pages.yml").includes("- name: whatsapp"));
});
