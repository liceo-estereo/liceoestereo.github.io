// Servidor estático mínimo: sirve el sitio en local (npm run servir) y lo usa la prueba de humo.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
};

export function crearServidor(raiz) {
  const base = resolve(raiz);
  return createServer(async (pedido, respuesta) => {
    try {
      const ruta = decodeURIComponent(new URL(pedido.url, "http://local").pathname);
      let archivo = resolve(join(base, normalize(ruta)));
      // Nada fuera de la carpeta del sitio, aunque la ruta traiga "..".
      if (archivo !== base && !archivo.startsWith(base + sep)) throw new Error("fuera de la raíz");
      if ((await stat(archivo)).isDirectory()) archivo = join(archivo, "index.html");
      const cuerpo = await readFile(archivo);
      respuesta.writeHead(200, {
        "Content-Type": TIPOS[extname(archivo)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      respuesta.end(cuerpo);
    } catch {
      respuesta.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      respuesta.end("No encontrado");
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const puerto = Number(process.env.PUERTO) || 8123;
  crearServidor(process.cwd()).listen(puerto, () => console.log(`Sitio en http://localhost:${puerto}`));
}
