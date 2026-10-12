import test from "node:test";
import assert from "node:assert/strict";
import { estadoDeInsercion, filaPedido, filaTicket } from "../js/datos.js";
import {
  LIMITES,
  MOTIVOS,
  TIPOS_PEDIDO,
  nuevoTicket,
  resultadoEnvio,
  validarPedido,
  validarTicket,
} from "../js/logica.js";
import { leer } from "./ayudas.js";

const sql = leer("supabase/002-rediseno.sql");
const html = leer("contacto.html");
const lista = (texto) => [...texto.matchAll(/'([^']*)'/g)].map((m) => m[1]);

test("un ticket válido pasa sin errores", () => {
  assert.deepEqual(validarTicket({ nombre: "Ana", correo: "", motivo: "Queja", mensaje: "Hola" }), { ok: true, errores: [] });
});

test("cada campo inválido produce un error", () => {
  const { ok, errores } = validarTicket({ nombre: "", correo: "", motivo: "Otro", mensaje: "x".repeat(2001) });
  assert.equal(ok, false);
  assert.equal(errores.length, 3);
  assert.equal(validarPedido({ tipo: "Dedicatoria", mensaje: "   " }).ok, false);
  assert.equal(validarPedido({ tipo: "Dedicatoria", mensaje: "Un saludo" }).ok, true);
});

test("filaTicket recorta, anula el correo vacío y no lleva id ni estado", () => {
  const fila = filaTicket({ nombre: " Ana ", correo: "", motivo: "Queja", mensaje: "Hola" }, "LT-261012-AB12");
  assert.equal(fila.nombre, "Ana");
  assert.equal(fila.correo, null);
  assert.equal(fila.codigo, "LT-261012-AB12");
  assert.ok(!("id" in fila) && !("estado" in fila));
  assert.deepEqual(filaPedido({ tipo: "Dedicatoria", nombre: "", para: " Sofía ", mensaje: " Hola " }), {
    tipo: "Dedicatoria",
    nombre: null,
    para: "Sofía",
    mensaje: "Hola",
  });
});

test("resultadoEnvio: basta con que una de las dos vías funcione", () => {
  assert.equal(resultadoEnvio(false, false), "error");
  assert.equal(resultadoEnvio(true, false), "ok");
  assert.equal(resultadoEnvio(false, true), "ok");
});

test("las inserciones no piden leer y contacto.html ya no carga el código viejo", () => {
  assert.ok(leer("js/datos.js").includes("return=minimal"));
  assert.deepEqual([...html.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]), ["js/contacto.js"]);
  assert.ok(!html.includes("js/app.js"));
});

test("listas, topes y formato del ticket coinciden con la base de datos y el formulario", () => {
  assert.deepEqual(lista(sql.match(/check \(motivo in \(([^)]*)\)\)/)[1]), MOTIVOS);
  assert.deepEqual(lista(sql.match(/check \(tipo in \(([^)]*)\)\)/)[1]), TIPOS_PEDIDO);

  const tablaTickets = sql.slice(sql.indexOf("create table if not exists tickets"), sql.indexOf("alter table tickets"));
  const tablaPedidos = sql.slice(sql.indexOf("create table if not exists pedidos"), sql.indexOf("alter table pedidos"));
  const tope = (tabla, columna) => {
    const patron = new RegExp(`char_length\\(${columna}\\) (?:between 1 and|<=) (\\d+)`);
    return Number(tabla.match(patron)[1]);
  };
  assert.equal(tope(tablaTickets, "nombre"), LIMITES.nombre);
  assert.equal(tope(tablaTickets, "correo"), LIMITES.correo);
  assert.equal(tope(tablaTickets, "mensaje"), LIMITES.mensajeTicket);
  assert.equal(tope(tablaPedidos, "mensaje"), LIMITES.mensajePedido);

  const maxlength = (id) => Number(html.match(new RegExp(`id="${id}"[^>]*maxlength="(\\d+)"`))[1]);
  assert.deepEqual(
    ["ticket-nombre", "ticket-correo", "ticket-mensaje", "pedido-nombre", "pedido-para", "pedido-mensaje"].map(maxlength),
    [80, 120, 2000, 80, 80, 600],
  );

  const [, formato] = sql.match(/codigo ~ '([^']+)'/);
  assert.match(nuevoTicket(), new RegExp(formato));
});

test("estadoDeInsercion distingue el límite de envíos de un fallo cualquiera", () => {
  assert.equal(estadoDeInsercion(true, null), "ok");
  assert.equal(estadoDeInsercion(false, { code: "P0001", message: "limite_mensajes" }), "limite");
  assert.equal(estadoDeInsercion(false, { message: "new row violates row-level security policy" }), "error");
  assert.equal(estadoDeInsercion(false, null), "error");
});

test("el límite de envíos cubre pedidos y tickets y no guarda la dirección IP", () => {
  const limite = leer("supabase/004-limite-envios.sql");
  assert.ok(limite.includes("before insert on pedidos for each row execute function limitar_envios();"));
  assert.ok(limite.includes("before insert on tickets for each row execute function limitar_envios();"));
  assert.ok(limite.includes("raise exception 'limite_mensajes'"));
  assert.ok(limite.includes("md5("));
  assert.ok(limite.includes("alter table envios enable row level security;"));
  assert.ok(!/create policy [^;]* on envios/.test(limite));
  assert.ok(leer("js/contacto.js").includes('estado === "limite"'));
});
