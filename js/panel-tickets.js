// Pestaña Tickets: muro de PQRSD en tres columnas por estado. Solo la ven los administradores; a
// los demás la base de datos no les devuelve ninguna fila.
import { ESTADOS_TICKET, agruparTickets, fechaLarga, fechaLocalISO, nombreEstado } from "./logica.js";
import { aviso, sb } from "./panel.js";
import { el, enlace } from "./vista.js";

const muro = document.querySelector("#muro-tickets");

async function cambiarEstado(ticket, estado) {
  const { data, error } = await sb.from("tickets").update({ estado }).eq("id", ticket.id).select();
  if (error || !data.length) aviso("No se pudo cambiar el estado.", true);
  else aviso(`Ticket ${ticket.codigo}: ${nombreEstado(estado)}.`);
  cargar();
}

function ficha(ticket) {
  const tarjeta = el("article", "", "ficha");
  tarjeta.append(el("strong", `${ticket.codigo} · ${ticket.motivo}`), el("p", ticket.nombre));
  if (ticket.correo) tarjeta.append(enlace(ticket.correo, "mailto:" + ticket.correo));
  tarjeta.append(el("p", ticket.mensaje), el("p", fechaLarga(fechaLocalISO(new Date(ticket.creado))), "meta"));

  const selector = el("select");
  selector.setAttribute("aria-label", `Estado del ticket ${ticket.codigo}`);
  for (const estado of ESTADOS_TICKET) {
    const opcion = el("option", nombreEstado(estado));
    opcion.value = estado;
    opcion.selected = estado === ticket.estado;
    selector.append(opcion);
  }
  selector.onchange = () => cambiarEstado(ticket, selector.value);
  tarjeta.append(selector);
  return tarjeta;
}

async function cargar() {
  const { data, error } = await sb.from("tickets").select("*").order("creado", { ascending: false });
  muro.replaceChildren();
  if (error) return aviso("No se pudieron cargar los tickets.", true);
  const grupos = agruparTickets(data);
  for (const estado of ESTADOS_TICKET) {
    const columna = el("section");
    columna.append(el("h3", `${nombreEstado(estado)} (${grupos[estado].length})`, "rotulo"));
    if (!grupos[estado].length) columna.append(el("p", "Ninguno.", "meta"));
    for (const ticket of grupos[estado]) columna.append(ficha(ticket));
    muro.append(columna);
  }
}

document.addEventListener("panel:pestana", (evento) => {
  if (evento.detail === "tickets") cargar();
});
