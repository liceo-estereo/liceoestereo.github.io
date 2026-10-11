const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// "9:30" -> "09:30", para que las horas se comparen bien como texto.
const hhmm = (s) => s.trim().padStart(5, "0");

function alAire(p, dia, hora) {
  return p.dias.includes(dia) && hhmm(p.inicio) <= hora && hora < hhmm(p.fin);
}

// Identificador de la noticia para poder compartir su enlace (#2026-10-05-titulo).
function slug(n) {
  const titulo = n.titulo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return n.fecha.slice(0, 10) + "-" + titulo.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const prueba = { dias: ["lunes"], inicio: "9:30", fin: "10:00" };
console.assert(alAire(prueba, "lunes", "09:45"));
console.assert(!alAire(prueba, "lunes", "10:00"));
console.assert(!alAire(prueba, "martes", "09:45"));
console.assert(slug({ fecha: "2026-10-05", titulo: "¡Nace la emisión!" }) === "2026-10-05-nace-la-emision");

function el(tag, texto, clase) {
  const e = document.createElement(tag);
  if (texto) e.textContent = texto;
  if (clase) e.className = clase;
  return e;
}

function textoDias(dias) {
  const semana = DIAS.slice(1, 6);
  if (dias.length === 5 && semana.every((d) => dias.includes(d))) return "Lunes a viernes";
  return dias.map((d) => d.slice(0, 3)).join(" · ");
}

function pintarParrilla(parrilla) {
  const ahora = new Date();
  const dia = DIAS[ahora.getDay()];
  const hora = ahora.toTimeString().slice(0, 5);
  // La lista solo existe en la página de programación; la franja de estado, en todas.
  const lista = document.querySelector("#parrilla");
  lista?.replaceChildren();
  let sonando, proximo;
  const orden = [...parrilla].sort((a, b) => hhmm(a.inicio).localeCompare(hhmm(b.inicio)));
  for (const p of orden) {
    const li = el("li");
    if (alAire(p, dia, hora)) {
      li.className = "al-aire";
      sonando = p;
    } else if (!proximo && p.dias.includes(dia) && hhmm(p.inicio) > hora) {
      proximo = p;
    }
    li.append(
      el("time", `${hhmm(p.inicio)} – ${hhmm(p.fin)}`, "hora"),
      el("strong", p.programa),
      el("span", [textoDias(p.dias), p.a_cargo].filter(Boolean).join(" · "), "detalle"),
    );
    lista?.append(li);
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
    if (mes !== ultimoMes) cont.append(el("h2", mes, "mes"));
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
  pendientes = noticias.sort((a, b) => b.fecha.localeCompare(a.fecha));
  const boton = el("button", "Ver más noticias");
  boton.id = "mas-noticias";
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

function pintarEquipo(equipo) {
  const lista = document.querySelector("#equipo");
  for (const m of equipo) {
    const li = el("li");
    if (m.foto) {
      const img = el("img");
      img.src = m.foto.replace(/^\//, "");
      img.alt = "";
      img.loading = "lazy";
      li.append(img);
    } else {
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

const pide = (u) => fetch(u).then((r) => r.json());
const hay = (id) => document.querySelector(id);

// Con Supabase conectado (config.js) las noticias salen de su base de datos; si no, del archivo local.
const pideNoticias = () =>
  SUPABASE_URL
    ? fetch(`${SUPABASE_URL}/rest/v1/noticias?select=*&order=fecha.desc`, { headers: { apikey: SUPABASE_KEY } })
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    : pide("noticias.json");

Promise.all([pide("emisora.json"), hay("#noticias") ? pideNoticias() : []])
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
    pintarParrilla(emisora.parrilla);
    setInterval(() => pintarParrilla(emisora.parrilla), 60000);
    if (hay("#equipo")) pintarEquipo(emisora.equipo || []);
    if (hay("#datos-contacto")) pintarContacto(emisora);
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
