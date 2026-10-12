-- Aviso en Discord de cada pedido de canción, mensaje o dedicatoria. Se puede ejecutar más de una vez.
-- Lo aplica una persona en Supabase → SQL Editor.
--
-- El pedido se guarda SIEMPRE en la tabla pedidos y se ve en la pestaña Mensajes del panel.
-- Discord es solo un aviso adicional para el equipo: si falla, el pedido no se pierde.
-- Los tickets de PQRSD NO se envían a Discord: pueden traer denuncias y datos personales.
--
-- Después de ejecutar este archivo falta guardar la dirección del webhook. Esa dirección es
-- secreta: se escribe directamente en el SQL Editor, nunca en este archivo ni en el repositorio.
-- Ejecuta allí esta instrucción, cambiando el texto entre comillas por la dirección que copiaste
-- de Discord (Editar canal → Integraciones → Webhooks → Copiar URL del webhook):
--
--   insert into secretos (clave, valor) values ('discord_pedidos', 'PEGA_AQUI_LA_DIRECCION')
--   on conflict (clave) do update set valor = excluded.valor;
--
-- Para dejar de avisar en Discord:  delete from secretos where clave = 'discord_pedidos';

create extension if not exists pg_net with schema extensions;

-- Valores que el navegador nunca debe ver. Sin políticas: solo se lee desde funciones de la base
-- de datos y desde el panel de Supabase.
create table if not exists secretos (
  clave text primary key,
  valor text not null
);
alter table secretos enable row level security;

create or replace function avisar_pedido_discord() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  destino text;
  texto text;
begin
  select valor into destino from secretos where clave = 'discord_pedidos';
  if destino is null or destino not like 'https://discord.com/api/webhooks/%' then
    return new;
  end if;
  texto := '**' || new.tipo || '**'
    || coalesce(E'\nDe: ' || new.nombre, '')
    || coalesce(E'\nPara: ' || new.para, '')
    || E'\n' || new.mensaje;
  -- allowed_mentions vacío: el texto de un visitante no puede mencionar a @everyone ni a nadie.
  perform net.http_post(
    url := destino,
    body := jsonb_build_object(
      'content', left(texto, 1900),
      'allowed_mentions', jsonb_build_object('parse', jsonb_build_array())
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
exception when others then
  return new; -- el aviso nunca impide que el pedido quede guardado
end $$;

drop trigger if exists pedidos_a_discord on pedidos;
create trigger pedidos_a_discord after insert on pedidos for each row execute function avisar_pedido_discord();
