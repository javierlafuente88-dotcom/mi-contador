import React from "react";
import { View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { color, space, type } from "./tokens";

/** Gráfica de una sola serie: peso en el tiempo.
 *
 *  Decisiones, y por qué:
 *  - **Una serie, sin leyenda.** El título ya la nombra. Una caja de leyenda
 *    para una única línea es ruido.
 *  - **Un solo eje.** Nunca dos escalas en la misma gráfica.
 *  - **Marcas finas y rejilla discreta.** La línea es lo único con color
 *    saturado; ejes y rejilla en gris, por debajo del dato.
 *  - **Etiquetas selectivas.** Solo el primer y el último punto llevan cifra.
 *    Un número sobre cada punto es ilegible y no dice nada más.
 *  - **El texto nunca va del color de la serie.** Va en tinta, como el resto.
 *  - **El objetivo es una referencia discreta**, a rayas, no una meta que grita.
 *
 *  Nada de esto es decorativo: una app de peso la miran personas que pueden
 *  estar pasándolo mal. La gráfica informa, no juzga.
 */

export type PuntoPeso = { localDate: string; kg: number };

const ALTO = 180;
const MARGEN = { arriba: 18, derecha: 44, abajo: 26, izquierda: 10 };

export function GraficaPeso({
  puntos,
  objetivoKg,
  ancho = 320,
}: {
  puntos: PuntoPeso[];
  objetivoKg?: number | null;
  ancho?: number;
}) {
  if (puntos.length === 0) return null;

  const valores = puntos.map((p) => p.kg);
  const conObjetivo = objetivoKg != null ? [...valores, objetivoKg] : valores;
  let min = Math.min(...conObjetivo);
  let max = Math.max(...conObjetivo);
  if (max - min < 2) {
    // Con poca variación, no exagerar: una banda de 2 kg evita que una
    // diferencia de 300 g parezca un desplome.
    const centro = (max + min) / 2;
    min = centro - 1;
    max = centro + 1;
  }
  const pad = (max - min) * 0.15;
  min -= pad;
  max += pad;

  const anchoUtil = ancho - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;

  const x = (i: number) =>
    MARGEN.izquierda +
    (puntos.length === 1 ? anchoUtil / 2 : (i / (puntos.length - 1)) * anchoUtil);
  const y = (kg: number) =>
    MARGEN.arriba + altoUtil - ((kg - min) / (max - min)) * altoUtil;

  const d = puntos
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.kg).toFixed(1)}`)
    .join(" ");

  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];

  return (
    <View style={{ marginVertical: space[3] }}>
      <Svg width={ancho} height={ALTO} accessibilityRole="image"
        accessibilityLabel={
          `Gráfica de peso. ${puntos.length} registros, ` +
          `de ${primero.kg} kg a ${ultimo.kg} kg.`
        }>
        {/* Rejilla: tres líneas, por debajo del dato. */}
        {[0, 0.5, 1].map((f) => (
          <Line
            key={f}
            x1={MARGEN.izquierda}
            x2={ancho - MARGEN.derecha}
            y1={MARGEN.arriba + altoUtil * f}
            y2={MARGEN.arriba + altoUtil * f}
            stroke={color.border}
            strokeWidth={1}
          />
        ))}

        {/* El objetivo, si lo hay: referencia a rayas, discreta. */}
        {objetivoKg != null && objetivoKg >= min && objetivoKg <= max && (
          <>
            <Line
              x1={MARGEN.izquierda}
              x2={ancho - MARGEN.derecha}
              y1={y(objetivoKg)}
              y2={y(objetivoKg)}
              stroke={color.muted}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <SvgText
              x={ancho - MARGEN.derecha + 4}
              y={y(objetivoKg) + 4}
              fontSize={11}
              fill={color.muted}
            >
              meta
            </SvgText>
          </>
        )}

        {/* La serie. Lo único con color saturado. */}
        <Path d={d} stroke={color.accent} strokeWidth={2} fill="none" />

        {puntos.map((p, i) => (
          <Circle
            key={p.localDate}
            cx={x(i)}
            cy={y(p.kg)}
            r={i === 0 || i === puntos.length - 1 ? 4.5 : 3}
            fill={color.bg}
            stroke={color.accent}
            strokeWidth={2}
          />
        ))}

        {/* Etiquetas selectivas: solo los extremos, y en tinta, no en el color
            de la serie. */}
        <SvgText
          x={ancho - MARGEN.derecha + 4}
          y={y(ultimo.kg) + 4}
          fontSize={12}
          fill={color.text}
          fontWeight="600"
        >
          {ultimo.kg}
        </SvgText>
        {puntos.length > 1 && (
          <SvgText
            x={MARGEN.izquierda}
            y={y(primero.kg) - 8}
            fontSize={11}
            fill={color.muted}
          >
            {primero.kg}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

export const tipoGrafica = type;
