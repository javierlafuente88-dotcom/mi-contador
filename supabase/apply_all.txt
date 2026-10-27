-- ============================================================
-- TODO EN UNO: las dos migraciones y los 49 alimentos.
-- Pegar entero en el editor SQL del panel de Supabase y ejecutar.
-- Generado el 2026-10-27 desde supabase/migrations/ y supabase/seed.sql
-- ============================================================

-- ---------- 1 de 3: esquema ----------
-- Esquema inicial — contador de calorías
-- Postgres 15+ (Supabase). Todas las horas en UTC, timestamptz siempre.
-- RLS activado en todo lo que pertenece a un usuario.
-- No existe ninguna tabla de monedas, créditos ni tokens. Es deliberado.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";      -- búsqueda de alimentos por nombre

-- ---------------------------------------------------------------- usuarios

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  locale        text not null default 'es',
  country_code  text not null default 'ES',          -- partición de la base de alimentos
  timezone      text not null default 'Europe/Madrid', -- define qué es "hoy". Crítico.
  units         text not null default 'metric' check (units in ('metric','imperial')),
  sex           text check (sex in ('female','male','other')),
  birth_date    date,
  height_cm     numeric(5,1) check (height_cm between 80 and 260),
  activity_level text check (activity_level in ('sedentary','light','moderate','high','athlete')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Edad: se calcula, no se declara. Menores de 16 no pueden fijar objetivo de pérdida.
create or replace function age_years(p profiles) returns int language sql stable as $$
  select case when p.birth_date is null then null
         else extract(year from age(p.birth_date))::int end;
$$;

-- ---------------------------------------------------------------- objetivos

create table goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  type           text not null check (type in ('lose','maintain','gain','recomp')),
  target_weight_kg numeric(5,1),
  pace_kg_week   numeric(3,2) check (pace_kg_week between 0 and 1.0),
  kcal_target    int not null,
  protein_g      int not null,
  carbs_g        int not null,
  fat_g          int not null,
  fiber_g        int,
  water_ml       int,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  -- Suelo de seguridad. La original acepta 1000 kcal a un peso saludable; nosotros no.
  constraint kcal_floor check (kcal_target >= 1200),
  constraint macros_sane check (protein_g >= 0 and carbs_g >= 0 and fat_g >= 0)
);
create index on goals (user_id, active);
create unique index one_active_goal on goals (user_id) where active;

-- Registro de cada vez que se bajó un objetivo. Para poder detectar patrones de riesgo.
create table goal_changes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  from_kcal  int, to_kcal int not null,
  reason     text,
  created_at timestamptz not null default now()
);
create index on goal_changes (user_id, created_at desc);

-- ---------------------------------------------------------------- alimentos

-- Catálogo compartido. Lectura pública, escritura solo del proceso de importación
-- o del propio usuario para sus alimentos.
create table foods (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  brand         text,
  barcode       text,
  country_code  text,                                  -- null = genérico, vale en todas partes
  source        text not null check (source in ('usda','off','user','curated')),
  source_ref    text,                                  -- id en origen, para re-sincronizar
  license       text not null check (license in ('public-domain','odbl','own')),
  owner_id      uuid references profiles(id) on delete cascade,  -- solo si source='user'
  kcal_100g     numeric(7,2) not null check (kcal_100g >= 0),
  protein_100g  numeric(7,2) not null default 0,
  carbs_100g    numeric(7,2) not null default 0,
  fat_100g      numeric(7,2) not null default 0,
  fiber_100g    numeric(7,2),
  sugar_100g    numeric(7,2),
  sat_fat_100g  numeric(7,2),
  sodium_mg_100g numeric(9,2),
  micros        jsonb not null default '{}',
  allergens     text[] not null default '{}',
  verified_at   timestamptz,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint user_food_has_owner check ((source = 'user') = (owner_id is not null))
);
create index on foods using gin (name gin_trgm_ops);
create unique index on foods (barcode, country_code) where barcode is not null and deleted_at is null;
create index on foods (country_code) where deleted_at is null;
create index on foods (owner_id) where owner_id is not null;
create index on foods using gin (allergens);

create table food_servings (
  id        uuid primary key default gen_random_uuid(),
  food_id   uuid not null references foods(id) on delete cascade,
  label     text not null,            -- "1 taza", "1 rebanada", "1 unidad mediana"
  grams     numeric(7,2) not null check (grams > 0),
  is_default boolean not null default false
);
create index on food_servings (food_id);

-- Correcciones de los usuarios. La original tiene el formulario y no contesta.
create table food_reports (
  id         uuid primary key default gen_random_uuid(),
  food_id    uuid not null references foods(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  field      text not null,
  suggested  text not null,
  status     text not null default 'open' check (status in ('open','accepted','rejected')),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index on food_reports (status, created_at);

-- ---------------------------------------------------------------- recetas

create table recipes (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references profiles(id) on delete cascade,  -- null = receta del catálogo
  name        text not null,
  servings    numeric(4,1) not null default 1 check (servings > 0),
  instructions text,
  image_path  text,
  tags        text[] not null default '{}',   -- 'keto','vegana','sin-gluten','desayuno'
  country_code text,
  prep_minutes int,
  deleted_at  timestamptz,                    -- se pueden borrar. La original no deja.
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on recipes (owner_id) where deleted_at is null;
create index on recipes using gin (tags);
create index on recipes using gin (name gin_trgm_ops);

create table recipe_ingredients (
  id        uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  food_id   uuid not null references foods(id) on delete restrict,
  grams     numeric(7,2) not null check (grams > 0),
  position  int not null default 0
);
create index on recipe_ingredients (recipe_id);

-- ---------------------------------------------------------------- diario

create table meal_slots (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  name       text not null,              -- Desayuno, Media mañana, Almuerzo, Merienda, Cena...
  position   int not null,
  kcal_percent numeric(5,2) check (kcal_percent between 0 and 100),
  created_at timestamptz not null default now()
);
create index on meal_slots (user_id, position);
-- Sin límite de 3 ni de 4. Si alguien quiere 7 comidas, son 7 filas.

create table log_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  local_date   date not null,            -- el día EN LA ZONA DEL USUARIO, no en UTC
  meal_slot_id uuid references meal_slots(id) on delete set null,
  food_id      uuid references foods(id) on delete restrict,
  recipe_id    uuid references recipes(id) on delete restrict,
  grams        numeric(7,2) not null check (grams > 0),
  servings     numeric(6,2),
  method       text not null check (method in ('text','barcode','photo','voice','plan','copy')),
  client_token uuid not null,            -- idempotencia: mata el registro doble y triple
  created_at   timestamptz not null default now(),
  constraint food_xor_recipe check ((food_id is null) <> (recipe_id is null))
);
create unique index on log_entries (user_id, client_token);
create index on log_entries (user_id, local_date);

-- ---------------------------------------------------------------- plan

create table plan_preferences (
  user_id         uuid primary key references profiles(id) on delete cascade,
  variety         text not null default 'balanced' check (variety in ('high','balanced','minimal')),
  suggestion_type text not null default 'both' check (suggestion_type in ('simple','recipes','both')),
  diet_type       text not null default 'none',
  max_prep_minutes int,
  updated_at      timestamptz not null default now()
);

create table user_allergens (
  user_id  uuid not null references profiles(id) on delete cascade,
  allergen text not null,
  severity text not null default 'avoid' check (severity in ('avoid','allergy')),
  primary key (user_id, allergen)
);

create table food_preferences (
  user_id uuid not null references profiles(id) on delete cascade,
  food_id uuid not null references foods(id) on delete cascade,
  stance  text not null check (stance in ('liked','excluded')),
  primary key (user_id, food_id)
);

create table meal_plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  local_date date not null,
  origin     text not null check (origin in ('chosen','suggested','manual')),
  created_at timestamptz not null default now()
);
create unique index on meal_plans (user_id, local_date);

create table meal_plan_items (
  id           uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references meal_plans(id) on delete cascade,
  meal_slot_id uuid not null references meal_slots(id) on delete cascade,
  food_id      uuid references foods(id) on delete restrict,
  recipe_id    uuid references recipes(id) on delete restrict,
  grams        numeric(7,2) not null check (grams > 0),
  locked       boolean not null default false,   -- "este plato no me lo toques al recalcular"
  constraint item_food_xor_recipe check ((food_id is null) <> (recipe_id is null))
);
create index on meal_plan_items (meal_plan_id);
-- Nota: recalcular NO borra días futuros. Solo sustituye los items con locked = false.

-- ---------------------------------------------------------------- compra

create table shopping_lists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  date_from  date not null,
  date_to    date not null,
  created_at timestamptz not null default now(),
  constraint range_ok check (date_to >= date_from)
);
create table shopping_list_items (
  id       uuid primary key default gen_random_uuid(),
  list_id  uuid not null references shopping_lists(id) on delete cascade,
  food_id  uuid not null references foods(id) on delete restrict,
  grams    numeric(9,2) not null,
  checked  boolean not null default false
);
create index on shopping_list_items (list_id);

-- ---------------------------------------------------------------- progreso

create table weight_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  local_date date not null,
  kg         numeric(5,2) not null check (kg between 20 and 400),
  created_at timestamptz not null default now()
);
create unique index on weight_entries (user_id, local_date);

create table measurements (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  local_date date not null,
  kind       text not null,     -- texto libre: cintura, cadera, cuádriceps, bíceps...
  value_cm   numeric(5,1) not null check (value_cm > 0)
);
create unique index on measurements (user_id, local_date, kind);

create table progress_photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  local_date date not null,
  image_path text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- RLS

alter table profiles            enable row level security;
alter table goals               enable row level security;
alter table goal_changes        enable row level security;
alter table foods               enable row level security;
alter table food_servings       enable row level security;
alter table food_reports        enable row level security;
alter table recipes             enable row level security;
alter table recipe_ingredients  enable row level security;
alter table meal_slots          enable row level security;
alter table log_entries         enable row level security;
alter table plan_preferences    enable row level security;
alter table user_allergens      enable row level security;
alter table food_preferences    enable row level security;
alter table meal_plans          enable row level security;
alter table meal_plan_items     enable row level security;
alter table shopping_lists      enable row level security;
alter table shopping_list_items enable row level security;
alter table weight_entries      enable row level security;
alter table measurements        enable row level security;
alter table progress_photos     enable row level security;

-- OJO: en Postgres, RLS activado SIN política = nadie ve nada. Hay que escribirlas
-- todas. Abajo están las 20.

create policy own_profile on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Tablas con user_id directo.
create policy own_rows on goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on goal_changes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on food_reports
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on meal_slots
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on log_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on plan_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on user_allergens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on food_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on meal_plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on shopping_lists
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on weight_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on measurements
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on progress_photos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Tablas hijas: la pertenencia se hereda del padre.
create policy via_parent on food_servings
  for all using (exists (
    select 1 from foods f where f.id = food_id
      and (f.source <> 'user' or f.owner_id = auth.uid())))
  with check (exists (
    select 1 from foods f where f.id = food_id and f.owner_id = auth.uid()));

create policy via_parent on recipe_ingredients
  for all using (exists (
    select 1 from recipes r where r.id = recipe_id
      and (r.owner_id is null or r.owner_id = auth.uid())))
  with check (exists (
    select 1 from recipes r where r.id = recipe_id and r.owner_id = auth.uid()));

create policy via_parent on meal_plan_items
  for all using (exists (
    select 1 from meal_plans p where p.id = meal_plan_id and p.user_id = auth.uid()))
  with check (exists (
    select 1 from meal_plans p where p.id = meal_plan_id and p.user_id = auth.uid()));

create policy via_parent on shopping_list_items
  for all using (exists (
    select 1 from shopping_lists l where l.id = list_id and l.user_id = auth.uid()))
  with check (exists (
    select 1 from shopping_lists l where l.id = list_id and l.user_id = auth.uid()));

-- Catálogo: todo el mundo lee lo público; cada cual escribe solo lo suyo.
create policy read_catalog on foods
  for select using (deleted_at is null and (source <> 'user' or owner_id = auth.uid()));
create policy write_own_food on foods
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid() and source = 'user');

create policy read_recipes on recipes
  for select using (deleted_at is null and (owner_id is null or owner_id = auth.uid()));
create policy write_own_recipe on recipes
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------- 2 de 3: extras de Supabase ----------
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

-- ---------- 3 de 3: alimentos ----------
-- Semilla de alimentos genericos. Generado por tools/gen_seed_sql.py
-- Fuente: USDA FoodData Central (SR Legacy), dominio publico.
-- Clave: (source, source_ref) = ('usda', fdcId). Reejecutar no duplica.

insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Aceite de oliva', 'usda', '171413', 'public-domain', 884.0, 0.0, 0.0, 100.0, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Aguacate', 'usda', '171705', 'public-domain', 160.0, 2.0, 8.53, 14.7, 6.7, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Almendras crudas', 'usda', '170567', 'public-domain', 579.0, 21.2, 21.6, 49.9, 12.5, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Alubias blancas cocidas', 'usda', '173750', 'public-domain', 142.0, 8.97, 25.8, 0.64, 10.4, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Arroz blanco cocido', 'usda', '168878', 'public-domain', 130.0, 2.69, 28.2, 0.28, 0.4, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Arroz integral cocido', 'usda', '168875', 'public-domain', 112.0, 2.32, 23.5, 0.83, 1.8, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Atún en conserva al natural', 'usda', '171986', 'public-domain', 116.0, 25.5, 0.0, 0.82, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Avena en copos', 'usda', '169705', 'public-domain', 389.0, 16.9, 66.3, 6.9, 10.6, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Azúcar blanca', 'usda', '169655', 'public-domain', 387.0, 0.0, 100.0, 0.0, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Bacalao cocido', 'usda', '171956', 'public-domain', 105.0, 22.8, 0.0, 0.86, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Batata cocida', 'usda', '168484', 'public-domain', 76.0, 1.37, 17.7, 0.14, 2.5, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Brócoli crudo', 'usda', '170379', 'public-domain', 34.0, 2.82, 6.64, 0.37, 2.6, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Calabacín crudo', 'usda', '169291', 'public-domain', 17.0, 1.21, 3.11, 0.32, 1.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Carne de res picada cocida', 'usda', '174032', 'public-domain', 250.0, 25.9, 0.0, 15.4, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Cebolla cruda', 'usda', '170000', 'public-domain', 40.0, 1.1, 9.34, 0.1, 1.7, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Champiñones crudos', 'usda', '169251', 'public-domain', 22.0, 3.09, 3.26, 0.34, 1.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Espinacas crudas', 'usda', '168462', 'public-domain', 23.0, 2.86, 3.63, 0.39, 2.2, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Fideos de huevo cocidos', 'usda', '169732', 'public-domain', 138.0, 4.54, 25.2, 2.07, 1.2, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Fresas', 'usda', '167762', 'public-domain', 32.0, 0.67, 7.68, 0.3, 2.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Frijoles negros cocidos', 'usda', '173735', 'public-domain', 132.0, 8.86, 23.7, 0.54, 8.7, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Garbanzos cocidos', 'usda', '173757', 'public-domain', 164.0, 8.86, 27.4, 2.59, 7.6, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Harina de trigo', 'usda', '168894', 'public-domain', 364.0, 10.3, 76.3, 0.98, 2.7, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Huevo cocido', 'usda', '173424', 'public-domain', 155.0, 12.6, 1.12, 10.6, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Judías verdes cocidas', 'usda', '169141', 'public-domain', 35.0, 1.89, 7.88, 0.28, 3.2, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Leche desnatada', 'usda', '171269', 'public-domain', 34.0, 3.37, 4.96, 0.08, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Leche entera', 'usda', '171265', 'public-domain', 61.0, 3.15, 4.8, 3.25, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Lechuga romana', 'usda', '169247', 'public-domain', 17.0, 1.23, 3.29, 0.3, 2.1, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Lentejas cocidas', 'usda', '172421', 'public-domain', 116.0, 9.02, 20.1, 0.38, 7.9, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Lomo de cerdo cocido', 'usda', '167894', 'public-domain', 214.0, 28.8, 0.0, 10.1, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Mantequilla', 'usda', '173410', 'public-domain', 717.0, 0.85, 0.06, 81.1, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Manzana con piel', 'usda', '171688', 'public-domain', 52.0, 0.26, 13.8, 0.17, 2.4, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Maíz dulce cocido', 'usda', '169999', 'public-domain', 96.0, 3.41, 21.0, 1.5, 2.4, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Merluza cocida', 'usda', '175161', 'public-domain', 116.0, 23.5, 0.0, 1.69, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Naranja', 'usda', '169097', 'public-domain', 47.0, 0.94, 11.8, 0.12, 2.4, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Pan blanco de trigo', 'usda', '174924', 'public-domain', 266.0, 8.85, 49.4, 3.33, 2.7, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Patata cocida', 'usda', '170440', 'public-domain', 86.0, 1.71, 20.0, 0.1, 1.8, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Pechuga de pavo cocida', 'usda', '171496', 'public-domain', 147.0, 30.1, 0.0, 2.08, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Pechuga de pollo cocida', 'usda', '171477', 'public-domain', 165.0, 31.0, 0.0, 3.57, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Pimiento rojo crudo', 'usda', '170108', 'public-domain', 26.0, 0.99, 6.03, 0.3, 2.1, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Plátano', 'usda', '173944', 'public-domain', 89.0, 1.09, 22.8, 0.33, 2.6, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Queso curado', 'usda', '173414', 'public-domain', 403.0, 22.9, 3.37, 33.3, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Queso fresco', 'usda', '172223', 'public-domain', 299.0, 18.1, 2.98, 23.8, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Salmón cocido', 'usda', '171998', 'public-domain', 182.0, 25.4, 0.0, 8.13, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Tomate crudo', 'usda', '170457', 'public-domain', 18.0, 0.88, 3.89, 0.2, 1.2, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Tortillas de maíz', 'usda', '173241', 'public-domain', 222.0, 5.7, 46.6, 2.5, 5.2, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Uvas', 'usda', '174683', 'public-domain', 69.0, 0.72, 18.1, 0.16, 0.9, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Yogur natural entero', 'usda', '171284', 'public-domain', 61.0, 3.47, 4.66, 3.25, 0.0, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Yuca cruda', 'usda', '169985', 'public-domain', 160.0, 1.36, 38.1, 0.28, 1.8, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
insert into foods (name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ('Zanahoria cruda', 'usda', '170393', 'public-domain', 41.0, 0.93, 9.58, 0.24, 2.8, now())
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = excluded.name,
    kcal_100g = excluded.kcal_100g,
    protein_100g = excluded.protein_100g,
    carbs_100g = excluded.carbs_100g,
    fat_100g = excluded.fat_100g,
    fiber_100g = excluded.fiber_100g,
    verified_at = now();
