import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Chip,
  Divider,
  Empty,
  Field,
  MenuLine,
  Screen,
  Title,
} from "../design/primitives";
import { color, space, tabular, type } from "../design/tokens";
import { store } from "../data";
import type { Food, Recipe } from "../data/types";

/** S12 — Crear una receta propia.
 *
 *  Los macros se CALCULAN sumando los ingredientes, en vivo, mientras los
 *  añades. No se escriben a mano, igual que en el catálogo.
 *
 *  Y se puede borrar después, que es justo lo que la original no deja:
 *  «al crear tú una receta ya no sale la opción de borrar y si tienes un
 *  error se van acumulando recetas que no sirven».
 */

const ETIQUETAS: { id: string; label: string }[] = [
  { id: "desayuno", label: "Desayuno" },
  { id: "comida", label: "Comida" },
  { id: "cena", label: "Cena" },
  { id: "merienda", label: "Merienda" },
  { id: "vegetariana", label: "Vegetariana" },
  { id: "rapida", label: "Rápida" },
];

export function CrearReceta({
  onCancel,
  onCreada,
}: {
  onCancel: () => void;
  onCreada: (r: Recipe) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [raciones, setRaciones] = useState("1");
  const [minutos, setMinutos] = useState("15");
  const [tags, setTags] = useState<string[]>([]);
  const [ingredientes, setIngredientes] = useState<{ food: Food; grams: number }[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Food[]>([]);
  const [gramos, setGramos] = useState("100");
  const [elegido, setElegido] = useState<Food | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vivo = true;
    store.searchFoods(busqueda).then((r) => vivo && setResultados(r.slice(0, 8)));
    return () => {
      vivo = false;
    };
  }, [busqueda]);

  const nRaciones = Math.max(1, parseInt(raciones, 10) || 1);

  /** Lo mismo que hace el generador del catálogo, pero en vivo. */
  const totales = useMemo(() => {
    const t = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
    for (const i of ingredientes) {
      const k = i.grams / 100;
      t.kcal += i.food.per100g.kcal * k;
      t.protein_g += (i.food.per100g.protein_g ?? 0) * k;
      t.carbs_g += (i.food.per100g.carbs_g ?? 0) * k;
      t.fat_g += (i.food.per100g.fat_g ?? 0) * k;
    }
    return t;
  }, [ingredientes]);

  const listo = nombre.trim().length >= 2 && ingredientes.length > 0 && !guardando;

  async function guardar() {
    if (!listo) return;
    setGuardando(true);
    try {
      const r = await store.createRecipe({
        name: nombre,
        servings: nRaciones,
        prepMinutes: parseInt(minutos, 10) || 0,
        tags,
        ingredients: ingredientes.map((i) => ({ foodId: i.food.id, grams: i.grams })),
      });
      onCreada(r);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Screen>
      <Title>Crear una receta</Title>
      <Body muted style={type.sm}>
        Añade ingredientes y las calorías se calculan solas. Podrás borrarla cuando
        quieras.
      </Body>

      <View style={{ height: space[5] }} />

      <Field label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Mi ensalada" />
      <Field label="Raciones" value={raciones} onChangeText={setRaciones} keyboardType="numeric" />
      <Field label="Minutos de preparación" value={minutos} onChangeText={setMinutos} keyboardType="numeric" />

      <Body muted style={type.sm}>Etiquetas</Body>
      <View style={s.chips}>
        {ETIQUETAS.map((t) => (
          <Chip
            key={t.id}
            label={t.label}
            selected={tags.includes(t.id)}
            onPress={() =>
              setTags((p) => (p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id]))
            }
          />
        ))}
      </View>

      <Divider />

      <Text style={s.seccion}>Ingredientes</Text>
      {ingredientes.length === 0 ? (
        <Body muted style={type.sm}>Todavía no has añadido ninguno.</Body>
      ) : (
        ingredientes.map((i, idx) => (
          <MenuLine
            key={`${i.food.id}:${idx}`}
            name={i.food.name}
            value={`${i.grams} g`}
            accessibilityHint="Mantén pulsado para quitarlo"
            onLongPress={() => setIngredientes((p) => p.filter((_, k) => k !== idx))}
          />
        ))
      )}

      {ingredientes.length > 0 && (
        <View style={s.totales}>
          <Text style={s.totalLabel}>Por ración</Text>
          <Text style={s.totalValor}>
            {Math.round(totales.kcal / nRaciones)} kcal
          </Text>
        </View>
      )}

      <Divider />

      {elegido ? (
        <>
          <Body>{elegido.name}</Body>
          <Field label="Cantidad en gramos" value={gramos} onChangeText={setGramos} keyboardType="decimal-pad" autoFocus />
          <Button
            label="Añadir a la receta"
            disabled={!(parseFloat(gramos.replace(",", ".")) > 0)}
            onPress={() => {
              const g = parseFloat(gramos.replace(",", "."));
              if (!(g > 0)) return;
              setIngredientes((p) => [...p, { food: elegido, grams: g }]);
              setElegido(null);
              setBusqueda("");
              setGramos("100");
            }}
          />
          <View style={{ height: space[2] }} />
          <Button label="Elegir otro" variant="ghost" onPress={() => setElegido(null)} />
        </>
      ) : (
        <>
          <Field label="Buscar ingrediente" value={busqueda} onChangeText={setBusqueda} placeholder="lentejas, huevo…" />
          {resultados.length === 0 ? (
            <Empty text="Ese alimento no está. Créalo primero desde el diario." />
          ) : (
            resultados.map((f) => (
              <MenuLine
                key={f.id}
                name={f.name}
                value={`${f.per100g.kcal} kcal/100 g`}
                accessibilityHint="Elige este ingrediente"
                onPress={() => setElegido(f)}
              />
            ))
          )}
        </>
      )}

      <View style={{ height: space[6] }} />
      <Button label={guardando ? "Guardando…" : "Guardar receta"} disabled={!listo} onPress={guardar} />
      <View style={{ height: space[3] }} />
      <Button label="Cancelar" variant="ghost" onPress={onCancel} />
      <View style={{ height: space[6] }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[2] },
  seccion: { ...type.xs, color: color.muted, letterSpacing: 0.6, marginBottom: space[1] },
  totales: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: space[3],
  },
  totalLabel: { ...type.sm, color: color.muted },
  totalValor: { ...type.lg, color: color.text, ...tabular },
});
