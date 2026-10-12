// Contacto: pedidos de canciones y dedicatorias (se guardan y, si hay número, abren WhatsApp) y
// PQRSD con número de ticket (se guardan y además se envían al correo).
import { enviarCorreoTicket, filaPedido, filaTicket, guardarPedido, guardarTicket } from "./datos.js";
import {
  MOTIVOS,
  TIPOS_PEDIDO,
  nuevoTicket,
  numeroWhatsapp,
  resultadoEnvio,
  textoWhatsapp,
  validarPedido,
  validarTicket,
} from "./logica.js";
import { montarMarco } from "./marco.js";
import { el, enlace } from "./vista.js";

function llenarOpciones(select, opciones) {
  for (const opcion of opciones) select.append(el("option", opcion));
}

function avisar(parrafo, texto, esError) {
  parrafo.textContent = texto;
  parrafo.classList.toggle("error", Boolean(esError));
}

function pintarDatos(emisora, whatsapp) {
  const datos = document.querySelector("#datos-contacto");
  const filas = [];
  if (emisora.contacto) filas.push(["Correo", enlace(emisora.contacto, "mailto:" + emisora.contacto)]);
  if (whatsapp) filas.push(["WhatsApp", enlace(emisora.whatsapp, "https://wa.me/" + whatsapp)]);
  if (emisora.telefono) filas.push(["Teléfono", emisora.telefono]);
  if (emisora.direccion) filas.push(["Dirección", emisora.direccion]);
  for (const [nombre, valor] of filas) {
    const dd = el("dd");
    dd.append(valor);
    datos.append(el("dt", nombre), dd);
  }
}

function prepararPedidos(whatsapp) {
  const form = document.querySelector("#form-pedido");
  const aviso = document.querySelector("#aviso-pedido");
  const boton = form.querySelector("button");
  form.onsubmit = async (evento) => {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(form));
    const { ok, errores } = validarPedido(datos);
    if (!ok) return avisar(aviso, errores.join(" "), true);
    boton.disabled = true;
    await guardarPedido(filaPedido(datos)); // si falla, el pedido igual puede salir por WhatsApp
    if (whatsapp) {
      window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(textoWhatsapp(datos))}`, "_blank", "noopener");
    }
    avisar(aviso, "Recibimos tu mensaje.");
    form.reset();
    boton.disabled = false;
  };
}

function prepararTickets(correoEmisora) {
  const form = document.querySelector("#form-ticket");
  const aviso = document.querySelector("#aviso-ticket");
  const boton = form.querySelector("button");
  form.onsubmit = async (evento) => {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(form));
    const codigo = nuevoTicket();
    const exito = `Mensaje enviado. Tu número de ticket es ${codigo}.`;
    // Campo trampa: las personas no lo ven; si viene lleno es un robot y no se envía nada.
    if (datos._honey) return avisar(aviso, exito);
    const { ok, errores } = validarTicket(datos);
    if (!ok) return avisar(aviso, errores.join(" "), true);
    boton.disabled = true;
    avisar(aviso, "Enviando…");
    const fila = filaTicket(datos, codigo);
    const [guardado, enviado] = await Promise.all([guardarTicket(fila), enviarCorreoTicket(correoEmisora, fila)]);
    if (resultadoEnvio(guardado, enviado) === "ok") {
      avisar(aviso, exito);
      form.reset();
    } else {
      avisar(aviso, `No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos a ${correoEmisora}.`, true);
    }
    boton.disabled = false;
  };
}

llenarOpciones(document.querySelector("#pedido-tipo"), TIPOS_PEDIDO);
llenarOpciones(document.querySelector("#ticket-motivo"), MOTIVOS);

const emisora = await montarMarco({ actual: "contacto.html" });
const whatsapp = numeroWhatsapp(emisora?.whatsapp);
if (emisora) pintarDatos(emisora, whatsapp);
prepararPedidos(whatsapp);
prepararTickets(emisora?.contacto || "");
