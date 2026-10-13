-- Anexos de una noticia: publicaciones de X o Facebook, videos, otros enlaces y fotos adicionales.
-- Es una lista de objetos { tipo, enlace, pie }; el sitio descarta al leer lo que no sea un enlace
-- seguro. El tope de 6 es MAX_ANEXOS de js/logica.js. Se puede ejecutar dos veces sin error.
alter table noticias
  add column if not exists anexos jsonb not null default '[]'::jsonb
  check (jsonb_typeof(anexos) = 'array' and jsonb_array_length(anexos) <= 6);
