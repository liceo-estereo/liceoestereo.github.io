// Pestaña En vivo: edita la única fila de la tabla transmision. Nada se detecta solo: lo marca y
// lo desmarca quien transmite.
import { filaTransmision, validarTransmision } from "./logica.js";
import { aviso, sb } from "./panel.js";

const activa = document.querySelector("#vivo-activa");
const red = document.querySelector("#vivo-red");
const enlace = document.querySelector("#vivo-enlace");
const titulo = document.querySelector("#vivo-titulo");

async function cargar() {
  const { data, error } = await sb.from("transmision").select("*").eq("id", true).single();
  if (error) return aviso("No se pudo leer el estado de la transmisión.", true);
  activa.checked = data.activa === true;
  if (data.red) red.value = data.red;
  enlace.value = data.enlace || "";
  titulo.value = data.titulo || "";
}

document.querySelector("#form-vivo").onsubmit = async (evento) => {
  evento.preventDefault();
  const campos = { activa: activa.checked, red: red.value, enlace: enlace.value.trim(), titulo: titulo.value };
  const { ok, errores } = validarTransmision(campos);
  if (!ok) return aviso(errores.join(" "), true);
  const { data, error } = await sb
    .from("transmision")
    .update(filaTransmision(campos, new Date().toISOString()))
    .eq("id", true)
    .select();
  // Sin permiso la base de datos no devuelve error: simplemente no cambia ninguna fila.
  if (error || !data.length) return aviso("No se pudo guardar.", true);
  aviso("Transmisión actualizada.");
};

document.addEventListener("panel:pestana", (evento) => {
  if (evento.detail === "vivo") cargar();
});
