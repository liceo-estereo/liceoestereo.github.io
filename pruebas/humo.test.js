// Prueba de humo: levanta el servidor local y pide el inicio de verdad.
import test from "node:test";
import assert from "node:assert/strict";
import { crearServidor } from "../herramientas/servidor.js";
import { RAIZ } from "./ayudas.js";

test("el sitio se sirve desde la raíz del proyecto", async (t) => {
  const servidor = crearServidor(RAIZ);
  await new Promise((listo) => servidor.listen(0, "127.0.0.1", listo));
  t.after(() => servidor.close());
  const base = `http://127.0.0.1:${servidor.address().port}`;

  const inicio = await fetch(base + "/");
  assert.equal(inicio.status, 200);
  assert.match(inicio.headers.get("content-type"), /text\/html/);
  assert.match(await inicio.text(), /<title>[^<]+<\/title>/);

  const datos = await fetch(base + "/datos/emisora.json");
  assert.equal(datos.status, 200);
  assert.equal(typeof (await datos.json()).lema, "string");

  assert.equal((await fetch(base + "/no-existe.html")).status, 404);
  assert.equal((await fetch(base + "/..%2F..%2Fsecreto.txt")).status, 404);
});
