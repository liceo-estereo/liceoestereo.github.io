import test from "node:test";
import assert from "node:assert/strict";
import { leer } from "./ayudas.js";

test("la tarea programada lee la configuración de js/ajustes.js", () => {
  const tarea = leer(".github/workflows/mantener-supabase.yml");
  assert.ok(tarea.includes("js/ajustes.js"));
  assert.ok(tarea.includes('export const SUPABASE_URL = "'));
  assert.ok(tarea.includes('export const SUPABASE_KEY = "'));
  assert.ok(!tarea.includes("js/config.js"));
});

test("js/ajustes.js tiene las dos líneas con la forma que la tarea extrae", () => {
  const ajustes = leer("js/ajustes.js");
  assert.match(ajustes, /^export const SUPABASE_URL = ".+";$/m);
  assert.match(ajustes, /^export const SUPABASE_KEY = ".+";$/m);
});

test("README.md tiene las secciones de la guía de relevo", () => {
  const guia = leer("README.md");
  for (const titulo of [
    "## Qué es este sitio",
    "## Cómo publicar una noticia",
    "## Cómo marcar que estamos en vivo",
    "## Cómo cambiar la programación, el equipo o las redes",
    "## Cómo dar o quitar acceso a un editor",
    "## Pruebas y sitio local",
    "## Cómo publicar un cambio del sitio",
  ]) {
    assert.ok(guia.includes(titulo + "\n"), titulo);
  }
});

test("README.md no menciona claves secretas", () => {
  const guia = leer("README.md");
  assert.ok(!guia.includes("service_role"));
  assert.ok(!guia.includes("sb_secret_"));
});
