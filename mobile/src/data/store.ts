import AsyncStorage from "@react-native-async-storage/async-storage";
import raw from "./foods.json";
import rawRecipes from "./recipes.json";
import type { Food, Goal, LogEntry, MealSlot, Profile, Recipe, Store } from "./types";

/** Almacen falso del hito 1. Mismas firmas que tendra el de Supabase,
 *  asi que /replica-backend lo sustituye sin tocar ninguna pantalla. */

const K = {
  profile: "v1.profile",
  goal: "v1.goal",
  entries: "v1.entries",
  slots: "v1.slots",
};

type SeedFood = {
  name_es: string;
  usda_fdc_id?: number;
  usda_description?: string;
  license: Food["license"];
  per_100g: Food["per100g"];
};

const FOODS: Food[] = (raw as { foods: SeedFood[] }).foods.map((f) => ({
  id: String(f.usda_fdc_id ?? f.name_es),
  name: f.name_es,
  usdaFdcId: f.usda_fdc_id,
  usdaDescription: f.usda_description,
  license: f.license,
  per100g: f.per_100g,
}));

type SeedRecipe = {
  nombre: string;
  etiquetas: string[];
  minutos: number;
  raciones: number;
  gramos_por_racion: number;
  por_racion: Recipe["perServing"];
  ingredientes: { alimento: string; gramos: number }[];
};

const RECIPES: Recipe[] = (rawRecipes as { recetas: SeedRecipe[] }).recetas.map((r) => ({
  id: `rec:${r.nombre}`,
  name: r.nombre,
  tags: r.etiquetas,
  prepMinutes: r.minutos,
  servings: r.raciones,
  gramsPerServing: r.gramos_por_racion,
  perServing: r.por_racion,
  ingredients: r.ingredientes.map((i) => ({ name: i.alimento, grams: i.gramos })),
}));

const DEFAULT_SLOTS: MealSlot[] = [
  { id: "desayuno", name: "Desayuno", position: 1 },
  { id: "almuerzo", name: "Almuerzo", position: 2 },
  { id: "merienda", name: "Merienda", position: 3 },
  { id: "cena", name: "Cena", position: 4 },
];

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function write(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento la app sigue funcionando en memoria durante la sesion.
  }
}

/** Quita acentos para que "platano" encuentre "plátano". */
const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const store: Store = {
  async getProfile() {
    return read<Profile | null>(K.profile, null);
  },
  async saveProfile(p) {
    await write(K.profile, p);
  },
  async getGoal() {
    return read<Goal | null>(K.goal, null);
  },
  async saveGoal(g) {
    await write(K.goal, g);
  },
  async listMealSlots() {
    return read<MealSlot[]>(K.slots, DEFAULT_SLOTS);
  },
  async searchFoods(query) {
    const q = fold(query.trim());
    if (!q) return FOODS.slice(0, 50);
    return FOODS.filter((f) => fold(f.name).includes(q)).slice(0, 50);
  },
  async getFood(id) {
    return FOODS.find((f) => f.id === id) ?? null;
  },
  async listRecipes(filtros) {
    let r = RECIPES;
    if (filtros?.etiqueta) r = r.filter((x) => x.tags.includes(filtros.etiqueta!));
    if (filtros?.maxKcal) r = r.filter((x) => x.perServing.kcal <= filtros.maxKcal!);
    if (filtros?.maxMinutos) r = r.filter((x) => x.prepMinutes <= filtros.maxMinutos!);
    return r;
  },
  async getRecipe(id) {
    return RECIPES.find((r) => r.id === id) ?? null;
  },
  async listEntries(localDate) {
    const all = await read<LogEntry[]>(K.entries, []);
    return all.filter((e) => e.localDate === localDate);
  },
  async addEntry(e) {
    const all = await read<LogEntry[]>(K.entries, []);
    // Idempotencia. La original registra la misma comida dos y tres veces
    // cuando el movil reintenta con mala cobertura; aqui no puede pasar.
    const existing = all.find((x) => x.clientToken === e.clientToken);
    if (existing) return existing;
    const entry: LogEntry = { ...e, id: e.clientToken };
    await write(K.entries, [...all, entry]);
    return entry;
  },
  async removeEntry(id) {
    const all = await read<LogEntry[]>(K.entries, []);
    await write(
      K.entries,
      all.filter((e) => e.id !== id)
    );
  },
};

export const allFoods = FOODS;
export const allRecipes = RECIPES;

/** Fecha de hoy EN LA ZONA DEL USUARIO. Nunca toISOString(), que da UTC
 *  y parte el diario por la medianoche de Londres. */
export function todayLocal(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Mifflin-St Jeor. Formula publica, publicada en 1990. */
export function basalKcal(p: Profile): number {
  const age = new Date().getFullYear() - p.birthYear;
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * age;
  if (p.sex === "male") return base + 5;
  if (p.sex === "female") return base - 161;
  return base - 78; // punto medio cuando no se declara
}

const FACTOR: Record<Profile["activity"], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
};

export const KCAL_FLOOR = 1200;

/** Devuelve el objetivo y, si se topa con el suelo, lo dice.
 *  El suelo no es un aviso que se pueda ignorar: se aplica. */
export function buildGoal(p: Profile, type: Goal["type"]) {
  const maintain = basalKcal(p) * FACTOR[p.activity];
  const delta = type === "lose" ? -500 : type === "gain" ? 350 : 0;
  const wanted = Math.round(maintain + delta);
  const floored = wanted < KCAL_FLOOR;
  const kcal = floored ? KCAL_FLOOR : wanted;

  // Proteina primero (1,6 g/kg), grasa al 25% de la energia, resto carbohidratos.
  const proteinG = Math.round(p.weightKg * 1.6);
  const fatG = Math.round((kcal * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((kcal - proteinG * 4 - fatG * 9) / 4));

  const goal: Goal = { type, kcalTarget: kcal, proteinG, carbsG, fatG };
  return { goal, floored, maintain: Math.round(maintain) };
}

/** El margen honesto.
 *  La incertidumbre nace de lo que has REGISTRADO, no de lo que te queda:
 *  con el dia vacio sabes exactamente cuanto te queda, y cada alimento que
 *  anotas suma error. Por eso la franja se abre segun comes. */
export function remainingRange(target: number, eaten: number) {
  const left = target - eaten;
  const margin = Math.round(eaten * 0.1);
  // Por debajo de 25 kcal la franja es ruido: mas honesto dar la cifra.
  const exact = margin < 25;
  return {
    low: Math.round(left - margin),
    high: Math.round(left + margin),
    left: Math.round(left),
    exact,
  };
}

export function kcalOf(food: Food, grams: number): number {
  return Math.round((food.per100g.kcal * grams) / 100);
}

/** Las kcal de una racion de receta, escaladas a los gramos registrados. */
export function kcalOfRecipe(recipe: Recipe, grams: number): number {
  const porGramo = recipe.perServing.kcal / Math.max(1, recipe.gramsPerServing);
  return Math.round(porGramo * grams);
}
