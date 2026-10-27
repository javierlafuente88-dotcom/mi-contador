-- Comprobación de que la migración quedó bien.
-- Pegar en el editor SQL de Supabase y ejecutar. Solo lee, no cambia nada.
-- Lo que importa es que la columna "estado" diga OK en todas las filas.

with
tablas as (
  select count(*)::int n from pg_tables where schemaname = 'public'
),
rls as (
  select count(*)::int n
  from pg_tables t
  join pg_class c on c.relname = t.tablename
  join pg_namespace ns on ns.oid = c.relnamespace and ns.nspname = 'public'
  where t.schemaname = 'public' and c.relrowsecurity
),
sin_politica as (
  select count(*)::int n
  from pg_class c
  join pg_namespace ns on ns.oid = c.relnamespace and ns.nspname = 'public'
  where c.relkind = 'r' and c.relrowsecurity
    and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
),
politicas as (
  select count(*)::int n from pg_policies where schemaname = 'public'
),
alimentos as (
  select count(*)::int n from foods
),
funciones as (
  select count(*)::int n from pg_proc p
  join pg_namespace ns on ns.oid = p.pronamespace and ns.nspname = 'public'
  where p.proname in ('handle_new_user','delete_my_account','export_my_data',
                      'search_foods','touch_updated_at')
),
disparador_alta as (
  select count(*)::int n from pg_trigger where tgname = 'on_auth_user_created'
),
suelo as (
  select count(*)::int n from pg_constraint where conname = 'kcal_floor'
),
idempotencia as (
  select count(*)::int n from pg_indexes
  where schemaname = 'public' and tablename = 'log_entries'
    and indexdef ilike '%unique%' and indexdef ilike '%client_token%'
),
busqueda as (
  select count(*)::int n from search_foods('platano')
),
kcal_pollo as (
  select coalesce(max(kcal_100g), 0)::numeric v from foods where name ilike '%pollo%'
)
select * from (
  select 1 ord, 'Tablas en public'                 comprobacion, tablas.n::text resultado,       case when tablas.n >= 20 then 'OK' else 'MAL' end estado from tablas
  union all
  select 2, 'Tablas con RLS activado',             rls.n::text,                                  case when rls.n >= 20 then 'OK' else 'MAL' end from rls
  union all
  select 3, 'Tablas con RLS y SIN politica',       sin_politica.n::text,                         case when sin_politica.n = 0 then 'OK' else 'MAL: quedarian negadas' end from sin_politica
  union all
  select 4, 'Politicas creadas',                   politicas.n::text,                            case when politicas.n >= 22 then 'OK' else 'MAL' end from politicas
  union all
  select 5, 'Alimentos cargados',                  alimentos.n::text,                            case when alimentos.n = 49 then 'OK' else 'MAL: esperabamos 49' end from alimentos
  union all
  select 6, 'Funciones propias',                   funciones.n::text,                            case when funciones.n >= 5 then 'OK' else 'MAL' end from funciones
  union all
  select 7, 'Perfil automatico al registrarse',    disparador_alta.n::text,                      case when disparador_alta.n = 1 then 'OK' else 'MAL' end from disparador_alta
  union all
  select 8, 'Suelo de 1200 kcal',                  suelo.n::text,                                case when suelo.n = 1 then 'OK' else 'MAL' end from suelo
  union all
  select 9, 'Indice unico anti registro doble',    idempotencia.n::text,                         case when idempotencia.n >= 1 then 'OK' else 'MAL' end from idempotencia
  union all
  select 10, 'Busqueda sin acentos (platano)',     busqueda.n::text,                             case when busqueda.n >= 1 then 'OK' else 'MAL: unaccent no resuelve' end from busqueda
  union all
  select 11, 'Pechuga de pollo, kcal/100g',        kcal_pollo.v::text,                           case when kcal_pollo.v = 165 then 'OK' else 'MAL' end from kcal_pollo
) t
order by ord;
