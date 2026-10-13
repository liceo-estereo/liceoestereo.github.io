// Página de una noticia: noticia.html?id=<id>
import { SECCIONES } from "./ajustes.js";
import { leerNoticia, leerNoticias } from "./datos.js";
import {
  anexoDeEnlace,
  enlacesCompartir,
  esEnlaceSeguro,
  fechaLarga,
  nombreSeccion,
  parrafos,
  relacionadas,
  tiempoLectura,
} from "./logica.js";
import { montarMarco } from "./marco.js";
import { el, enlace, rutaImagen, tarjetaNoticia } from "./vista.js";

const titulo = document.querySelector("#titulo");
const cuerpo = document.querySelector("#articulo");

function pintarMigas(noticia) {
  const migas = document.querySelector("#migas");
  migas.append(enlace("Inicio", "index.html"));
  const seccion = nombreSeccion(noticia.seccion, SECCIONES);
  if (seccion) migas.append(el("span", " › "), enlace(seccion, "noticias.html?seccion=" + noticia.seccion));
}

function bloqueCompartir(noticia) {
  const bloque = el("div", "", "compartir");
  bloque.append(el("span", "Compartir:"));
  const destinos = enlacesCompartir(location.href, noticia.titulo);
  for (const [nombre, clave] of [["WhatsApp", "whatsapp"], ["Facebook", "facebook"], ["X", "x"]]) {
    const a = enlace(nombre, destinos[clave], "boton");
    a.target = "_blank";
    a.rel = "noopener";
    bloque.append(a);
  }
  const copiar = el("button", "Copiar enlace", "boton");
  copiar.type = "button";
  const aviso = el("span", "", "meta");
  aviso.setAttribute("role", "status");
  copiar.onclick = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      aviso.textContent = "Enlace copiado.";
    } catch {
      aviso.textContent = location.href;
    }
  };
  bloque.append(copiar, aviso);
  return bloque;
}

// Un anexo de la noticia: otra foto, o un enlace que se incrusta si es de un sitio conocido.
function bloqueAnexo(anexo) {
  const figura = el("figure", "", "anexo");
  const pie = el("figcaption", anexo.pie ? anexo.pie + " " : "", "meta");
  if (anexo.tipo === "foto") {
    const img = el("img");
    img.src = anexo.enlace;
    img.alt = anexo.pie;
    img.loading = "lazy";
    figura.append(img);
  } else {
    const info = anexoDeEnlace(anexo.enlace);
    if (info.marco) {
      const marco = el("iframe", "", "marco-" + info.tipo);
      marco.src = info.marco;
      marco.title = info.nombre;
      marco.loading = "lazy";
      marco.allowFullscreen = true;
      figura.append(marco);
    }
    // El enlace a la fuente va siempre: si el marco no carga, la publicación sigue al alcance.
    const fuente = enlace(info.marco ? "Abrir la " + info.nombre.toLowerCase() : anexo.enlace, anexo.enlace);
    fuente.target = "_blank";
    fuente.rel = "noopener";
    pie.append(fuente);
  }
  if (pie.textContent) figura.append(pie);
  return figura;
}

// Las publicaciones de X avisan su alto real con un mensaje; sin esto quedarían cortadas.
window.addEventListener("message", (evento) => {
  if (evento.origin !== "https://platform.twitter.com") return;
  const aviso = evento.data?.["twttr.embed"];
  const alto = aviso?.method === "twttr.private.resize" ? Number(aviso.params?.[0]?.height) : 0;
  if (!alto) return;
  for (const marco of cuerpo.querySelectorAll("iframe.marco-x")) {
    if (marco.contentWindow === evento.source) marco.style.height = alto + "px";
  }
});

function pintarNoticia(noticia) {
  titulo.textContent = noticia.titulo;
  document.title = `${noticia.titulo} · Liceo Tame Stereo`;
  pintarMigas(noticia);

  if (noticia.subtitulo) cuerpo.append(el("p", noticia.subtitulo, "subtitulo"));
  const meta = el("p", "", "meta");
  const fecha = el("time", fechaLarga(noticia.fecha));
  fecha.dateTime = noticia.fecha.slice(0, 10);
  if (noticia.origen) meta.append(noticia.origen + " · ");
  meta.append(fecha, ` · ${tiempoLectura(noticia.cuerpo)} min de lectura`);
  cuerpo.append(meta);

  const foto = rutaImagen(noticia.foto);
  if (foto) {
    const figura = el("figure");
    const img = el("img");
    img.src = foto;
    img.alt = noticia.pie_foto || "";
    figura.append(img);
    if (noticia.pie_foto) figura.append(el("figcaption", noticia.pie_foto, "meta"));
    cuerpo.append(figura);
  }
  if (esEnlaceSeguro(noticia.audio)) {
    const audio = el("audio");
    audio.controls = true;
    audio.src = noticia.audio;
    audio.setAttribute("aria-label", "Escucha esta noticia");
    cuerpo.append(audio);
  }
  if (noticia.entradilla) cuerpo.append(el("p", noticia.entradilla, "entradilla"));
  for (const parrafo of parrafos(noticia.cuerpo)) cuerpo.append(el("p", parrafo));
  for (const anexo of noticia.anexos) cuerpo.append(bloqueAnexo(anexo));
  if (noticia.emisor) cuerpo.append(el("p", "Por " + noticia.emisor, "firma"));
  cuerpo.append(bloqueCompartir(noticia));
}

async function pintarRelacionadas(noticia) {
  let otras = [];
  try {
    otras = relacionadas(noticia, await leerNoticias({ seccion: noticia.seccion }));
  } catch {
    return; // sin relacionadas la noticia se lee igual
  }
  if (!otras.length) return;
  const seccion = document.querySelector("#relacionadas");
  const rejilla = el("div", "", "rejilla");
  for (const otra of otras) rejilla.append(tarjetaNoticia(otra));
  seccion.append(el("h2", "Más de " + (nombreSeccion(noticia.seccion, SECCIONES) || "la emisora"), "rotulo"), rejilla);
  seccion.hidden = false;
}

function noEncontrada() {
  titulo.textContent = "No encontramos esta noticia";
  cuerpo.append(enlace("Ver todas las noticias", "noticias.html", "boton"));
}

await montarMarco({ actual: "noticias.html" });

let noticia = null;
let fallo = false;
try {
  noticia = await leerNoticia(new URLSearchParams(location.search).get("id"));
} catch (error) {
  fallo = !(error instanceof RangeError); // un id inválido es "no encontrada", no un fallo de red
}

if (noticia) {
  pintarNoticia(noticia);
  pintarRelacionadas(noticia);
} else if (fallo) {
  titulo.textContent = "No pudimos cargar la noticia";
  cuerpo.append(el("p", "No pudimos cargar la noticia. Intenta de nuevo más tarde."));
} else {
  noEncontrada();
}
