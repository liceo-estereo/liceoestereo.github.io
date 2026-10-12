// Pestaña En vivo: edita la única fila de la tabla transmision. Nada se detecta solo: el
// interruptor «Al aire» lo enciende y lo apaga quien transmite, y se guarda al moverlo.
import { filaTransmision, validarTransmision } from "./logica.js";
import { aviso, sb } from "./panel.js";

const activa = document.querySelector("#vivo-activa");
const red = document.querySelector("#vivo-red");
const enlace = document.querySelector("#vivo-enlace");
const titulo = document.querySelector("#vivo-titulo");

function pintarEstado() {
  document.querySelector("#vivo-estado").textContent = activa.checked
    ? "Encendido: todas las páginas del sitio dicen «Al aire»."
    : "Apagado: el sitio solo muestra la programación del día.";
}

async function cargar() {
  const { data, error } = await sb.from("transmision").select("*").eq("id", true).single();
  if (error) return aviso("No se pudo leer el estado de la transmisión.", true);
  activa.checked = data.activa === true;
  red.value = data.red || "audio";
  enlace.value = data.enlace || "";
  titulo.value = data.titulo || "";
  pintarEstado();
}

// Devuelve true si la base de datos aceptó el cambio.
async function guardar() {
  const campos = { activa: activa.checked, red: red.value, enlace: enlace.value.trim(), titulo: titulo.value };
  const { ok, errores } = validarTransmision(campos);
  if (!ok) return aviso(errores.join(" "), true), false;
  const { data, error } = await sb
    .from("transmision")
    .update(filaTransmision(campos, new Date().toISOString()))
    .eq("id", true)
    .select();
  // Sin permiso la base de datos no devuelve error: simplemente no cambia ninguna fila.
  if (error || !data.length) return aviso("No se pudo guardar.", true), false;
  aviso(campos.activa ? "Están al aire." : "Transmisión apagada.");
  return true;
}

activa.onchange = async () => {
  activa.disabled = true;
  // Si no se pudo guardar, el interruptor vuelve a donde estaba: nunca muestra un estado falso.
  if (!(await guardar())) activa.checked = !activa.checked;
  activa.disabled = false;
  pintarEstado();
};

document.querySelector("#form-vivo").onsubmit = (evento) => {
  evento.preventDefault();
  guardar();
};

document.addEventListener("panel:pestana", (evento) => {
  if (evento.detail === "vivo") cargar();
});
