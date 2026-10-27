import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // En un movil no hay URL que leer: la sesion no viaja en la direccion.
      detectSessionInUrl: false,
    },
  });
  return client;
}

export function isConfigured(): boolean {
  return !!(url && publicKey);
}
