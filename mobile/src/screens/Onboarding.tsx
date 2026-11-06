import React, { useState } from "react";
import { View } from "react-native";
import {
  Body,
  Button,
  Chip,
  Field,
  Notice,
  Screen,
  Title,
} from "../design/primitives";
import { space } from "../design/tokens";
import { buildGoal, KCAL_FLOOR } from "../data";
import type { Activity, GoalType, Profile, Sex } from "../data/types";

/** S01 cuestionario + S02 objetivos.
 *  Los dos en una pantalla a proposito: la queja repetida de la app de
 *  referencia es rellenar un formulario largo para descubrir el precio al
 *  final. Aqui ves tu resultado en cuanto hay datos suficientes. */

const SEXES: { v: Sex; l: string }[] = [
  { v: "female", l: "Mujer" },
  { v: "male", l: "Hombre" },
  { v: "other", l: "Prefiero no decirlo" },
];

const ACTS: { v: Activity; l: string }[] = [
  { v: "sedentary", l: "Sedentario" },
  { v: "light", l: "Ligero" },
  { v: "moderate", l: "Moderado" },
  { v: "high", l: "Alto" },
  { v: "athlete", l: "Muy alto" },
];

const GOALS: { v: GoalType; l: string }[] = [
  { v: "lose", l: "Bajar peso" },
  { v: "maintain", l: "Mantener" },
  { v: "gain", l: "Ganar músculo" },
  { v: "recomp", l: "Recomposición" },
];

export function Onboarding({
  onDone,
}: {
  onDone: (p: Profile, type: GoalType) => void | Promise<void>;
}) {
  const [sex, setSex] = useState<Sex>("female");
  const [activity, setActivity] = useState<Activity>("light");
  const [goalType, setGoalType] = useState<GoalType>("maintain");
  const [year, setYear] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  // Guardar puede fallar: no hay red, la base dice que no. Sin esto el boton
  // se pulsa y no pasa nada, que desde fuera es identico a una app colgada.
  async function empezar(p: Profile) {
    setGuardando(true);
    setFallo(null);
    try {
      await onDone(p, goalType);
    } catch (e) {
      setFallo(
        e instanceof Error && e.message
          ? e.message
          : "No hemos podido guardar tus datos. Inténtalo otra vez."
      );
      setGuardando(false);
    }
  }

  const y = parseInt(year, 10);
  const h = parseFloat(height);
  const w = parseFloat(weight);
  const thisYear = new Date().getFullYear();

  const errYear =
    year && (!y || y < 1920 || y > thisYear - 13)
      ? `Introduce un año entre 1920 y ${thisYear - 13}`
      : undefined;
  const errH = height && (!h || h < 80 || h > 260) ? "Entre 80 y 260 cm" : undefined;
  const errW = weight && (!w || w < 20 || w > 400) ? "Entre 20 y 400 kg" : undefined;

  const ready = !!y && !!h && !!w && !errYear && !errH && !errW;
  // Lo que falta, con su nombre. Un «rellena los tres campos» no dice cual de
  // los tres, y los que ya estan mal puestos avisan solos en su propia casilla.
  const faltan = [
    !y && "el año de nacimiento",
    !h && "la altura",
    !w && "el peso",
  ].filter(Boolean) as string[];
  const profile: Profile | null = ready
    ? { sex, birthYear: y, heightCm: h, weightKg: w, activity }
    : null;
  const preview = profile ? buildGoal(profile, goalType) : null;

  return (
    <Screen>
      <Title>Tus datos</Title>
      <Body muted>
        Sirven para calcular cuánta energía necesitas. Se quedan en este móvil.
      </Body>

      <View style={{ height: space[5] }} />

      <Body>Sexo</Body>
      <Row>
        {SEXES.map((o) => (
          <Chip key={o.v} label={o.l} selected={sex === o.v} onPress={() => setSex(o.v)} />
        ))}
      </Row>

      <View style={{ height: space[5] }} />

      <Field
        label="Año de nacimiento"
        value={year}
        onChangeText={setYear}
        keyboardType="numeric"
        placeholder="1988"
        error={errYear}
      />
      <Field
        label="Altura (cm)"
        value={height}
        onChangeText={setHeight}
        keyboardType="decimal-pad"
        placeholder="175"
        error={errH}
      />
      <Field
        label="Peso (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder="72"
        error={errW}
      />

      <Body>Actividad diaria</Body>
      <Row>
        {ACTS.map((o) => (
          <Chip
            key={o.v}
            label={o.l}
            selected={activity === o.v}
            onPress={() => setActivity(o.v)}
          />
        ))}
      </Row>

      <View style={{ height: space[5] }} />

      <Body>Objetivo</Body>
      <Row>
        {GOALS.map((o) => (
          <Chip
            key={o.v}
            label={o.l}
            selected={goalType === o.v}
            onPress={() => setGoalType(o.v)}
          />
        ))}
      </Row>

      <View style={{ height: space[5] }} />

      {preview && (
        <>
          <Notice
            tone={preview.floored ? "danger" : "info"}
            text={
              preview.floored
                ? `Ese objetivo saldría por debajo de ${KCAL_FLOOR} kcal al día. No podemos ponerlo como meta, así que lo dejamos en ${KCAL_FLOOR}.`
                : `Para mantener tu peso necesitas unas ${preview.maintain} kcal. Con este objetivo, tu meta diaria es de ${preview.goal.kcalTarget} kcal.`
            }
          />
          <Body muted>
            Proteína {preview.goal.proteinG} g · Carbohidratos {preview.goal.carbsG} g ·
            Grasa {preview.goal.fatG} g
          </Body>
          <View style={{ height: space[5] }} />
        </>
      )}

      {/* El boton esta siempre, aunque falten datos. Antes no aparecia hasta
          tenerlos todos, y eso deja la pantalla sin ninguna salida visible:
          tocas opciones, no pasa nada, y no hay forma de saber que esperan de
          ti. Apagado y con el motivo al lado se entiende solo. */}
      {!!fallo && <Notice tone="danger" text={fallo} />}
      {!ready && !!faltan.length && (
        <Body muted>Falta rellenar {faltan.join(", ")}.</Body>
      )}
      <Button
        label={guardando ? "Guardando…" : "Empezar"}
        disabled={!ready || guardando}
        onPress={() => profile && empezar(profile)}
      />
      <View style={{ height: space[6] }} />
    </Screen>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: space[2],
        marginTop: space[2],
      }}
    >
      {children}
    </View>
  );
}
