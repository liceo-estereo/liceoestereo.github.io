// Pestaña Noticias del panel: publicar, editar y eliminar, con sección, noticia de la semana y audio.
import { SECCIONES } from "./ajustes.js";
import {
  AUDIO,
  DEPOSITO_FOTOS,
  conflictoSemana,
  errorDeFoto,
  fechaLocalISO,
  filaNoticia,
  noticiaDeLaSemana,
  validarAudio,
} from "./logica.js";
import { aviso, sb } from "./panel.js";

const CAMPOS = ["titulo", "subtitulo", "entradilla", "seccion", "pie_foto", "cuerpo", "emisor", "origen", "fecha"];
const campo = (id) => document.querySelector("#" + id);
const form = document.querySelector("#form-noticia");
const dialogo = document.querySelector("#aviso-semana");

let noticias = [];
let editando = null; // la noticia que se está editando, o null si es nueva

function mostrarAudio() {
  const visible = document.querySelector("#con-audio").checked;
  document.querySelector("#audio").hidden = !visible;
  document.querySelector("#etiqueta-audio").hidden = !visible;
}

function limpiar() {
  editando = null;
  form.reset();
  campo("fecha").value = fechaLocalISO();
  document.querySelector("#titulo-form").textContent = "Nueva noticia";
  document.querySelector("#guardar").textContent = "Publicar";
  document.querySelector("#cancelar").hidden = true;
  mostrarAudio();
}

function cargar(noticia) {
  limpiar();
  editando = noticia;
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
  const ruta = `${Date.now()}.${extension}`;
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
    const li = document.createElement("li");
    const texto = document.createElement("span");
    texto.textContent = `${noticia.fecha} · ${noticia.titulo}${noticia === vigente ? " · noticia de la semana" : ""}`;
    const editar = document.createElement("button");
    editar.textContent = "Editar";
    editar.onclick = () => cargar(noticia);
    const borrar = document.createElement("button");
    borrar.textContent = "Eliminar";
    borrar.onclick = () => eliminar(noticia);
    editar.type = borrar.type = "button";
    editar.className = borrar.className = "boton";
    li.append(texto, editar, borrar);
    lista.append(li);
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
  aviso("Noticia eliminada.");
  if (editando?.id === noticia.id) limpiar();
  listar();
}

async function guardar() {
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
    if (audio) fila.audio = await subir(AUDIO.deposito, audio, "mp3", AUDIO.tipos[0], subidos);
    else if (editando && !conAudio) fila.audio = null;

    const consulta = editando
      ? sb.from("noticias").update(fila).eq("id", editando.id)
      : sb.from("noticias").insert(fila);
    // Si el usuario no es editor la base de datos no falla al actualizar: no cambia ninguna fila.
    const { data, error } = await consulta.select();
    if (error || !data.length) throw error || new Error("sin permiso");

    // Guardado: ya se pueden borrar los archivos que la noticia dejó de usar.
    if (editando && foto) await borrarArchivo(DEPOSITO_FOTOS, editando.foto);
    if (editando && (audio || !conAudio)) await borrarArchivo(AUDIO.deposito, editando.audio);
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
document.querySelector("#con-audio").onchange = mostrarAudio;
document.querySelector("#cerrar-aviso-semana").onclick = () => dialogo.close();

document.addEventListener("panel:pestana", (evento) => {
  if (evento.detail !== "noticias") return;
  limpiar();
  listar();
});
