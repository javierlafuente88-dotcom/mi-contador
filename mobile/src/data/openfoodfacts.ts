import type { Food } from "./types";

/** Cliente de Open Food Facts.
 *
 *  Es su API pública y documentada, no scraping. Sus normas piden identificarse
 *  con un User-Agent propio, así que se manda uno.
 *
 *  Lo que medimos en /replica-architect y conviene no olvidar:
 *  México 18.075 productos, Chile 6.870, Perú 2.861. Hay huecos enormes, y la
 *  interfaz tiene que decirlo en vez de dejar al usuario con una pantalla vacía.
 *
 *  Licencia: los datos son ODbL. Mostrarlos exige **atribución**, y por eso
 *  cada alimento traído de aquí la lleva. Volcarlos a una base propia y
 *  distribuirla es otra cosa, con share-alike, y está pendiente de consultar.
 */

const BASE = "https://world.openfoodfacts.org/api/v2/product";
const UA = "mi-contador/0.1 (proyecto personal)";
const TIEMPO_MAXIMO = 8000;

export type ResultadoCodigo =
  | { estado: "encontrado"; food: Food }
  | { estado: "no-esta" }
  | { estado: "sin-datos" }
  | { estado: "error"; motivo: string };

type ProductoOFF = {
  status?: number;
  product?: {
    product_name?: string;
    product_name_es?: string;
    brands?: string;
    nutriments?: Record<string, number | string | undefined>;
  };
};

function num(v: unknown): number | undefined {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : undefined;
}

/** Normaliza el código: quita espacios y guiones. Acepta EAN-8 y EAN-13. */
export function limpiarCodigo(raw: string): string {
  return raw.replace(/[\s-]/g, "");
}

export function codigoValido(code: string): boolean {
  return /^\d{8}$|^\d{12,14}$/.test(limpiarCodigo(code));
}

export async function buscarPorCodigo(codigo: string): Promise<ResultadoCodigo> {
  const code = limpiarCodigo(codigo);
  if (!codigoValido(code)) return { estado: "error", motivo: "Ese código no parece válido" };

  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), TIEMPO_MAXIMO);
  try {
    const campos = "product_name,product_name_es,brands,nutriments";
    const r = await fetch(`${BASE}/${code}.json?fields=${campos}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: control.signal,
    });
    if (r.status === 404) return { estado: "no-esta" };
    if (!r.ok) return { estado: "error", motivo: `El servicio respondió ${r.status}` };

    const data = (await r.json()) as ProductoOFF;
    if (data.status === 0 || !data.product) return { estado: "no-esta" };

    const p = data.product;
    const nombre = (p.product_name_es || p.product_name || "").trim();
    const kcal = num(p.nutriments?.["energy-kcal_100g"]);

    // Un producto sin nombre o sin calorías no sirve de nada: es peor que nada,
    // porque parece que hay dato cuando no lo hay.
    if (!nombre || kcal === undefined) return { estado: "sin-datos" };

    const marca = (p.brands || "").split(",")[0]?.trim();
    const food: Food = {
      id: `off:${code}`,
      name: marca && !nombre.toLowerCase().includes(marca.toLowerCase())
        ? `${nombre} (${marca})`
        : nombre,
      license: "odbl",
      per100g: {
        kcal,
        protein_g: num(p.nutriments?.["proteins_100g"]),
        carbs_g: num(p.nutriments?.["carbohydrates_100g"]),
        fat_g: num(p.nutriments?.["fat_100g"]),
        fiber_g: num(p.nutriments?.["fiber_100g"]),
      },
    };
    return { estado: "encontrado", food };
  } catch (e) {
    const abortado = e instanceof Error && e.name === "AbortError";
    return {
      estado: "error",
      motivo: abortado ? "El servicio tarda demasiado" : "No se pudo conectar",
    };
  } finally {
    clearTimeout(corte);
  }
}
