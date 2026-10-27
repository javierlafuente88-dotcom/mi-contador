"""Genera replica/seed/recipes.json y supabase/seed_recipes.sql.

Las recetas son NUESTRAS: combinaciones sencillas de cocina casera escritas
aqui. No se copia ninguna receta de ninguna app. Lo unico que viene de fuera
son los valores nutricionales de cada ingrediente, que salen de USDA
(dominio publico) a traves de replica/seed/foods.json.

Los totales NO se escriben a mano: se calculan sumando los ingredientes.

Uso: python -I tools/build_recipes.py
"""
import io
import json

FOODS = "replica/seed/foods.json"
OUT_JSON = "replica/seed/recipes.json"
OUT_SQL = "supabase/seed_recipes.sql"

# (nombre, etiquetas, minutos, raciones, [(alimento, gramos)])
RECETAS = [
    ("Lentejas con verduras", ["comida", "vegetariana"], 35, 2,
     [("Lentejas cocidas", 250), ("Cebolla cruda", 40), ("Zanahoria cruda", 60), ("Aceite de oliva", 10)]),
    ("Ensalada de garbanzos", ["comida", "vegetariana", "rapida"], 10, 1,
     [("Garbanzos cocidos", 180), ("Tomate crudo", 80), ("Cebolla cruda", 30),
      ("Lechuga romana", 40), ("Aceite de oliva", 10)]),
    ("Pollo con arroz y brócoli", ["comida"], 30, 1,
     [("Pechuga de pollo cocida", 150), ("Arroz blanco cocido", 180),
      ("Brócoli crudo", 100), ("Aceite de oliva", 8)]),
    ("Tortilla de patata al horno", ["cena", "vegetariana"], 40, 2,
     [("Patata cocida", 200), ("Huevo cocido", 120), ("Cebolla cruda", 40), ("Aceite de oliva", 10)]),
    ("Avena con plátano", ["desayuno", "vegetariana", "rapida"], 5, 1,
     [("Avena en copos", 50), ("Leche desnatada", 200), ("Plátano", 100)]),
    ("Yogur con fresas y almendras", ["desayuno", "vegetariana", "rapida"], 3, 1,
     [("Yogur natural entero", 150), ("Fresas", 100), ("Almendras crudas", 15)]),
    ("Tostada con tomate y aceite", ["desayuno", "vegetariana", "rapida"], 5, 1,
     [("Pan blanco de trigo", 60), ("Tomate crudo", 60), ("Aceite de oliva", 8)]),
    ("Merluza al horno con patata", ["cena"], 30, 1,
     [("Merluza cocida", 150), ("Patata cocida", 180), ("Pimiento rojo crudo", 50), ("Aceite de oliva", 10)]),
    ("Salmón con espinacas", ["cena"], 20, 1,
     [("Salmón cocido", 140), ("Espinacas crudas", 120), ("Aceite de oliva", 8)]),
    ("Frijoles con arroz", ["comida", "vegetariana"], 25, 2,
     [("Frijoles negros cocidos", 180), ("Arroz integral cocido", 150),
      ("Cebolla cruda", 30), ("Aceite de oliva", 8)]),
    ("Bocadillo de atún", ["comida", "rapida"], 5, 1,
     [("Pan blanco de trigo", 80), ("Atún en conserva al natural", 80),
      ("Tomate crudo", 40), ("Aceite de oliva", 5)]),
    ("Revuelto de champiñones", ["cena", "vegetariana", "rapida"], 10, 1,
     [("Huevo cocido", 120), ("Champiñones crudos", 120), ("Aceite de oliva", 8)]),
    ("Pavo con calabacín", ["cena"], 20, 1,
     [("Pechuga de pavo cocida", 150), ("Calabacín crudo", 200), ("Aceite de oliva", 8)]),
    ("Batata con queso fresco", ["merienda", "vegetariana"], 25, 1,
     [("Batata cocida", 200), ("Queso fresco", 60), ("Aceite de oliva", 5)]),
    ("Manzana con almendras", ["merienda", "vegetariana", "rapida"], 1, 1,
     [("Manzana con piel", 150), ("Almendras crudas", 20)]),
    ("Ensalada de maíz y aguacate", ["comida", "vegetariana", "rapida"], 10, 1,
     [("Maíz dulce cocido", 100), ("Aguacate", 80), ("Tomate crudo", 80),
      ("Lechuga romana", 40), ("Aceite de oliva", 5)]),
    ("Judías verdes con huevo", ["cena", "vegetariana", "rapida"], 15, 1,
     [("Judías verdes cocidas", 200), ("Huevo cocido", 120), ("Aceite de oliva", 8)]),
    ("Cerdo con alubias", ["comida"], 30, 2,
     [("Lomo de cerdo cocido", 160), ("Alubias blancas cocidas", 200),
      ("Zanahoria cruda", 60), ("Aceite de oliva", 10)]),
]

MACROS = ["kcal", "protein_g", "carbs_g", "fat_g", "fiber_g"]


def main():
    with open(FOODS, encoding="utf-8") as fh:
        catalogo = {f["name_es"]: f for f in json.load(fh)["foods"]}

    recetas, faltan = [], set()
    for nombre, etiquetas, minutos, raciones, ingredientes in RECETAS:
        total = {m: 0.0 for m in MACROS}
        filas = []
        ok = True
        for alimento, gramos in ingredientes:
            f = catalogo.get(alimento)
            if not f:
                faltan.add(alimento)
                ok = False
                continue
            for m in MACROS:
                v = f["per_100g"].get(m)
                if v is not None:
                    total[m] += v * gramos / 100.0
            filas.append({"alimento": alimento, "usda_fdc_id": f["usda_fdc_id"], "gramos": gramos})
        if not ok:
            continue
        gramos_totales = sum(r["gramos"] for r in filas)
        recetas.append({
            "nombre": nombre,
            "etiquetas": etiquetas,
            "minutos": minutos,
            "raciones": raciones,
            "gramos_totales": gramos_totales,
            "ingredientes": filas,
            "por_racion": {m: round(total[m] / raciones, 1) for m in MACROS},
            "gramos_por_racion": round(gramos_totales / raciones, 1),
        })

    payload = {
        "_about": ("Recetas propias: combinaciones de cocina casera escritas para este "
                   "proyecto. No se ha copiado ninguna receta de ninguna aplicacion. "
                   "Los valores nutricionales se CALCULAN sumando los ingredientes, "
                   "cuyos datos vienen de USDA (dominio publico)."),
        "recetas": sorted(recetas, key=lambda r: r["nombre"]),
    }
    with io.open(OUT_JSON, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)

    # --- SQL para Supabase ---
    def q(s):
        return "'" + s.replace("'", "''") + "'"

    lineas = [
        "-- Recetas del catalogo. Generado por tools/build_recipes.py",
        "-- owner_id null = receta del catalogo, visible para todos.",
        "-- Los ingredientes se enlazan por el fdcId del alimento.",
        "",
    ]
    for r in recetas:
        etiquetas = "array[" + ",".join(q(e) for e in r["etiquetas"]) + "]::text[]"
        lineas.append(
            f"insert into recipes (owner_id, name, servings, tags, prep_minutes)\n"
            f"  values (null, {q(r['nombre'])}, {r['raciones']}, {etiquetas}, {r['minutos']})\n"
            f"  on conflict do nothing;"
        )
        for ing in r["ingredientes"]:
            lineas.append(
                f"insert into recipe_ingredients (recipe_id, food_id, grams)\n"
                f"  select r.id, f.id, {ing['gramos']}\n"
                f"  from recipes r, foods f\n"
                f"  where r.name = {q(r['nombre'])} and r.owner_id is null\n"
                f"    and f.source = 'usda' and f.source_ref = {q(str(ing['usda_fdc_id']))}\n"
                f"  on conflict do nothing;"
            )
        lineas.append("")
    with io.open(OUT_SQL, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lineas))

    print(f"{len(recetas)} recetas -> {OUT_JSON} y {OUT_SQL}")
    if faltan:
        print("INGREDIENTES QUE NO ESTAN EN LA BASE:", ", ".join(sorted(faltan)))
    for r in recetas:
        p = r["por_racion"]
        print(f"  {r['nombre']:32s} {p['kcal']:6.0f} kcal/racion  "
              f"P{p['protein_g']:5.1f} C{p['carbs_g']:5.1f} G{p['fat_g']:5.1f}  "
              f"{r['gramos_por_racion']:5.0f} g")


if __name__ == "__main__":
    main()
