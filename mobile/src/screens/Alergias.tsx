import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Body, Button, Chip, Divider, Notice, Screen, Title } from "../design/primitives";
import { space, type } from "../design/tokens";
import { store } from "../data";
import { ALERGENOS_UE as TODOS } from "../data/alergenos";
import type { Alergeno } from "../data/types";

/** Declarar alergias e intolerancias.
 *
 *  Los 14 de declaración obligatoria en la UE. Los primeros son los que traen
 *  marcados nuestros 49 alimentos; el resto se pueden declarar, pero la app
 *  avisa de que ahí no saltará —solo en los alimentos que cree el usuario.
 *
 *  Decir «no detecto esto» es más útil que aceptarlo en silencio y dar una
 *  falsa sensación de que está cubierto.
 */

export function Alergias({ onVolver }: { onVolver: () => void }) {
  const [mios, setMios] = useState<Alergeno[] | null>(null);

  useEffect(() => {
    store.listMyAllergens().then(setMios);
  }, []);

  async function alternar(a: Alergeno) {
    const siguiente = (mios ?? []).includes(a)
      ? (mios ?? []).filter((x) => x !== a)
      : [...(mios ?? []), a];
    setMios(siguiente);
    await store.saveMyAllergens(siguiente);
  }

  const elegidos = mios ?? [];
  const sinDeteccion = elegidos.filter(
    (a) => !TODOS.find((t) => t.id === a)?.detectado
  );

  return (
    <Screen>
      <Title>Alergias e intolerancias</Title>
      <Body muted style={type.sm}>
        Lo que marques aquí se avisa en la carta antes de añadir un plato.
      </Body>

      <View style={{ height: space[4] }} />

      <Notice
        text={
          "Esto es una ayuda, no una garantía. Los alérgenos están puestos a partir " +
          "de lo que es cada alimento genérico, no de la etiqueta de un producto " +
          "concreto. Si tienes una alergia seria, sigue leyendo las etiquetas."
        }
      />

      <Body muted style={type.xs}>
        Los que traen marcados nuestros alimentos
      </Body>
      <View style={s.chips}>
        {TODOS.filter((t) => t.detectado).map((t) => (
          <Chip
            key={t.id}
            label={t.label}
            selected={elegidos.includes(t.id)}
            onPress={() => alternar(t.id)}
          />
        ))}
      </View>

      <Divider />

      <Body muted style={type.xs}>
        Los demás de la lista de la UE. Ninguno de nuestros 49 alimentos los trae
        marcado, pero sí puedes ponérselos a los que crees tú.
      </Body>
      <View style={s.chips}>
        {TODOS.filter((t) => !t.detectado).map((t) => (
          <Chip
            key={t.id}
            label={t.label}
            selected={elegidos.includes(t.id)}
            onPress={() => alternar(t.id)}
          />
        ))}
      </View>

      {sinDeteccion.length > 0 && (
        <>
          <View style={{ height: space[4] }} />
          <Notice
            tone="danger"
            text={
              `Has declarado ${sinDeteccion.length === 1 ? "un alérgeno que" : "alérgenos que"} ` +
              "ninguno de nuestros alimentos trae marcado, así que ahí no te avisará. " +
              "Solo saltará en los alimentos que crees tú y se lo pongas. Prefiero " +
              "decírtelo a que confíes en un aviso que no va a llegar."
            }
          />
        </>
      )}

      <View style={{ height: space[6] }} />
      <Button label="Volver" variant="ghost" onPress={onVolver} />
      <View style={{ height: space[6] }} />
    </Screen>
  );
}

const s = {
  chips: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: space[2],
    marginTop: space[2],
    marginBottom: space[2],
  },
};
