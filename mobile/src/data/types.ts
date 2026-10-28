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

/** Codigos de la lista de 14 alergenos de declaracion obligatoria en la UE. */
export type Alergeno =
  | "gluten" | "huevo" | "leche" | "pescado" | "frutos-secos" | "soja"
  | "crustaceos" | "moluscos" | "cacahuetes" | "sesamo" | "apio"
  | "mostaza" | "sulfitos" | "altramuces";

export type Food = {
  id: string;
  name: string;
  barcode?: string;
  /** Vacio NO significa "sin alergenos": significa "no declarado". */
  allergens?: Alergeno[];
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

/** Una receta del catalogo. Nuestra, no de nadie: los valores salen de
 *  sumar sus ingredientes, que vienen de USDA. */
export type Recipe = {
  id: string;
  name: string;
  tags: string[];
  prepMinutes: number;
  servings: number;
  gramsPerServing: number;
  perServing: {
    kcal: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
  };
  ingredients: { name: string; grams: number }[];
  /** Heredados de los ingredientes. Vacio = no declarado, no "libre de". */
  allergens?: Alergeno[];
  /** true si es del usuario: entonces se puede borrar. */
  mine?: boolean;
};

export type NuevoAlimento = {
  name: string;
  kcal100: number;
  protein100: number;
  carbs100: number;
  fat100: number;
  fiber100?: number;
  /** Lo que el usuario declare que lleva. Vacio es "no declarado". */
  allergens?: Alergeno[];
};

export type NuevaReceta = {
  name: string;
  servings: number;
  prepMinutes: number;
  tags: string[];
  ingredients: { foodId: string; grams: number }[];
};

export type WeightEntry = {
  id: string;
  localDate: string; // AAAA-MM-DD en la zona del usuario
  kg: number;
};

export type LogEntry = {
  id: string;
  localDate: string; // AAAA-MM-DD en la zona del usuario, nunca UTC
  mealSlotId: string;
  /** Uno de los dos, nunca los dos: lo mismo que exige la base de datos. */
  foodId?: string;
  recipeId?: string;
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
  /** El catalogo. Sin monedas, sin limites, sin generar nada:
   *  una lista que se lee y de la que se elige. */
  listRecipes(filtros?: { etiqueta?: string; maxKcal?: number; maxMinutos?: number }): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | null>;
  listEntries(localDate: string): Promise<LogEntry[]>;
  /** Historial de peso, del mas antiguo al mas reciente. */
  listWeights(): Promise<WeightEntry[]>;
  /** Alimento propio. La base de 49 es corta: lo que no esta, lo pone el usuario. */
  createFood(f: NuevoAlimento): Promise<Food>;
  /** Busca un codigo de barras en lo que ya tenemos. null si no esta. */
  findByBarcode(code: string): Promise<Food | null>;
  /** Guarda un alimento traido de fuera para no volver a pedirlo. */
  rememberFood(f: Food, barcode: string): Promise<void>;
  /** Receta propia, y poder BORRARLA, que es justo lo que la original no deja. */
  createRecipe(r: NuevaReceta): Promise<Recipe>;
  deleteRecipe(id: string): Promise<void>;
  /** Un peso por dia: volver a guardar el mismo dia lo sustituye. */
  saveWeight(localDate: string, kg: number): Promise<void>;
  removeWeight(localDate: string): Promise<void>;
  /** Alergenos que el usuario ha declarado. */
  listMyAllergens(): Promise<Alergeno[]>;
  saveMyAllergens(a: Alergeno[]): Promise<void>;
  addEntry(e: Omit<LogEntry, "id">): Promise<LogEntry>;
  removeEntry(id: string): Promise<void>;
}
