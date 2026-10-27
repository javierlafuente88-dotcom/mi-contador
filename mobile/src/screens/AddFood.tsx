import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Divider,
  Empty,
  Field,
  MenuLine,
  Notice,
  Screen,
  Title,
} from "../design/primitives";
import { color, space, tabular, type } from "../design/tokens";
import { kcalOf, store } from "../data";
import type { Food } from "../data/types";

/** S06 buscar + S07 detalle, en una hoja.
 *  El estado sin resultados NUNCA es una pantalla vacia: es una accion.
 *  Nuestra base de alimentos es el punto debil conocido del proyecto, asi
 *  que la interfaz lo convierte en salida, no en callejon. */

export function AddFood({
  slotName,
  onCancel,
  onConfirm,
}: {
  slotName: string;
  onCancel: () => void;
  onConfirm: (food: Food, grams: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[] | null>(null);
  const [picked, setPicked] = useState<Food | null>(null);
  const [grams, setGrams] = useState("100");

  useEffect(() => {
    let alive = true;
    store.searchFoods(query).then((r) => {
      if (alive) setResults(r);
    });
    return () => {
      alive = false;
    };
  }, [query]);

  // El mismo techo que la restriccion "grams <= 10000" de la base de datos.
  // Sin esto, el registro funciona en local y revienta al sincronizar.
  const MAX_GRAMOS = 10000;

  const gramsNum = useMemo(() => {
    const raw = grams.trim();
    // Acepta aritmetica: "1200/3.5" se resuelve. Peticion literal de un
    // usuario de la app de referencia, que se cansaba de abrir la calculadora.
    if (/^[\d\s.+\-*/()]+$/.test(raw) && /[+\-*/]/.test(raw)) {
      try {
        // eslint-disable-next-line no-new-func
        const v = Function(`"use strict";return (${raw})`)();
        return typeof v === "number" && isFinite(v) && v > 0 ? v : NaN;
      } catch {
        return NaN;
      }
    }
    const v = parseFloat(raw.replace(",", "."));
    return v > 0 ? v : NaN;
  }, [grams]);

  if (picked) {
    const demasiado = !Number.isNaN(gramsNum) && gramsNum > MAX_GRAMOS;
    const ok = !Number.isNaN(gramsNum) && !demasiado;
    return (
      <Screen>
        <Title>{picked.name}</Title>
        {!!picked.usdaDescription && (
          <Body muted style={type.sm}>
            Según USDA: {picked.usdaDescription}
          </Body>
        )}

        <View style={{ height: space[5] }} />

        <Field
          label="Cantidad en gramos"
          value={grams}
          onChangeText={setGrams}
          keyboardType="decimal-pad"
          autoFocus
          error={
            ok
              ? undefined
              : demasiado
                ? `Como máximo ${MAX_GRAMOS.toLocaleString("es-ES")} g de una vez`
                : "Escribe un número mayor que cero"
          }
        />
        <Body muted style={type.sm}>
          Puedes escribir una operación: 1200/3.5 también vale.
        </Body>

        <View style={{ height: space[5] }} />

        <View style={s.macros}>
          <Macro label="Calorías" value={ok ? `${kcalOf(picked, gramsNum)} kcal` : "—"} />
          <Macro
            label="Proteína"
            value={fmt(picked.per100g.protein_g, gramsNum, ok, "g")}
          />
          <Macro
            label="Carbohidratos"
            value={fmt(picked.per100g.carbs_g, gramsNum, ok, "g")}
          />
          <Macro label="Grasa" value={fmt(picked.per100g.fat_g, gramsNum, ok, "g")} />
        </View>

        <View style={{ height: space[6] }} />

        <Button
          label={`Registrar en ${slotName}`}
          disabled={!ok}
          onPress={() => onConfirm(picked, gramsNum)}
        />
        <View style={{ height: space[3] }} />
        <Button label="Elegir otro alimento" variant="ghost" onPress={() => setPicked(null)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Añadir a {slotName}</Title>

      <Field
        label="Buscar alimento"
        value={query}
        onChangeText={setQuery}
        placeholder="lentejas, pan, yogur…"
        autoFocus
      />

      <Divider />

      {results === null ? (
        <Body muted>Buscando…</Body>
      ) : results.length === 0 ? (
        <>
          <Notice
            text={`No encontramos «${query}». Nuestra base de alimentos es pequeña todavía: son datos abiertos y hay huecos.`}
          />
          <Empty
            text="Puedes crearlo tú y quedará guardado para la próxima."
            action={<Button label="Crear este alimento" variant="secondary" onPress={() => {}} />}
          />
          <Body muted style={type.sm}>
            Crear alimentos llega en el hito 2. Hoy el botón todavía no hace nada.
          </Body>
        </>
      ) : (
        results.map((f) => (
          <MenuLine
            key={f.id}
            name={f.name}
            value={`${f.per100g.kcal} kcal/100 g`}
            accessibilityHint="Abre la cantidad"
            onPress={() => setPicked(f)}
          />
        ))
      )}

      <View style={{ height: space[6] }} />
      <Button label="Cancelar" variant="ghost" onPress={onCancel} />
      <View style={{ height: space[6] }} />
    </Screen>
  );
}

function fmt(per100: number | undefined, grams: number, ok: boolean, unit: string) {
  if (!ok || per100 === undefined) return "—";
  return `${Math.round((per100 * grams) / 100)} ${unit}`;
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.macro}>
      <Text style={s.macroLabel}>{label}</Text>
      <Text style={s.macroValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  macros: { gap: space[2] },
  macro: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: color.border,
    paddingVertical: space[2],
  },
  macroLabel: { ...type.sm, color: color.muted },
  macroValue: { ...type.base, color: color.text, ...tabular },
});
