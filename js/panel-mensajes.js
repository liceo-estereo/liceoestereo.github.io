// Pestaña Mensajes: canciones, mensajes y dedicatorias. Los de hoy van arriba; los de días
// anteriores quedan plegados debajo hasta que caducan a los 30 días.
import { caducados, esNuevo, fechaLarga, fechaLocalISO, masReciente, pedidosAnteriores, pedidosDeHoy } from "./logica.js";
import { aviso, sb } from "./panel.js";
import { el } from "./vista.js";

const listaHoy = document.querySelector("#lista-mensajes");
const listaAnteriores = document.querySelector("#lista-anteriores");
let reloj = null;
// Momento del último pedido que el encargado ya vio. Lo que llegue después se resalta como nuevo
// hasta que pulse "Marcar como vistos" o vuelva a abrir la pestaña.
// ponytail: se guarda solo en memoria; si se recarga la página nada sale como nuevo. Pasarlo a la
// base de datos si varios encargados necesitan compartir qué está visto.
let vistoHasta = null;

function ficha(pedido, conFecha) {
  const nuevo = esNuevo(pedido, vistoHasta);
  const li = el("li", "", nuevo ? "ficha nuevo" : "ficha");
  const momento = new Date(pedido.creado);
  const hora = momento.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  const cuando = conFecha ? `${fechaLarga(fechaLocalISO(momento))}, ${hora}` : hora;
  const titulo = el("strong", `${cuando} · ${pedido.tipo}`);
  if (nuevo) titulo.append(" ", el("span", "Nuevo", "etiqueta"));
  li.append(titulo);
  if (pedido.nombre) li.append(el("p", "De: " + pedido.nombre));
  if (pedido.para) li.append(el("p", "Para: " + pedido.para));
  li.append(el("p", pedido.mensaje));
  return li;
}

// `marcarVistos`: true al abrir la pestaña o pulsar el botón; false en el refresco automático,
// para que lo nuevo siga resaltado hasta que alguien lo mire.
async function cargar(marcarVistos) {
  const { data, error } = await sb.from("pedidos").select("*").order("creado", { ascending: false });
  if (error) return aviso("No se pudieron cargar los mensajes.", true);
  const hoy = fechaLocalISO();
  const viejos = caducados(data, hoy);
  if (viejos.length) await sb.from("pedidos").delete().in("id", viejos);
  const vigentes = data.filter((pedido) => !viejos.includes(pedido.id));
  if (marcarVistos) vistoHasta = masReciente(vigentes) || new Date(0).toISOString();

  const deHoy = pedidosDeHoy(vigentes, hoy);
  const nuevos = deHoy.filter((pedido) => esNuevo(pedido, vistoHasta)).length;
  document.querySelector("#titulo-mensajes-hoy").textContent =
    `Hoy (${deHoy.length})` + (nuevos ? ` · ${nuevos} ${nuevos === 1 ? "nuevo" : "nuevos"}` : "");
  listaHoy.replaceChildren();
  if (!deHoy.length) listaHoy.append(el("li", "Todavía no hay mensajes hoy.", "meta"));
  for (const pedido of deHoy) listaHoy.append(ficha(pedido, false));

  const anteriores = pedidosAnteriores(vigentes, hoy);
  document.querySelector("#mensajes-anteriores").hidden = !anteriores.length;
  document.querySelector("#resumen-anteriores").textContent = `Días anteriores (${anteriores.length})`;
  listaAnteriores.replaceChildren();
  for (const pedido of anteriores) listaAnteriores.append(ficha(pedido, true));
}

document.querySelector("#actualizar-mensajes").onclick = () => cargar(true);

// Mientras la pestaña esté abierta se refresca cada minuto; al salir de ella, se detiene.
document.addEventListener("panel:pestana", (evento) => {
  clearInterval(reloj);
  if (evento.detail !== "mensajes") return;
  cargar(true);
  reloj = setInterval(() => cargar(false), 60000);
});
