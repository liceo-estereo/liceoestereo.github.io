// Portada. El marco se monta primero: si Supabase falla, la cabecera, la franja de «al aire» y el
// recuadro de hoy se ven igual.
import { SECCIONES } from "./ajustes.js";
import { leerNoticias } from "./datos.js";
import {
  bloquesPorSeccion,
  enlaceNoticia,
  fechaLarga,
  fechaLocalISO,
  hhmm,
  jornada,
  nombreEspecial,
  noticiaDeLaSemana,
  ultimas,
} from "./logica.js";
import { montarMarco } from "./marco.js";
import { el, enlace, tarjetaNoticia } from "./vista.js";

function pintarHoy(emisora) {
  const caja = document.querySelector("#hoy");
  caja.append(el("h2", "Hoy en la emisora", "rotulo"));
  const hoy = fechaLocalISO();
  const especiales = (emisora?.especiales || [])
    .filter((e) => e.fecha.slice(0, 10) === hoy)
    .sort((a, b) => hhmm(a.inicio).localeCompare(hhmm(b.inicio)));
  if (!especiales.length) caja.append(el("p", "Hoy programación habitual."));
  for (const especial of especiales) {
    const item = el("p", "", "especial");
    item.append(
      el("strong", nombreEspecial(especial)),
      el("time", `${hhmm(especial.inicio)} a ${hhmm(especial.fin)} · ${jornada(especial.inicio).toLowerCase()}`, "meta"),
    );
    if (especial.detalle) item.append(el("span", especial.detalle, "meta"));
    caja.append(item);
  }
  caja.append(enlace("Ver la programación completa", "programacion.html"));
}

function pintarSemana(noticia) {
  const seccion = document.querySelector("#semana");
  seccion.append(el("h2", "Noticia de la semana", "rotulo"), tarjetaNoticia(noticia, { grande: true }));
  seccion.hidden = false;
}

function pintarUltimas(noticias) {
  const caja = document.querySelector("#ultimas");
  const lista = el("ol", "", "lista-ultimas");
  for (const noticia of noticias) {
    const li = el("li");
    const fecha = el("time", fechaLarga(noticia.fecha), "meta");
    fecha.dateTime = noticia.fecha.slice(0, 10);
    li.append(enlace(noticia.titulo, enlaceNoticia(noticia)), fecha);
    lista.append(li);
  }
  caja.append(el("h2", "Últimas noticias", "rotulo"), lista);
}

function pintarBloques(bloques) {
  const caja = document.querySelector("#bloques");
  for (const { seccion, noticias } of bloques) {
    const bloque = el("section", "", "bloque-seccion");
    const rejilla = el("div", "", "rejilla");
    for (const noticia of noticias) rejilla.append(tarjetaNoticia(noticia));
    bloque.append(
      el("h2", seccion.nombre, "rotulo"),
      rejilla,
      enlace("Ver más de " + seccion.nombre, "noticias.html?seccion=" + seccion.id, "ver-mas"),
    );
    caja.append(bloque);
  }
}

const emisora = await montarMarco({ actual: "index.html" });
pintarHoy(emisora);

try {
  const noticias = await leerNoticias();
  if (!noticias.length) {
    document.querySelector("#bloques").append(el("p", "Todavía no hay noticias publicadas."));
  } else {
    const semana = noticiaDeLaSemana(noticias, fechaLocalISO());
    if (semana) pintarSemana(semana);
    pintarUltimas(ultimas(noticias, 6, semana?.id));
    pintarBloques(bloquesPorSeccion(noticias, SECCIONES, 3, semana?.id));
  }
} catch {
  document.querySelector("#bloques").append(el("p", "No pudimos cargar las noticias. Intenta de nuevo más tarde."));
}
