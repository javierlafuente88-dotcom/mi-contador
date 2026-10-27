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
