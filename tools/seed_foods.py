"""Genera replica/seed/foods.json desde USDA FoodData Central (dominio publico).

Los valores nutricionales NO se inventan ni se redondean a ojo: salen tal cual de
USDA y cada alimento guarda su fdcId para poder comprobarlo.
El nombre en espanol es etiqueta nuestra, mapeada a una entrada concreta de USDA.

Uso: python -I tools/seed_foods.py
Solo libreria estandar. Respeta el limite de DEMO_KEY: 10 peticiones, espaciadas.
"""
import json
import os
import time
import urllib.parse
import urllib.request

API = "https://api.nal.usda.gov/fdc/v1/foods/search"
KEY = os.environ.get("USDA_API_KEY", "DEMO_KEY")

# Diez busquedas amplias en vez de cuarenta concretas: el limite de DEMO_KEY es
# estrecho y asi cabemos de sobra.
QUERIES = [
    "lentils chickpeas beans cooked",
    "rice pasta bread wheat flour oats cooked",
    "chicken breast turkey cooked roasted",
    "beef pork ground loin cooked",
    "fish hake cod tuna canned cooked",
    "milk yogurt cheese egg",
    "tomato onion carrot broccoli spinach lettuce zucchini pepper raw",
    "banana apple orange avocado strawberry raw",
    "almonds olive oil butter sugar",
    "potato sweet potato cassava corn tortilla cooked",
]

# nombre en espanol -> palabras que deben aparecer en la descripcion de USDA
WANTED = [
    ("Arroz blanco cocido",          ["rice", "white", "cooked"]),
    ("Pasta cocida",                 ["spaghetti", "cooked"]),
    ("Pan blanco",                   ["bread", "white"]),
    ("Avena en copos",               ["oats"]),
    ("Harina de trigo",              ["wheat flour", "white"]),
    ("Tortilla de maiz",             ["tortillas", "corn"]),
    ("Lentejas cocidas",             ["lentils", "cooked"]),
    ("Garbanzos cocidos",            ["chickpeas", "cooked"]),
    ("Frijoles negros cocidos",      ["beans", "black", "cooked"]),
    ("Pechuga de pollo cocida",      ["chicken", "breast", "cooked"]),
    ("Pavo cocido",                  ["turkey", "cooked"]),
    ("Carne de res picada cocida",   ["beef", "ground", "cooked"]),
    ("Lomo de cerdo cocido",         ["pork", "loin", "cooked"]),
    ("Merluza cocida",               ["hake"]),
    ("Bacalao cocido",               ["cod", "cooked"]),
    ("Atun en conserva",             ["tuna", "canned"]),
    ("Huevo cocido",                 ["egg", "whole", "cooked"]),
    ("Leche entera",                 ["milk", "whole"]),
    ("Yogur natural",                ["yogurt", "plain"]),
    ("Queso fresco",                 ["cheese"]),
    ("Tomate crudo",                 ["tomatoes", "raw"]),
    ("Cebolla cruda",                ["onions", "raw"]),
    ("Zanahoria cruda",              ["carrots", "raw"]),
    ("Brocoli crudo",                ["broccoli", "raw"]),
    ("Espinacas crudas",             ["spinach", "raw"]),
    ("Lechuga",                      ["lettuce", "raw"]),
    ("Calabacin crudo",              ["squash", "zucchini"]),
    ("Pimiento crudo",               ["peppers", "raw"]),
    ("Platano",                       ["bananas", "raw"]),
    ("Manzana",                      ["apples", "raw"]),
    ("Naranja",                      ["oranges", "raw"]),
    ("Aguacate",                     ["avocados", "raw"]),
    ("Fresas",                       ["strawberries", "raw"]),
    ("Almendras",                    ["almonds"]),
    ("Aceite de oliva",              ["oil", "olive"]),
    ("Mantequilla",                  ["butter"]),
    ("Azucar",                       ["sugars", "granulated"]),
    ("Patata cocida",                ["potatoes", "cooked"]),
    ("Batata cocida",                ["sweet potato", "cooked"]),
    ("Yuca cruda",                   ["cassava", "raw"]),
    ("Maiz dulce",                   ["corn", "sweet"]),
]

NUT = {"208": "kcal", "203": "protein_g", "204": "fat_g",
       "205": "carbs_g", "291": "fiber_g"}


def fetch(query):
    url = API + "?" + urllib.parse.urlencode({
        "api_key": KEY, "query": query, "dataType": "SR Legacy", "pageSize": 50})
    req = urllib.request.Request(url, headers={"User-Agent": "mi-contador-seed/1.0"})
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.load(r).get("foods", [])


def nutrients(food):
    out = {}
    for n in food.get("foodNutrients", []):
        key = NUT.get(str(n.get("nutrientNumber")))
        if key and n.get("value") is not None:
            out[key] = round(float(n["value"]), 2)
    return out


def main():
    pool = {}
    for i, q in enumerate(QUERIES):
        if i:
            time.sleep(6)
        try:
            for f in fetch(q):
                pool[f["fdcId"]] = f
            print(f"  consulta {i+1}/{len(QUERIES)} ok · pool={len(pool)}")
        except Exception as e:
            print(f"  consulta {i+1}/{len(QUERIES)} FALLO: {e}")

    foods, missing = [], []
    for name_es, words in WANTED:
        best = None
        for f in pool.values():
            desc = f.get("description", "").lower()
            if all(w.lower() in desc for w in words):
                n = nutrients(f)
                if "kcal" not in n:
                    continue
                # el mas corto suele ser el generico, no una variante rara
                if best is None or len(desc) < len(best[0].get("description", "")):
                    best = (f, n)
        if best:
            f, n = best
            foods.append({
                "name_es": name_es,
                "usda_fdc_id": f["fdcId"],
                "usda_description": f["description"],
                "license": "public-domain",
                "source": "usda",
                "per_100g": n,
            })
        else:
            missing.append(name_es)

    os.makedirs("replica/seed", exist_ok=True)
    payload = {
        "_about": ("Alimentos genericos para el hito 1. Valores de USDA FoodData "
                   "Central (SR Legacy), dominio publico. El nombre en espanol es "
                   "etiqueta nuestra; usda_fdc_id permite comprobar cada valor."),
        "_attribution": "U.S. Department of Agriculture, FoodData Central. fdc.nal.usda.gov",
        "_generated": time.strftime("%Y-%m-%d"),
        "foods": sorted(foods, key=lambda f: f["name_es"]),
    }
    with open("replica/seed/foods.json", "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)

    print(f"\nescritos {len(foods)} alimentos en replica/seed/foods.json")
    if missing:
        print(f"NO encontrados ({len(missing)}): {', '.join(missing)}")


if __name__ == "__main__":
    main()
