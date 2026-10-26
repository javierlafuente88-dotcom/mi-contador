"""Comprueba replica/seed/foods.json de forma INDEPENDIENTE de como se construyo.

build_seed.py empareja por palabras y rangos. Si esas reglas estan mal, el
resultado sale mal sin que nadie se entere: eso es justo lo que paso la primera
vez. Este script no mira las reglas: mira los numeros.

  1. Atwater: 4 kcal/g de proteina y de carbohidrato digerible, 9 de grasa,
     2 de fibra. Si la suma no se parece a las kcal declaradas, algo falla.
  2. Rangos imposibles: macros negativos, mas de 100 g de algo por 100 g,
     kcal por encima de 900 (ni la grasa pura llega).
  3. Trazabilidad: todo tiene fdcId, no hay duplicados y la licencia es la
     que decimos que es.

Sale con codigo 1 si algo falla, para poder usarlo como barrera.

Uso: python -I tools/verify_seed.py [ruta]
"""
import json
import sys

TOLERANCIA = 0.20  # 20% sobre las kcal declaradas
SUELO_ABS = 12     # ...o 12 kcal absolutas, lo que sea mas generoso


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "replica/seed/foods.json"
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    foods = data["foods"]
    fallos = []

    for f in foods:
        n = f["per_100g"]
        name = f["name_es"]
        kcal = n.get("kcal")
        prot = n.get("protein_g", 0.0)
        carb = n.get("carbs_g", 0.0)
        fat = n.get("fat_g", 0.0)
        fib = n.get("fiber_g", 0.0) or 0.0

        if kcal is None:
            fallos.append((name, "sin kcal"))
            continue
        for etiqueta, v in (("proteina", prot), ("carbohidratos", carb),
                            ("grasa", fat), ("fibra", fib)):
            if v < 0:
                fallos.append((name, f"{etiqueta} negativa"))
            if v > 100:
                fallos.append((name, f"{etiqueta} > 100 g por 100 g"))
        if kcal < 0 or kcal > 900:
            fallos.append((name, f"kcal fuera de lo posible: {kcal}"))

        digerible = max(0.0, carb - fib)
        est = 4 * prot + 4 * digerible + 2 * fib + 9 * fat
        margen = max(SUELO_ABS, kcal * TOLERANCIA)
        if abs(est - kcal) > margen:
            fallos.append((
                name,
                f"Atwater no cuadra: declara {kcal:.0f} kcal, los macros dan {est:.0f}",
            ))

        if not f.get("usda_fdc_id"):
            fallos.append((name, "sin fdcId: no es comprobable"))
        if f.get("license") != "public-domain":
            fallos.append((name, f"licencia inesperada: {f.get('license')}"))

    ids = [f.get("usda_fdc_id") for f in foods]
    for i in set(ids):
        if ids.count(i) > 1:
            dupes = [f["name_es"] for f in foods if f.get("usda_fdc_id") == i]
            fallos.append((", ".join(dupes), f"comparten el fdcId {i}"))

    print(f"alimentos comprobados: {len(foods)}")
    if fallos:
        print(f"FALLOS: {len(fallos)}")
        for name, why in fallos:
            print(f"  {name:30s} {why}")
        sys.exit(1)
    print("todo cuadra: Atwater, rangos, fdcId y licencia")


if __name__ == "__main__":
    main()
