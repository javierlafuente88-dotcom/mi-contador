import { store as fakeStore } from "./store";
import { isConfigured } from "./supabaseClient";
import { supabaseStore } from "./supabaseStore";
import type { Store } from "./types";

/** Un solo sitio decide que almacen se usa. Las pantallas no lo saben. */

const forced = process.env.EXPO_PUBLIC_DATA_SOURCE;

export const usingSupabase: boolean =
  forced === "supabase" || (forced !== "fake" && isConfigured());

export const store: Store = usingSupabase ? supabaseStore : fakeStore;

export {
  todayLocal,
  buildGoal,
  basalKcal,
  remainingRange,
  kcalOf,
  kcalOfRecipe,
  macrosOf,
  macrosOfRecipe,
  sumarMacros,
  MACROS,
  KCAL_FLOOR,
  allFoods,
  allRecipes,
  cargarLoMio,
  buscarAlimento,
  buscarReceta,
} from "./store";
