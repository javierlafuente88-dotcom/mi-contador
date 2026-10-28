"""Asigna alergenos a los 49 alimentos de la semilla.

DE DONDE SALEN. USDA SR Legacy NO trae alergenos, asi que esta asignacion la
hago yo a partir de lo que es cada alimento, siguiendo la lista de 14 alergenos
de declaracion obligatoria en la UE (Reglamento 1169/2011).

QUE NO ES. No es una base de alergenos certificada ni sustituye a leer la
etiqueta del producto. Es una ayuda para alimentos GENERICOS: "huevo cocido"
lleva huevo, "merluza" lleva pescado. Para producto envasado no dice nada,
porque las trazas y los ingredientes ocultos no se deducen del nombre.

La app tiene que decir esto mismo en pantalla. Una ayuda presentada como
garantia es peor que no tener nada.

Reglas:
  - Explicitas y por alimento, nunca por adivinanza sobre el nombre.
  - Lo que no este en la tabla se queda SIN alergenos declarados, y eso
    tambien se dice: ausencia de dato no es ausencia de alergeno.

Uso: python -I tools/build_allergens.py
"""
import io
import json

FOODS = "replica/seed/foods.json"
OUT_SQL = "supabase/seed_allergens.sql"

# nombre_es -> alergenos de la lista de la UE presentes en el alimento generico
ALERGENOS = {
    # --- cereales con gluten ---
    "Pan blanco de trigo": ["gluten"],
    "Harina de trigo": ["gluten"],
    # La avena entra en "cereales que contienen gluten" del anexo II,
    # aunque su proteina sea avenina y no gliadina.
    "Avena en copos": ["gluten"],
    "Fideos de huevo cocidos": ["gluten", "huevo"],

    # --- huevo ---
    "Huevo cocido": ["huevo"],

    # --- leche ---
    "Leche entera": ["leche"],
    "Leche desnatada": ["leche"],
    "Yogur natural entero": ["leche"],
    "Queso fresco": ["leche"],
    "Queso curado": ["leche"],
    "Mantequilla": ["leche"],

    # --- pescado ---
    "Bacalao cocido": ["pescado"],
    "Merluza cocida": ["pescado"],
    "Salmón cocido": ["pescado"],
    "Atún en conserva al natural": ["pescado"],

    # --- frutos de cascara ---
    "Almendras crudas": ["frutos-secos"],
}

ETIQUETAS = {
    "gluten": "Gluten",
    "huevo": "Huevo",
    "leche": "Leche",
    "pescado": "Pescado",
    "frutos-secos": "Frutos secos",
    "soja": "Soja",
    "crustaceos": "Crustáceos",
    "moluscos": "Moluscos",
    "cacahuetes": "Cacahuetes",
    "sesamo": "Sésamo",
    "apio": "Apio",
    "mostaza": "Mostaza",
    "sulfitos": "Sulfitos",
    "altramuces": "Altramuces",
}


def q(s):
    return "'" + s.replace("'", "''") + "'"


def main():
    with open(FOODS, encoding="utf-8") as fh:
        data = json.load(fh)

    desconocidos = [n for n in ALERGENOS if not any(f["name_es"] == n for f in data["foods"])]
    con, sin = 0, 0
    for f in data["foods"]:
        al = ALERGENOS.get(f["name_es"], [])
        f["alergenos"] = al
        if al:
            con += 1
        else:
            sin += 1

    data["_alergenos"] = {
        "_about": ("Asignados a mano siguiendo la lista de 14 alergenos de la UE "
                   "(Reglamento 1169/2011). USDA no trae alergenos. Esto vale para "
                   "alimento GENERICO y NO sustituye a leer la etiqueta de un "
                   "producto envasado."),
        "etiquetas": ETIQUETAS,
    }

    with io.open(FOODS, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)

    lineas = [
        "-- Alergenos de los alimentos genericos. Generado por tools/build_allergens.py",
        "-- Lista de 14 alergenos de la UE. NO sustituye a leer la etiqueta.",
        "",
    ]
    for f in data["foods"]:
        if not f["alergenos"]:
            continue
        arr = "array[" + ",".join(q(a) for a in f["alergenos"]) + "]::text[]"
        lineas.append(
            f"update foods set allergens = {arr}\n"
            f"  where source = 'usda' and source_ref = {q(str(f['usda_fdc_id']))};"
        )
    with io.open(OUT_SQL, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lineas) + "\n")

    print(f"con alergenos declarados: {con}")
    print(f"sin alergenos declarados: {sin}  (ausencia de dato != ausencia de alergeno)")
    if desconocidos:
        print("REGLAS QUE NO CASAN CON NINGUN ALIMENTO:", ", ".join(desconocidos))
    print(f"\n{OUT_SQL} escrito")
    for f in data["foods"]:
        if f["alergenos"]:
            print(f"  {f['name_es']:32s} {', '.join(f['alergenos'])}")


if __name__ == "__main__":
    main()
