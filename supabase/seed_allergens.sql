-- Alergenos de los alimentos genericos. Generado por tools/build_allergens.py
-- Lista de 14 alergenos de la UE. NO sustituye a leer la etiqueta.

update foods set allergens = array['frutos-secos']::text[]
  where source = 'usda' and source_ref = '170567';
update foods set allergens = array['pescado']::text[]
  where source = 'usda' and source_ref = '171986';
update foods set allergens = array['gluten']::text[]
  where source = 'usda' and source_ref = '169705';
update foods set allergens = array['pescado']::text[]
  where source = 'usda' and source_ref = '171956';
update foods set allergens = array['gluten','huevo']::text[]
  where source = 'usda' and source_ref = '169732';
update foods set allergens = array['gluten']::text[]
  where source = 'usda' and source_ref = '168894';
update foods set allergens = array['huevo']::text[]
  where source = 'usda' and source_ref = '173424';
update foods set allergens = array['leche']::text[]
  where source = 'usda' and source_ref = '171269';
update foods set allergens = array['leche']::text[]
  where source = 'usda' and source_ref = '171265';
update foods set allergens = array['leche']::text[]
  where source = 'usda' and source_ref = '173410';
update foods set allergens = array['pescado']::text[]
  where source = 'usda' and source_ref = '175161';
update foods set allergens = array['gluten']::text[]
  where source = 'usda' and source_ref = '174924';
update foods set allergens = array['leche']::text[]
  where source = 'usda' and source_ref = '173414';
update foods set allergens = array['leche']::text[]
  where source = 'usda' and source_ref = '172223';
update foods set allergens = array['pescado']::text[]
  where source = 'usda' and source_ref = '171998';
update foods set allergens = array['leche']::text[]
  where source = 'usda' and source_ref = '171284';
