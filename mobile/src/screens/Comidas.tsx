import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Body, Button, Divider, Field, Notice, Screen, Title } from "../design/primitives";
import { color, space, type } from "../design/tokens";
import { NUEVA } from "../data/types";
import type { MealSlot } from "../data/types";

/** Las comidas del día.
 *
 *  La original te deja hasta cinco, y cuatro en el plan gratis. Aquí no hay
 *  tope porque no hay razón para que lo haya: son filas en una tabla. Diez
 *  reseñas piden merienda y comidas propias, y una pide hasta diez.
 *
 *  Nombres y orden se guardan al pulsar Guardar. Quitar una comida va aparte y
 *  es inmediato, porque toca lo que ya tienes registrado y eso se pregunta en
 *  el momento, no se mete en un lote. */

export function Comidas({
  slots,
  onGuardar,
  onQuitar,
  onVolver,
}: {
  slots: MealSlot[];
  onGuardar: (slots: MealSlot[]) => Promise<void>;
  onQuitar: (id: string, moverA: string) => Promise<void>;
  onVolver: () => void;
}) {
  const [lista, setLista] = useState<MealSlot[]>(slots);
  const [quitando, setQuitando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiado =
    lista.length !== slots.length ||
    lista.some((s, i) => s.id !== slots[i]?.id || s.name !== slots[i]?.name);

  const vacias = lista.filter((s) => s.name.trim() === "").length;

  /** Una comida recién añadida todavía no se llama nada, y «Quitar» a secas
   *  no dice cuál. Mientras no tenga nombre, vale su sitio. */
  const comoSeLlama = (s: MealSlot, i: number) => s.name.trim() || `la comida ${i + 1}`;

  function renombrar(i: number, name: string) {
    setLista(lista.map((s, j) => (i === j ? { ...s, name } : s)));
    setQuitando(null);
  }

  function mover(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= lista.length) return;
    const copia = [...lista];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    setLista(copia);
    setQuitando(null);
  }

  function anadir() {
    setLista([
      ...lista,
      { id: `${NUEVA}${Date.now()}`, name: "", position: lista.length + 1 },
    ]);
    setQuitando(null);
  }

  /** A dónde va lo registrado al quitar una comida: la de encima, o la de
   *  debajo si es la primera. Siempre hay una, porque la última no se quita. */
  function destino(i: number): MealSlot {
    return i > 0 ? lista[i - 1] : lista[i + 1];
  }

  async function confirmarQuitar(i: number) {
    const s = lista[i];
    const a = destino(i);
    // Una comida que todavía no existe no tiene nada registrado ni nada que
    // mover: se va de la lista y ya.
    if (s.id.startsWith(NUEVA)) {
      setLista(lista.filter((_, j) => j !== i));
      setQuitando(null);
      return;
    }
    await onQuitar(s.id, a.id);
    // El almacén ya la quitó; la lista de aquí se pone al día sin tirar los
    // renombres que el usuario tenga a medias en las otras.
    setLista(lista.filter((_, j) => j !== i));
    setQuitando(null);
  }

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardar(lista.map((s) => ({ ...s, name: s.name.trim() })));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Screen>
      <Title>Tus comidas</Title>
      <Body muted>
        Las que quieras y como las llames tú. Sin tope: si comes cinco veces,
        pones cinco.
      </Body>

      <View style={{ height: space[4] }} />

      {lista.map((s, i) => (
        // La última no lleva raya: el Divider de abajo ya está, y las dos
        // juntas parecían un fallo de maquetación.
        <View key={s.id} style={[a.comida, i === lista.length - 1 && a.ultima]}>
          <Field
            label={`Nombre de la comida ${i + 1}`}
            value={s.name}
            onChangeText={(t) => renombrar(i, t)}
            placeholder="Media mañana"
            error={s.name.trim() === "" ? "Ponle un nombre" : undefined}
          />
          {/* El texto visible es corto porque la columna es estrecha, pero el
              que se lee en voz alta nombra la comida: cuatro "Subir" seguidos
              suenan igual y no se sabe cual se esta pulsando. */}
          <View style={a.acciones}>
            <Button
              label="Subir"
              a11yLabel={`Subir ${comoSeLlama(s, i)}`}
              variant="ghost"
              disabled={i === 0}
              onPress={() => mover(i, -1)}
            />
            <Button
              label="Bajar"
              a11yLabel={`Bajar ${comoSeLlama(s, i)}`}
              variant="ghost"
              disabled={i === lista.length - 1}
              onPress={() => mover(i, 1)}
            />
            {lista.length > 1 && (
              <Button
                label="Quitar"
                a11yLabel={`Quitar ${comoSeLlama(s, i)}`}
                variant="ghost"
                onPress={() => setQuitando(s.id)}
              />
            )}
          </View>

          {quitando === s.id && (
            <View style={a.confirma}>
              <Notice
                tone="danger"
                text={
                  s.id.startsWith(NUEVA)
                    ? `Quitas «${s.name.trim() || "la comida nueva"}», que todavía no habías guardado.`
                    : `Lo que ya tengas registrado en «${s.name.trim()}» se mueve a «${destino(i).name.trim()}», de todos los días. No se borra nada de lo que comiste.`
                }
              />
              <View style={a.acciones}>
                <Button
                  label="Quitar y mover"
                  variant="danger"
                  onPress={() => confirmarQuitar(i)}
                />
                <Button label="Dejarlo" variant="ghost" onPress={() => setQuitando(null)} />
              </View>
            </View>
          )}
        </View>
      ))}

      <Divider />

      <Button label="Añadir una comida" variant="secondary" onPress={anadir} />

      {lista.length === 1 && (
        <Body muted style={{ marginTop: space[3], ...type.sm }}>
          No se puede quedar en ninguna: el diario necesita al menos un sitio
          donde anotar.
        </Body>
      )}

      <View style={{ height: space[5] }} />

      <Button
        label={guardando ? "Guardando…" : "Guardar"}
        onPress={guardar}
        disabled={!cambiado || vacias > 0 || guardando}
      />
      <View style={{ height: space[2] }} />
      <Button label="Volver al diario" variant="ghost" onPress={onVolver} />

      <Text style={a.nota}>
        El reparto de calorías por comida todavía no está: estas son los sitios
        donde anotas, no cuánto toca en cada uno.
      </Text>

      <View style={{ height: space[7] }} />
    </Screen>
  );
}

const a = StyleSheet.create({
  comida: {
    borderBottomWidth: 1,
    borderColor: color.border,
    paddingBottom: space[3],
    marginBottom: space[3],
  },
  ultima: { borderBottomWidth: 0, marginBottom: 0 },
  acciones: { flexDirection: "row", gap: space[2], flexWrap: "wrap" },
  confirma: { marginTop: space[3], gap: space[2] },
  nota: { ...type.sm, color: color.muted, marginTop: space[5] },
});
