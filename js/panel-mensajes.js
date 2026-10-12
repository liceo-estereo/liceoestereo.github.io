// Pestaña Mensajes: canciones, mensajes y dedicatorias recibidos hoy. Al abrirse borra los pedidos
// que ya pasaron los 30 días de conservación.
import { caducados, fechaLocalISO, pedidosDeHoy } from "./logica.js";
import { aviso, sb } from "./panel.js";
import { el } from "./vista.js";

const lista = document.querySelector("#lista-mensajes");
let reloj = null;

function ficha(pedido) {
  const li = el("li", "", "ficha");
  const hora = new Date(pedido.creado).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  li.append(el("strong", `${hora} · ${pedido.tipo}`));
  if (pedido.nombre) li.append(el("p", "De: " + pedido.nombre));
  if (pedido.para) li.append(el("p", "Para: " + pedido.para));
  li.append(el("p", pedido.mensaje));
  return li;
}

async function cargar() {
  const { data, error } = await sb.from("pedidos").select("*").order("creado", { ascending: false });
  if (error) return aviso("No se pudieron cargar los mensajes.", true);
  const hoy = fechaLocalISO();
  const viejos = caducados(data, hoy);
  if (viejos.length) await sb.from("pedidos").delete().in("id", viejos);
  lista.replaceChildren();
  const deHoy = pedidosDeHoy(data, hoy);
  if (!deHoy.length) lista.append(el("li", "Todavía no hay mensajes hoy.", "meta"));
  for (const pedido of deHoy) lista.append(ficha(pedido));
}

document.querySelector("#actualizar-mensajes").onclick = cargar;

// Mientras la pestaña esté abierta se refresca cada minuto; al salir de ella, se detiene.
document.addEventListener("panel:pestana", (evento) => {
  clearInterval(reloj);
  if (evento.detail !== "mensajes") return;
  cargar();
  reloj = setInterval(cargar, 60000);
});
