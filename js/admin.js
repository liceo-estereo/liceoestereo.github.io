const $ = (s) => document.querySelector(s);
const CAMPOS = ["titulo", "subtitulo", "entradilla", "pie_foto", "cuerpo", "emisor", "origen", "fecha"];
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let editando = null; // id de la noticia que se está editando, o null si es nueva

function aviso(texto, esError) {
  $("#aviso").textContent = texto;
  $("#aviso").className = esError ? "error" : "";
}

async function mostrar() {
  const { data } = await sb.auth.getSession();
  const sesion = data.session;
  $("#entrada").hidden = Boolean(sesion);
  $("#panel").hidden = $("#salir").hidden = !sesion;
  if (!sesion) return;
  $("#quien").textContent = sesion.user.email;
  limpiar();
  listar();
}

function limpiar() {
  editando = null;
  $("#form-noticia").reset();
  $("#fecha").value = new Date().toLocaleDateString("en-CA"); // hoy, en formato AAAA-MM-DD
  $("#titulo-form").textContent = "Nueva noticia";
  $("#guardar").textContent = "Publicar";
  $("#cancelar").hidden = true;
}

// Las fotos de celular pesan varios MB; se bajan a 1600 px para no llenar el almacenamiento gratuito.
async function reducir(archivo, max = 1600) {
  const img = await createImageBitmap(archivo);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(img.width * k);
  lienzo.height = Math.round(img.height * k);
  lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
  return new Promise((listo) => lienzo.toBlob(listo, "image/jpeg", 0.82));
}

async function subirFoto(archivo) {
  const ruta = Date.now() + ".jpg";
  const { error } = await sb.storage.from("fotos").upload(ruta, await reducir(archivo), { contentType: "image/jpeg" });
  if (error) throw error;
  return sb.storage.from("fotos").getPublicUrl(ruta).data.publicUrl;
}

async function listar() {
  const { data, error } = await sb.from("noticias").select("*").order("fecha", { ascending: false });
  const lista = $("#publicadas");
  lista.replaceChildren();
  if (error) return aviso("No se pudieron cargar las noticias.", true);
  for (const n of data) {
    const li = document.createElement("li");
    const texto = document.createElement("span");
    texto.textContent = `${n.fecha} · ${n.titulo}`;
    const editar = document.createElement("button");
    editar.textContent = "Editar";
    editar.onclick = () => cargar(n);
    const borrar = document.createElement("button");
    borrar.textContent = "Eliminar";
    borrar.onclick = () => eliminar(n);
    editar.type = borrar.type = "button";
    editar.className = borrar.className = "boton";
    li.append(texto, editar, borrar);
    lista.append(li);
  }
}

function cargar(n) {
  limpiar();
  editando = n.id;
  for (const c of CAMPOS) $("#" + c).value = n[c] || "";
  $("#titulo-form").textContent = "Editar noticia";
  $("#guardar").textContent = "Guardar cambios";
  $("#cancelar").hidden = false;
  $("#titulo-form").scrollIntoView();
}

async function eliminar(n) {
  if (!confirm(`¿Eliminar la noticia "${n.titulo}"? No se puede deshacer.`)) return;
  const { data, error } = await sb.from("noticias").delete().eq("id", n.id).select();
  if (error || !data.length) return aviso("No se pudo eliminar. Revisa que tu usuario esté en la lista de editores.", true);
  const ruta = n.foto?.split("/fotos/")[1];
  if (ruta) await sb.storage.from("fotos").remove([ruta]);
  aviso("Noticia eliminada.");
  if (editando === n.id) limpiar();
  listar();
}

$("#form-entrada").onsubmit = async (e) => {
  e.preventDefault();
  const { error } = await sb.auth.signInWithPassword({ email: $("#correo").value, password: $("#clave").value });
  if (error) return aviso("Correo o contraseña incorrectos.", true);
  aviso("");
  $("#form-entrada").reset();
  mostrar();
};

$("#salir").onclick = async () => {
  await sb.auth.signOut();
  aviso("");
  mostrar();
};

$("#cancelar").onclick = limpiar;

$("#form-noticia").onsubmit = async (e) => {
  e.preventDefault();
  $("#guardar").disabled = true;
  aviso("Guardando…");
  try {
    const datos = Object.fromEntries(CAMPOS.map((c) => [c, $("#" + c).value.trim()]));
    const archivo = $("#foto").files[0];
    // ponytail: al cambiar la foto de una noticia, la anterior queda guardada sin usarse; limpiar a mano si el almacenamiento se llena.
    if (archivo) datos.foto = await subirFoto(archivo);
    const consulta = editando
      ? sb.from("noticias").update(datos).eq("id", editando)
      : sb.from("noticias").insert(datos);
    // Si el usuario no es editor, la base de datos no falla al actualizar: simplemente no cambia ninguna fila.
    const { data, error } = await consulta.select();
    if (error || !data.length) throw error || new Error("sin permiso");
    aviso(editando ? "Cambios guardados." : "Noticia publicada.");
    limpiar();
    listar();
  } catch {
    aviso("No se pudo guardar. Revisa que tu usuario esté en la lista de editores y que la foto sea una imagen.", true);
  }
  $("#guardar").disabled = false;
};

mostrar();
