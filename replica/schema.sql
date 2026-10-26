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
