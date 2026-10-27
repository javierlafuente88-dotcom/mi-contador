import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Body, Button, Field, Notice, Screen, Title } from "../design/primitives";
import { space, type } from "../design/tokens";
import { store } from "../data";
import type { Food } from "../data/types";

/** S11 — Crear un alimento.
 *
 *  Nuestra base son 49 alimentos. Es poco, y lo sabemos. Así que lo que no
 *  esté, lo pone el usuario y se queda guardado para siempre.
 *
 *  Lleva la comprobación de Atwater: si los macros no cuadran con las
 *  calorías, se avisa. No se bloquea —las etiquetas redondean y a veces no
 *  cuadran de verdad— pero tampoco se traga un dato imposible en silencio.
 *  Es el mismo control que usamos para validar la semilla de USDA.
 */

export function CrearAlimento({
  nombreSugerido,
  onCancel,
  onCreado,
}: {
  nombreSugerido?: string;
  onCancel: () => void;
  onCreado: (f: Food) => void;
}) {
  const [nombre, setNombre] = useState(nombreSugerido ?? "");
  const [kcal, setKcal] = useState("");
  const [prot, setProt] = useState("");
  const [carb, setCarb] = useState("");
  const [gras, setGras] = useState("");
  const [fibra, setFibra] = useState("");
  const [guardando, setGuardando] = useState(false);

  const n = (v: string) => {
    const x = parseFloat(v.replace(",", "."));
    return Number.isNaN(x) ? null : x;
  };

  const vKcal = n(kcal);
  const vProt = n(prot) ?? 0;
  const vCarb = n(carb) ?? 0;
  const vGras = n(gras) ?? 0;
  const vFibra = n(fibra) ?? 0;

  const errNombre = nombre.trim().length > 0 && nombre.trim().length < 2
    ? "Dale un nombre reconocible"
    : undefined;
  const errKcal =
    kcal && (vKcal === null || vKcal < 0 || vKcal > 900)
      ? "Entre 0 y 900 kcal por 100 g"
      : undefined;

  const sumaMacros = vProt + vCarb + vGras;
  const errSuma =
    sumaMacros > 100 ? "Los macros suman más de 100 g por cada 100 g" : undefined;

  /** Atwater: 4 kcal/g de proteína y carbohidrato digerible, 9 de grasa,
   *  2 de fibra. Si la cuenta no se parece, algo está mal copiado. */
  const avisoAtwater = useMemo(() => {
    if (vKcal === null || vKcal === 0) return null;
    const digerible = Math.max(0, vCarb - vFibra);
    const estimado = 4 * vProt + 4 * digerible + 2 * vFibra + 9 * vGras;
    const margen = Math.max(15, vKcal * 0.25);
    if (Math.abs(estimado - vKcal) <= margen) return null;
    return (
      `Los macros dan unas ${Math.round(estimado)} kcal y has puesto ${Math.round(vKcal)}. ` +
      `Puede estar bien —las etiquetas redondean— pero merece una segunda mirada.`
    );
  }, [vKcal, vProt, vCarb, vGras, vFibra]);

  const listo =
    nombre.trim().length >= 2 && vKcal !== null && !errKcal && !errSuma && !guardando;

  async function guardar() {
    if (!listo || vKcal === null) return;
    setGuardando(true);
    try {
      const f = await store.createFood({
        name: nombre,
        kcal100: vKcal,
        protein100: vProt,
        carbs100: vCarb,
        fat100: vGras,
        fiber100: vFibra || undefined,
      });
      onCreado(f);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Screen>
      <Title>Crear un alimento</Title>
      <Body muted style={type.sm}>
        Los valores van por cada 100 g, como en la etiqueta del envase. Se queda
        guardado para la próxima vez.
      </Body>

      <View style={{ height: space[5] }} />

      <Field label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Galletas María Artiach" error={errNombre} />
      <Field label="Calorías por 100 g" value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" placeholder="450" error={errKcal} />
      <Field label="Proteína por 100 g (g)" value={prot} onChangeText={setProt} keyboardType="decimal-pad" placeholder="7" />
      <Field label="Carbohidratos por 100 g (g)" value={carb} onChangeText={setCarb} keyboardType="decimal-pad" placeholder="72" />
      <Field label="Grasa por 100 g (g)" value={gras} onChangeText={setGras} keyboardType="decimal-pad" placeholder="15" error={errSuma} />
      <Field label="Fibra por 100 g (g, opcional)" value={fibra} onChangeText={setFibra} keyboardType="decimal-pad" placeholder="3" />

      {!!avisoAtwater && <Notice text={avisoAtwater} />}

      <Button label={guardando ? "Guardando…" : "Guardar alimento"} disabled={!listo} onPress={guardar} />
      <View style={{ height: space[3] }} />
      <Button label="Cancelar" variant="ghost" onPress={onCancel} />
      <View style={{ height: space[6] }} />
    </Screen>
  );
}
