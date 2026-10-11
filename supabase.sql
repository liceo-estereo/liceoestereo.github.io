-- Preparación del proyecto de Supabase para Liceo Tame Stereo.
-- Se ejecuta una sola vez: Supabase → SQL Editor → pegar todo → Run.

-- Noticias
create table noticias (
  id bigint generated always as identity primary key,
  titulo text not null,
  subtitulo text,
  entradilla text,
  foto text,
  pie_foto text,
  cuerpo text,
  emisor text,
  origen text,
  fecha date not null default current_date,
  creada timestamptz not null default now()
);

-- Lista de personas que pueden publicar. Tener usuario y contraseña no basta:
-- el usuario debe estar aquí. Así, aunque alguien lograra registrarse por su
-- cuenta, no podría tocar las noticias.
create table editores (
  user_id uuid primary key references auth.users on delete cascade
);
alter table editores enable row level security; -- sin políticas: solo se edita desde el panel de Supabase

create function es_editor() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from editores where user_id = auth.uid()) $$;

alter table noticias enable row level security;
create policy "cualquiera lee" on noticias for select using (true);
create policy "editores escriben" on noticias for all to authenticated
  using (es_editor()) with check (es_editor());

-- Fotos: lectura pública, máximo 5 MB, solo imágenes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "editores suben fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and es_editor());
create policy "editores borran fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and es_editor());
