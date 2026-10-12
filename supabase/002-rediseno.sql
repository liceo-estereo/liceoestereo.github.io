-- Rediseño de Liceo Tame Stereo: cambios aditivos. Se puede ejecutar más de una vez.
-- Lo aplica una persona en Supabase → SQL Editor. No modifica noticias ni usuarios existentes.

-- Noticias: sección, noticia de la semana y audio
alter table noticias add column if not exists seccion text not null default 'institucional' check (seccion in ('institucional', 'academico', 'deportes', 'cultura', 'emisora', 'local', 'nacional', 'internacional', 'opinion'));
alter table noticias add column if not exists semana_desde date;
alter table noticias add column if not exists audio text;
create index if not exists noticias_seccion_fecha on noticias (seccion, fecha desc);

-- Administradores: editores que además pueden ver los tickets
alter table editores add column if not exists admin boolean not null default false;
create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from editores where user_id = auth.uid() and admin) $$;

-- Transmisión en vivo: una sola fila
create table if not exists transmision (
  id boolean primary key default true check (id),
  activa boolean not null default false,
  red text check (red in ('instagram', 'tiktok', 'facebook', 'audio')),
  enlace text,
  titulo text,
  actualizada timestamptz not null default now()
);
alter table transmision enable row level security;
insert into transmision (id) values (true) on conflict (id) do nothing;
drop policy if exists "cualquiera lee transmision" on transmision;
create policy "cualquiera lee transmision" on transmision for select using (true);
drop policy if exists "editores cambian transmision" on transmision;
create policy "editores cambian transmision" on transmision for update to authenticated using (es_editor()) with check (es_editor());

-- Tickets de PQRSD: cualquiera crea, solo los administradores leen y actualizan
create table if not exists tickets (
  id bigint generated always as identity primary key,
  codigo text not null unique check (codigo ~ '^LT-[0-9]{6}-[A-Z0-9]{4}$'),
  motivo text not null check (motivo in ('Petición', 'Queja', 'Reclamo', 'Sugerencia', 'Denuncia', 'Solicitud para unirme al equipo')),
  nombre text not null check (char_length(nombre) between 1 and 80),
  correo text check (correo is null or char_length(correo) <= 120),
  mensaje text not null check (char_length(mensaje) between 1 and 2000),
  estado text not null default 'abierto' check (estado in ('abierto', 'en_tramite', 'cerrado')),
  creado timestamptz not null default now()
);
alter table tickets enable row level security;
drop policy if exists "cualquiera crea tickets" on tickets;
create policy "cualquiera crea tickets" on tickets for insert to anon, authenticated with check (estado = 'abierto');
drop policy if exists "administradores leen tickets" on tickets;
create policy "administradores leen tickets" on tickets for select to authenticated using (es_admin());
drop policy if exists "administradores actualizan tickets" on tickets;
create policy "administradores actualizan tickets" on tickets for update to authenticated using (es_admin()) with check (es_admin());

-- Pedidos de canciones, mensajes y dedicatorias: cualquiera crea, los editores leen y borran
create table if not exists pedidos (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('Pedir una canción', 'Mensaje al aire', 'Dedicatoria')),
  nombre text check (nombre is null or char_length(nombre) <= 80),
  para text check (para is null or char_length(para) <= 80),
  mensaje text not null check (char_length(mensaje) between 1 and 600),
  creado timestamptz not null default now()
);
alter table pedidos enable row level security;
drop policy if exists "cualquiera crea pedidos" on pedidos;
create policy "cualquiera crea pedidos" on pedidos for insert to anon, authenticated with check (true);
drop policy if exists "editores leen pedidos" on pedidos;
create policy "editores leen pedidos" on pedidos for select to authenticated using (es_editor());
drop policy if exists "editores borran pedidos" on pedidos;
create policy "editores borran pedidos" on pedidos for delete to authenticated using (es_editor());

-- Audios de las noticias: lectura pública, máximo 10 MB, solo MP3
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('audios', 'audios', true, 10485760, array['audio/mpeg', 'audio/mp3']) on conflict (id) do nothing;
drop policy if exists "editores suben audios" on storage.objects;
create policy "editores suben audios" on storage.objects for insert to authenticated with check (bucket_id = 'audios' and es_editor());
drop policy if exists "editores ven audios" on storage.objects;
create policy "editores ven audios" on storage.objects for select to authenticated using (bucket_id = 'audios' and es_editor());
drop policy if exists "editores borran audios" on storage.objects;
create policy "editores borran audios" on storage.objects for delete to authenticated using (bucket_id = 'audios' and es_editor());
