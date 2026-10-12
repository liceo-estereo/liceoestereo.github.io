// Listado de noticias, con filtro por sección: noticias.html?seccion=<id>
import { SECCIONES } from "./ajustes.js";
import { leerNoticias } from "./datos.js";
import { agruparPorMes, filtrarPorSeccion, hayMas, nombreSeccion, tanda } from "./logica.js";
import { montarMarco } from "./marco.js";
import { el, enlace, tarjetaNoticia } from "./vista.js";

const pedida = new URLSearchParams(location.search).get("seccion") || "";
const nombre = nombreSeccion(pedida, SECCIONES); // vacío si la sección no existe: se muestran todas
const lista = document.querySelector("#lista");
const mas = document.querySelector("#mas");

function pintarFiltros() {
  const filtros = document.querySelector("#filtros");
  const opciones = [{ id: "", nombre: "Todas" }, ...SECCIONES];
  for (const opcion of opciones) {
    const a = enlace(opcion.nombre, opcion.id ? "noticias.html?seccion=" + opcion.id : "noticias.html", "etiqueta");
    if ((nombre ? pedida : "") === opcion.id) a.setAttribute("aria-current", "page");
    filtros.append(a);
  }
}

function pintarLista(noticias, pagina) {
  lista.replaceChildren();
  for (const grupo of agruparPorMes(tanda(noticias, pagina))) {
    const seccion = el("section", "", "grupo-mes");
    const rejilla = el("div", "", "rejilla");
    for (const noticia of grupo.noticias) rejilla.append(tarjetaNoticia(noticia));
    seccion.append(el("h2", grupo.mes, "rotulo"), rejilla);
    lista.append(seccion);
  }
  mas.hidden = !hayMas(noticias, pagina);
}

if (nombre) {
  document.querySelector("#titulo").textContent = nombre;
  document.title = `${nombre} · Liceo Tame Stereo`;
}
pintarFiltros();
await montarMarco({ actual: "noticias.html" });

try {
  const noticias = filtrarPorSeccion(await leerNoticias(), pedida, SECCIONES);
  if (!noticias.length) {
    lista.append(el("p", "Todavía no hay noticias en esta sección."));
  } else {
    let pagina = 1;
    pintarLista(noticias, pagina);
    mas.onclick = () => pintarLista(noticias, ++pagina);
  }
} catch {
  lista.append(el("p", "No pudimos cargar las noticias. Intenta de nuevo más tarde."));
}
