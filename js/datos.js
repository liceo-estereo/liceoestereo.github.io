// Único módulo del sitio público que hace fetch. Nada se ejecuta al importarlo.
import { FORMSUBMIT_URL, SECCIONES, SUPABASE_KEY, SUPABASE_URL } from "./ajustes.js";

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

// Mientras la migración 002 no esté aplicada las noticias llegan sin sección: cuentan como institucionales.
export const normalizarNoticia = (noticia) => ({ ...noticia, seccion: noticia.seccion || "institucional" });

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
  return (await respuesta.json()).map(normalizarNoticia);
}

export async function leerNoticia(id) {
  const respuesta = await fetch(urlNoticia(id), { headers: CABECERAS });
  if (!respuesta.ok) throw new Error("No se pudo leer la noticia: " + respuesta.status);
  const [noticia] = await respuesta.json();
  return noticia ? normalizarNoticia(noticia) : null;
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

const recortado = (valor) => (valor || "").trim();

// La fila no lleva id ni estado: los pone la base de datos, que solo acepta el estado "abierto".
export function filaTicket(datos, codigo) {
  return {
    codigo,
    motivo: datos.motivo,
    nombre: recortado(datos.nombre),
    correo: recortado(datos.correo) || null,
    mensaje: recortado(datos.mensaje),
  };
}

export function filaPedido(datos) {
  return {
    tipo: datos.tipo,
    nombre: recortado(datos.nombre) || null,
    para: recortado(datos.para) || null,
    mensaje: recortado(datos.mensaje),
  };
}

// Resultado de una inserción: "ok", "limite" (la base de datos rechazó por demasiados envíos
// seguidos desde la misma conexión, ver supabase/004-limite-envios.sql) o "error".
export function estadoDeInsercion(aceptada, cuerpo) {
  if (aceptada) return "ok";
  return String(cuerpo?.message || "").includes("limite_mensajes") ? "limite" : "error";
}

// El visitante puede insertar pero no leer lo que inserta: por eso return=minimal.
async function insertar(tabla, fila) {
  try {
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}`, {
      method: "POST",
      headers: { ...CABECERAS, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(fila),
    });
    return estadoDeInsercion(respuesta.ok, respuesta.ok ? null : await respuesta.json().catch(() => null));
  } catch {
    return "error";
  }
}

export const guardarTicket = (fila) => insertar("tickets", fila);
export const guardarPedido = (fila) => insertar("pedidos", fila);

// Copia del ticket al correo de la emisora por FormSubmit; el código va en el asunto.
export async function enviarCorreoTicket(destino, fila) {
  if (!destino) return false;
  const mensaje = {
    _subject: `[${fila.codigo}] ${fila.motivo} · ${fila.nombre}`,
    _template: "table",
    Ticket: fila.codigo,
    Motivo: fila.motivo,
    Nombre: fila.nombre,
    Mensaje: fila.mensaje,
  };
  if (fila.correo) mensaje.email = fila.correo;
  try {
    const respuesta = await fetch(FORMSUBMIT_URL + destino, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(mensaje),
    });
    return respuesta.ok && String((await respuesta.json()).success) === "true";
  } catch {
    return false;
  }
}
