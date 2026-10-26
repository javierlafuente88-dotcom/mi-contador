"""Construye replica/seed/foods.json desde el volcado completo de USDA SR Legacy.

Lo que fallo la vez anterior: emparejar por "la descripcion mas corta que
contiene estas palabras". Eso dio almendras garrapinadas, manteca de cacao y la
PIEL de la patata. Aqui el emparejamiento es estricto y ademas se verifica:

  1. palabras obligatorias  (must)
  2. palabras prohibidas    (never)  <- mata garrapinadas, empanados, papillas
  3. rango de cordura de kcal por alimento  <- mata el error de categoria
  4. si quedan varios candidatos, gana el de fdcId mas bajo (estable y
     reproducible), y se deja constancia de cuantos habia

Nada que no supere los cuatro filtros entra en la app.

Uso:
    python -I tools/build_seed.py <ruta al zip de SR Legacy>

El zip es el fichero publico de USDA FoodData Central (dominio publico):
FoodData_Central_sr_legacy_food_json_2018-04.zip
"""
import json
import os
import sys
import zipfile

# (nombre_es, must, never, kcal_min, kcal_max)
TARGETS = [
    # --- cereales y feculas ---
    ("Arroz blanco cocido",        ["rice", "white", "cooked"], ["glutinous", "instant", "wild", "fried", "spanish", "puffed"], 110, 145),
    ("Arroz integral cocido",      ["rice", "brown", "cooked"], ["instant", "puffed"], 100, 150),
    # SR Legacy no trae pasta comun cocida (solo "protein-fortified" y "spinach"),
    # asi que lo que entra son fideos de huevo, con su nombre de verdad.
    ("Fideos de huevo cocidos",    ["noodles", "egg", "enriched", "cooked"], ["spinach", "salt", "dry", "chinese", "japanese", "unenriched"], 120, 160),
    ("Pan blanco de trigo",        ["bread", "white", "commercially"], ["toasted", "reduced", "low sodium", "no salt", "from recipe"], 230, 290),
    ("Avena en copos",             ["oats"],                    ["cereals", "ready-to-eat", "honey", "bunches", "instant", "flavored", "bread", "flour", "bar", "granola", "milk"], 350, 410),
    ("Harina de trigo",            ["wheat flour", "white", "all-purpose"], ["cake", "self-rising", "bread flour"], 330, 380),
    ("Tortillas de maíz",          ["tortillas", "corn"],       ["fried", "chips", "taco"], 190, 250),
    ("Patata cocida",              ["potatoes", "boiled", "without skin", "flesh"], ["with salt", "chips", "fried", "canned", "au gratin"], 70, 105),
    ("Batata cocida",              ["sweet potato", "cooked", "boiled"], ["canned", "candied", "fried"], 65, 110),
    ("Yuca cruda",                 ["cassava", "raw"],          [], 140, 175),
    ("Maíz dulce cocido",          ["corn", "sweet", "yellow", "cooked", "boiled"], ["babyfood", "canned", "cream", "frozen", "cob", "with salt"], 70, 120),

    # --- legumbres ---
    ("Lentejas cocidas",           ["lentils", "cooked", "boiled"], ["sprouted"], 95, 130),
    ("Garbanzos cocidos",          ["chickpeas", "cooked", "boiled"], ["canned"], 140, 185),
    ("Frijoles negros cocidos",    ["beans", "black", "cooked", "boiled"], ["canned", "turtle"], 110, 155),
    ("Alubias blancas cocidas",    ["beans", "white", "cooked", "boiled"], ["canned"], 110, 160),

    # --- proteina animal ---
    ("Pechuga de pollo cocida",    ["chicken", "breast", "meat only", "roasted"], ["breaded", "fried", "skin", "canned", "tenders"], 140, 200),
    ("Pechuga de pavo cocida",        ["turkey", "breast", "meat only", "roasted"], ["salami", "prepackaged", "deli", "smoked"], 120, 180),
    ("Carne de res picada cocida", ["beef", "ground", "85% lean", "patty", "cooked", "broiled"], ["frozen", "pan-broiled"], 190, 280),
    ("Lomo de cerdo cocido",       ["pork", "loin", "lean only", "roasted"], ["backribs", "bone-in", "cured", "ham"], 150, 230),
    ("Huevo cocido",               ["egg", "whole", "cooked", "hard-boiled"], ["white only", "yolk only"], 130, 175),
    ("Bacalao cocido",             ["fish", "cod", "cooked", "dry heat"], ["dried", "salted", "canned"], 70, 120),
    ("Merluza cocida",             ["fish", "whiting", "cooked"], ["canned"], 70, 130),
    ("Atún en conserva al natural",["fish", "tuna", "canned", "water"], ["oil"], 85, 135),
    ("Salmón cocido",              ["fish", "salmon", "cooked", "dry heat"], ["smoked", "canned"], 140, 230),

    # --- lacteos ---
    ("Leche entera",               ["milk", "whole", "3.25%"], ["yogurt", "chocolate", "dry", "evaporated", "condensed", "goat"], 55, 75),
    ("Leche desnatada",            ["milk", "nonfat", "fluid", "vitamin a"], ["dry", "yogurt", "condensed", "calcium fortified", "protein fortified", "milk solids", "without added"], 28, 45),
    ("Yogur natural entero",       ["yogurt", "plain", "whole milk"], ["greek", "frozen", "flavored"], 50, 75),
    ("Queso fresco",               ["cheese", "queso fresco"],  [], 280, 340),
    ("Queso curado",               ["cheese", "cheddar"],       ["imitation", "pasteurized", "american", "low fat", "spread", "sauce", "nonfat", "fat free", "reduced fat", "sliced", "soup", "powder"], 350, 430),

    # --- verduras ---
    ("Tomate crudo",               ["tomatoes", "red", "ripe", "raw"], ["green", "canned", "sun-dried", "juice", "cooked", "stewed"], 12, 28),
    ("Cebolla cruda",              ["onions", "raw"],           ["dehydrated", "spring", "welsh", "young green"], 30, 50),
    ("Zanahoria cruda",            ["carrots", "raw"],          ["baby", "canned", "juice"], 30, 50),
    ("Brócoli crudo",              ["broccoli", "raw"],         ["chinese", "raab", "leaves", "flower clusters", "stalks", "frozen"], 25, 45),
    ("Espinacas crudas",           ["spinach", "raw"],          ["canned", "frozen", "mustard", "new zealand", "malabar", "souffle"], 15, 35),
    ("Lechuga romana",             ["lettuce", "cos or romaine", "raw"], [], 10, 25),
    ("Calabacín crudo",            ["squash", "zucchini", "includes skin", "raw"], ["baby", "cooked"], 10, 30),
    ("Pimiento rojo crudo",        ["peppers", "sweet", "red", "raw"], ["serrano", "jalapeno", "hot", "canned", "freeze-dried"], 20, 45),
    ("Judías verdes cocidas",      ["beans", "snap", "cooked", "boiled"], ["canned"], 25, 50),
    ("Champiñones crudos",         ["mushrooms", "white", "raw"], ["canned", "portabella", "shiitake"], 15, 35),

    # --- frutas ---
    ("Plátano",                    ["bananas", "raw"],          ["dehydrated", "dried"], 80, 110),
    ("Manzana con piel",           ["apples", "raw", "with skin"], ["dried", "juice", "canned", "fuji", "gala", "granny", "golden", "red delicious", "braeburn", "cripps"], 45, 70),
    ("Naranja",                    ["oranges", "raw", "all commercial"], ["juice", "peel", "candied"], 35, 60),
    ("Aguacate",                   ["avocados", "raw"],         ["california", "florida"], 140, 185),
    ("Fresas",                     ["strawberries", "raw"],     ["frozen", "canned"], 25, 45),
    ("Uvas",                       ["grapes", "red or green", "raw"], ["juice", "raisins"], 55, 85),

    # --- grasas, frutos secos y otros ---
    ("Aceite de oliva",            ["oil", "olive", "salad or cooking"], ["corn", "peanut", "blend"], 860, 910),
    ("Mantequilla",                ["butter", "salted"],        ["cocoa", "whipped", "oil", "light", "peanut"], 680, 760),
    ("Almendras crudas",           ["nuts", "almonds"],         ["candies", "sugar-coated", "roasted", "honey", "chocolate", "butter", "milk", "flour", "paste", "blanched", "salt"], 540, 620),
    ("Azúcar blanca",              ["sugars", "granulated"],    ["brown", "powdered"], 370, 400),
]

NUT = {"208": "kcal", "203": "protein_g", "204": "fat_g", "205": "carbs_g", "291": "fiber_g"}


def load_foods(zip_path):
    with zipfile.ZipFile(zip_path) as z:
        name = next(n for n in z.namelist() if n.lower().endswith(".json"))
        with z.open(name) as fh:
            data = json.load(fh)
    for key in ("SRLegacyFoods", "srLegacyFoods", "foods"):
        if isinstance(data, dict) and key in data:
            return data[key]
    return data if isinstance(data, list) else []


def nutrients(food):
    out = {}
    for n in food.get("foodNutrients", []):
        num = str((n.get("nutrient") or {}).get("number", ""))
        key = NUT.get(num)
        if key and n.get("amount") is not None:
            out[key] = round(float(n["amount"]), 2)
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit("uso: python -I tools/build_seed.py <ruta-al-zip>")
    foods = load_foods(sys.argv[1])
    print(f"alimentos en el volcado: {len(foods)}")

    kept, rejected = [], []
    for name_es, must, never, lo, hi in TARGETS:
        cands = []
        for f in foods:
            d = (f.get("description") or "").lower()
            if not all(w in d for w in must):
                continue
            if any(w in d for w in never):
                continue
            n = nutrients(f)
            kcal = n.get("kcal")
            if kcal is None:
                continue
            if not (lo <= kcal <= hi):          # filtro de cordura
                continue
            cands.append((f, n))
        if not cands:
            rejected.append((name_es, "ningun candidato supera los filtros"))
            continue
        cands.sort(key=lambda c: c[0]["fdcId"])  # estable y reproducible
        f, n = cands[0]
        kept.append({
            "name_es": name_es,
            "usda_fdc_id": f["fdcId"],
            "usda_description": f["description"],
            "license": "public-domain",
            "source": "usda",
            "per_100g": n,
            "match": {
                "must": must,
                "never": never,
                "kcal_range": [lo, hi],
                "candidates": len(cands),
            },
        })

    payload = {
        "_about": ("Alimentos genericos. Valores de USDA FoodData Central (SR Legacy), "
                   "dominio publico. Cada fila guarda su fdcId y las reglas con las que "
                   "se eligio, asi que el emparejamiento es comprobable y reproducible."),
        "_attribution": "U.S. Department of Agriculture, FoodData Central. fdc.nal.usda.gov",
        "_method": ("Filtros: palabras obligatorias, palabras prohibidas, rango de kcal "
                    "de cordura y desempate por fdcId mas bajo. Lo que no pasa los cuatro, "
                    "no entra."),
        "foods": sorted(kept, key=lambda x: x["name_es"]),
    }
    if rejected:
        payload["_pendientes"] = {
            "_nota": "No estan en la app porque no superaron los filtros.",
            "alimentos": [r[0] for r in rejected],
            "motivos": dict(rejected),
        }

    os.makedirs("replica/seed", exist_ok=True)
    with open("replica/seed/foods.json", "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)

    print(f"\naceptados: {len(kept)} / {len(TARGETS)}")
    for k in kept:
        amb = "" if k["match"]["candidates"] == 1 else f"  ({k['match']['candidates']} candidatos)"
        print(f"  {k['name_es']:30s} {k['per_100g']['kcal']:6.0f} kcal  | {k['usda_description'][:58]}{amb}")
    if rejected:
        print(f"\nrechazados: {len(rejected)}")
        for name, why in rejected:
            print(f"  {name:30s} {why}")


if __name__ == "__main__":
    main()
