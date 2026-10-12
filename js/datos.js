// Único módulo del sitio público que hace fetch. Nada se ejecuta al importarlo.
import { SECCIONES, SUPABASE_KEY, SUPABASE_URL } from "./ajustes.js";

export const CABECERAS = { apikey: SUPABASE_KEY };

const texto = (valor) => (typeof valor === "string" ? valor : "");

// Filas de `lista` que traen texto no vacío en todos los `campos`. Una fila incompleta del CMS
// se descarta aquí para que nunca tumbe la página.
const filasCon = (lista, ...campos) =>
  (Array.isArray(lista) ? lista : []).filter(
    (fila) => fila && campos.every((campo) => typeof fila[campo] === "string" && fila[campo].trim()),
  );

export function limpiarEmisora(crudo) {
  const c = crudo || {};
  const limpia = {};
  for (const clave of ["lema", "contacto", "whatsapp", "telefono", "direccion", "stream", "resena"]) {
    limpia[clave] = texto(c[clave]);
  }
  limpia.parrilla = filasCon(c.parrilla, "dia", "inicio", "fin", "programa");
  limpia.especiales = filasCon(c.especiales, "fecha", "inicio", "fin", "titulo");
  limpia.junta = filasCon(c.junta, "nombre");
  limpia.miembros = filasCon(c.miembros, "nombre");
  limpia.redes = filasCon(c.redes, "nombre", "enlace");
  limpia.videos = filasCon(c.videos, "titulo", "enlace");
  limpia.podcasts = filasCon(c.podcasts, "titulo", "enlace");
  return limpia;
}

export function urlNoticias({ seccion, limite } = {}) {
  let url = SUPABASE_URL + "/rest/v1/noticias?select=*&order=fecha.desc,id.desc";
  if (SECCIONES.some((s) => s.id === seccion)) url += "&seccion=eq." + seccion;
  if (Number.isInteger(limite) && limite > 0) url += "&limit=" + limite;
  return url;
}

export function urlNoticia(id) {
  if (!/^[1-9]\d*$/.test(String(id))) throw new RangeError("El id de la noticia debe ser un entero positivo");
  return SUPABASE_URL + "/rest/v1/noticias?select=*&id=eq." + id;
}

export const urlTransmision = () => SUPABASE_URL + "/rest/v1/transmision?select=*&id=eq.true";

export async function leerEmisora() {
  const respuesta = await fetch("datos/emisora.json");
  return limpiarEmisora(await respuesta.json());
}

export async function leerNoticias(opciones) {
  const respuesta = await fetch(urlNoticias(opciones), { headers: CABECERAS });
  if (!respuesta.ok) throw new Error("No se pudieron leer las noticias: " + respuesta.status);
  return respuesta.json();
}

export async function leerNoticia(id) {
  const respuesta = await fetch(urlNoticia(id), { headers: CABECERAS });
  if (!respuesta.ok) throw new Error("No se pudo leer la noticia: " + respuesta.status);
  return (await respuesta.json())[0] || null;
}

// Sin transmisión no hay aviso de "en vivo": cualquier fallo se trata como "no estamos en vivo".
export async function leerTransmision() {
  try {
    const respuesta = await fetch(urlTransmision(), { headers: CABECERAS });
    return respuesta.ok ? (await respuesta.json())[0] || null : null;
  } catch {
    return null;
  }
}
