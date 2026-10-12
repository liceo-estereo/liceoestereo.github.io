// Antes de publicar: busca marcadores entre corchetes ([NOMBRE OFICIAL DEL COLEGIO]) que queden
// en los textos legales. Uso: node herramientas/revisar-lanzamiento.js [archivo]  (legal.html por defecto)
// Termina con código 1 si queda alguno y con 0 si no queda ninguno.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function pendientes(texto) {
  return texto.match(/\[[A-ZÁÉÍÓÚÑ][^\]\n]{3,}\]/g) || [];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const archivo = process.argv[2] || "legal.html";
  const encontrados = pendientes(readFileSync(archivo, "utf8"));
  if (encontrados.length) {
    console.log(`${archivo}: quedan ${encontrados.length} marcadores por completar`);
    for (const marcador of new Set(encontrados)) console.log("  " + marcador);
    process.exit(1);
  }
  console.log(`${archivo}: sin marcadores pendientes`);
}
