// Funciones puras del sitio: sin DOM, sin red y sin estado. Todo lo de aquí lleva prueba en pruebas/.
import { SECCIONES } from "./ajustes.js";

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

// Días enteros entre dos fechas AAAA-MM-DD; negativo si `desdeISO` es posterior.
export function diasEntre(desdeISO, hastaISO) {
  const mediodia = (iso) => new Date(iso.slice(0, 10) + "T12:00").getTime();
  return Math.round((mediodia(hastaISO) - mediodia(desdeISO)) / 86400000);
}

// La noticia marcada en los últimos siete días (0 a 6 días antes de hoy); si hay varias, la más reciente.
export function noticiaDeLaSemana(noticias, hoy) {
  const vigentes = noticias.filter((n) => {
    if (!n.semana_desde) return false;
    const dias = diasEntre(n.semana_desde, hoy);
    return dias >= 0 && dias < 7;
  });
  return vigentes.sort((a, b) => b.semana_desde.localeCompare(a.semana_desde))[0] || null;
}

export const ultimas = (noticias, cuantas, excluirId) => noticias.filter((n) => n.id !== excluirId).slice(0, cuantas);

// Un bloque por cada sección con noticias, en el orden de `secciones`.
export function bloquesPorSeccion(noticias, secciones, porBloque = 3, excluirId) {
  return secciones
    .map((seccion) => ({
      seccion,
      noticias: noticias.filter((n) => n.seccion === seccion.id && n.id !== excluirId).slice(0, porBloque),
    }))
    .filter((bloque) => bloque.noticias.length);
}

// La misma lista, en el mismo orden, que el check de transmision.red en supabase/002-rediseno.sql.
export const REDES_VIVO = ["instagram", "tiktok", "facebook", "audio"];

// Lo que la portada necesita para avisar que hay transmisión, o null si no la hay o no es fiable.
export function estadoEnVivo(transmision) {
  if (!transmision || transmision.activa !== true) return null;
  if (!REDES_VIVO.includes(transmision.red) || !esEnlaceSeguro(transmision.enlace)) return null;
  return {
    red: transmision.red,
    enlace: transmision.enlace,
    titulo: transmision.titulo || "En vivo",
    esAudio: transmision.red === "audio",
  };
}

export const redesDeTransmision = (redes) => redes.filter((r) => r.transmite === true && esEnlaceSeguro(r.enlace));

export const mediosVisibles = (lista) => lista.filter((m) => m.titulo && esEnlaceSeguro(m.enlace));

// La parrilla agrupada de lunes a domingo, solo con los días que tienen bloques, ordenados por hora.
export function parrillaPorDia(parrilla) {
  return [...DIAS.slice(1), DIAS[0]]
    .map((dia) => ({
      dia,
      bloques: parrilla.filter((b) => b.dia === dia).sort((a, b) => hhmm(a.inicio).localeCompare(hhmm(b.inicio))),
    }))
    .filter((d) => d.bloques.length);
}

export function separarJornadas(bloques) {
  return ["Mañana", "Tarde"]
    .map((nombre) => ({ jornada: nombre, bloques: bloques.filter((b) => jornada(b.inicio) === nombre) }))
    .filter((grupo) => grupo.bloques.length);
}

// Las tres constantes siguientes se repiten en supabase/002-rediseno.sql (check y char_length) y en
// los maxlength de contacto.html; pruebas/contacto.test.js comprueba que coincidan.
export const MOTIVOS = ["Petición", "Queja", "Reclamo", "Sugerencia", "Denuncia", "Solicitud para unirme al equipo"];
export const TIPOS_PEDIDO = ["Pedir una canción", "Mensaje al aire", "Dedicatoria"];
export const LIMITES = { nombre: 80, correo: 120, mensajeTicket: 2000, mensajePedido: 600 };

const largo = (valor) => (valor || "").trim().length;

export function validarTicket({ nombre, correo, motivo, mensaje }) {
  const errores = [];
  if (largo(nombre) < 1 || largo(nombre) > LIMITES.nombre) errores.push("Escribe tu nombre (máximo 80 caracteres).");
  if (!MOTIVOS.includes(motivo)) errores.push("Elige un motivo de la lista.");
  if (largo(mensaje) < 1 || largo(mensaje) > LIMITES.mensajeTicket) {
    errores.push("Escribe el mensaje (máximo 2000 caracteres).");
  }
  if (largo(correo) && (!correo.includes("@") || largo(correo) > LIMITES.correo)) errores.push("Revisa el correo.");
  return { ok: errores.length === 0, errores };
}

export function validarPedido({ tipo, nombre, para, mensaje }) {
  const errores = [];
  if (!TIPOS_PEDIDO.includes(tipo)) errores.push("Elige qué quieres enviar.");
  if (largo(mensaje) < 1 || largo(mensaje) > LIMITES.mensajePedido) {
    errores.push("Escribe la canción o el mensaje (máximo 600 caracteres).");
  }
  if (largo(nombre) > LIMITES.nombre || largo(para) > LIMITES.nombre) {
    errores.push("Los nombres admiten máximo 80 caracteres.");
  }
  return { ok: errores.length === 0, errores };
}

export function textoWhatsapp({ tipo, nombre, para, mensaje }) {
  const lineas = [`*${tipo}*`, largo(nombre) && `De: ${nombre.trim()}`, largo(para) && `Para: ${para.trim()}`, mensaje];
  return lineas.filter(Boolean).join(String.fromCharCode(10));
}

// Basta con que el ticket quede guardado o que el correo haya salido.
export const resultadoEnvio = (guardado, correoEnviado) => (guardado || correoEnviado ? "ok" : "error");

// Pestañas del panel según el rol. La base de datos es la que de verdad impide leer los tickets.
export const pestanasPara = (esAdmin) =>
  esAdmin === true ? ["noticias", "vivo", "tickets", "mensajes"] : ["noticias", "vivo", "mensajes"];

// Depósito, tope y tipos del audio: los mismos del depósito "audios" en supabase/002-rediseno.sql
// y del atributo accept de #audio. DEPOSITO_FOTOS es el depósito de supabase/esquema.sql.
export const AUDIO = { deposito: "audios", maxBytes: 10485760, tipos: ["audio/mpeg", "audio/mp3"] };
export const DEPOSITO_FOTOS = "fotos";

// La noticia de la semana que sigue vigente y no es la que se está editando, o null.
export function conflictoSemana(noticias, idEditando, hoy) {
  const vigente = noticiaDeLaSemana(noticias, hoy);
  return vigente && vigente.id !== idEditando ? vigente : null;
}

export function validarAudio({ type, size }) {
  if (!AUDIO.tipos.includes(type)) return "El audio debe ser un archivo MP3.";
  if (!(size > 0 && size <= AUDIO.maxBytes)) return "El audio no puede pesar más de 10 MB.";
  return "";
}

export function errorDeFoto({ name, type }) {
  if (/\.hei[cf]$/i.test(name || "")) return "Esta foto está en formato HEIC. Conviértela a JPG o toma una captura y vuelve a subirla.";
  if (type && !type.startsWith("image/")) return "El archivo de la fotografía no es una imagen.";
  return "";
}

export function filaNoticia(campos, hoy) {
  const fila = {};
  for (const clave of ["titulo", "subtitulo", "entradilla", "pie_foto", "cuerpo", "emisor", "origen", "fecha"]) {
    fila[clave] = (campos[clave] || "").trim();
  }
  fila.seccion = SECCIONES.some((s) => s.id === campos.seccion) ? campos.seccion : "institucional";
  fila.semana_desde = campos.semana === true ? hoy : null;
  return fila;
}

// Desactivar siempre se permite; para activar hace falta una red conocida y un enlace https.
export function validarTransmision({ activa, red, enlace }) {
  const errores = [];
  if (activa === true) {
    if (!REDES_VIVO.includes(red)) errores.push("Elige por dónde están transmitiendo.");
    if (typeof enlace !== "string" || !enlace.startsWith("https://")) {
      errores.push("Pega el enlace de la transmisión, empezando por https://");
    }
  }
  return { ok: errores.length === 0, errores };
}

export function filaTransmision({ activa, red, enlace, titulo }, ahoraISO) {
  const texto = (valor) => (valor || "").trim() || null;
  return { activa: activa === true, red: texto(red), enlace: texto(enlace), titulo: texto(titulo), actualizada: ahoraISO };
}

// La misma lista, en el mismo orden, que el check de tickets.estado en supabase/002-rediseno.sql.
export const ESTADOS_TICKET = ["abierto", "en_tramite", "cerrado"];

export const nombreEstado = (estado) =>
  ({ abierto: "Abierto", en_tramite: "En trámite", cerrado: "Cerrado" })[estado] || "";

// Un arreglo por estado, del ticket más reciente al más antiguo. Un estado desconocido se omite.
export function agruparTickets(tickets) {
  const grupos = Object.fromEntries(ESTADOS_TICKET.map((estado) => [estado, []]));
  for (const ticket of [...tickets].sort((a, b) => String(b.creado).localeCompare(String(a.creado)))) {
    grupos[ticket.estado]?.push(ticket);
  }
  return grupos;
}

const recientesPrimero = (a, b) => new Date(b.creado) - new Date(a.creado);

export const pedidosDeHoy = (pedidos, hoy) =>
  pedidos.filter((p) => fechaLocalISO(new Date(p.creado)) === hoy).sort(recientesPrimero);

// Ids de los pedidos que ya pasaron el plazo de conservación.
export const caducados = (pedidos, hoy, dias = 30) =>
  pedidos.filter((p) => diasEntre(fechaLocalISO(new Date(p.creado)), hoy) > dias).map((p) => p.id);

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
