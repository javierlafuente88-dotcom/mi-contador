import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Body, Button, Chip, Divider, Field, Notice, Screen, Title } from "../design/primitives";
import { color, space, tabular, type } from "../design/tokens";
import { KCAL_FLOOR } from "../data";
import type { Goal, GoalType } from "../data/types";

/** S27 — tu objetivo, a mano.
 *
 *  En la original esto es premium: el cuestionario calcula un número y, si no
 *  te convence, pagas o te aguantas. Aquí se toca.
 *
 *  Con un suelo. Dos reseñas independientes de la original cuentan que acepta
 *  déficits peligrosos, y ese es justo el motivo por el que pusimos los 1.200.
 *  Dejar que se edite sin suelo sería quitarnos lo único que nos distingue de
 *  verdad en seguridad. */

const TIPOS: { v: GoalType; l: string }[] = [
  { v: "lose", l: "Bajar peso" },
  { v: "maintain", l: "Mantener" },
  { v: "gain", l: "Ganar músculo" },
  { v: "recomp", l: "Recomposición" },
];

const n = (s: string): number | null => {
  // Vacio NO es cero: Number("") da 0, y un campo en blanco acabaria
  // diciendo "no bajamos de 1200" en vez de "escribe un numero".
  if (s.trim() === "") return null;
  const v = Number(s.replace(",", "."));
  return Number.isFinite(v) && v >= 0 ? v : null;
};

export function Objetivo({
  goal,
  calculado,
  pesoUsado,
  onGuardar,
  onVolver,
}: {
  goal: Goal;
  /** Lo que saldría del cuestionario hoy, con el peso más reciente. */
  calculado: Goal;
  /** De dónde sale ese peso, para poder decirlo en vez de dar un número suelto. */
  pesoUsado: { kg: number; deLaBascula: boolean };
  onGuardar: (g: Goal) => Promise<void>;
  onVolver: () => void;
}) {
  const [tipo, setTipo] = useState<GoalType>(goal.type);
  const [kcal, setKcal] = useState(String(goal.kcalTarget));
  const [prot, setProt] = useState(String(goal.proteinG));
  const [carb, setCarb] = useState(String(goal.carbsG));
  const [gras, setGras] = useState(String(goal.fatG));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vKcal = n(kcal);
  const vProt = n(prot);
  const vCarb = n(carb);
  const vGras = n(gras);
  const completo = vKcal !== null && vProt !== null && vCarb !== null && vGras !== null;

  const bajoElSuelo = vKcal !== null && vKcal < KCAL_FLOOR;

  /** Las calorías SON los macros: 4 por gramo de proteína y de carbohidrato,
   *  9 por el de grasa. Si las dos cifras no se parecen, una de las dos miente,
   *  y el diario enseña las dos. */
  const suman = useMemo(
    () =>
      completo ? Math.round(4 * vProt! + 4 * vCarb! + 9 * vGras!) : null,
    [completo, vProt, vCarb, vGras],
  );
  const desfase = suman !== null && vKcal !== null ? suman - vKcal : 0;
  // Menos de 50 kcal es redondeo, no desacuerdo. Y si la meta ni siquiera la
  // aceptamos, no se avisa de que los macros no cuadran con ella: un problema
  // cada vez, y primero el que importa.
  const descuadrado = Math.abs(desfase) > 50 && !bajoElSuelo;

  function cuadrar() {
    if (vKcal === null || vProt === null || vGras === null) return;
    // Se mueven los carbohidratos porque son el resto en la fórmula del alta:
    // la proteína va por peso y la grasa por porcentaje de la energía.
    const resto = Math.max(0, Math.round((vKcal - vProt * 4 - vGras * 9) / 4));
    setCarb(String(resto));
  }

  function recalcular() {
    setTipo(calculado.type);
    setKcal(String(calculado.kcalTarget));
    setProt(String(calculado.proteinG));
    setCarb(String(calculado.carbsG));
    setGras(String(calculado.fatG));
    setError(null);
  }

  async function guardar() {
    if (!completo || bajoElSuelo) return;
    setGuardando(true);
    setError(null);
    try {
      await onGuardar({
        type: tipo,
        kcalTarget: Math.round(vKcal!),
        proteinG: Math.round(vProt!),
        carbsG: Math.round(vCarb!),
        fatG: Math.round(vGras!),
      });
    } catch (e) {
      // El suelo también está en la base. Si llega hasta allí, se dice.
      setError(e instanceof Error ? e.message : "No se ha podido guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Screen>
      <Title>Tu objetivo</Title>
      <Body muted>
        Lo calculamos nosotros al empezar, pero el número es tuyo. Cámbialo si no
        te cuadra.
      </Body>

      <View style={{ height: space[4] }} />

      <Text style={o.etiqueta}>Qué quieres hacer</Text>
      <View style={o.chips}>
        {TIPOS.map((t) => (
          <Chip
            key={t.v}
            label={t.l}
            selected={tipo === t.v}
            onPress={() => setTipo(t.v)}
          />
        ))}
      </View>

      <View style={{ height: space[4] }} />

      <Field
        label="Calorías al día"
        value={kcal}
        onChangeText={setKcal}
        keyboardType="numeric"
        placeholder="2175"
        error={
          vKcal === null
            ? "Escribe un número"
            : bajoElSuelo
              ? `No bajamos de ${KCAL_FLOOR.toLocaleString("es-ES")}`
              : undefined
        }
      />

      {bajoElSuelo && (
        <Notice
          tone="danger"
          text={`Por debajo de ${KCAL_FLOOR.toLocaleString("es-ES")} kcal al día no se come bien, y no es algo que se arregle teniendo cuidado. Si tu caso necesita menos, eso lo lleva alguien que te vea: nosotros no sabemos lo suficiente de ti para ponerlo.`}
        />
      )}

      <Divider />

      <Text style={o.etiqueta}>Los macros, en gramos</Text>
      <Field label="Proteína" value={prot} onChangeText={setProt} keyboardType="numeric" />
      <Field label="Carbohidratos" value={carb} onChangeText={setCarb} keyboardType="numeric" />
      <Field label="Grasa" value={gras} onChangeText={setGras} keyboardType="numeric" />

      {suman !== null && (
        <>
          <View style={o.suma}>
            <Text style={o.sumaLabel}>Esos macros son</Text>
            <Text style={o.sumaValor}>{suman.toLocaleString("es-ES")} kcal</Text>
          </View>
          {descuadrado && (
            <>
              <Notice
                tone="info"
                text={`Son ${Math.abs(desfase).toLocaleString("es-ES")} kcal ${
                  desfase > 0 ? "más" : "menos"
                } que tu meta. No te lo impido: puede que lo quieras así. Pero el diario enseña las dos cifras, y así no van a cuadrar.`}
              />
              <Button label="Cuadrar los carbohidratos" variant="secondary" onPress={cuadrar} />
            </>
          )}
        </>
      )}

      <Divider />

      <Button label="Volver a calcularlo" variant="ghost" onPress={recalcular} />
      <Body muted style={{ marginTop: space[2], ...type.sm }}>
        {pesoUsado.deLaBascula
          ? `Saldría ${calculado.kcalTarget.toLocaleString("es-ES")} kcal, con los ${pesoUsado.kg} kg que anotaste la última vez.`
          : `Saldría ${calculado.kcalTarget.toLocaleString("es-ES")} kcal, con los ${pesoUsado.kg} kg que pusiste al empezar. Si te pesas en Progreso, usaremos ese.`}
      </Body>

      {!!error && <Notice tone="danger" text={error} />}

      <View style={{ height: space[5] }} />

      <Button
        label={guardando ? "Guardando…" : "Guardar"}
        onPress={guardar}
        disabled={!completo || bajoElSuelo || guardando}
      />
      <View style={{ height: space[2] }} />
      <Button label="Volver al diario" variant="ghost" onPress={onVolver} />

      <View style={{ height: space[7] }} />
    </Screen>
  );
}

const o = StyleSheet.create({
  etiqueta: { ...type.sm, color: color.muted, marginBottom: space[2] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  // Sin raya abajo: el Divider que viene después ya separa, y las dos juntas
  // parecen un fallo de maquetación. Es la segunda vez que lo hago.
  suma: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingVertical: space[2],
    marginBottom: space[2],
  },
  sumaLabel: { ...type.sm, color: color.muted },
  sumaValor: { ...type.base, color: color.text, ...tabular },
});
