-- Recetas del catalogo. Generado por tools/build_recipes.py
-- owner_id null = receta del catalogo, visible para todos.
-- Los ingredientes se enlazan por el fdcId del alimento.

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Lentejas con verduras', 2, array['comida','vegetariana']::text[], 35)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 250
  from recipes r, foods f
  where r.name = 'Lentejas con verduras' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '172421'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 40
  from recipes r, foods f
  where r.name = 'Lentejas con verduras' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170000'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 60
  from recipes r, foods f
  where r.name = 'Lentejas con verduras' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170393'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 10
  from recipes r, foods f
  where r.name = 'Lentejas con verduras' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Ensalada de garbanzos', 1, array['comida','vegetariana','rapida']::text[], 10)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 180
  from recipes r, foods f
  where r.name = 'Ensalada de garbanzos' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '173757'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 80
  from recipes r, foods f
  where r.name = 'Ensalada de garbanzos' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170457'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 30
  from recipes r, foods f
  where r.name = 'Ensalada de garbanzos' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170000'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 40
  from recipes r, foods f
  where r.name = 'Ensalada de garbanzos' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '169247'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 10
  from recipes r, foods f
  where r.name = 'Ensalada de garbanzos' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Pollo con arroz y brócoli', 1, array['comida']::text[], 30)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 150
  from recipes r, foods f
  where r.name = 'Pollo con arroz y brócoli' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171477'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 180
  from recipes r, foods f
  where r.name = 'Pollo con arroz y brócoli' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '168878'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 100
  from recipes r, foods f
  where r.name = 'Pollo con arroz y brócoli' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170379'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 8
  from recipes r, foods f
  where r.name = 'Pollo con arroz y brócoli' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Tortilla de patata al horno', 2, array['cena','vegetariana']::text[], 40)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 200
  from recipes r, foods f
  where r.name = 'Tortilla de patata al horno' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170440'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 120
  from recipes r, foods f
  where r.name = 'Tortilla de patata al horno' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '173424'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 40
  from recipes r, foods f
  where r.name = 'Tortilla de patata al horno' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170000'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 10
  from recipes r, foods f
  where r.name = 'Tortilla de patata al horno' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Avena con plátano', 1, array['desayuno','vegetariana','rapida']::text[], 5)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 50
  from recipes r, foods f
  where r.name = 'Avena con plátano' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '169705'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 200
  from recipes r, foods f
  where r.name = 'Avena con plátano' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171269'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 100
  from recipes r, foods f
  where r.name = 'Avena con plátano' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '173944'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Yogur con fresas y almendras', 1, array['desayuno','vegetariana','rapida']::text[], 3)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 150
  from recipes r, foods f
  where r.name = 'Yogur con fresas y almendras' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171284'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 100
  from recipes r, foods f
  where r.name = 'Yogur con fresas y almendras' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '167762'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 15
  from recipes r, foods f
  where r.name = 'Yogur con fresas y almendras' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170567'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Tostada con tomate y aceite', 1, array['desayuno','vegetariana','rapida']::text[], 5)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 60
  from recipes r, foods f
  where r.name = 'Tostada con tomate y aceite' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '174924'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 60
  from recipes r, foods f
  where r.name = 'Tostada con tomate y aceite' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170457'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 8
  from recipes r, foods f
  where r.name = 'Tostada con tomate y aceite' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Merluza al horno con patata', 1, array['cena']::text[], 30)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 150
  from recipes r, foods f
  where r.name = 'Merluza al horno con patata' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '175161'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 180
  from recipes r, foods f
  where r.name = 'Merluza al horno con patata' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170440'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 50
  from recipes r, foods f
  where r.name = 'Merluza al horno con patata' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170108'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 10
  from recipes r, foods f
  where r.name = 'Merluza al horno con patata' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Salmón con espinacas', 1, array['cena']::text[], 20)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 140
  from recipes r, foods f
  where r.name = 'Salmón con espinacas' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171998'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 120
  from recipes r, foods f
  where r.name = 'Salmón con espinacas' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '168462'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 8
  from recipes r, foods f
  where r.name = 'Salmón con espinacas' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Frijoles con arroz', 2, array['comida','vegetariana']::text[], 25)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 180
  from recipes r, foods f
  where r.name = 'Frijoles con arroz' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '173735'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 150
  from recipes r, foods f
  where r.name = 'Frijoles con arroz' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '168875'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 30
  from recipes r, foods f
  where r.name = 'Frijoles con arroz' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170000'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 8
  from recipes r, foods f
  where r.name = 'Frijoles con arroz' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Bocadillo de atún', 1, array['comida','rapida']::text[], 5)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 80
  from recipes r, foods f
  where r.name = 'Bocadillo de atún' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '174924'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 80
  from recipes r, foods f
  where r.name = 'Bocadillo de atún' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171986'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 40
  from recipes r, foods f
  where r.name = 'Bocadillo de atún' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170457'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 5
  from recipes r, foods f
  where r.name = 'Bocadillo de atún' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Revuelto de champiñones', 1, array['cena','vegetariana','rapida']::text[], 10)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 120
  from recipes r, foods f
  where r.name = 'Revuelto de champiñones' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '173424'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 120
  from recipes r, foods f
  where r.name = 'Revuelto de champiñones' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '169251'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 8
  from recipes r, foods f
  where r.name = 'Revuelto de champiñones' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Pavo con calabacín', 1, array['cena']::text[], 20)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 150
  from recipes r, foods f
  where r.name = 'Pavo con calabacín' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171496'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 200
  from recipes r, foods f
  where r.name = 'Pavo con calabacín' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '169291'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 8
  from recipes r, foods f
  where r.name = 'Pavo con calabacín' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Batata con queso fresco', 1, array['merienda','vegetariana']::text[], 25)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 200
  from recipes r, foods f
  where r.name = 'Batata con queso fresco' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '168484'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 60
  from recipes r, foods f
  where r.name = 'Batata con queso fresco' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '172223'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 5
  from recipes r, foods f
  where r.name = 'Batata con queso fresco' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Manzana con almendras', 1, array['merienda','vegetariana','rapida']::text[], 1)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 150
  from recipes r, foods f
  where r.name = 'Manzana con almendras' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171688'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 20
  from recipes r, foods f
  where r.name = 'Manzana con almendras' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170567'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Ensalada de maíz y aguacate', 1, array['comida','vegetariana','rapida']::text[], 10)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 100
  from recipes r, foods f
  where r.name = 'Ensalada de maíz y aguacate' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '169999'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 80
  from recipes r, foods f
  where r.name = 'Ensalada de maíz y aguacate' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171705'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 80
  from recipes r, foods f
  where r.name = 'Ensalada de maíz y aguacate' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170457'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 40
  from recipes r, foods f
  where r.name = 'Ensalada de maíz y aguacate' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '169247'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 5
  from recipes r, foods f
  where r.name = 'Ensalada de maíz y aguacate' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Judías verdes con huevo', 1, array['cena','vegetariana','rapida']::text[], 15)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 200
  from recipes r, foods f
  where r.name = 'Judías verdes con huevo' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '169141'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 120
  from recipes r, foods f
  where r.name = 'Judías verdes con huevo' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '173424'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 8
  from recipes r, foods f
  where r.name = 'Judías verdes con huevo' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;

insert into recipes (owner_id, name, servings, tags, prep_minutes)
  values (null, 'Cerdo con alubias', 2, array['comida']::text[], 30)
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 160
  from recipes r, foods f
  where r.name = 'Cerdo con alubias' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '167894'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 200
  from recipes r, foods f
  where r.name = 'Cerdo con alubias' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '173750'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 60
  from recipes r, foods f
  where r.name = 'Cerdo con alubias' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '170393'
  on conflict do nothing;
insert into recipe_ingredients (recipe_id, food_id, grams)
  select r.id, f.id, 10
  from recipes r, foods f
  where r.name = 'Cerdo con alubias' and r.owner_id is null
    and f.source = 'usda' and f.source_ref = '171413'
  on conflict do nothing;
