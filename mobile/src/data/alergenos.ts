import raw from "./foods.json";
import type { Alergeno } from "./types";

/** Los 14 alérgenos de declaración obligatoria en la UE
 *  (Reglamento 1169/2011) y lo que sabemos hacer con cada uno.
 *
 *  Vive aquí y no en una pantalla porque lo usan tres: la carta, la búsqueda
 *  de alimentos y la pantalla de declararlos. Tres copias de esta lista serían
 *  tres sitios donde se puede quedar vieja, y una lista de alérgenos vieja es
 *  un aviso que no salta.
 */

export const ETIQUETAS: Record<Alergeno, string> = {
  gluten: "Gluten",
  huevo: "Huevo",
  leche: "Leche",
  pescado: "Pescado",
  "frutos-secos": "Frutos secos",
  crustaceos: "Crustáceos",
  moluscos: "Moluscos",
  cacahuetes: "Cacahuetes",
  soja: "Soja",
  sesamo: "Sésamo",
  apio: "Apio",
  mostaza: "Mostaza",
  sulfitos: "Sulfitos",
  altramuces: "Altramuces",
};

/** El orden de la pantalla: primero los que hoy aparecen en algún alimento. */
const ORDEN: Alergeno[] = [
  "gluten", "huevo", "leche", "pescado", "frutos-secos", "crustaceos",
  "moluscos", "cacahuetes", "soja", "sesamo", "apio", "mostaza",
  "sulfitos", "altramuces",
];

/** Cuáles sabemos detectar NO es una lista escrita a mano: se mira en la
 *  semilla. Si mañana se marca sésamo en un alimento, la pantalla deja de
 *  decir que no lo detecta sin que nadie se acuerde de tocar nada. */
const PRESENTES: Set<string> = new Set(
  (raw as { foods: { alergenos?: string[] }[] }).foods.flatMap(
    (f) => f.alergenos ?? []
  )
);

export const ALERGENOS_UE: { id: Alergeno; label: string; detectado: boolean }[] =
  ORDEN.map((id) => ({
    id,
    label: ETIQUETAS[id],
    detectado: PRESENTES.has(id),
  }));

export function nombreAlergeno(a: Alergeno | string): string {
  return (ETIQUETAS[a as Alergeno] ?? a).toLowerCase();
}

/** Los alérgenos declarados que lleva esto. Vacío = no choca, que no es lo
 *  mismo que «no lleva nada»: un alimento sin dato también da vacío. */
export function choque(
  lleva: Alergeno[] | undefined,
  mios: Alergeno[]
): Alergeno[] {
  return (lleva ?? []).filter((a) => mios.includes(a));
}

/** «pescado» · «gluten y huevo» · «leche, huevo y pescado» */
export function listar(as: Alergeno[]): string {
  const n = as.map(nombreAlergeno);
  if (n.length <= 1) return n.join("");
  return `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}`;
}
