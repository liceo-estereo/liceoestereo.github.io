// Ayudantes de DOM compartidos. Solo arman elementos con textContent; nada aquí hace fetch ni
// toca el documento al importarse.
import { SECCIONES } from "./ajustes.js";
import { enlaceNoticia, esEnlaceSeguro, fechaLarga } from "./logica.js";

export function el(etiqueta, texto, clase) {
  const elemento = document.createElement(etiqueta);
  if (texto) elemento.textContent = texto;
  if (clase) elemento.className = clase;
  return elemento;
}

// El href solo se asigna a rutas locales (sin esquema) o a enlaces http(s).
export function enlace(texto, href, clase) {
  const a = el("a", texto, clase);
  if (typeof href === "string" && href && (!href.includes(":") || esEnlaceSeguro(href))) a.href = href;
  return a;
}

// Las fotos del panel son direcciones completas de Supabase; las del CMS, rutas que empiezan por "/".
export function rutaImagen(ruta) {
  if (esEnlaceSeguro(ruta)) return ruta;
  return typeof ruta === "string" && !ruta.includes(":") ? ruta.replace(/^\//, "") : "";
}

export function tarjetaNoticia(noticia, { grande = false } = {}) {
  const tarjeta = el("article", "", grande ? "tarjeta grande" : "tarjeta");
  const foto = rutaImagen(noticia.foto);
  if (foto) {
    const img = el("img");
    img.src = foto;
    img.alt = noticia.pie_foto || "";
    img.loading = "lazy";
    tarjeta.append(img);
  }
  const seccion = SECCIONES.find((s) => s.id === noticia.seccion);
  if (seccion) tarjeta.append(enlace(seccion.nombre, "noticias.html?seccion=" + seccion.id, "etiqueta"));
  const titulo = el("h3");
  titulo.append(enlace(noticia.titulo, enlaceNoticia(noticia)));
  tarjeta.append(titulo);
  if (noticia.entradilla) tarjeta.append(el("p", noticia.entradilla, "entradilla"));
  const fecha = el("time", fechaLarga(noticia.fecha), "meta");
  fecha.dateTime = noticia.fecha.slice(0, 10);
  tarjeta.append(fecha);
  return tarjeta;
}
