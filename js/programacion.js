// Programación: un bloque plegable por día, con el de hoy abierto y el programa al aire resaltado.
import {
  DIAS,
  alAire,
  especialAhora,
  fechaLocalISO,
  hhmm,
  jornada,
  nombreEspecial,
  parrillaPorDia,
  separarJornadas,
} from "./logica.js";
import { montarMarco } from "./marco.js";
import { el } from "./vista.js";

const contenedor = document.querySelector("#parrilla");
const filas = new Map(); // bloque de la parrilla -> su fila en la página

function pintarCambios(especiales) {
  const hoy = fechaLocalISO();
  const deHoy = especiales
    .filter((e) => e.fecha.slice(0, 10) === hoy)
    .sort((a, b) => hhmm(a.inicio).localeCompare(hhmm(b.inicio)));
  if (!deHoy.length) return;
  const seccion = document.querySelector("#cambios");
  seccion.append(el("h2", "Cambios de hoy", "rotulo"));
  for (const especial of deHoy) {
    const item = el("p", "", "especial");
    item.append(
      el("strong", nombreEspecial(especial)),
      el("time", `${hhmm(especial.inicio)} a ${hhmm(especial.fin)} · ${jornada(especial.inicio).toLowerCase()}`, "meta"),
    );
    if (especial.detalle) item.append(el("span", especial.detalle, "meta"));
    seccion.append(item);
  }
  seccion.hidden = false;
}

function filaDeBloque(bloque) {
  const li = el("li");
  const texto = el("div");
  texto.append(el("strong", bloque.programa));
  if (bloque.enfoque) texto.append(el("span", bloque.enfoque, "meta"));
  if (bloque.a_cargo) texto.append(el("span", "A cargo de " + bloque.a_cargo, "meta"));
  li.append(el("time", `${hhmm(bloque.inicio)} – ${hhmm(bloque.fin)}`, "hora"), texto);
  if (bloque.estado) li.append(el("span", bloque.estado, "etiqueta"));
  filas.set(bloque, li);
  return li;
}

function pintarParrilla(parrilla) {
  const hoy = DIAS[new Date().getDay()];
  for (const { dia, bloques } of parrillaPorDia(parrilla)) {
    const detalle = el("details");
    detalle.name = "dia"; // con el mismo nombre, al abrir un día se cierra el anterior
    detalle.open = dia === hoy;
    const titulo = el("summary", dia);
    if (dia === hoy) titulo.append(el("span", "Hoy", "etiqueta"));
    const lista = el("ul");
    for (const grupo of separarJornadas(bloques)) {
      lista.append(el("li", grupo.jornada, "jornada"));
      for (const bloque of grupo.bloques) lista.append(filaDeBloque(bloque));
    }
    detalle.append(titulo, lista);
    contenedor.append(detalle);
  }
}

// Un especial de hoy reemplaza al programa habitual: mientras suena, no se resalta ninguna fila.
function marcarAlAire(emisora) {
  const ahora = new Date();
  const dia = DIAS[ahora.getDay()];
  const hora = ahora.toTimeString().slice(0, 5);
  const hayEspecial = Boolean(especialAhora(emisora.especiales, fechaLocalISO(ahora), hora));
  for (const [bloque, fila] of filas) fila.classList.toggle("al-aire", !hayEspecial && alAire(bloque, dia, hora));
}

const emisora = await montarMarco({ actual: "programacion.html" });
if (!emisora) {
  contenedor.append(el("p", "No pudimos cargar la programación."));
} else {
  pintarCambios(emisora.especiales);
  pintarParrilla(emisora.parrilla);
  marcarAlAire(emisora);
  setInterval(() => marcarAlAire(emisora), 60000);
}
