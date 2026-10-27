import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GraficaPeso } from "../design/Grafica";
import {
  Body,
  Button,
  Divider,
  Empty,
  Field,
  MenuLine,
  Screen,
  Title,
} from "../design/primitives";
import { color, layout, space, tabular, type } from "../design/tokens";
import { store, todayLocal } from "../data";
import type { Goal, WeightEntry } from "../data/types";

/** S17 — Progreso.
 *
 *  La cifra grande es el peso de hoy, no «lo que te falta». El cambio se dice
 *  en seco: «−1,4 kg desde el 3 de octubre». Sin flechas verdes ni rojas, sin
 *  felicitaciones ni reproches.
 *
 *  Una app de peso la miran personas que pueden estar pasándolo mal. Informar
 *  está bien; opinar sobre su cuerpo, no.
 */

export function Progreso({
  goal,
  onVolver,
}: {
  goal: Goal | null;
  onVolver: () => void;
}) {
  const [pesos, setPesos] = useState<WeightEntry[] | null>(null);
  const [kg, setKg] = useState("");
  const [guardando, setGuardando] = useState(false);
  const hoy = todayLocal();

  async function recargar() {
    setPesos(await store.listWeights());
  }

  useEffect(() => {
    recargar();
  }, []);

  const valor = parseFloat(kg.replace(",", "."));
  const valido = !Number.isNaN(valor) && valor > 20 && valor < 400;
  const error = kg && !valido ? "Un peso entre 20 y 400 kg" : undefined;

  async function guardar() {
    if (!valido) return;
    setGuardando(true);
    try {
      await store.saveWeight(hoy, Math.round(valor * 10) / 10);
      setKg("");
      await recargar();
    } finally {
      setGuardando(false);
    }
  }

  const lista = pesos ?? [];
  const ultimo = lista.length ? lista[lista.length - 1] : null;
  const primero = lista.length ? lista[0] : null;
  const cambio = ultimo && primero && lista.length > 1 ? ultimo.kg - primero.kg : null;

  return (
    <Screen>
      <Title>Progreso</Title>

      {pesos === null ? (
        <Body muted>Cargando…</Body>
      ) : lista.length === 0 ? (
        <>
          <Empty text="Todavía no has anotado ningún peso." />
          <Apuntar
            kg={kg}
            setKg={setKg}
            error={error}
            valido={valido}
            guardando={guardando}
            onGuardar={guardar}
          />
        </>
      ) : (
        <>
          <View style={s.cabecera}>
            <View>
              <Text style={s.etiqueta}>Peso de hoy</Text>
              <Text style={s.cifra}>
                {ultimo!.kg.toLocaleString("es-ES", { minimumFractionDigits: 1 })}
                <Text style={s.unidad}> kg</Text>
              </Text>
            </View>
          </View>

          {cambio !== null && (
            <Text style={s.cambio}>
              {cambio === 0
                ? "Igual que al empezar"
                : `${cambio > 0 ? "+" : "−"}${Math.abs(cambio).toFixed(1)} kg desde el ${diaCorto(primero!.localDate)}`}
            </Text>
          )}

          <GraficaPeso
            puntos={lista.map((w) => ({ localDate: w.localDate, kg: w.kg }))}
            objetivoKg={null}
          />

          <Body muted style={type.sm}>
            {lista.length === 1
              ? "Con un solo registro no hay tendencia todavía. Anota otro día y la verás."
              : "El peso sube y baja por agua, sal y hora del día. Lo que cuenta es la línea, no el punto."}
          </Body>

          <Divider />

          <Apuntar
            kg={kg}
            setKg={setKg}
            error={error}
            valido={valido}
            guardando={guardando}
            onGuardar={guardar}
            yaHoy={lista.some((w) => w.localDate === hoy)}
          />

          <Text style={s.etiqueta}>Historial</Text>
          {[...lista].reverse().map((w) => (
            <MenuLine
              key={w.localDate}
              name={diaLargo(w.localDate)}
              value={`${w.kg.toLocaleString("es-ES", { minimumFractionDigits: 1 })} kg`}
              accessibilityHint="Mantén pulsado para quitarlo"
              onLongPress={async () => {
                await store.removeWeight(w.localDate);
                await recargar();
              }}
            />
          ))}
        </>
      )}

      <View style={{ height: space[6] }} />
      <Button label="Volver al diario" variant="ghost" onPress={onVolver} />
      <View style={{ height: space[6] }} />
    </Screen>
  );
}

function Apuntar({
  kg,
  setKg,
  error,
  valido,
  guardando,
  onGuardar,
  yaHoy,
}: {
  kg: string;
  setKg: (v: string) => void;
  error?: string;
  valido: boolean;
  guardando: boolean;
  onGuardar: () => void;
  yaHoy?: boolean;
}) {
  return (
    <View style={{ marginBottom: space[4] }}>
      <Field
        label={yaHoy ? "Corregir el peso de hoy" : "Peso de hoy (kg)"}
        value={kg}
        onChangeText={setKg}
        keyboardType="decimal-pad"
        placeholder="82,4"
        error={error}
      />
      <Button
        label={guardando ? "Guardando…" : yaHoy ? "Corregir" : "Anotar"}
        disabled={!valido || guardando}
        onPress={onGuardar}
      />
    </View>
  );
}

function diaCorto(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

function diaLargo(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const f = new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return f[0].toUpperCase() + f.slice(1);
}

const s = StyleSheet.create({
  cabecera: { flexDirection: "row", alignItems: "flex-end", marginTop: space[3] },
  etiqueta: { ...type.xs, color: color.muted, letterSpacing: 0.6, marginTop: space[4] },
  cifra: { ...type.total, color: color.text, ...tabular },
  unidad: { ...type.lg, color: color.muted },
  cambio: { ...type.sm, color: color.muted, marginTop: space[1], ...tabular },
  _unused: { minHeight: layout.rowMinHeight },
});
