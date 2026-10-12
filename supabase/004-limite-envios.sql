-- Límite de envíos por dirección IP: como máximo 10 mensajes (pedidos y tickets sumados) cada
-- 10 minutos desde una misma conexión. Se puede ejecutar más de una vez.
-- Lo aplica una persona en Supabase → SQL Editor.
--
-- Ojo: todos los computadores y celulares conectados al wifi del colegio salen a internet con la
-- misma dirección IP, así que el límite es compartido por todo el colegio. Si en los descansos
-- se queda corto, sube el número 10 o baja los minutos en la función de abajo y vuelve a ejecutar.
--
-- No se guarda la dirección IP, sino una huella (md5) que se borra a las 24 horas.

create table if not exists envios (
  ip_hash text not null,
  creado timestamptz not null default now()
);
create index if not exists envios_ip_creado on envios (ip_hash, creado);
alter table envios enable row level security; -- sin políticas: el navegador no la lee ni la escribe

create or replace function limitar_envios() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  cabeceras json := nullif(current_setting('request.headers', true), '')::json;
  ip text;
  huella text;
  recientes integer;
begin
  -- cf-connecting-ip lo pone la red de Supabase y el visitante no puede falsificarlo;
  -- x-forwarded-for queda como respaldo.
  ip := trim(coalesce(
    cabeceras ->> 'cf-connecting-ip',
    cabeceras ->> 'x-real-ip',
    split_part(coalesce(cabeceras ->> 'x-forwarded-for', ''), ',', 1)
  ));
  if ip is null or ip = '' then
    return new; -- inserción hecha desde el panel de Supabase, sin petición web
  end if;
  huella := md5(ip || ':liceo-tame-stereo');
  delete from envios where creado < now() - interval '24 hours';
  select count(*) into recientes from envios
    where ip_hash = huella and creado > now() - interval '10 minutes';
  if recientes >= 10 then
    raise exception 'limite_mensajes' using hint = 'Demasiados mensajes seguidos desde esta conexión';
  end if;
  insert into envios (ip_hash) values (huella);
  return new;
end $$;

drop trigger if exists limite_pedidos on pedidos;
create trigger limite_pedidos before insert on pedidos for each row execute function limitar_envios();
drop trigger if exists limite_tickets on tickets;
create trigger limite_tickets before insert on tickets for each row execute function limitar_envios();
