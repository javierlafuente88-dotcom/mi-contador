"""Convierte replica/seed/foods.json en supabase/seed.sql.

Identifica cada alimento por (source, source_ref) = ('usda', fdcId), que tiene
indice unico, asi que ejecutar la semilla dos veces no duplica nada.

Uso: python -I tools/gen_seed_sql.py
"""
import io
import json

SRC = "replica/seed/foods.json"
DST = "supabase/seed.sql"


def q(s):
    return "'" + s.replace("'", "''") + "'"


def num(v):
    return "null" if v is None else repr(round(float(v), 2))


def main():
    with open(SRC, encoding="utf-8") as fh:
        data = json.load(fh)

    lines = [
        "-- Semilla de alimentos genericos. Generado por tools/gen_seed_sql.py",
        "-- Fuente: USDA FoodData Central (SR Legacy), dominio publico.",
        "-- Clave: (source, source_ref) = ('usda', fdcId). Reejecutar no duplica.",
        "",
    ]
    for f in data["foods"]:
        n = f["per_100g"]
        lines.append(
            "insert into foods (name, source, source_ref, license, kcal_100g, "
            "protein_100g, carbs_100g, fat_100g, fiber_100g, verified_at) values ("
            f"{q(f['name_es'])}, 'usda', {q(str(f['usda_fdc_id']))}, 'public-domain', "
            f"{num(n.get('kcal'))}, {num(n.get('protein_g', 0))}, "
            f"{num(n.get('carbs_g', 0))}, {num(n.get('fat_g', 0))}, "
            f"{num(n.get('fiber_g'))}, now())"
            # El indice unico es PARCIAL (where source_ref is not null), asi que
            # hay que repetir el predicado aqui o Postgres no lo encuentra.
            "\n  on conflict (source, source_ref) where source_ref is not null"
            "\n  do update set"
            "\n    name = excluded.name,"
            "\n    kcal_100g = excluded.kcal_100g,"
            "\n    protein_100g = excluded.protein_100g,"
            "\n    carbs_100g = excluded.carbs_100g,"
            "\n    fat_100g = excluded.fat_100g,"
            "\n    fiber_100g = excluded.fiber_100g,"
            "\n    verified_at = now();"
        )

    with io.open(DST, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")
    print(f"{DST}: {len(data['foods'])} alimentos")


if __name__ == "__main__":
    main()
