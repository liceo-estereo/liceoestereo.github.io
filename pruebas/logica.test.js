import test from "node:test";
import assert from "node:assert/strict";
import {
  DIAS,
  alAire,
  enlaceNoticia,
  especialAhora,
  fechaLocalISO,
  hhmm,
  jornada,
  nombreEspecial,
  nuevoTicket,
  numeroWhatsapp,
  parrafos,
  proximoHoy,
} from "../js/logica.js";

const PARRILLA = [{ dia: "lunes", inicio: "14:00", fin: "15:00", programa: "Conexión Tarde" }];
const ESPECIALES = [{ fecha: "2026-10-12", inicio: "13:00", fin: "14:00", tipo: "Entrevista", titulo: "Rectoría" }];

test("alAire respeta el día y el intervalo, con el fin excluido", () => {
  const bloque = { dia: "lunes", inicio: "9:30", fin: "10:00" };
  assert.equal(alAire(bloque, "lunes", "09:45"), true);
  assert.equal(alAire(bloque, "lunes", "10:00"), false);
  assert.equal(alAire(bloque, "martes", "09:45"), false);
});

test("nuevoTicket toma la fecha de la hora local, no de UTC", () => {
  assert.match(nuevoTicket(new Date(2026, 9, 12, 23, 30), () => 0.5), /^LT-261012-[A-Z0-9]{4}$/);
});

test("proximoHoy cuenta los especiales de la fecha", () => {
  const siguiente = proximoHoy(PARRILLA, ESPECIALES, "lunes", "2026-10-12", "12:50");
  assert.equal(siguiente.inicio, "13:00");
  assert.equal(siguiente.programa, "Entrevista: Rectoría");
});

test("proximoHoy devuelve null cuando ya no queda nada hoy", () => {
  assert.equal(proximoHoy(PARRILLA, ESPECIALES, "lunes", "2026-10-12", "18:00"), null);
  assert.equal(proximoHoy([], [], "lunes", "2026-10-12", "06:00"), null);
});

test("numeroWhatsapp deja solo dígitos y antepone 57 a los celulares", () => {
  assert.equal(numeroWhatsapp("322 000 0000"), "573220000000");
  assert.equal(numeroWhatsapp("+57 322 000 0000"), "573220000000");
  assert.equal(numeroWhatsapp(""), "");
  assert.equal(numeroWhatsapp(undefined), "");
});

test("especialAhora solo devuelve el especial de esa fecha y hora", () => {
  assert.equal(especialAhora(ESPECIALES, "2026-10-12", "13:30"), ESPECIALES[0]);
  assert.equal(especialAhora(ESPECIALES, "2026-10-13", "13:30"), undefined);
  assert.equal(especialAhora(ESPECIALES, "2026-10-12", "14:00"), undefined);
});

test("ayudantes de formato", () => {
  assert.equal(DIAS[1], "lunes");
  assert.equal(hhmm(" 9:30 "), "09:30");
  assert.equal(fechaLocalISO(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
  assert.equal(jornada("9:30"), "Mañana");
  assert.equal(jornada("12:00"), "Tarde");
  assert.equal(nombreEspecial({ titulo: "Rectoría" }), "Rectoría");
  assert.deepEqual(parrafos(" uno \n\n dos "), ["uno", "dos"]);
  assert.deepEqual(parrafos(null), []);
  assert.equal(enlaceNoticia({ id: 7 }), "noticia.html?id=7");
});
