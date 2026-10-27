-- ============================================================
-- Prueba de aislamiento entre usuarios (RLS).
-- Crea dos usuarios de prueba, les da datos, se hace pasar por el primero
-- y comprueba que NO ve nada del segundo.
--
-- Todo ocurre dentro de una transaccion que termina en ROLLBACK:
-- no queda ni un dato de prueba en la base.
--
-- Lo que debe salir: "aislado" en todas las filas menos el catalogo,
-- que es publico a proposito.
-- ============================================================

begin;

-- ---------- dos usuarios de prueba ----------
-- Al insertarlos se dispara handle_new_user, que debe crear su perfil,
-- sus comidas y sus preferencias. Eso tambien se comprueba aqui.

insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, created_at, updated_at,
   raw_app_meta_data, raw_user_meta_data)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'prueba-a@ejemplo.invalid', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'prueba-b@ejemplo.invalid', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb);

-- ---------- datos de cada uno ----------

insert into goals (user_id, type, kcal_target, protein_g, carbs_g, fat_g) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'maintain', 2000, 120, 200, 60),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'maintain', 1800, 110, 180, 55);

insert into weight_entries (user_id, local_date, kg) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', current_date, 80),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', current_date, 65);

insert into log_entries (user_id, local_date, meal_slot_id, food_id, grams, method, client_token)
select u.uid, current_date,
       (select id from meal_slots m where m.user_id = u.uid order by position limit 1),
       (select id from foods order by name limit 1),
       100, 'text', gen_random_uuid()
from (values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid),
             ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid)) as u(uid);

-- ---------- ahora somos el usuario A ----------

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select * from (
  select 1 ord, 'Perfiles visibles' comprobacion,
         (select count(*) from profiles)::text resultado,
         case when (select count(*) from profiles) = 1 then 'aislado' else 'FUGA' end estado
  union all
  select 2, 'Objetivos visibles',
         (select count(*) from goals)::text,
         case when (select count(*) from goals) = 1 then 'aislado' else 'FUGA' end
  union all
  select 3, 'Pesos visibles',
         (select count(*) from weight_entries)::text,
         case when (select count(*) from weight_entries) = 1 then 'aislado' else 'FUGA' end
  union all
  select 4, 'Registros de comida visibles',
         (select count(*) from log_entries)::text,
         case when (select count(*) from log_entries) = 1 then 'aislado' else 'FUGA' end
  union all
  select 5, 'Comidas del dia visibles',
         (select count(*) from meal_slots)::text,
         case when (select count(*) from meal_slots) = 4 then 'aislado (4 propias)' else 'FUGA o trigger mal' end
  union all
  -- El objetivo que se ve, debe ser el SUYO (2000), no el del otro (1800).
  select 6, 'El objetivo visible es el propio',
         coalesce((select kcal_target from goals limit 1)::text, 'ninguno'),
         case when (select kcal_target from goals limit 1) = 2000 then 'correcto' else 'FUGA' end
  union all
  -- El catalogo de alimentos SI es publico. Debe verse entero.
  select 7, 'Catalogo de alimentos (publico a proposito)',
         (select count(*) from foods)::text,
         case when (select count(*) from foods) = 49 then 'visible, correcto' else 'revisar' end
  union all
  -- Intento explicito de leer al otro usuario por su id.
  select 8, 'Leer al otro usuario por su id',
         (select count(*) from goals where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')::text,
         case when (select count(*) from goals where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') = 0
              then 'aislado' else 'FUGA GRAVE' end
) t order by ord;

rollback;
