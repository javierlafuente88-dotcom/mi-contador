-- Lo que el esquema base no puede saber: el pegamento con Supabase.
-- Se aplica DESPUES de 20261027000001_schema.sql

-- ---------------------------------------------------------------- updated_at

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on profiles
  for each row execute function touch_updated_at();
create trigger foods_touch before update on foods
  for each row execute function touch_updated_at();
create trigger recipes_touch before update on recipes
  for each row execute function touch_updated_at();

-- ------------------------------------------------- perfil al crear la cuenta

-- Sin esto, alguien se registra y no tiene fila en profiles, asi que RLS le
-- niega todo y la app parece rota.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, locale, country_code, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'locale', 'es'),
    coalesce(new.raw_user_meta_data->>'country_code', 'ES'),
    coalesce(new.raw_user_meta_data->>'timezone', 'Europe/Madrid')
  )
  on conflict (id) do nothing;

  -- Comidas por defecto. Sin tope: son filas, y el usuario puede anadir mas.
  insert into public.meal_slots (user_id, name, position, kcal_percent) values
    (new.id, 'Desayuno', 1, 25),
    (new.id, 'Almuerzo', 2, 35),
    (new.id, 'Merienda', 3, 10),
    (new.id, 'Cena',     4, 30);

  insert into public.plan_preferences (user_id) values (new.id)
    on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- -------------------------------------------------- borrado real de la cuenta

-- Apple lo exige en cualquier app con registro, y la original tiene 106
-- resenas con nota 1,4 sobre lo dificil que es salirse. Aqui es una llamada.
create or replace function delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'sin sesion';
  end if;
  -- Todo lo del usuario cuelga de profiles con on delete cascade,
  -- y profiles cuelga de auth.users igual.
  delete from auth.users where id = uid;
end;
$$;

revoke all on function delete_my_account() from public;
grant execute on function delete_my_account() to authenticated;

-- ------------------------------------------------- exportar los propios datos

create or replace function export_my_data() returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'perfil',      (select to_jsonb(p) from profiles p where p.id = auth.uid()),
    'objetivos',   (select coalesce(jsonb_agg(to_jsonb(g)), '[]'::jsonb) from goals g where g.user_id = auth.uid()),
    'comidas',     (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) from meal_slots m where m.user_id = auth.uid()),
    'registros',   (select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb) from log_entries l where l.user_id = auth.uid()),
    'peso',        (select coalesce(jsonb_agg(to_jsonb(w)), '[]'::jsonb) from weight_entries w where w.user_id = auth.uid()),
    'medidas',     (select coalesce(jsonb_agg(to_jsonb(me)), '[]'::jsonb) from measurements me where me.user_id = auth.uid()),
    'recetas',     (select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) from recipes r where r.owner_id = auth.uid()),
    'generado',    now()
  );
$$;

revoke all on function export_my_data() from public;
grant execute on function export_my_data() to authenticated;

-- --------------------------------------------------------- busqueda de comida

-- Sin acentos, para que "platano" encuentre "plátano". unaccent no viene
-- activado por defecto en Supabase, asi que se pide aqui.
create extension if not exists unaccent;

-- search_path incluye "extensions" porque Supabase instala ahi algunas
-- extensiones; sin eso, unaccent() no se resuelve y la busqueda revienta.
create or replace function search_foods(q text, pais text default null, lim int default 50)
returns setof foods
language sql stable security invoker set search_path = public, extensions as $$
  select f.*
  from foods f
  where f.deleted_at is null
    and (f.source <> 'user' or f.owner_id = auth.uid())
    and (pais is null or f.country_code is null or f.country_code = pais)
    and (q = '' or unaccent(f.name) ilike '%' || unaccent(q) || '%')
  order by
    case when unaccent(f.name) ilike unaccent(q) || '%' then 0 else 1 end,
    length(f.name),
    f.name
  limit least(lim, 100);
$$;

-- ------------------------------------------------- identidad de los alimentos

-- Sin esto, volver a pasar la semilla duplica los 49 alimentos.
create unique index foods_source_ref_uniq on foods (source, source_ref)
  where source_ref is not null;

-- --------------------------------------------------------- limites de cordura

-- El suelo de 1200 kcal ya es una restriccion de goals. Esto impide ademas
-- que alguien registre cantidades absurdas por un fallo del cliente.
alter table log_entries add constraint grams_sane check (grams > 0 and grams <= 10000);
alter table weight_entries add constraint kg_sane check (kg > 20 and kg < 400);
