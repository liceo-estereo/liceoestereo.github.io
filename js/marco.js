// Marco compartido de las páginas públicas: cabecera, franja de «al aire» y pie.
// Nada aquí toca el documento al importarse: todo ocurre dentro de montarMarco().
import { SECCIONES } from "./ajustes.js";
import { leerEmisora } from "./datos.js";
import {
  DIAS,
  alAire,
  enlacesLegales,
  esEnlaceSeguro,
  especialAhora,
  fechaLarga,
  fechaLocalISO,
  hhmm,
  menuPrincipal,
  nombreEspecial,
  proximoHoy,
} from "./logica.js";
import { el, enlace } from "./vista.js";

export const FUENTES_URL =
  "https://fonts.googleapis.com/css2?family=Jost:wght@700&family=Newsreader:opsz,wght@6..72,500;6..72,700&family=Public+Sans:wght@400;600;700&display=swap";

function enlaceDeHoja(rel, href) {
  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  document.head.append(link);
}

function marca() {
  const a = enlace("", "index.html", "marca");
  a.setAttribute("aria-label", "Liceo Tame Stereo, inicio");
  const logo = el("img");
  logo.src = "img/logo.svg";
  logo.alt = "";
  logo.width = logo.height = 52;
  const nombre = el("p", "Liceo Tame ", "nombre");
  nombre.append(el("span", "stereo"));
  a.append(logo, nombre);
  return a;
}

function listaDeEnlaces(entradas, clase) {
  const ul = el("ul", "", clase);
  for (const entrada of entradas) {
    const li = el("li");
    const a = enlace(entrada.texto, entrada.href);
    if (entrada.actual) a.setAttribute("aria-current", "page");
    li.append(a);
    ul.append(li);
  }
  return ul;
}

function cabecera(actual) {
  const header = el("header", "", "cabecera");
  const principal = el("div", "", "envoltura cabecera-principal");
  const nav = el("nav");
  nav.setAttribute("aria-label", "Principal");
  nav.append(listaDeEnlaces(menuPrincipal(actual), "menu"));
  principal.append(marca(), nav);

  const barra = el("div", "", "barra-secciones");
  const dentro = el("div", "", "envoltura");
  const secciones = el("nav");
  secciones.setAttribute("aria-label", "Secciones de noticias");
  secciones.append(
    listaDeEnlaces(
      SECCIONES.map((s) => ({ href: "noticias.html?seccion=" + s.id, texto: s.nombre })),
      "menu-secciones",
    ),
  );
  dentro.append(el("p", fechaLarga(fechaLocalISO()), "barra-fecha"), secciones);
  barra.append(dentro);
  header.append(principal, barra);
  return header;
}

function franja() {
  const div = el("div", "", "franja");
  const estado = el("p", "", "envoltura estado");
  estado.id = "estado";
  estado.setAttribute("role", "status");
  const punto = el("span", "", "punto");
  punto.setAttribute("aria-hidden", "true");
  const texto = el("span");
  estado.append(punto, texto);
  div.append(estado);
  return { div, estado, texto };
}

function bloqueDelPie(titulo, contenido) {
  const seccion = el("section");
  seccion.append(el("h2", titulo), contenido);
  return seccion;
}

function pie(actual) {
  const footer = el("footer", "", "pie");
  const dentro = el("div", "", "envoltura");

  const emisora = el("section");
  emisora.setAttribute("aria-label", "La emisora");
  const insignias = el("div", "", "insignias");
  const escudo = el("img");
  escudo.src = "img/escudo.png";
  escudo.alt = "Escudo del Liceo Tame";
  escudo.width = 71;
  escudo.height = 88;
  const logo = el("img", "", "logo");
  logo.src = "img/logo.svg";
  logo.alt = "";
  logo.width = logo.height = 64;
  const nombre = el("p", "Liceo Tame ", "nombre");
  nombre.append(el("span", "stereo"));
  insignias.append(escudo, logo, nombre);
  const lema = el("p");
  emisora.append(insignias, lema);

  const redes = el("ul");
  const correo = enlace("", "", "correo");
  const contacto = el("div");
  contacto.append(correo, redes);

  const creditos = el(
    "p",
    `Emisora institucional de la Institución Educativa Liceo Tame · Sitio desarrollado por sovietic_tech. Contenidos © ${new Date().getFullYear()} Liceo Tame Stereo`,
    "creditos",
  );
  dentro.append(
    emisora,
    bloqueDelPie("Secciones", listaDeEnlaces(menuPrincipal(actual))),
    bloqueDelPie("Información", listaDeEnlaces(enlacesLegales())),
    bloqueDelPie("Contacto y redes", contacto),
    creditos,
  );
  footer.append(dentro);
  return { footer, lema, correo, redes };
}

// Texto de la franja según la hora: un especial de hoy reemplaza al programa habitual.
function estadoAlAire(emisora, ahora = new Date()) {
  const dia = DIAS[ahora.getDay()];
  const fecha = fechaLocalISO(ahora);
  const hora = ahora.toTimeString().slice(0, 5);
  const especial = especialAhora(emisora.especiales, fecha, hora);
  if (especial) return { encendido: true, texto: `Al aire: ${nombreEspecial(especial)}, hasta las ${hhmm(especial.fin)}` };
  const bloque = emisora.parrilla.find((b) => alAire(b, dia, hora));
  if (bloque) return { encendido: true, texto: `Al aire: ${bloque.programa}, hasta las ${hhmm(bloque.fin)}` };
  const proximo = proximoHoy(emisora.parrilla, emisora.especiales, dia, fecha, hora);
  return {
    encendido: false,
    texto: proximo ? `Fuera del aire. Sigue ${proximo.programa} a las ${proximo.inicio}` : "Fuera del aire por hoy",
  };
}

export async function montarMarco({ actual = "" } = {}) {
  enlaceDeHoja("stylesheet", FUENTES_URL);
  enlaceDeHoja("icon", "img/logo.svg");

  const main = document.querySelector("main");
  const tira = franja();
  const abajo = pie(actual);
  main.before(enlace("Saltar al contenido", "#contenido", "saltar"), cabecera(actual), tira.div);
  main.after(abajo.footer);

  let emisora = null;
  try {
    emisora = await leerEmisora();
  } catch {
    tira.texto.textContent = "Programación no disponible";
    return null;
  }

  abajo.lema.textContent = emisora.lema;
  if (emisora.contacto) {
    abajo.correo.textContent = emisora.contacto;
    abajo.correo.href = "mailto:" + emisora.contacto;
  }
  for (const red of emisora.redes.filter((r) => esEnlaceSeguro(r.enlace))) {
    const li = el("li");
    const a = enlace(red.nombre, red.enlace);
    a.target = "_blank";
    a.rel = "noopener";
    li.append(a);
    abajo.redes.append(li);
  }

  const pintar = () => {
    const { encendido, texto } = estadoAlAire(emisora);
    tira.estado.classList.toggle("encendido", encendido);
    tira.texto.textContent = texto;
  };
  pintar();
  setInterval(pintar, 60000);
  return emisora;
}
