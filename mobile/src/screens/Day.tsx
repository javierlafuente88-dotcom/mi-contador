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
import { kcalOf, remainingRange } from "../data/store";
import type { Food, Goal, LogEntry, MealSlot } from "../data/types";

/** S04 — el diario del dia.
 *  La cuenta, no el marcador: una lista de platos que suma, con el total
 *  abajo. Sin anillo, sin barra, sin regano. */

export function Day({
  dateLabel,
  goal,
  slots,
  entries,
  foodById,
  onAdd,
  onRemove,
}: {
  dateLabel: string;
  goal: Goal;
  slots: MealSlot[];
  entries: LogEntry[];
  foodById: (id: string) => Food | undefined;
  onAdd: (slotId: string) => void;
  onRemove: (entryId: string) => void;
}) {
  const eaten = entries.reduce((sum, e) => {
    const f = foodById(e.foodId);
    return sum + (f ? kcalOf(f, e.grams) : 0);
  }, 0);

  // Entradas que apuntan a un alimento que ya no esta en la base: pasa si la
  // base cambia bajo los pies del usuario. NUNCA se descartan en silencio.
  const huerfanas = entries.filter((e) => !foodById(e.foodId)).length;

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
      <Text style={s.date}>{dateLabel}</Text>

      {slots.map((slot) => {
        const mine = entries.filter((e) => e.mealSlotId === slot.id);
        return (
          <View key={slot.id}>
            <SlotLabel>{slot.name}</SlotLabel>
            {mine.length === 0 ? (
              <Empty
                text="Aún no has anotado nada aquí."
                action={
                  <Button
                    label="Añadir"
                    variant="secondary"
                    onPress={() => onAdd(slot.id)}
                  />
                }
              />
            ) : (
              <>
                {mine.map((e) => {
                  const f = foodById(e.foodId);
                  return (
                    <MenuLine
                      key={e.id}
                      name={f ? f.name : "Alimento que ya no está en la base"}
                      value={f ? `${kcalOf(f, e.grams)} kcal` : "sin datos"}
                      accessibilityHint="Mantén pulsado para quitarlo"
                      onLongPress={() => onRemove(e.id)}
                    />
                  );
                })}
                <View style={{ marginTop: space[2], alignItems: "flex-start" }}>
                  <Button
                    label="Añadir"
                    variant="ghost"
                    onPress={() => onAdd(slot.id)}
                  />
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

      <View style={{ height: space[7] }} />
    </Screen>
  );
}

const s = StyleSheet.create({
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
  _unused: { minHeight: layout.rowMinHeight },
});
