const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// "9:30" -> "09:30", para que las horas se comparen bien como texto.
const hhmm = (s) => s.trim().padStart(5, "0");

function alAire(p, dia, hora) {
  return p.dia === dia && hhmm(p.inicio) <= hora && hora < hhmm(p.fin);
}

// Código que identifica cada mensaje del formulario de contacto: LT-AAMMDD-XXXX.
function nuevoTicket() {
  const fecha = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const azar = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "0");
  return `LT-${fecha}-${azar}`;
}

// Identificador de la noticia para poder compartir su enlace (#2026-10-05-titulo).
function slug(n) {
  const titulo = n.titulo.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return n.fecha.slice(0, 10) + "-" + titulo.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const prueba = { dia: "lunes", inicio: "9:30", fin: "10:00" };
console.assert(alAire(prueba, "lunes", "09:45"));
console.assert(!alAire(prueba, "lunes", "10:00"));
console.assert(!alAire(prueba, "martes", "09:45"));
console.assert(slug({ fecha: "2026-10-05", titulo: "¡Nace la emisión!" }) === "2026-10-05-nace-la-emision");
console.assert(/^LT-\d{6}-[A-Z0-9]{4}$/.test(nuevoTicket()));

function el(tag, texto, clase) {
  const e = document.createElement(tag);
  if (texto) e.textContent = texto;
  if (clase) e.className = clase;
  return e;
}

const filas = new Map(); // programa -> su fila en la página de programación

// Arma la programación una sola vez: un bloque plegable por día, con el de hoy abierto.
function pintarParrilla(parrilla) {
  const cont = document.querySelector("#parrilla");
  const hoy = DIAS[new Date().getDay()];
  for (const dia of [...DIAS.slice(1), DIAS[0]]) {
    const delDia = parrilla.filter((p) => p.dia === dia);
    if (!delDia.length) continue;
    const bloque = el("details");
    bloque.name = "dia"; // con el mismo nombre, al abrir un día se cierra el anterior
    bloque.open = dia === hoy;
    const titulo = el("summary", dia, "dia");
    if (dia === hoy) titulo.append(el("span", "Hoy", "etiqueta"));
    const lista = el("ul");
    for (const p of delDia) {
      const li = el("li");
      const texto = el("div");
      texto.append(el("strong", p.programa));
      if (p.enfoque) texto.append(el("span", p.enfoque, "detalle"));
      if (p.a_cargo) texto.append(el("span", "A cargo de " + p.a_cargo, "detalle"));
      li.append(el("time", `${hhmm(p.inicio)} – ${hhmm(p.fin)}`, "hora"), texto);
      if (p.estado) li.append(el("span", p.estado, p.estado === "En Vivo" ? "etiqueta vivo" : "etiqueta"));
      filas.set(p, li);
      lista.append(li);
    }
    bloque.append(titulo, lista);
    cont.append(bloque);
  }
}

// Se repite cada minuto: actualiza la franja de estado y resalta el programa que suena.
function marcarAlAire(parrilla) {
  const ahora = new Date();
  const dia = DIAS[ahora.getDay()];
  const hora = ahora.toTimeString().slice(0, 5);
  let sonando, proximo;
  for (const p of parrilla) {
    const suena = alAire(p, dia, hora);
    filas.get(p)?.classList.toggle("al-aire", suena);
    if (suena) sonando = p;
    else if (!proximo && p.dia === dia && hhmm(p.inicio) > hora) proximo = p;
  }
  const estado = document.querySelector("#estado");
  estado.classList.toggle("encendido", Boolean(sonando));
  estado.querySelector("span").textContent = sonando
    ? `Al aire: ${sonando.programa}, hasta las ${hhmm(sonando.fin)}`
    : proximo
      ? `Fuera del aire. Sigue ${proximo.programa} a las ${hhmm(proximo.inicio)}`
      : "Fuera del aire por hoy";
}

const POR_TANDA = 10;
let pendientes = [];
let ultimoMes = "";

// T12:00 evita que la zona horaria corra la fecha un día atrás.
const fechaDe = (n) => new Date(n.fecha.slice(0, 10) + "T12:00");

function armarNoticia(n) {
  const art = el("article");
  art.id = slug(n);
  if (n.foto) {
    const figura = el("figure");
    const img = el("img");
    img.src = n.foto.replace(/^\//, "");
    img.alt = n.pie_foto || "";
    img.loading = "lazy";
    figura.append(img);
    if (n.pie_foto) figura.append(el("figcaption", n.pie_foto));
    art.append(figura);
  }
  const fecha = el("time", fechaDe(n).toLocaleDateString("es-CO", { dateStyle: "long" }));
  fecha.dateTime = n.fecha.slice(0, 10);
  const meta = el("p", n.origen ? n.origen + " · " : "", "meta");
  meta.append(fecha);
  const titulo = el("h3");
  const enlace = el("a", n.titulo);
  enlace.href = "#" + art.id;
  titulo.append(enlace);
  art.append(meta, titulo);
  if (n.subtitulo) art.append(el("p", n.subtitulo, "subtitulo"));
  if (n.entradilla) art.append(el("p", n.entradilla, "entradilla"));
  if (n.cuerpo) {
    const mas = el("details");
    mas.append(el("summary", "Leer la noticia completa"));
    for (const parrafo of n.cuerpo.split(/\n+/)) {
      if (parrafo.trim()) mas.append(el("p", parrafo));
    }
    art.append(mas);
  }
  if (n.emisor) art.append(el("footer", "Por " + n.emisor, "firma"));
  return art;
}

// Agrega la siguiente tanda de noticias, con un título cada vez que cambia el mes.
function pintarMas() {
  const cont = document.querySelector("#noticias");
  for (const n of pendientes.splice(0, POR_TANDA)) {
    const mes = fechaDe(n).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
    if (mes !== ultimoMes) cont.append(el("h2", mes, "rotulo"));
    ultimoMes = mes;
    cont.append(armarNoticia(n));
  }
  document.querySelector("#mas-noticias").hidden = !pendientes.length;
}

function pintarNoticias(noticias) {
  const cont = document.querySelector("#noticias");
  if (!noticias.length) {
    cont.append(el("p", "Todavía no hay noticias publicadas."));
    return;
  }
  pendientes = noticias; // ya llegan ordenadas de la más reciente a la más antigua
  const boton = el("button", "Ver más noticias");
  boton.id = "mas-noticias";
  boton.className = "boton";
  boton.type = "button";
  boton.onclick = pintarMas;
  cont.after(boton);
  pintarMas();
}

function abrirDesdeHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  // El enlace puede apuntar a una noticia antigua que aún no se ha cargado.
  if (pendientes.some((n) => slug(n) === id)) {
    while (!document.getElementById(id)) pintarMas();
  }
  const art = document.getElementById(id);
  if (!art || !art.matches("article")) return;
  const mas = art.querySelector("details");
  if (mas) mas.open = true;
  art.scrollIntoView();
}

// La junta lleva foto (o la inicial si no hay); los miembros, solo nombre y cargo.
function pintarEquipo(personas, lista, conFoto) {
  for (const m of personas) {
    const li = el("li");
    if (conFoto && m.foto) {
      const img = el("img");
      img.src = m.foto.replace(/^\//, "");
      img.alt = "";
      img.loading = "lazy";
      li.append(img);
    } else if (conFoto) {
      const inicial = el("span", m.nombre.trim()[0], "inicial");
      inicial.ariaHidden = "true";
      li.append(inicial);
    }
    li.append(el("strong", m.nombre));
    if (m.cargo) li.append(el("span", m.cargo, "detalle"));
    lista.append(li);
  }
}

function pintarContacto(emisora) {
  const datos = document.querySelector("#datos-contacto");
  const correo = el("a", emisora.contacto);
  correo.href = "mailto:" + emisora.contacto;
  const filas = [["Correo", correo], ["Teléfono", emisora.telefono], ["Dirección", emisora.direccion]];
  for (const [nombre, valor] of filas) {
    if (!valor) continue;
    const dd = el("dd");
    dd.append(valor);
    datos.append(el("dt", nombre), dd);
  }
}

// El formulario envía el mensaje al correo de la emisora a través de FormSubmit
// (formsubmit.co). El número de ticket va en el asunto para poder seguir cada caso.
function prepararFormulario(destino) {
  const form = document.querySelector("#form-contacto");
  const aviso = document.querySelector("#aviso");
  const boton = form.querySelector("button");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const ticket = nuevoTicket();
    const mensaje = {
      _subject: `[${ticket}] ${d.get("tipo")} · ${d.get("nombre")}`,
      _template: "table",
      _honey: d.get("_honey"), // campo trampa: las personas no lo ven, los robots lo llenan
      Ticket: ticket,
      Tipo: d.get("tipo"),
      Nombre: d.get("nombre"),
      Mensaje: d.get("mensaje"),
    };
    if (d.get("correo")) mensaje.email = d.get("correo");
    boton.disabled = true;
    aviso.className = "";
    aviso.textContent = "Enviando…";
    try {
      const r = await fetch("https://formsubmit.co/ajax/" + destino, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(mensaje),
      });
      const respuesta = await r.json();
      if (!r.ok || String(respuesta.success) !== "true") throw new Error(respuesta.message);
      form.reset();
      aviso.textContent = `Mensaje enviado. Tu número de ticket es ${ticket}.`;
    } catch {
      aviso.className = "error";
      aviso.textContent = `No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos a ${destino}.`;
    }
    boton.disabled = false;
  };
}

const pide = (u) => fetch(u).then((r) => r.json());
const hay = (id) => document.querySelector(id);

// Las noticias viven en Supabase (js/config.js); la lectura es pública.
const pideNoticias = () =>
  fetch(`${SUPABASE_URL}/rest/v1/noticias?select=*&order=fecha.desc,id.desc`, { headers: { apikey: SUPABASE_KEY } })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)));

Promise.all([pide("datos/emisora.json"), hay("#noticias") ? pideNoticias() : []])
  .then(([emisora, noticias]) => {
    document.querySelector("#lema").textContent = emisora.lema;
    const correo = document.querySelector("#correo");
    correo.textContent = emisora.contacto;
    correo.href = "mailto:" + emisora.contacto;
    if (emisora.stream) {
      const audio = el("audio");
      audio.controls = true;
      audio.src = emisora.stream;
      document.querySelector("#estado").append(audio);
    }
    const parrilla = [...emisora.parrilla].sort((a, b) => hhmm(a.inicio).localeCompare(hhmm(b.inicio)));
    if (hay("#parrilla")) pintarParrilla(parrilla);
    marcarAlAire(parrilla);
    setInterval(() => marcarAlAire(parrilla), 60000);
    if (hay("#junta")) {
      pintarEquipo(emisora.junta || [], hay("#junta"), true);
      pintarEquipo(emisora.miembros || [], hay("#miembros"), false);
    }
    if (hay("#datos-contacto")) {
      pintarContacto(emisora);
      prepararFormulario(emisora.contacto);
    }
    if (hay("#noticias")) {
      pintarNoticias(noticias);
      abrirDesdeHash();
      addEventListener("hashchange", abrirDesdeHash);
    }
  })
  .catch(() => {
    document.querySelector("main").append(
      el("p", "No se pudo cargar el contenido. Si abriste el archivo con doble clic, ábrelo desde la dirección publicada del sitio."),
    );
  });
