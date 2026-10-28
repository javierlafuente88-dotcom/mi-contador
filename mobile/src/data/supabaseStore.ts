import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabaseClient";
import type { Food, Goal, LogEntry, MealSlot, Profile, Recipe, Store, WeightEntry } from "./types";

/** El mismo contrato que el almacen falso del hito 1.
 *  Ninguna pantalla sabe cual de los dos esta usando. */

function db(): SupabaseClient {
  const c = getSupabase();
  if (!c) throw new Error("Supabase no esta configurado");
  return c;
}

async function uid(): Promise<string> {
  const { data, error } = await db().auth.getUser();
  if (error || !data.user) throw new Error("sin sesion");
  return data.user.id;
}

type FoodRow = {
  id: string;
  name: string;
  source: string;
  source_ref: string | null;
  license: Food["license"];
  kcal_100g: number;
  protein_100g: number | null;
  carbs_100g: number | null;
  fat_100g: number | null;
  fiber_100g: number | null;
};

function toFood(r: FoodRow): Food {
  return {
    id: r.id,
    name: r.name,
    usdaFdcId: r.source_ref ? Number(r.source_ref) : undefined,
    license: r.license,
    per100g: {
      kcal: r.kcal_100g,
      protein_g: r.protein_100g ?? undefined,
      carbs_g: r.carbs_100g ?? undefined,
      fat_g: r.fat_100g ?? undefined,
      fiber_g: r.fiber_100g ?? undefined,
    },
  };
}

type FoodOfRecipe = {
  name: string;
  kcal_100g: number;
  protein_100g: number | null;
  carbs_100g: number | null;
  fat_100g: number | null;
  fiber_100g: number | null;
};

/** PostgREST devuelve la relación anidada como objeto o como lista según
 *  cómo infiera la cardinalidad. Se acepta cualquiera de las dos. */
type RecipeRow = {
  id: string;
  name: string;
  servings: number;
  tags: string[] | null;
  prep_minutes: number | null;
  recipe_ingredients: {
    grams: number;
    foods: FoodOfRecipe | FoodOfRecipe[] | null;
  }[];
};

function unoSolo(f: FoodOfRecipe | FoodOfRecipe[] | null): FoodOfRecipe | null {
  if (!f) return null;
  return Array.isArray(f) ? (f[0] ?? null) : f;
}

/** Los totales se CALCULAN sumando los ingredientes, igual que en el
 *  generador. Nunca se guardan en la fila de la receta: un total guardado
 *  se queda viejo en cuanto se corrige un ingrediente. */
function toRecipe(r: RecipeRow): Recipe {
  const total = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  let gramos = 0;
  const ingredientes: Recipe["ingredients"] = [];

  for (const ing of r.recipe_ingredients ?? []) {
    const f = unoSolo(ing.foods);
    if (!f) continue;
    const k = Number(ing.grams) / 100;
    total.kcal += Number(f.kcal_100g) * k;
    total.protein_g += Number(f.protein_100g ?? 0) * k;
    total.carbs_g += Number(f.carbs_100g ?? 0) * k;
    total.fat_g += Number(f.fat_100g ?? 0) * k;
    total.fiber_g += Number(f.fiber_100g ?? 0) * k;
    gramos += Number(ing.grams);
    ingredientes.push({ name: f.name, grams: Number(ing.grams) });
  }

  const raciones = Math.max(1, Number(r.servings) || 1);
  const redondear = (v: number) => Math.round((v / raciones) * 10) / 10;

  return {
    id: r.id,
    name: r.name,
    tags: r.tags ?? [],
    prepMinutes: Number(r.prep_minutes ?? 0),
    servings: raciones,
    gramsPerServing: Math.round(gramos / raciones),
    perServing: {
      kcal: redondear(total.kcal),
      protein_g: redondear(total.protein_g),
      carbs_g: redondear(total.carbs_g),
      fat_g: redondear(total.fat_g),
      fiber_g: redondear(total.fiber_g),
    },
    ingredients: ingredientes,
  };
}

export const supabaseStore: Store = {
  async getProfile() {
    const { data, error } = await db()
      .from("profiles")
      .select("sex, birth_date, height_cm, activity_level")
      .eq("id", await uid())
      .maybeSingle();
    if (error) throw error;
    if (!data || !data.sex || !data.birth_date) return null;
    return {
      sex: data.sex,
      birthYear: new Date(data.birth_date).getFullYear(),
      heightCm: Number(data.height_cm),
      weightKg: 0, // el peso vive en weight_entries, no en el perfil
      activity: data.activity_level,
    } as Profile;
  },

  async saveProfile(p) {
    const id = await uid();
    const { error } = await db()
      .from("profiles")
      .update({
        sex: p.sex,
        birth_date: `${p.birthYear}-01-01`,
        height_cm: p.heightCm,
        activity_level: p.activity,
      })
      .eq("id", id);
    if (error) throw error;

    // El peso es un dato con fecha, no un campo del perfil.
    const today = new Date().toISOString().slice(0, 10);
    const { error: e2 } = await db()
      .from("weight_entries")
      .upsert(
        { user_id: id, local_date: today, kg: p.weightKg },
        { onConflict: "user_id,local_date" }
      );
    if (e2) throw e2;
  },

  async getGoal() {
    const { data, error } = await db()
      .from("goals")
      .select("type, kcal_target, protein_g, carbs_g, fat_g")
      .eq("user_id", await uid())
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      type: data.type,
      kcalTarget: data.kcal_target,
      proteinG: data.protein_g,
      carbsG: data.carbs_g,
      fatG: data.fat_g,
    } as Goal;
  },

  async saveGoal(g) {
    const id = await uid();
    // Un solo objetivo activo: lo garantiza el indice unico parcial.
    const { error: e1 } = await db()
      .from("goals")
      .update({ active: false })
      .eq("user_id", id)
      .eq("active", true);
    if (e1) throw e1;

    const { error } = await db().from("goals").insert({
      user_id: id,
      type: g.type,
      kcal_target: g.kcalTarget,
      protein_g: g.proteinG,
      carbs_g: g.carbsG,
      fat_g: g.fatG,
      active: true,
    });
    // El suelo de 1200 kcal es una restriccion de la base: si el cliente
    // intenta saltarselo, Postgres lo rechaza y lo decimos en claro.
    if (error) {
      if (error.message.includes("kcal_floor")) {
        throw new Error("Ese objetivo está por debajo de lo que recomendamos.");
      }
      throw error;
    }
  },

  async listMealSlots() {
    const { data, error } = await db()
      .from("meal_slots")
      .select("id, name, position")
      .eq("user_id", await uid())
      .order("position");
    if (error) throw error;
    return (data ?? []) as MealSlot[];
  },

  async searchFoods(query) {
    // Funcion del servidor: busca sin acentos y ordena por relevancia.
    const { data, error } = await db().rpc("search_foods", {
      q: query.trim(),
      pais: null,
      lim: 50,
    });
    if (error) throw error;
    return ((data ?? []) as FoodRow[]).map(toFood);
  },

  async getFood(id) {
    const { data, error } = await db()
      .from("foods")
      .select("id, name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toFood(data as FoodRow) : null;
  },

  async listRecipes(filtros) {
    // owner_id null = receta del catalogo. RLS ya deja ver esas y las propias.
    let q = db()
      .from("recipes")
      .select(
        "id, name, servings, tags, prep_minutes, recipe_ingredients(grams, foods(name, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g))"
      )
      .is("deleted_at", null)
      .order("name");
    if (filtros?.maxMinutos) q = q.lte("prep_minutes", filtros.maxMinutos);
    if (filtros?.etiqueta) q = q.contains("tags", [filtros.etiqueta]);

    const { data, error } = await q;
    if (error) throw error;
    const recetas = (data ?? []).map(toRecipe);
    return filtros?.maxKcal
      ? recetas.filter((r) => r.perServing.kcal <= filtros.maxKcal!)
      : recetas;
  },

  async getRecipe(id) {
    const { data, error } = await db()
      .from("recipes")
      .select(
        "id, name, servings, tags, prep_minutes, recipe_ingredients(grams, foods(name, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g))"
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toRecipe(data as RecipeRow) : null;
  },

  async listEntries(localDate) {
    const { data, error } = await db()
      .from("log_entries")
      .select("id, local_date, meal_slot_id, food_id, grams, method, client_token")
      .eq("user_id", await uid())
      .eq("local_date", localDate)
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      localDate: r.local_date,
      mealSlotId: r.meal_slot_id,
      foodId: r.food_id,
      grams: Number(r.grams),
      method: r.method,
      clientToken: r.client_token,
    })) as LogEntry[];
  },

  async addEntry(e) {
    const { data, error } = await db()
      .from("log_entries")
      .upsert(
        {
          user_id: await uid(),
          local_date: e.localDate,
          meal_slot_id: e.mealSlotId,
          food_id: e.foodId,
          grams: e.grams,
          method: e.method,
          client_token: e.clientToken,
        },
        // Idempotencia de verdad: el indice unico (user_id, client_token)
        // impide el registro doble aunque el movil reintente.
        { onConflict: "user_id,client_token", ignoreDuplicates: false }
      )
      .select("id, local_date, meal_slot_id, food_id, grams, method, client_token")
      .single();
    if (error) throw error;
    return {
      id: data.id,
      localDate: data.local_date,
      mealSlotId: data.meal_slot_id,
      foodId: data.food_id,
      grams: Number(data.grams),
      method: data.method,
      clientToken: data.client_token,
    } as LogEntry;
  },

  async createFood(n) {
    const { data, error } = await db()
      .from("foods")
      .insert({
        name: n.name.trim(),
        source: "user",
        license: "own",
        owner_id: await uid(),
        kcal_100g: n.kcal100,
        protein_100g: n.protein100,
        carbs_100g: n.carbs100,
        fat_100g: n.fat100,
        fiber_100g: n.fiber100 ?? null,
      })
      .select("id, name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g")
      .single();
    if (error) throw error;
    return toFood(data as FoodRow);
  },

  async findByBarcode(code) {
    const limpio = code.replace(/[\s-]/g, "");
    const { data, error } = await db()
      .from("foods")
      .select("id, name, source, source_ref, license, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g")
      .eq("barcode", limpio)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? toFood(data as FoodRow) : null;
  },

  async rememberFood(f, barcode) {
    // Se guarda como alimento del usuario, con su licencia de origen intacta.
    const { error } = await db().from("foods").insert({
      name: f.name,
      barcode: barcode.replace(/[\s-]/g, ""),
      source: "user",
      license: f.license,
      owner_id: await uid(),
      kcal_100g: f.per100g.kcal,
      protein_100g: f.per100g.protein_g ?? 0,
      carbs_100g: f.per100g.carbs_g ?? 0,
      fat_100g: f.per100g.fat_g ?? 0,
      fiber_100g: f.per100g.fiber_g ?? null,
    });
    if (error && !String(error.message).includes("duplicate")) throw error;
  },

  async createRecipe(n) {
    const owner = await uid();
    const { data, error } = await db()
      .from("recipes")
      .insert({
        owner_id: owner,
        name: n.name.trim(),
        servings: n.servings,
        tags: n.tags,
        prep_minutes: n.prepMinutes,
      })
      .select("id")
      .single();
    if (error) throw error;

    const filas = n.ingredients.map((i, pos) => ({
      recipe_id: data.id,
      food_id: i.foodId,
      grams: i.grams,
      position: pos,
    }));
    const { error: e2 } = await db().from("recipe_ingredients").insert(filas);
    if (e2) throw e2;

    const creada = await supabaseStore.getRecipe(data.id);
    if (!creada) throw new Error("no se pudo leer la receta recién creada");
    return { ...creada, mine: true };
  },

  async deleteRecipe(id) {
    // Borrado suave: la receta desaparece, pero los registros que la usaron
    // siguen cuadrando. RLS impide borrar las que no son tuyas.
    const { error } = await db()
      .from("recipes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("owner_id", await uid());
    if (error) throw error;
  },

  async listWeights() {
    const { data, error } = await db()
      .from("weight_entries")
      .select("id, local_date, kg")
      .eq("user_id", await uid())
      .order("local_date");
    if (error) throw error;
    return (data ?? []).map((w) => ({
      id: w.id,
      localDate: w.local_date,
      kg: Number(w.kg),
    })) as WeightEntry[];
  },

  async saveWeight(localDate, kg) {
    // Un peso por dia lo garantiza el indice unico (user_id, local_date).
    const { error } = await db()
      .from("weight_entries")
      .upsert(
        { user_id: await uid(), local_date: localDate, kg },
        { onConflict: "user_id,local_date" }
      );
    if (error) throw error;
  },

  async removeWeight(localDate) {
    const { error } = await db()
      .from("weight_entries")
      .delete()
      .eq("user_id", await uid())
      .eq("local_date", localDate);
    if (error) throw error;
  },

  async removeEntry(id) {
    const { error } = await db().from("log_entries").delete().eq("id", id);
    if (error) throw error;
  },
};

/** Borrado real de la cuenta. Una llamada, sin laberinto. */
export async function deleteMyAccount(): Promise<void> {
  const { error } = await db().rpc("delete_my_account");
  if (error) throw error;
  await db().auth.signOut();
}

export async function exportMyData(): Promise<unknown> {
  const { data, error } = await db().rpc("export_my_data");
  if (error) throw error;
  return data;
}
