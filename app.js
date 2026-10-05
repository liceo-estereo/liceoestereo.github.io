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
  const lista = document.querySelector("#parrilla");
  lista.replaceChildren();
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
    lista.append(li);
  }
  const estado = document.querySelector("#estado");
  estado.classList.toggle("encendido", Boolean(sonando));
  estado.querySelector("span").textContent = sonando
    ? `Al aire: ${sonando.programa}, hasta las ${hhmm(sonando.fin)}`
    : proximo
      ? `Fuera del aire. Sigue ${proximo.programa} a las ${hhmm(proximo.inicio)}`
      : "Fuera del aire por hoy";
}

// ponytail: todas las noticias en una sola página; paginar o archivar por año cuando pasen de ~50.
function pintarNoticias(noticias) {
  const cont = document.querySelector("#noticias");
  if (!noticias.length) {
    cont.append(el("p", "Todavía no hay noticias publicadas."));
    return;
  }
  noticias.sort((a, b) => b.fecha.localeCompare(a.fecha));
  for (const n of noticias) {
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
    // T12:00 evita que la zona horaria corra la fecha un día atrás.
    const dia = n.fecha.slice(0, 10);
    const fecha = el("time", new Date(dia + "T12:00").toLocaleDateString("es-CO", { dateStyle: "long" }));
    fecha.dateTime = dia;
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
    cont.append(art);
  }
}

function abrirDesdeHash() {
  const art = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (!art || !art.matches("article")) return;
  const mas = art.querySelector("details");
  if (mas) mas.open = true;
  art.scrollIntoView();
}

Promise.all(["emisora.json", "noticias.json"].map((u) => fetch(u).then((r) => r.json())))
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
    pintarNoticias(noticias);
    abrirDesdeHash();
    addEventListener("hashchange", abrirDesdeHash);
  })
  .catch(() => {
    document.querySelector("#noticias").textContent =
      "No se pudo cargar el contenido. Si abriste el archivo con doble clic, ábrelo desde la dirección publicada del sitio.";
  });
