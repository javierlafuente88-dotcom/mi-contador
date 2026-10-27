import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { Body, Screen } from "./src/design/primitives";
import { color } from "./src/design/tokens";
import { allFoods, allRecipes, buildGoal, kcalOf, kcalOfRecipe, remainingRange, store, todayLocal, usingSupabase } from "./src/data";
import { getSupabase } from "./src/data/supabaseClient";
import type { Food, Goal, GoalType, LogEntry, MealSlot, Profile, Recipe } from "./src/data/types";
import { AddFood } from "./src/screens/AddFood";
import { Catalogo } from "./src/screens/Catalogo";
import { Auth } from "./src/screens/Auth";
import { Day } from "./src/screens/Day";
import { Onboarding } from "./src/screens/Onboarding";
import { Progreso } from "./src/screens/Progreso";

/** Hito 1: la rebanada vertical.
 *  Navegacion por estado, a proposito: el objetivo de este hito es demostrar
 *  que el bucle central funciona, no montar un enrutador. */

type Route =
  | { name: "loading" }
  | { name: "auth" }
  | { name: "onboarding" }
  | { name: "day" }
  | { name: "add"; slotId: string }
  | { name: "carta"; slotId: string }
  | { name: "progreso" };

const foodById = (id: string): Food | undefined => allFoods.find((f) => f.id === id);
const recipeById = (id: string): Recipe | undefined => allRecipes.find((r: Recipe) => r.id === id);

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "loading" });
  const [goal, setGoal] = useState<Goal | null>(null);
  const [slots, setSlots] = useState<MealSlot[]>([]);
  const [entries, setEntries] = useState<LogEntry[]>([]);

  // El dia es estado, no un calculo suelto. Si fuera un calculo, solo se
  // actualizaria cuando algo provocase un redibujado: con la app abierta a
  // medianoche el diario se quedaba en el dia anterior.
  const [today, setToday] = useState(todayLocal);

  useEffect(() => {
    const t = setInterval(() => {
      const ahora = todayLocal();
      setToday((anterior) => (anterior === ahora ? anterior : ahora));
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const refresh = useCallback(async () => {
    setEntries(await store.listEntries(today));
  }, [today]);

  const bootstrap = useCallback(async () => {
    // Con Supabase hace falta sesion antes de poder leer nada: RLS lo exige.
    if (usingSupabase) {
      const sb = getSupabase();
      const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } };
      if (!data.session) {
        setRoute({ name: "auth" });
        return;
      }
    }
    const [g, sl] = await Promise.all([store.getGoal(), store.listMealSlots()]);
    setSlots(sl);
    await refresh();
    setGoal(g);
    setRoute(g ? { name: "day" } : { name: "onboarding" });
  }, [refresh]);

  useEffect(() => {
    bootstrap().catch(() => setRoute({ name: "auth" }));
  }, [bootstrap]);

  async function finishOnboarding(p: Profile, type: GoalType) {
    const { goal: g } = buildGoal(p, type);
    await store.saveProfile(p);
    await store.saveGoal(g);
    setGoal(g);
    setRoute({ name: "day" });
  }

  async function confirmAddRecipe(slotId: string, receta: Recipe, grams: number) {
    await store.addEntry({
      localDate: today,
      mealSlotId: slotId,
      recipeId: receta.id,
      grams,
      method: "plan",
      clientToken: `${today}:${slotId}:${receta.id}:${grams}:${Date.now()}`,
    });
    await refresh();
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

  // Se deriva de `today`, no de un Date nuevo, para que etiqueta y datos
  // no puedan discrepar nunca.
  const [y, m, d] = today.split("-").map(Number);
  const dateLabel = new Date(y, m - 1, d).toLocaleDateString("es-ES", {
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

        {route.name === "auth" && (
          <Auth onSignedIn={() => { setRoute({ name: "loading" }); bootstrap(); }} />
        )}

        {route.name === "onboarding" && <Onboarding onDone={finishOnboarding} />}

        {route.name === "day" && goal && (
          <Day
            dateLabel={dateLabel[0].toUpperCase() + dateLabel.slice(1)}
            goal={goal}
            slots={slots}
            entries={entries}
            foodById={foodById}
            recipeById={recipeById}
            onAdd={(slotId) => setRoute({ name: "add", slotId })}
            onCarta={(slotId) => setRoute({ name: "carta", slotId })}
            onProgreso={() => setRoute({ name: "progreso" })}
            onRemove={remove}
          />
        )}

        {route.name === "progreso" && (
          <Progreso goal={goal} onVolver={() => setRoute({ name: "day" })} />
        )}

        {route.name === "carta" && goal && (
          <Catalogo
            slotName={slots.find((x) => x.id === route.slotId)?.name ?? "la comida"}
            restanKcal={(() => {
              const comidas = entries.reduce((sum, e) => {
                if (e.recipeId) {
                  const r = recipeById(e.recipeId);
                  return sum + (r ? kcalOfRecipe(r, e.grams) : 0);
                }
                const f = e.foodId ? foodById(e.foodId) : undefined;
                return sum + (f ? kcalOf(f, e.grams) : 0);
              }, 0);
              return Math.max(0, remainingRange(goal.kcalTarget, comidas).left);
            })()}
            onCancel={() => setRoute({ name: "day" })}
            onElegir={(receta, grams) => confirmAddRecipe(route.slotId, receta, grams)}
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
