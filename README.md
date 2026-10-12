# Liceo Tame Stereo

Guía para quienes manejen la emisora. No hace falta saber programar para las tareas del día a día.

## Qué es este sitio

El sitio web de la emisora estudiantil del Liceo Tame: noticias por sección, programación, equipo,
contacto y un panel de administración. Tiene tres piezas:

| Pieza | Para qué | Dónde se maneja |
|---|---|---|
| El sitio | Lo que ve el público | Este repositorio; se publica solo en GitHub Pages al subir cambios a `main` |
| El panel | Noticias, aviso de «en vivo», tickets y mensajes | La página `/login/` del sitio, con correo y contraseña |
| Pages CMS | Programación, equipo, redes, videos y pódcast | https://app.pagescms.org, entrando con la cuenta de GitHub o con el correo invitado |

Las noticias, los tickets y los mensajes se guardan en Supabase. La programación y el equipo se
guardan en el archivo `datos/emisora.json` de este repositorio.

## Cómo publicar una noticia

1. Entra a `/login/` con tu correo y tu contraseña.
2. En la pestaña **Noticias**, llena el formulario. El título, la sección y la fecha son obligatorios.
3. La foto se reduce sola. Si viene de un iPhone en formato HEIC, conviértela a JPG primero.
4. Marca **Noticia de la semana** para que salga destacada en la portada durante 7 días. Solo puede
   haber una: si ya hay otra vigente, el panel te pide quitarle la marca primero.
5. Marca **Incluir audio** si quieres adjuntar la nota grabada (MP3 de máximo 10 MB).
6. Pulsa **Publicar**. Para corregirla después, búscala en «Noticias publicadas» y pulsa **Editar**.

La sesión se cierra sola al cerrar la pestaña del navegador. En un computador compartido, pulsa
además **Cerrar sesión**.

## Cómo marcar que estamos en vivo

1. En el panel, abre la pestaña **En vivo**.
2. Marca **Estamos en vivo**, elige la red y pega el enlace de la transmisión (debe empezar por `https://`).
3. Pulsa **Guardar**. El aviso aparece en la portada.
4. Al terminar, desmarca la casilla y guarda otra vez. Nada se apaga solo.

## Cómo cambiar la programación, el equipo o las redes

1. Entra a https://app.pagescms.org y abre el repositorio del sitio.
2. Abre **Emisora, programación y equipo**.
3. Cambia lo que necesites: la programación habitual, los cambios de un solo día (invitados,
   entrevistas), la junta directiva, los miembros, la reseña, las redes, los videos y los pódcast.
4. Pulsa **Save**. El sitio se actualiza en uno o dos minutos.

Las horas van en formato de 24 horas, como `09:30`. Los enlaces van completos, empezando por
`https://`. Una fila a la que le falte un dato obligatorio simplemente no aparece en el sitio.

## Cómo dar o quitar acceso a un editor

Esto se hace en el panel de Supabase, no en el sitio.

1. **Authentication → Users → Add user**: crea el usuario con su correo y una contraseña.
2. **Table Editor → editores**: agrega una fila con el `user_id` de ese usuario.
3. Si esa persona debe ver los tickets de PQRSD (junta directiva o docente responsable), pon la
   columna `admin` en verdadero. Los demás editores no los ven.
4. Para quitar el acceso, borra su fila de `editores` o borra el usuario.

Las contraseñas olvidadas también se cambian en **Authentication → Users**. Tener usuario no basta
para publicar: debe estar en la tabla `editores`. La clave secreta de Supabase no se escribe en
ningún archivo de este repositorio; la única clave que aparece aquí es la pública.

## Pruebas y sitio local

Hace falta tener instalado Node 22 o superior. No hay nada más que instalar.

| Para | Comando |
|---|---|
| Correr todas las pruebas | `npm test` |
| Ver el sitio en tu computador | `npm run servir` y abrir http://localhost:8123 |
| Revisar si quedan textos legales por completar | `node herramientas/revisar-lanzamiento.js` |

Las pruebas no usan internet ni tocan la base de datos.

## Cómo publicar un cambio del sitio

1. Haz el cambio en una rama, no directamente en `main`.
2. Corre `npm test`; debe terminar sin fallos.
3. Corre `node herramientas/revisar-lanzamiento.js`; debe decir que no quedan marcadores pendientes.
4. Mira el cambio en el sitio local, en celular y en computador.
5. Fusiona la rama en `main` y súbela. GitHub Pages publica el sitio en uno o dos minutos.

Si el cambio incluye un archivo nuevo en `supabase/`, ejecútalo antes en Supabase → SQL Editor.
Para volver atrás, revierte la fusión en `main` y sube de nuevo.

Las reglas técnicas del proyecto están en `CLAUDE.md`.
