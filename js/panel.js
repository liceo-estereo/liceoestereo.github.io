// Panel de administración: sesión, rol y pestañas. Los módulos js/panel-*.js importan de aquí el
// cliente `sb` (uno solo para todo el panel) y esperan el evento "panel:pestana" para pedir datos.
import { SUPABASE_KEY, SUPABASE_URL } from "./ajustes.js";
import { pestanasPara } from "./logica.js";
import { FUENTES_URL } from "./marco.js";

// sessionStorage: la sesión termina al cerrar la pestaña del navegador. Los computadores del
// colegio son compartidos; con el almacenamiento por defecto el panel quedaba abierto.
export const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { storage: sessionStorage } });

export function aviso(texto, esError) {
  const parrafo = document.querySelector("#aviso");
  parrafo.textContent = texto;
  parrafo.classList.toggle("error", Boolean(esError));
}

const botones = [...document.querySelectorAll('[role="tab"]')];

export function mostrarPestana(nombre) {
  for (const boton of botones) {
    const activa = boton.dataset.pestana === nombre;
    boton.setAttribute("aria-selected", String(activa));
    document.querySelector("#pestana-" + boton.dataset.pestana).hidden = !activa;
  }
  aviso("");
  document.dispatchEvent(new CustomEvent("panel:pestana", { detail: nombre }));
}

// La pestaña Tickets solo se ofrece a los administradores. Ocultarla no es la protección: quien
// no es administrador tampoco recibe filas de la base de datos.
async function esAdministrador() {
  const { data, error } = await sb.rpc("es_admin");
  return !error && data === true;
}

async function mostrar() {
  const { data } = await sb.auth.getSession();
  const sesion = data.session;
  document.querySelector("#entrada").hidden = Boolean(sesion);
  document.querySelector("#panel").hidden = !sesion;
  document.querySelector("#salir").hidden = !sesion;
  if (!sesion) return;
  document.querySelector("#quien").textContent = sesion.user.email;
  const admin = await esAdministrador();
  // Se dice el rol para que no extrañe la falta de la pestaña Tickets.
  document.querySelector("#rol").textContent = admin
    ? "administrador"
    : "editor (la pestaña Tickets es solo para administradores)";
  const permitidas = pestanasPara(admin);
  for (const boton of botones) boton.hidden = !permitidas.includes(boton.dataset.pestana);
  mostrarPestana("noticias");
}

for (const boton of botones) boton.onclick = () => mostrarPestana(boton.dataset.pestana);

document.querySelector("#form-entrada").onsubmit = async (evento) => {
  evento.preventDefault();
  const { error } = await sb.auth.signInWithPassword({
    email: document.querySelector("#correo").value,
    password: document.querySelector("#clave").value,
  });
  if (error) return aviso("Correo o contraseña incorrectos.", true);
  evento.target.reset();
  aviso("");
  mostrar();
};

document.querySelector("#salir").onclick = async () => {
  await sb.auth.signOut();
  aviso("");
  mostrar();
};

const fuentes = document.createElement("link");
fuentes.rel = "stylesheet";
fuentes.href = FUENTES_URL;
document.head.append(fuentes);

mostrar();
