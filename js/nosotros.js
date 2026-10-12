// Nosotros: reseña de la emisora, junta directiva en fichas y miembros en lista.
import { inicial, parrafos } from "./logica.js";
import { montarMarco } from "./marco.js";
import { el, rutaImagen } from "./vista.js";

function pintarResena(texto) {
  if (!texto.trim()) return;
  const seccion = document.querySelector("#resena");
  for (const parrafo of parrafos(texto)) seccion.append(el("p", parrafo));
  seccion.hidden = false;
}

// De cada persona se publica solo nombre, cargo y, en la junta, la foto si la hay.
function pintarJunta(junta) {
  const lista = document.querySelector("#junta");
  for (const persona of junta) {
    const li = el("li");
    const foto = rutaImagen(persona.foto);
    if (foto) {
      const img = el("img");
      img.src = foto;
      img.alt = "";
      img.loading = "lazy";
      li.append(img);
    } else {
      const letra = el("span", inicial(persona.nombre), "inicial");
      letra.setAttribute("aria-hidden", "true");
      li.append(letra);
    }
    li.append(el("strong", persona.nombre));
    if (persona.cargo) li.append(el("span", persona.cargo, "meta"));
    lista.append(li);
  }
}

function pintarMiembros(miembros) {
  const lista = document.querySelector("#miembros");
  for (const persona of miembros) {
    const li = el("li");
    li.append(el("strong", persona.nombre));
    if (persona.cargo) li.append(el("span", persona.cargo, "meta"));
    lista.append(li);
  }
}

const emisora = await montarMarco({ actual: "nosotros.html" });
if (!emisora) {
  document.querySelector("main").append(el("p", "No pudimos cargar el equipo."));
} else {
  pintarResena(emisora.resena);
  pintarJunta(emisora.junta);
  pintarMiembros(emisora.miembros);
}
