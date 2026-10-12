// Portada. El marco se monta primero: si Supabase falla, la cabecera, la franja de «al aire» y el
// recuadro de hoy se ven igual.
import { SECCIONES } from "./ajustes.js";
import { leerNoticias, leerTransmision } from "./datos.js";
import {
  bloquesPorSeccion,
  enlaceNoticia,
  estadoEnVivo,
  fechaLarga,
  fechaLocalISO,
  hhmm,
  jornada,
  mediosVisibles,
  nombreEspecial,
  noticiaDeLaSemana,
  redesDeTransmision,
  ultimas,
} from "./logica.js";
import { montarMarco } from "./marco.js";
import { el, enlace, rutaImagen, tarjetaNoticia } from "./vista.js";

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

function enlaceExterno(texto, href, clase) {
  const a = enlace(texto, href, clase);
  a.target = "_blank";
  a.rel = "noopener";
  return a;
}

function pintarEnVivo(vivo, redes) {
  const caja = document.querySelector("#en-vivo");
  caja.append(el("h2", "Dónde escucharnos", "rotulo"));
  if (vivo) {
    const bloque = el("div", "", "en-vivo");
    const aviso = el("p", "", "aviso-vivo");
    const punto = el("span", "", "punto-vivo");
    punto.setAttribute("aria-hidden", "true");
    aviso.append(punto, el("strong", "EN VIVO"));
    bloque.append(aviso, el("p", vivo.titulo));
    if (vivo.esAudio) {
      const audio = el("audio");
      audio.controls = true;
      audio.src = vivo.enlace;
      bloque.append(audio);
    } else {
      bloque.append(enlaceExterno("Ver en vivo", vivo.enlace, "boton lleno"));
    }
    caja.append(bloque);
  }
  if (redes.length) {
    const lista = el("ul", "", "lista-redes");
    for (const red of redes) {
      const li = el("li");
      li.append(enlaceExterno(red.nombre, red.enlace));
      lista.append(li);
    }
    caja.append(lista);
  }
  if (!vivo && !redes.length) caja.append(el("p", "Pronto publicaremos nuestros canales."));
}

function pintarMedios(selector, titulo, medios) {
  if (!medios.length) return;
  const seccion = document.querySelector(selector);
  const fila = el("div", "", "fila-medios");
  for (const medio of medios) {
    const tarjeta = el("article", "", "tarjeta");
    const portada = rutaImagen(medio.portada);
    if (portada) {
      const img = el("img");
      img.src = portada;
      img.alt = "";
      img.loading = "lazy";
      tarjeta.append(img);
    }
    const nombre = el("h3");
    nombre.append(enlaceExterno(medio.titulo, medio.enlace));
    tarjeta.append(nombre);
    fila.append(tarjeta);
  }
  seccion.append(el("h2", titulo, "rotulo"), fila);
  seccion.hidden = false;
}

const emisora = await montarMarco({ actual: "index.html" });
pintarHoy(emisora);
pintarEnVivo(estadoEnVivo(await leerTransmision()), redesDeTransmision(emisora?.redes || []));
pintarMedios("#videos", "En video", mediosVisibles(emisora?.videos || []));
pintarMedios("#podcasts", "Pódcast", mediosVisibles(emisora?.podcasts || []));

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
