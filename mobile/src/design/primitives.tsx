import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { color, layout, radius, space, tabular, type } from "./tokens";

/* ---------------------------------------------------------------- Screen */

export function Screen({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const inner = (
    <View style={s.screenInner}>
      <View style={s.content}>{children}</View>
    </View>
  );
  if (!scroll) return <View style={s.screen}>{inner}</View>;
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenScroll}>
      {inner}
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ Text */

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={s.title}>{children}</Text>;
}

export function Body({
  children,
  muted,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: TextStyle;
}) {
  return <Text style={[s.body, muted && s.muted, style]}>{children}</Text>;
}

export function SlotLabel({ children }: { children: React.ReactNode }) {
  return <Text style={s.slotLabel}>{children}</Text>;
}

/* ---------------------------------------------------------------- Button */

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        variant === "primary" && s.btnPrimary,
        variant === "secondary" && s.btnSecondary,
        variant === "ghost" && s.btnGhost,
        variant === "danger" && s.btnDanger,
        pressed && s.btnPressed,
        disabled && s.btnDisabled,
      ]}
    >
      <Text
        style={[
          s.btnText,
          (variant === "primary" || variant === "danger") && s.btnTextOn,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------- MenuLine */
/* El renglon de carta. Plato .......... kcal
   Es el componente con caracter de la app: codifica "elige de una lista". */

export function MenuLine({
  name,
  value,
  onPress,
  onLongPress,
  accessibilityHint,
}: {
  name: string;
  value: string;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityHint?: string;
}) {
  const content = (
    <View style={s.line}>
      <Text style={s.lineName} numberOfLines={2}>
        {name}
      </Text>
      {/* La guia de puntos es decorativa: el lector de pantalla no la lee. */}
      <View style={s.lineLead} accessible={false} importantForAccessibility="no" />
      <Text style={s.lineValue}>{value}</Text>
    </View>
  );
  if (!onPress && !onLongPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${value}`}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [pressed && s.linePressed]}
    >
      {content}
    </Pressable>
  );
}

/* ----------------------------------------------------------------- Field */

export function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
  error,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  placeholder?: string;
  error?: string;
  autoFocus?: boolean;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel} nativeID={`lbl-${label}`}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityLabelledBy={`lbl-${label}`}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={color.muted}
        autoFocus={autoFocus}
        style={[s.input, !!error && s.inputError]}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={s.fieldError}>
          {error}
        </Text>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ Chip */

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[s.chip, selected && s.chipOn]}
    >
      <Text style={[s.chipText, selected && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------ Empty / Notice */

export function Empty({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <View style={s.empty}>
      <Body muted>{text}</Body>
      {action}
    </View>
  );
}

export function Notice({
  text,
  tone = "info",
}: {
  text: string;
  tone?: "info" | "danger" | "success";
}) {
  return (
    <View
      accessibilityRole="alert"
      style={[
        s.notice,
        tone === "danger" && s.noticeDanger,
        tone === "success" && s.noticeSuccess,
      ]}
    >
      <Text
        style={[
          s.noticeText,
          tone === "danger" && { color: color.danger },
          tone === "success" && { color: color.success },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

export function Divider() {
  return <View style={s.divider} />;
}

/* ----------------------------------------------------------------- estilos */

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg } as ViewStyle,
  screenScroll: { paddingBottom: space[7] },
  screenInner: { paddingHorizontal: layout.screenPadding, paddingTop: space[5] },
  content: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center" },

  title: { ...type.lg, color: color.text, marginBottom: space[2] },
  body: { ...type.base, color: color.text },
  muted: { color: color.muted },
  slotLabel: {
    ...type.xs,
    color: color.muted,
    letterSpacing: 0.6,
    marginTop: space[4],
    marginBottom: space[1],
  },

  btn: {
    minHeight: layout.tapTargetMin,
    paddingHorizontal: space[4],
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.input,
    borderWidth: 1,
  },
  btnPrimary: { backgroundColor: color.accent, borderColor: color.accent },
  btnSecondary: { backgroundColor: color.bg, borderColor: color.borderInput },
  btnGhost: { backgroundColor: "transparent", borderColor: "transparent" },
  btnDanger: { backgroundColor: color.danger, borderColor: color.danger },
  btnPressed: { opacity: 0.82 },
  btnDisabled: { opacity: 0.45 },
  btnText: { ...type.base, fontWeight: "600", color: color.accent },
  btnTextOn: { color: color.onAccent },

  line: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space[2],
    minHeight: layout.rowMinHeight,
    paddingVertical: space[1],
  },
  lineName: { ...type.dish, color: color.text, flexShrink: 1 },
  lineLead: {
    flexGrow: 1,
    flexBasis: 12,
    borderBottomWidth: 1,
    borderStyle: "dotted",
    borderColor: color.borderInput,
    marginBottom: 6,
  },
  lineValue: { ...type.sm, color: color.muted, ...tabular, marginBottom: 2 },
  linePressed: { backgroundColor: color.surface },

  field: { marginBottom: space[4] },
  fieldLabel: { ...type.sm, color: color.muted, marginBottom: space[1] },
  input: {
    minHeight: layout.tapTargetMin,
    borderWidth: 1,
    borderColor: color.borderInput,
    borderRadius: radius.input,
    paddingHorizontal: space[3],
    ...type.base,
    color: color.text,
    backgroundColor: color.bg,
  },
  inputError: { borderColor: color.danger },
  fieldError: { ...type.sm, color: color.danger, marginTop: space[1] },

  chip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: space[3],
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.bg,
  },
  chipOn: { backgroundColor: color.accent, borderColor: color.accent },
  chipText: { ...type.sm, color: color.text },
  chipTextOn: { color: color.onAccent },

  empty: { paddingVertical: space[4], gap: space[3], alignItems: "flex-start" },

  notice: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    padding: space[3],
    marginBottom: space[4],
  },
  noticeDanger: { backgroundColor: "#fbeeeb" },
  noticeSuccess: { backgroundColor: "#eaf2ee" },
  noticeText: { ...type.sm, color: color.text },

  divider: { height: 1, backgroundColor: color.border, marginVertical: space[3] },
});
