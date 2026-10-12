// Valores públicos del proyecto. La clave "publishable" de Supabase está hecha para verse en el
// navegador; la clave "secret" o "service_role" NUNCA va en este archivo.
// La tarea programada .github/workflows/mantener-supabase.yml lee las dos primeras líneas tal como
// están escritas: cada una empieza por `export const` y termina en `";`.
export const SUPABASE_URL = "https://vklydcakwjdzjonajqeb.supabase.co";
export const SUPABASE_KEY = "sb_publishable_SX_GtFTXLrIggKdRmX51uA_Q0jNqN5s";
export const FORMSUBMIT_URL = "https://formsubmit.co/ajax/";

// La misma lista, en el mismo orden, que el check de noticias.seccion en supabase/002-rediseno.sql.
export const SECCIONES = [
  { id: "institucional", nombre: "Institucional" },
  { id: "academico", nombre: "Académico" },
  { id: "deportes", nombre: "Deportes" },
  { id: "cultura", nombre: "Cultura" },
  { id: "emisora", nombre: "Emisora" },
  { id: "local", nombre: "Local" },
  { id: "nacional", nombre: "Nacional" },
  { id: "internacional", nombre: "Internacional" },
  { id: "opinion", nombre: "Opinión" },
];
