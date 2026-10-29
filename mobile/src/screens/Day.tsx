import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Empty,
  MenuLine,
  Screen,
  SlotLabel,
} from "../design/primitives";
import { color, layout, space, tabular, type } from "../design/tokens";
import {
  MACROS,
  kcalOf,
  kcalOfRecipe,
  macrosOf,
  macrosOfRecipe,
  remainingRange,
  sumarMacros,
} from "../data";
import type { MacroId, Macros } from "../data/store";
import type { Food, Goal, LogEntry, MealSlot, Recipe } from "../data/types";

const NOMBRE: Record<MacroId, string> = {
  protein: "Proteína",
  carbs: "Carbohidratos",
  fat: "Grasa",
  fiber: "Fibra",
};

/** Nada que no sepamos. La fibra no sale aqui porque el objetivo que calcula
 *  el alta no la incluye, y poner una meta que el usuario nunca acepto seria
 *  inventarsela. */
/** «grasa y fibra» · «proteína, grasa y fibra» */
function unir(ks: MacroId[]): string {
  const n = ks.map((k) => NOMBRE[k].toLowerCase());
  if (n.length <= 1) return n.join("");
  return `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}`;
}

const OBJETIVO: Record<MacroId, (g: Goal) => number | null> = {
  protein: (g) => g.proteinG,
  carbs: (g) => g.carbsG,
  fat: (g) => g.fatG,
  fiber: () => null,
};

/** S04 — el diario del dia.
 *  La cuenta, no el marcador: una lista de platos que suma, con el total
 *  abajo. Sin anillo, sin barra, sin regano. */

export function Day({
  dateLabel,
  goal,
  slots,
  entries,
  foodById,
  recipeById,
  onAdd,
  onCarta,
  onProgreso,
  onComidas,
  onObjetivo,
  onRemove,
}: {
  dateLabel: string;
  goal: Goal;
  slots: MealSlot[];
  entries: LogEntry[];
  foodById: (id: string) => Food | undefined;
  recipeById: (id: string) => Recipe | undefined;
  onAdd: (slotId: string) => void;
  onCarta: (slotId: string) => void;
  onProgreso: () => void;
  onComidas: () => void;
  onObjetivo: () => void;
  onRemove: (entryId: string) => void;
}) {
  /** Una entrada puede ser un alimento suelto o una receta de la carta. */
  function kcalDe(e: LogEntry): number | null {
    if (e.recipeId) {
      const r = recipeById(e.recipeId);
      return r ? kcalOfRecipe(r, e.grams) : null;
    }
    if (e.foodId) {
      const f = foodById(e.foodId);
      return f ? kcalOf(f, e.grams) : null;
    }
    return null;
  }

  /** null cuando la entrada apunta a algo que ya no esta: entonces no suma
   *  ni en kcal ni en macros, y el aviso de huerfanas ya lo cuenta. */
  function macrosDe(e: LogEntry): Macros | null {
    if (e.recipeId) {
      const r = recipeById(e.recipeId);
      return r ? macrosOfRecipe(r, e.grams) : null;
    }
    if (e.foodId) {
      const f = foodById(e.foodId);
      return f ? macrosOf(f, e.grams) : null;
    }
    return null;
  }

  function nombreDe(e: LogEntry): string | null {
    if (e.recipeId) return recipeById(e.recipeId)?.name ?? null;
    if (e.foodId) return foodById(e.foodId)?.name ?? null;
    return null;
  }

  const eaten = entries.reduce((sum, e) => sum + (kcalDe(e) ?? 0), 0);

  // Entradas que apuntan a un alimento que ya no esta en la base: pasa si la
  // base cambia bajo los pies del usuario. NUNCA se descartan en silencio.
  const huerfanas = entries.filter((e) => kcalDe(e) === null).length;

  const { total, sinDato, cuantos } = sumarMacros(
    entries.map(macrosDe).filter((m): m is Macros => m !== null),
  );

  // Los que faltan en ALGUNOS registros, no en todos: ese total existe pero se
  // queda corto, y hay que decirlo, igual que la franja de kcal.
  //
  // Los que no constan en NINGUNO se quedan fuera a proposito: esos ya dicen
  // "sin datos" en su fila, y anadir "ese total se queda corto" seria hablar de
  // un total que no hay. Se vio mirando la pantalla, no en las pruebas.
  const cojos = MACROS.filter((k) => sinDato[k] > 0 && sinDato[k] < cuantos);

  /** "23 de 131 g", no "23 / 131 g": la barra el lector de pantalla la lee
   *  "barra". Ponerla y esconder debajo un texto distinto para el lector deja
   *  dos frases que mantener, y una se queda vieja. Una sola, que sirva a los dos.
   *
   *  "sin datos" solo cuando no sabemos de NINGUNO. Si faltan algunos, se da el
   *  total y el aviso de abajo dice que va corto: una cifra corta con su aviso
   *  dice mas que un guion. */
  function valorDe(k: MacroId): string {
    if (cuantos > 0 && sinDato[k] === cuantos) return "sin datos";
    const meta = OBJETIVO[k](goal);
    return meta === null ? `${total[k]} g` : `${total[k]} de ${meta} g`;
  }

  const { low, high, left, exact } = remainingRange(goal.kcalTarget, eaten);
  const over = high < 0;

  const remainingText = over
    ? exact
      ? `Te has pasado ${Math.abs(left)} kcal`
      : `Te has pasado entre ${Math.abs(high)} y ${Math.abs(low)} kcal`
    : exact
      ? `Te quedan ${Math.max(0, left)} kcal`
      : `Te quedan entre ${Math.max(0, low)} y ${Math.max(0, high)} kcal`;

  return (
    <Screen>
      <View style={s.cabecera}>
        <Text style={s.date}>{dateLabel}</Text>
        <Button label="Progreso" variant="ghost" onPress={onProgreso} />
      </View>

      {slots.map((slot) => {
        const mine = entries.filter((e) => e.mealSlotId === slot.id);
        return (
          <View key={slot.id}>
            <SlotLabel>{slot.name}</SlotLabel>
            {mine.length === 0 ? (
              <Empty
                text="Aún no has anotado nada aquí."
                action={
                  <View style={{ flexDirection: "row", gap: space[2], flexWrap: "wrap" }}>
                    <Button
                      label="Elegir de la carta"
                      variant="secondary"
                      onPress={() => onCarta(slot.id)}
                    />
                    <Button label="Añadir" variant="ghost" onPress={() => onAdd(slot.id)} />
                  </View>
                }
              />
            ) : (
              <>
                {mine.map((e) => {
                  const nombre = nombreDe(e);
                  const kcal = kcalDe(e);
                  return (
                    <MenuLine
                      key={e.id}
                      name={nombre ?? "Ya no está en la base"}
                      value={kcal === null ? "sin datos" : `${kcal} kcal`}
                      accessibilityHint="Mantén pulsado para quitarlo"
                      onLongPress={() => onRemove(e.id)}
                    />
                  );
                })}
                <View style={{ marginTop: space[2], flexDirection: "row", gap: space[2], flexWrap: "wrap" }}>
                  <Button
                    label="Elegir de la carta"
                    variant="ghost"
                    onPress={() => onCarta(slot.id)}
                  />
                  <Button label="Añadir" variant="ghost" onPress={() => onAdd(slot.id)} />
                </View>
              </>
            )}
          </View>
        );
      })}

      <View style={s.rule} />

      <View style={s.totals} accessibilityLiveRegion="polite">
        <Text style={s.totalLabel}>Hoy</Text>
        <Text style={s.totalValue}>{eaten.toLocaleString("es-ES")}</Text>
      </View>

      <Text style={[s.left, over && { color: color.danger }]}>{remainingText}</Text>

      <View style={s.macros}>
        {MACROS.map((k) => (
          <View key={k} style={s.macro}>
            <Text style={s.macroLabel}>{NOMBRE[k]}</Text>
            <Text style={s.macroValue}>{valorDe(k)}</Text>
          </View>
        ))}
      </View>

      {cojos.length > 0 && (
        <Body muted style={{ marginTop: space[3], ...type.sm }}>
          {cojos.length === 1
            ? `Falta el dato de ${NOMBRE[cojos[0]].toLowerCase()} en ${
                sinDato[cojos[0]] === 1 ? "un registro" : `${sinDato[cojos[0]]} registros`
              }, así que ese total se queda corto.`
            : `Faltan datos de ${unir(cojos)} en algunos registros, así que esos totales se quedan cortos.`}
        </Body>
      )}

      {huerfanas > 0 && (
        <Body muted style={{ marginTop: space[3], ...type.sm, color: color.danger }}>
          {huerfanas === 1
            ? "Hay 1 registro cuyo alimento ya no está en la base, así que no suma. Mantén pulsado para quitarlo."
            : `Hay ${huerfanas} registros cuyo alimento ya no está en la base, así que no suman. Mantén pulsado para quitarlos.`}
        </Body>
      )}

      {!exact && (
        <Body muted style={{ marginTop: space[3], ...type.sm }}>
          Es una franja porque ningún método de registro acierta al gramo. Preferimos
          decirte lo que sabemos.
        </Body>
      )}

      {/* Abajo y en ghost a proposito: se toca una vez y no se vuelve. */}
      <View style={{ marginTop: space[5] }}>
        <Button label="Editar las comidas" variant="ghost" onPress={onComidas} />
        <Button label="Cambiar el objetivo" variant="ghost" onPress={onObjetivo} />
      </View>

      <View style={{ height: space[7] }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  date: { ...type.sm, color: color.muted, marginBottom: space[2] },
  rule: {
    borderTopWidth: 1,
    borderColor: color.border,
    marginTop: space[5],
    marginBottom: space[3],
  },
  totals: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  totalLabel: { ...type.sm, color: color.muted, marginBottom: 6 },
  totalValue: { ...type.total, color: color.text, ...tabular },
  left: { ...type.sm, color: color.success, marginTop: space[1], ...tabular },
  macros: { marginTop: space[4] },
  macro: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    borderBottomWidth: 1,
    borderColor: color.border,
    paddingVertical: space[2],
  },
  macroLabel: { ...type.sm, color: color.muted },
  macroValue: { ...type.base, color: color.text, ...tabular },
  _unused: { minHeight: layout.rowMinHeight },
});
