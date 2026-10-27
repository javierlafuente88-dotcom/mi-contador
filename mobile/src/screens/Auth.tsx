import React, { useState } from "react";
import { View } from "react-native";
import { Body, Button, Field, Notice, Screen, Title } from "../design/primitives";
import { space, type } from "../design/tokens";
import { getSupabase } from "../data/supabaseClient";

/** Entrar o crear cuenta. Solo aparece cuando la app habla con Supabase.
 *  Con el almacen local no hace falta cuenta para nada. */

export function Auth({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passOk = password.length >= 8;
  const ready = emailOk && passOk && !busy;

  async function submit() {
    const sb = getSupabase();
    if (!sb) {
      setError("Falta la configuración de Supabase en .env.local");
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "up") {
        const { error } = await sb.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { locale: "es" } },
        });
        if (error) throw error;
        setInfo("Te hemos enviado un correo para confirmar la cuenta.");
      } else {
        const { error } = await sb.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onSignedIn();
      }
    } catch (e) {
      // Mensaje en claro, sin filtrar si el correo existe o no.
      setError(
        mode === "in"
          ? "No hemos podido entrar. Revisa el correo y la contraseña."
          : "No hemos podido crear la cuenta. Inténtalo de nuevo."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Title>{mode === "in" ? "Entrar" : "Crear cuenta"}</Title>
      <Body muted>
        Tus registros se guardan en tu cuenta para que estén en cualquier móvil tuyo.
      </Body>

      <View style={{ height: space[5] }} />

      <Field
        label="Correo"
        value={email}
        onChangeText={setEmail}
        placeholder="tu@correo.com"
        error={email && !emailOk ? "Ese correo no parece válido" : undefined}
      />
      <Field
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        placeholder="al menos 8 caracteres"
        error={password && !passOk ? "Mínimo 8 caracteres" : undefined}
      />

      {!!error && <Notice tone="danger" text={error} />}
      {!!info && <Notice tone="success" text={info} />}

      <Button
        label={busy ? "Un momento…" : mode === "in" ? "Entrar" : "Crear cuenta"}
        disabled={!ready}
        onPress={submit}
      />

      <View style={{ height: space[3] }} />

      <Button
        label={mode === "in" ? "No tengo cuenta" : "Ya tengo cuenta"}
        variant="ghost"
        onPress={() => {
          setMode(mode === "in" ? "up" : "in");
          setError(null);
          setInfo(null);
        }}
      />

      <Body muted style={{ marginTop: space[5], ...type.sm }}>
        Puedes borrar tu cuenta y todos tus datos cuando quieras, desde los ajustes,
        sin escribir a nadie.
      </Body>
    </Screen>
  );
}
