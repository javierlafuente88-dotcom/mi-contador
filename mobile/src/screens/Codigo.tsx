import React, { useState } from "react";
import { View } from "react-native";
import { Body, Button, Field, MenuLine, Notice, Screen, Title } from "../design/primitives";
import { space, type } from "../design/tokens";
import { store } from "../data";
import { buscarPorCodigo, codigoValido } from "../data/openfoodfacts";
import type { Food } from "../data/types";

/** S10 — Buscar por código de barras.
 *
 *  La cámara llega después: leer el código necesita compilación nativa y no
 *  funciona en Expo Go web. Lo que sí funciona en todas partes, y es la mitad
 *  que aporta valor, es teclear el código y encontrar el producto.
 *
 *  Nuestra cobertura es mala y la pantalla lo dice. Medido: 18.075 productos
 *  en México, 6.870 en Chile, 2.861 en Perú. Cuando no esté, la salida es
 *  crearlo, no un callejón.
 */

export function Codigo({
  slotName,
  onCancel,
  onEncontrado,
  onCrear,
}: {
  slotName: string;
  onCancel: () => void;
  onEncontrado: (f: Food) => void;
  onCrear: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [hallado, setHallado] = useState<Food | null>(null);

  const valido = codigoValido(codigo);
  const errorCampo =
    codigo.length > 0 && !valido ? "Son 8 o 13 dígitos, los del envase" : undefined;

  async function buscar() {
    if (!valido) return;
    setBuscando(true);
    setAviso(null);
    setHallado(null);
    try {
      // Primero lo nuestro: puede que ya lo hayas creado o buscado antes.
      const local = await store.findByBarcode(codigo);
      if (local) {
        setHallado(local);
        return;
      }
      const r = await buscarPorCodigo(codigo);
      if (r.estado === "encontrado") {
        await store.rememberFood(r.food, codigo);
        setHallado(r.food);
      } else if (r.estado === "no-esta") {
        setAviso(
          "Ese producto no está en Open Food Facts. Es una base abierta y tiene " +
            "huecos grandes fuera de Europa: en México hay unos 18.000 productos y " +
            "en Perú menos de 3.000. Puedes crearlo tú y queda guardado."
        );
      } else if (r.estado === "sin-datos") {
        setAviso(
          "El producto está, pero sin calorías por 100 g. Un dato a medias es peor " +
            "que ninguno, así que mejor créalo tú con lo que diga la etiqueta."
        );
      } else {
        setAviso(`${r.motivo}. Puedes crear el alimento a mano mientras tanto.`);
      }
    } finally {
      setBuscando(false);
    }
  }

  if (hallado) {
    return (
      <Screen>
        <Title>{hallado.name}</Title>
        {hallado.license === "odbl" && (
          <Body muted style={type.sm}>
            Datos de Open Food Facts, bajo licencia ODbL.
          </Body>
        )}
        <View style={{ height: space[4] }} />
        <MenuLine name="Calorías" value={`${hallado.per100g.kcal} kcal/100 g`} />
        <MenuLine name="Proteína" value={g(hallado.per100g.protein_g)} />
        <MenuLine name="Carbohidratos" value={g(hallado.per100g.carbs_g)} />
        <MenuLine name="Grasa" value={g(hallado.per100g.fat_g)} />

        <View style={{ height: space[5] }} />
        <Button label={`Usar en ${slotName}`} onPress={() => onEncontrado(hallado)} />
        <View style={{ height: space[3] }} />
        <Button label="Buscar otro código" variant="ghost" onPress={() => { setHallado(null); setCodigo(""); }} />
        <View style={{ height: space[6] }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Código de barras</Title>
      <Body muted style={type.sm}>
        Teclea los dígitos que hay bajo el código del envase.
      </Body>

      <View style={{ height: space[5] }} />

      <Field
        label="Código"
        value={codigo}
        onChangeText={setCodigo}
        keyboardType="numeric"
        placeholder="8410076472151"
        error={errorCampo}
        autoFocus
      />

      <Button
        label={buscando ? "Buscando…" : "Buscar"}
        disabled={!valido || buscando}
        onPress={buscar}
      />

      {!!aviso && (
        <>
          <View style={{ height: space[4] }} />
          <Notice text={aviso} />
          <Button label="Crear este alimento" variant="secondary" onPress={onCrear} />
        </>
      )}

      <View style={{ height: space[6] }} />
      <Body muted style={type.sm}>
        Leer el código con la cámara llega en cuanto la app se compile de forma
        nativa: no funciona desde el navegador.
      </Body>

      <View style={{ height: space[5] }} />
      <Button label="Cancelar" variant="ghost" onPress={onCancel} />
      <View style={{ height: space[6] }} />
    </Screen>
  );
}

function g(v: number | undefined) {
  return v === undefined ? "—" : `${v} g`;
}
