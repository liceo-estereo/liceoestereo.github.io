// Pestaña Noticias del panel: publicar, editar y eliminar, con sección, noticia de la semana y audio.
import { SECCIONES } from "./ajustes.js";
import {
  AUDIO,
  DEPOSITO_FOTOS,
  MAX_ANEXOS,
  anexoDeEnlace,
  conflictoSemana,
  errorDeFoto,
  esEnlaceSeguro,
  fechaLarga,
  fechaLocalISO,
  filaNoticia,
  limpiarAnexos,
  noticiaDeLaSemana,
  validarAudio,
} from "./logica.js";
import { aviso, sb } from "./panel.js";
import { el } from "./vista.js";

const CAMPOS = ["titulo", "subtitulo", "entradilla", "seccion", "pie_foto", "cuerpo", "emisor", "origen", "fecha"];
const campo = (id) => document.querySelector("#" + id);
const form = document.querySelector("#form-noticia");
const dialogo = document.querySelector("#aviso-semana");

let noticias = [];
let editando = null; // la noticia que se está editando, o null si es nueva
let sinFoto = false; // al editar: se pidió quitar la foto que la noticia ya tenía
let temporal = ""; // dirección de la vista previa del archivo elegido

// Muestra la foto elegida o, al editar, la que la noticia ya tiene, con el botón para quitarla.
function pintarFoto() {
  URL.revokeObjectURL(temporal);
  const archivo = campo("foto").files[0];
  temporal = archivo ? URL.createObjectURL(archivo) : "";
  const actual = !sinFoto && esEnlaceSeguro(editando?.foto) ? editando.foto : "";
  document.querySelector("#vista-foto").hidden = !(temporal || actual);
  document.querySelector("#imagen-foto").src = temporal || actual;
}

// Primero descarta el archivo recién elegido; si no había, quita la foto guardada de la noticia.
function quitarFoto() {
  if (campo("foto").files[0]) campo("foto").value = "";
  else sinFoto = true;
  pintarFoto();
}

// Anexos del formulario: { tipo, enlace, pie } y, en las fotos aún sin subir, también `archivo`
// (ahí `enlace` es la dirección temporal de la vista previa).
let anexos = [];

function pintarAnexos() {
  const lista = document.querySelector("#lista-anexos");
  lista.replaceChildren();
  for (const anexo of anexos) {
    const li = el("li");
    if (anexo.tipo === "foto") {
      const img = el("img");
      img.src = anexo.enlace;
      img.alt = "Foto anexa";
      li.append(img);
    } else {
      li.append(el("strong", anexoDeEnlace(anexo.enlace).nombre), el("span", anexo.enlace, "meta"));
    }
    const pie = el("input");
    pie.value = anexo.pie;
    pie.maxLength = 200;
    pie.placeholder = "Pie o descripción (opcional)";
    pie.setAttribute("aria-label", "Pie o descripción del anexo");
    pie.oninput = () => (anexo.pie = pie.value);
    const quitar = el("button", "Quitar", "boton peligro");
    quitar.type = "button";
    quitar.onclick = () => {
      if (anexo.archivo) URL.revokeObjectURL(anexo.enlace);
      anexos = anexos.filter((otro) => otro !== anexo);
      pintarAnexos();
    };
    li.append(pie, quitar);
    lista.append(li);
  }
}

// Devuelve false si no se pudo agregar (y lo avisa).
function agregarAnexo(anexo) {
  if (anexos.length >= MAX_ANEXOS) return aviso(`Una noticia admite máximo ${MAX_ANEXOS} anexos.`, true), false;
  anexos.push({ pie: "", ...anexo });
  pintarAnexos();
  aviso("");
  return true;
}

function agregarEnlace() {
  const entrada = document.querySelector("#anexo-enlace");
  const enlace = entrada.value.trim();
  if (!enlace) return true;
  if (!anexoDeEnlace(enlace)) return aviso("El enlace del anexo debe empezar por https://", true), false;
  if (!agregarAnexo({ tipo: "enlace", enlace })) return false;
  entrada.value = "";
  return true;
}

function mostrarAudio() {
  const visible = document.querySelector("#con-audio").checked;
  document.querySelector("#audio").hidden = !visible;
  document.querySelector("#etiqueta-audio").hidden = !visible;
}

function limpiar() {
  editando = null;
  sinFoto = false;
  for (const anexo of anexos) if (anexo.archivo) URL.revokeObjectURL(anexo.enlace);
  anexos = [];
  pintarAnexos();
  form.reset();
  pintarFoto();
  campo("fecha").value = fechaLocalISO();
  document.querySelector("#titulo-form").textContent = "Nueva noticia";
  document.querySelector("#guardar").textContent = "Publicar";
  document.querySelector("#cancelar").hidden = true;
  mostrarAudio();
}

function cargar(noticia) {
  limpiar();
  editando = noticia;
  anexos = limpiarAnexos(noticia.anexos);
  pintarAnexos();
  pintarFoto();
  for (const id of CAMPOS) campo(id).value = noticia[id] || "";
  document.querySelector("#semana").checked = Boolean(noticiaDeLaSemana([noticia], fechaLocalISO()));
  document.querySelector("#con-audio").checked = Boolean(noticia.audio);
  mostrarAudio();
  document.querySelector("#titulo-form").textContent = "Editar noticia";
  document.querySelector("#guardar").textContent = "Guardar cambios";
  document.querySelector("#cancelar").hidden = false;
  document.querySelector("#titulo-form").scrollIntoView();
}

// Las fotos de celular pesan varios MB: se bajan a 1600 px por su lado mayor. "from-image" respeta
// la orientación con la que se tomó la foto.
async function reducir(archivo, max = 1600) {
  const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, max / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  return new Promise((listo) => lienzo.toBlob(listo, "image/jpeg", 0.82));
}

// Sube un archivo y anota dónde quedó, para poder borrarlo si después falla el guardado.
async function subir(deposito, archivo, extension, tipo, subidos) {
  const ruta = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { error } = await sb.storage.from(deposito).upload(ruta, archivo, { contentType: tipo });
  if (error) throw error;
  subidos.push({ deposito, ruta });
  return sb.storage.from(deposito).getPublicUrl(ruta).data.publicUrl;
}

async function borrarArchivo(deposito, direccion) {
  const ruta = direccion?.split(`/${deposito}/`)[1];
  if (ruta) await sb.storage.from(deposito).remove([ruta]);
}

async function listar() {
  const { data, error } = await sb.from("noticias").select("*").order("fecha", { ascending: false });
  const lista = document.querySelector("#publicadas");
  lista.replaceChildren();
  if (error) return aviso("No se pudieron cargar las noticias.", true);
  noticias = data;
  const vigente = noticiaDeLaSemana(noticias, fechaLocalISO());
  for (const noticia of noticias) {
    const fila = el("tr");
    const titulo = el("td", noticia.titulo);
    if (noticia === vigente) titulo.append(" ", el("span", "★ De la semana", "insignia"));
    const editar = el("button", "Editar", "boton");
    editar.onclick = () => cargar(noticia);
    const borrar = el("button", "Eliminar", "boton peligro");
    borrar.onclick = () => eliminar(noticia);
    editar.type = borrar.type = "button";
    const acciones = el("td", "", "acciones-fila");
    acciones.append(editar, borrar);
    fila.append(titulo, el("td", fechaLarga(noticia.fecha)), el("td", noticia.emisor || "—"), acciones);
    lista.append(fila);
  }
  if (!noticias.length) {
    const vacia = el("td", "Todavía no hay noticias publicadas.");
    vacia.colSpan = 4;
    const fila = el("tr");
    fila.append(vacia);
    lista.append(fila);
  }
}

async function eliminar(noticia) {
  if (!confirm(`¿Eliminar la noticia "${noticia.titulo}"? No se puede deshacer.`)) return;
  const { data, error } = await sb.from("noticias").delete().eq("id", noticia.id).select();
  if (error || !data.length) {
    return aviso("No se pudo eliminar. Revisa que tu usuario esté en la lista de editores.", true);
  }
  await borrarArchivo(DEPOSITO_FOTOS, noticia.foto);
  await borrarArchivo(AUDIO.deposito, noticia.audio);
  for (const anexo of limpiarAnexos(noticia.anexos)) if (anexo.tipo === "foto") await borrarArchivo(DEPOSITO_FOTOS, anexo.enlace);
  aviso("Noticia eliminada.");
  if (editando?.id === noticia.id) limpiar();
  listar();
}

async function guardar() {
  if (!agregarEnlace()) return; // un enlace escrito pero sin añadir también cuenta
  const hoy = fechaLocalISO();
  const campos = Object.fromEntries(CAMPOS.map((id) => [id, campo(id).value]));
  campos.semana = document.querySelector("#semana").checked;

  // Solo puede haber una noticia de la semana vigente: primero hay que quitarle la marca a la otra.
  const otra = campos.semana ? conflictoSemana(noticias, editando?.id ?? null, hoy) : null;
  if (otra) {
    document.querySelector("#aviso-semana-texto").textContent =
      `Ya hay una noticia de la semana: ${otra.titulo}. Quítale la marca antes de marcar otra.`;
    return dialogo.showModal();
  }

  const conAudio = document.querySelector("#con-audio").checked;
  const foto = campo("foto").files[0];
  const audio = conAudio ? document.querySelector("#audio").files[0] : null;
  const problema = (foto && errorDeFoto(foto)) || (audio && validarAudio(audio));
  if (problema) return aviso(problema, true);

  const boton = document.querySelector("#guardar");
  boton.disabled = true;
  aviso("Guardando…");
  const subidos = [];
  try {
    const fila = filaNoticia(campos, hoy);
    // Editar la noticia de la semana no reinicia sus siete días.
    if (campos.semana && editando && noticiaDeLaSemana([editando], hoy)) fila.semana_desde = editando.semana_desde;
    if (foto) fila.foto = await subir(DEPOSITO_FOTOS, await reducir(foto), "jpg", "image/jpeg", subidos);
    else if (editando && sinFoto) fila.foto = null;
    if (audio) fila.audio = await subir(AUDIO.deposito, audio, "mp3", AUDIO.tipos[0], subidos);
    else if (editando && !conAudio) fila.audio = null;

    const lista = [];
    for (const anexo of anexos) {
      const enlace = anexo.archivo
        ? await subir(DEPOSITO_FOTOS, await reducir(anexo.archivo), "jpg", "image/jpeg", subidos)
        : anexo.enlace;
      lista.push({ ...anexo, enlace });
    }
    const guardados = limpiarAnexos(lista);
    const viejos = limpiarAnexos(editando?.anexos);
    // Sin anexos no se envía el campo: así el panel sigue sirviendo aunque falte aplicar 005-anexos.sql.
    if (guardados.length || viejos.length) fila.anexos = guardados;

    const consulta = editando
      ? sb.from("noticias").update(fila).eq("id", editando.id)
      : sb.from("noticias").insert(fila);
    // Si el usuario no es editor la base de datos no falla al actualizar: no cambia ninguna fila.
    const { data, error } = await consulta.select();
    if (error || !data.length) throw error || new Error("sin permiso");

    // Guardado: ya se pueden borrar los archivos que la noticia dejó de usar.
    if (editando && (foto || sinFoto)) await borrarArchivo(DEPOSITO_FOTOS, editando.foto);
    if (editando && (audio || !conAudio)) await borrarArchivo(AUDIO.deposito, editando.audio);
    for (const viejo of viejos) {
      if (viejo.tipo === "foto" && !guardados.some((a) => a.enlace === viejo.enlace)) await borrarArchivo(DEPOSITO_FOTOS, viejo.enlace);
    }
    aviso(editando ? "Cambios guardados." : "Noticia publicada.");
    limpiar();
    listar();
  } catch {
    // Lo que se alcanzó a subir en este intento se borra, para no dejar archivos sin noticia.
    for (const { deposito, ruta } of subidos) await sb.storage.from(deposito).remove([ruta]);
    aviso("No se pudo guardar. Revisa que tu usuario esté en la lista de editores.", true);
  }
  boton.disabled = false;
}

for (const seccion of SECCIONES) {
  const opcion = document.createElement("option");
  opcion.value = seccion.id;
  opcion.textContent = seccion.nombre;
  campo("seccion").append(opcion);
}

form.onsubmit = (evento) => {
  evento.preventDefault();
  guardar();
};
document.querySelector("#cancelar").onclick = limpiar;
campo("foto").onchange = () => {
  sinFoto = false;
  pintarFoto();
};
document.querySelector("#quitar-foto").onclick = quitarFoto;
document.querySelector("#agregar-anexo").onclick = agregarEnlace;
document.querySelector("#anexo-enlace").onkeydown = (evento) => {
  if (evento.key !== "Enter") return;
  evento.preventDefault(); // Enter añade el enlace; no debe publicar la noticia
  agregarEnlace();
};
document.querySelector("#anexo-foto").onchange = (evento) => {
  const archivo = evento.target.files[0];
  evento.target.value = "";
  if (!archivo) return;
  const problema = errorDeFoto(archivo);
  if (problema) return aviso(problema, true);
  agregarAnexo({ tipo: "foto", enlace: URL.createObjectURL(archivo), archivo });
};
document.querySelector("#con-audio").onchange = mostrarAudio;
document.querySelector("#cerrar-aviso-semana").onclick = () => dialogo.close();

document.addEventListener("panel:pestana", (evento) => {
  if (evento.detail !== "noticias") return;
  limpiar();
  listar();
});
