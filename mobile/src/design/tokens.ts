/** Tokens. Fuente de verdad: replica/design/tokens.json
 *  Ningun componente escribe un hex ni un pixel suelto. Si falta un valor,
 *  se anade aqui y en tokens.json, no en el componente. */

export const color = {
  bg: "#ffffff",
  surface: "#f1f3ef",
  border: "#d9ded6",
  borderInput: "#6b7468",
  text: "#0f2440",
  muted: "#4d5a66",
  accent: "#24557f",
  onAccent: "#ffffff",
  danger: "#a8321e",
  success: "#2f6b4f",
  warning: "#7a5b12",
} as const;

export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64] as const;

export const radius = {
  input: 4,
  card: 8,
  sheet: 20,
  chip: 999,
} as const;

export const type = {
  xs: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  sm: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  base: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  lg: { fontSize: 20, lineHeight: 28, fontWeight: "600" },
  dish: { fontSize: 18, lineHeight: 26, fontWeight: "400" },
  total: { fontSize: 34, lineHeight: 38, fontWeight: "600" },
} as const;

export const layout = {
  screenPadding: 16,
  maxContentWidth: 560,
  rowMinHeight: 48,
  tapTargetMin: 44,
} as const;

/** Las cifras van siempre con esto. Sin tabulares, una columna de kcal baila. */
export const tabular = { fontVariant: ["tabular-nums" as const] };
