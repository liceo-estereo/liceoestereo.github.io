import test from "node:test";
import assert from "node:assert/strict";
import { ESTADOS_TICKET, agruparTickets, caducados, nombreEstado, pedidosDeHoy } from "../js/logica.js";
import { leer } from "./ayudas.js";

test("agruparTickets devuelve una lista por estado y omite los desconocidos", () => {
  const grupos = agruparTickets([
    { id: 1, estado: "abierto", creado: "2026-10-12T10:00:00Z" },
    { id: 2, estado: "cerrado", creado: "2026-10-11T10:00:00Z" },
    { id: 3, estado: "otro", creado: "2026-10-10T10:00:00Z" },
  ]);
  assert.deepEqual(Object.keys(grupos), ["abierto", "en_tramite", "cerrado"]);
  assert.equal(grupos.abierto.length, 1);
  assert.equal(grupos.cerrado.length, 1);
  assert.equal(grupos.en_tramite.length, 0);
});

test("pedidosDeHoy usa la fecha local de cada pedido", () => {
  const hoy = { id: 1, creado: new Date(2026, 9, 12, 10).toISOString() };
  const ayer = { id: 2, creado: new Date(2026, 9, 11, 10).toISOString() };
  assert.deepEqual(pedidosDeHoy([ayer, hoy], "2026-10-12"), [hoy]);
});

test("caducados devuelve los ids con más de 30 días", () => {
  const pedidos = [
    { id: 1, creado: "2026-09-01T10:00:00" },
    { id: 2, creado: "2026-10-01T10:00:00" },
  ];
  assert.deepEqual(caducados(pedidos, "2026-10-12"), [1]);
});

test("nombreEstado", () => {
  assert.equal(nombreEstado("en_tramite"), "En trámite");
  assert.equal(nombreEstado("otro"), "");
});

test("los contenedores y los módulos de tickets y mensajes", () => {
  const html = leer("login/index.html");
  assert.ok(html.includes('id="muro-tickets"') && html.includes('id="lista-mensajes"'));
  const tickets = leer("js/panel-tickets.js");
  const mensajes = leer("js/panel-mensajes.js");
  assert.ok(tickets.includes('from("tickets")'));
  assert.ok(mensajes.includes('from("pedidos")'));
  assert.ok(!tickets.includes("innerHTML") && !mensajes.includes("innerHTML"));
});

test("ESTADOS_TICKET coincide con el check de la base de datos", () => {
  const [, dentro] = leer("supabase/002-rediseno.sql").match(/check \(estado in \(([^)]*)\)\)/);
  assert.deepEqual([...dentro.matchAll(/'([^']*)'/g)].map((m) => m[1]), ESTADOS_TICKET);
});
