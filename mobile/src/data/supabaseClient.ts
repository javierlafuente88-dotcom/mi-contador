import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

/** Cliente de Supabase. Devuelve null si no hay configuracion, para que la app
 *  siga arrancando con el almacen local en vez de morirse. */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;

// Supabase retira anon y service_role a finales de 2026. Se prefiere la clave
// publicable nueva, y se acepta la antigua mientras exista.
const publicKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!url || !publicKey) return null;
  client = createClient(url, publicKey, {
    auth: {
      // En web, el almacen por defecto de Supabase (localStorage). AsyncStorage
      // en el navegador no guarda nada: se queda en memoria y se pierde al
      // cambiar de pagina. Eso rompia entrar con Google, porque el codigo de
      // verificacion se guarda antes de salir y hay que leerlo al volver; y
      // dejaba la sesion sin sobrevivir a recargar. En movil si es almacen real.
      storage: Platform.OS === "web" ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // Google devuelve al usuario con la sesion colgada de la direccion, asi
      // que en web hay que leerla o el viaje de vuelta no sirve de nada. En un
      // movil no hay direccion que leer, y ademas mirarla es trabajo inutil en
      // cada arranque.
      detectSessionInUrl: Platform.OS === "web",
    },
  });
  return client;
}

export function isConfigured(): boolean {
  return !!(url && publicKey);
}
