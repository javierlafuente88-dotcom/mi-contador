import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { Body, Screen } from "./src/design/primitives";
import { color } from "./src/design/tokens";
import { allFoods, buildGoal, store, todayLocal } from "./src/data/store";
import type { Food, Goal, GoalType, LogEntry, MealSlot, Profile } from "./src/data/types";
import { AddFood } from "./src/screens/AddFood";
import { Day } from "./src/screens/Day";
import { Onboarding } from "./src/screens/Onboarding";

/** Hito 1: la rebanada vertical.
 *  Navegacion por estado, a proposito: el objetivo de este hito es demostrar
 *  que el bucle central funciona, no montar un enrutador. */

type Route = { name: "loading" } | { name: "onboarding" } | { name: "day" } | { name: "add"; slotId: string };

const foodById = (id: string): Food | undefined => allFoods.find((f) => f.id === id);

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "loading" });
  const [goal, setGoal] = useState<Goal | null>(null);
  const [slots, setSlots] = useState<MealSlot[]>([]);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const today = todayLocal();

  const refresh = useCallback(async () => {
    setEntries(await store.listEntries(today));
  }, [today]);

  useEffect(() => {
    (async () => {
      const [g, sl] = await Promise.all([store.getGoal(), store.listMealSlots()]);
      setSlots(sl);
      await refresh();
      setGoal(g);
      setRoute(g ? { name: "day" } : { name: "onboarding" });
    })();
  }, [refresh]);

  async function finishOnboarding(p: Profile, type: GoalType) {
    const { goal: g } = buildGoal(p, type);
    await store.saveProfile(p);
    await store.saveGoal(g);
    setGoal(g);
    setRoute({ name: "day" });
  }

  async function confirmAdd(slotId: string, food: Food, grams: number) {
    await store.addEntry({
      localDate: today,
      mealSlotId: slotId,
      foodId: food.id,
      grams,
      method: "text",
      // Token de idempotencia: dos toques seguidos no crean dos registros.
      clientToken: `${today}:${slotId}:${food.id}:${grams}:${Date.now()}`,
    });
    await refresh();
    setRoute({ name: "day" });
  }

  async function remove(entryId: string) {
    await store.removeEntry(entryId);
    await refresh();
  }

  const dateLabel = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <View style={s.body}>
        {route.name === "loading" && (
          <Screen>
            <Body muted>Cargando…</Body>
          </Screen>
        )}

        {route.name === "onboarding" && <Onboarding onDone={finishOnboarding} />}

        {route.name === "day" && goal && (
          <Day
            dateLabel={dateLabel[0].toUpperCase() + dateLabel.slice(1)}
            goal={goal}
            slots={slots}
            entries={entries}
            foodById={foodById}
            onAdd={(slotId) => setRoute({ name: "add", slotId })}
            onRemove={remove}
          />
        )}

        {route.name === "add" && (
          <AddFood
            slotName={slots.find((x) => x.id === route.slotId)?.name ?? "la comida"}
            onCancel={() => setRoute({ name: "day" })}
            onConfirm={(food, grams) => confirmAdd(route.slotId, food, grams)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  body: { flex: 1 },
});
