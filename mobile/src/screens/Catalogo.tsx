import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Notice,
  Button,
  Chip,
  Divider,
  Empty,
  MenuLine,
  Screen,
  Title,
} from "../design/primitives";
import { color, space, tabular, type } from "../design/tokens";
import { store } from "../data";
import { choque, listar } from "../data/alergenos";
import type { Alergeno, Recipe } from "../data/types";

/** S13 — el catálogo de recetas.
 *
 *  Esto es el producto. La app de referencia tenía un catálogo navegable y lo
 *  retiró en julio de 2026: ahora hay que pedirle platos a una IA y pagar
 *  monedas por cada intento. 67 reseñas con nota media 1,46 hablan de eso.
 *
 *  Aquí: una lista que se lee, se filtra y de la que se elige. Dos toques.
 *  Sin monedas, sin créditos, sin generar nada, sin límite de cambios.
 */

/** Dos grupos, porque no son lo mismo.
 *  El momento del día es excluyente: un plato es desayuno o es cena.
 *  Los atributos se acumulan: puedes querer algo vegetariano Y rápido.
 *  Mezclarlos en un solo grupo hacía que elegir uno borrase el otro. */
const MOMENTOS = [
  { id: "desayuno", label: "Desayuno" },
  { id: "comida", label: "Comida" },
  { id: "cena", label: "Cena" },
  { id: "merienda", label: "Merienda" },
];

const ATRIBUTOS = [
  { id: "vegetariana", label: "Vegetariana" },
  { id: "rapida", label: "Rápida" },
];

export function Catalogo({
  slotName,
  restanKcal,
  onCancel,
  onElegir,
  onCrearReceta,
  onAlergias,
}: {
  slotName: string;
  restanKcal: number | null;
  onCancel: () => void;
  onElegir: (receta: Recipe, grams: number) => void;
  onCrearReceta: () => void;
  onAlergias: () => void;
}) {
  const [recetas, setRecetas] = useState<Recipe[] | null>(null);
  const [momento, setMomento] = useState<string | null>(null);
  const [atributos, setAtributos] = useState<string[]>([]);
  const [soloQueCaben, setSoloQueCaben] = useState(false);
  const [abierta, setAbierta] = useState<Recipe | null>(null);
  const [misAlergenos, setMisAlergenos] = useState<Alergeno[]>([]);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    let vivo = true;
    store.listRecipes().then((r) => vivo && setRecetas(r));
    store.listMyAllergens().then((a) => vivo && setMisAlergenos(a));
    return () => {
      vivo = false;
    };
  }, []);

  const visibles = useMemo(() => {
    let r = recetas ?? [];
    if (momento) r = r.filter((x) => x.tags.includes(momento));
    // Los atributos se suman: han de cumplirse todos los marcados.
    for (const a of atributos) r = r.filter((x) => x.tags.includes(a));
    if (soloQueCaben && restanKcal !== null) {
      r = r.filter((x) => x.perServing.kcal <= restanKcal);
    }
    return r;
  }, [recetas, momento, atributos, soloQueCaben, restanKcal]);

  /** Alergenos declarados que lleva esta receta. */
  const choca = (r: Recipe) => choque(r.allergens, misAlergenos);

  const hayFiltros = !!momento || atributos.length > 0 || soloQueCaben;

  function limpiar() {
    setMomento(null);
    setAtributos([]);
    setSoloQueCaben(false);
  }

  /* ----------------------------------------------------- detalle */

  if (abierta) {
    const gramos = Math.round(abierta.gramsPerServing);
    return (
      <Screen>
        <Title>{abierta.name}</Title>
        <Body muted style={type.sm}>
          {abierta.prepMinutes} min · {abierta.servings}{" "}
          {abierta.servings === 1 ? "ración" : "raciones"} · {gramos} g por ración
        </Body>

        {choca(abierta).length > 0 && (
          <>
            <View style={{ height: space[4] }} />
            <Notice
              tone="danger"
              text={
                `Este plato lleva ${listar(choca(abierta))}, ` +
                "que has declarado. Si lo añades, lo haces a sabiendas."
              }
            />
          </>
        )}

        <View style={{ height: space[5] }} />

        <Text style={s.seccion}>Lleva</Text>
        {abierta.ingredients.map((i) => (
          <MenuLine key={i.name} name={i.name} value={`${i.grams} g`} />
        ))}

        <Divider />

        <Text style={s.seccion}>Por ración</Text>
        <View style={s.macros}>
          <Macro label="Calorías" value={`${Math.round(abierta.perServing.kcal)} kcal`} />
          <Macro label="Proteína" value={g(abierta.perServing.protein_g)} />
          <Macro label="Carbohidratos" value={g(abierta.perServing.carbs_g)} />
          <Macro label="Grasa" value={g(abierta.perServing.fat_g)} />
        </View>

        <View style={{ height: space[6] }} />

        {choca(abierta).length > 0 ? (
          <>
            {!confirmado ? (
              <Button
                label="Lo sé, quiero añadirlo igualmente"
                variant="danger"
                onPress={() => setConfirmado(true)}
              />
            ) : (
              <Button
                label={`Añadir a ${slotName}`}
                variant="danger"
                onPress={() => onElegir(abierta, gramos)}
              />
            )}
          </>
        ) : (
          <Button
            label={`Añadir a ${slotName}`}
            onPress={() => onElegir(abierta, gramos)}
          />
        )}
        <View style={{ height: space[3] }} />
        <Button label="Volver a la carta" variant="ghost" onPress={() => { setAbierta(null); setConfirmado(false); }} />
        {abierta.mine && (
          <>
            <View style={{ height: space[3] }} />
            <Button
              label="Borrar esta receta"
              variant="danger"
              onPress={async () => {
                await store.deleteRecipe(abierta.id);
                setAbierta(null);
                setRecetas(await store.listRecipes());
              }}
            />
          </>
        )}
        <View style={{ height: space[6] }} />
      </Screen>
    );
  }

  /* ------------------------------------------------------ listado */

  return (
    <Screen>
      <Title>La carta</Title>
      <Body muted style={type.sm}>
        Elige lo que te apetezca. Todas las veces que quieras, sin coste.
      </Body>

      <View style={s.filtros}>
        {MOMENTOS.map((e) => (
          <Chip
            key={e.id}
            label={e.label}
            selected={momento === e.id}
            onPress={() => setMomento(momento === e.id ? null : e.id)}
          />
        ))}
      </View>

      <View style={s.filtros}>
        {ATRIBUTOS.map((e) => (
          <Chip
            key={e.id}
            label={e.label}
            selected={atributos.includes(e.id)}
            onPress={() =>
              setAtributos((prev) =>
                prev.includes(e.id) ? prev.filter((x) => x !== e.id) : [...prev, e.id]
              )
            }
          />
        ))}
        {restanKcal !== null && restanKcal > 0 && (
          <Chip
            label={`Cabe en ${restanKcal} kcal`}
            selected={soloQueCaben}
            onPress={() => setSoloQueCaben(!soloQueCaben)}
          />
        )}
      </View>

      <Divider />

      {recetas === null ? (
        <Body muted>Cargando…</Body>
      ) : visibles.length === 0 ? (
        <Empty
          text="Ninguna receta encaja con esos filtros."
          action={
            <Button
              label="Quitar los filtros"
              variant="secondary"
              onPress={limpiar}
            />
          }
        />
      ) : (
        <>
          <Text style={s.cuenta}>
            {visibles.length} {visibles.length === 1 ? "receta" : "recetas"}
            {hayFiltros ? " con esos filtros" : ""}
          </Text>
          {visibles.map((r) => (
            <MenuLine
              key={r.id}
              name={r.name}
              // El aviso va delante de las calorias, pero no las tapa: la
              // carta sigue siendo una carta.
              value={
                choca(r).length > 0
                  ? `lleva ${listar(choca(r))} · ${Math.round(r.perServing.kcal)} kcal`
                  : `${Math.round(r.perServing.kcal)} kcal · ${r.prepMinutes} min${r.mine ? " · tuya" : ""}`
              }
              tone={choca(r).length > 0 ? "danger" : undefined}
              accessibilityHint="Abre la receta"
              onPress={() => { setConfirmado(false); setAbierta(r); }}
            />
          ))}
        </>
      )}

      <View style={{ height: space[5] }} />
      <Button label="Crear una receta" variant="secondary" onPress={onCrearReceta} />
      <View style={{ height: space[3] }} />
      <Button
        label={
          misAlergenos.length > 0
            ? `Mis alergias (${misAlergenos.length})`
            : "Declarar alergias"
        }
        variant="ghost"
        onPress={onAlergias}
      />
      <View style={{ height: space[3] }} />
      <Button label="Cancelar" variant="ghost" onPress={onCancel} />
      <View style={{ height: space[6] }} />
    </Screen>
  );
}

function g(v: number | undefined) {
  return v === undefined ? "—" : `${Math.round(v)} g`;
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
  filtros: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[2],
    marginTop: space[4],
  },
  cuenta: { ...type.xs, color: color.muted, marginTop: space[3], marginBottom: space[1] },
  seccion: { ...type.xs, color: color.muted, letterSpacing: 0.6, marginBottom: space[1] },
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
