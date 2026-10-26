export type Sex = "female" | "male" | "other";
export type Activity = "sedentary" | "light" | "moderate" | "high" | "athlete";
export type GoalType = "lose" | "maintain" | "gain" | "recomp";

export type Profile = {
  sex: Sex;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
};

export type Goal = {
  type: GoalType;
  kcalTarget: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type Food = {
  id: string;
  name: string;
  usdaFdcId?: number;
  usdaDescription?: string;
  license: "public-domain" | "odbl" | "own";
  per100g: {
    kcal: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
  };
};

export type MealSlot = { id: string; name: string; position: number };

export type LogEntry = {
  id: string;
  localDate: string; // AAAA-MM-DD en la zona del usuario, nunca UTC
  mealSlotId: string;
  foodId: string;
  grams: number;
  method: "text" | "barcode" | "photo" | "voice" | "plan" | "copy";
  clientToken: string; // idempotencia: mata el registro doble
};

/** El contrato del almacen. La version falsa de hoy y la de Supabase de manana
 *  implementan ESTO, asi que cambiarla no toca ni una pantalla. */
export interface Store {
  getProfile(): Promise<Profile | null>;
  saveProfile(p: Profile): Promise<void>;
  getGoal(): Promise<Goal | null>;
  saveGoal(g: Goal): Promise<void>;
  listMealSlots(): Promise<MealSlot[]>;
  searchFoods(query: string): Promise<Food[]>;
  getFood(id: string): Promise<Food | null>;
  listEntries(localDate: string): Promise<LogEntry[]>;
  addEntry(e: Omit<LogEntry, "id">): Promise<LogEntry>;
  removeEntry(id: string): Promise<void>;
}
