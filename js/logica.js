// Funciones puras del sitio: sin DOM, sin red y sin estado. Todo lo de aquí lleva prueba en pruebas/.

export const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// "9:30" -> "09:30", para que las horas se comparen bien como texto.
export const hhmm = (texto) => texto.trim().padStart(5, "0");

// AAAA-MM-DD en hora local. toISOString() daría el día en UTC, que en Colombia cambia a las 7 p. m.
export function fechaLocalISO(fecha = new Date()) {
  const dos = (n) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

export function alAire(bloque, dia, hora) {
  return bloque.dia === dia && hhmm(bloque.inicio) <= hora && hora < hhmm(bloque.fin);
}

export const jornada = (hora) => (hhmm(hora) < "12:00" ? "Mañana" : "Tarde");

export const nombreEspecial = (especial) => [especial.tipo, especial.titulo].filter(Boolean).join(": ");

// Cambio de un solo día (invitado, entrevista...) que está sonando en ese momento, si lo hay.
export function especialAhora(especiales, fecha, hora) {
  return especiales.find((e) => e.fecha.slice(0, 10) === fecha && hhmm(e.inicio) <= hora && hora < hhmm(e.fin));
}

// Siguiente espacio de hoy, contando tanto la parrilla habitual como los especiales de la fecha.
export function proximoHoy(parrilla, especiales, dia, fecha, hora) {
  const candidatos = [
    ...parrilla.filter((b) => b.dia === dia).map((b) => ({ programa: b.programa, inicio: hhmm(b.inicio) })),
    ...especiales
      .filter((e) => e.fecha.slice(0, 10) === fecha)
      .map((e) => ({ programa: nombreEspecial(e), inicio: hhmm(e.inicio) })),
  ];
  return candidatos.filter((c) => c.inicio > hora).sort((a, b) => a.inicio.localeCompare(b.inicio))[0] || null;
}

// "322 000 0000" o "+57 322 000 0000" -> "573220000000", como lo pide wa.me.
// Con 10 dígitos se asume que es un celular de Colombia.
export function numeroWhatsapp(texto) {
  const numero = (texto || "").replace(/\D/g, "");
  return numero.length === 10 ? "57" + numero : numero;
}

// Código que identifica cada mensaje del formulario de contacto: LT-AAMMDD-XXXX.
export function nuevoTicket(fecha = new Date(), azar = Math.random) {
  const dia = fechaLocalISO(fecha).slice(2).replaceAll("-", "");
  return `LT-${dia}-${azar().toString(36).slice(2, 6).toUpperCase().padEnd(4, "0")}`;
}

export const parrafos = (texto) =>
  (texto || "")
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean);

export const enlaceNoticia = (noticia) => "noticia.html?id=" + noticia.id;

// Solo http y https: un enlace que viene de datos nunca puede ser javascript: ni data:.
export const esEnlaceSeguro = (url) => typeof url === "string" && /^https?:\/\//.test(url);

export function menuPrincipal(actual) {
  return [
    { href: "index.html", texto: "Inicio" },
    { href: "noticias.html", texto: "Noticias" },
    { href: "programacion.html", texto: "Programación" },
    { href: "nosotros.html", texto: "Nosotros" },
    { href: "contacto.html", texto: "Contacto" },
  ].map((entrada) => ({ ...entrada, actual: entrada.href === actual }));
}

export function enlacesLegales() {
  return [
    { href: "legal.html#terminos", texto: "Términos y condiciones" },
    { href: "legal.html#datos", texto: "Tratamiento de datos" },
    { href: "legal.html#responsabilidad", texto: "Responsabilidad institucional" },
    { href: "legal.html#aclaraciones", texto: "Aclaraciones y rectificaciones" },
    { href: "mapa.html", texto: "Mapa del sitio" },
  ];
}

// T12:00 evita que la zona horaria corra la fecha un día atrás.
export const fechaLarga = (fechaISO) =>
  new Date(fechaISO.slice(0, 10) + "T12:00").toLocaleDateString("es-CO", { dateStyle: "long" });

export const inicial = (nombre) => ((nombre || "").trim()[0] || "?").toUpperCase();

// Minutos de lectura a 200 palabras por minuto, nunca menos de uno.
export function tiempoLectura(texto) {
  const palabras = (texto || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(palabras / 200));
}

export function enlacesCompartir(url, titulo) {
  const u = encodeURIComponent(url);
  return {
    whatsapp: "https://wa.me/?text=" + encodeURIComponent(titulo + " " + url),
    facebook: "https://www.facebook.com/sharer/sharer.php?u=" + u,
    x: "https://twitter.com/intent/tweet?text=" + encodeURIComponent(titulo) + "&url=" + u,
  };
}

// Otras noticias de la misma sección, de la más reciente a la más antigua.
export function relacionadas(noticia, todas, maximo = 3) {
  return todas
    .filter((n) => n.seccion === noticia.seccion && n.id !== noticia.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, maximo);
}

export const nombreSeccion = (id, secciones) => secciones.find((s) => s.id === id)?.nombre || "";

// Una sección desconocida (o vacía) se trata como "todas".
export function filtrarPorSeccion(noticias, seccion, secciones) {
  if (!secciones.some((s) => s.id === seccion)) return noticias;
  return noticias.filter((n) => n.seccion === seccion);
}

export const tanda = (noticias, pagina, porPagina = 10) => noticias.slice(0, pagina * porPagina);

export const hayMas = (noticias, pagina, porPagina = 10) => noticias.length > pagina * porPagina;

// Grupos consecutivos por mes, en el orden recibido.
export function agruparPorMes(noticias) {
  const grupos = [];
  for (const noticia of noticias) {
    const mes = new Date(noticia.fecha.slice(0, 10) + "T12:00").toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric",
    });
    if (grupos.at(-1)?.mes !== mes) grupos.push({ mes, noticias: [] });
    grupos.at(-1).noticias.push(noticia);
  }
  return grupos;
}
