import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabaseClient";
import type { Food, Goal, LogEntry, MealSlot, Profile, Store } from "./types";

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
