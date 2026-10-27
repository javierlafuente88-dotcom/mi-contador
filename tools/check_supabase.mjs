/**
 * Comprueba que el proyecto de Supabase quedó bien montado.
 * Se ejecuta DESPUÉS de crear el proyecto y aplicar las migraciones.
 *
 *   node tools/check_supabase.mjs
 *
 * Lee mobile/.env.local. No escribe nada. No necesita Docker.
 * Usa solo la clave pública, así que lo que no vea es porque RLS no se lo deja,
 * y eso es exactamente lo que queremos comprobar.
 */
import { readFileSync } from "node:fs";

const ENV = "mobile/.env.local";

function loadEnv(path) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    console.error(`No encuentro ${path}. Cópialo desde mobile/.env.example.`);
    process.exit(1);
  }
  const out = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const env = loadEnv(ENV);
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const key =
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const problemas = [];
const bien = [];

if (!url) problemas.push("Falta EXPO_PUBLIC_SUPABASE_URL");
if (!key) problemas.push("Falta la clave pública (publishable o anon)");
if (/sb_secret_|service_role/.test(JSON.stringify(env))) {
  problemas.push(
    "HAY UNA CLAVE SECRETA EN .env.local. Quítala: se salta todas las políticas " +
      "y acabaría dentro de la app."
  );
}
if (problemas.length) {
  problemas.forEach((p) => console.error("  ✗", p));
  process.exit(1);
}

const base = url.replace(/\/$/, "");
const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function rest(path) {
  const r = await fetch(`${base}/rest/v1/${path}`, { headers });
  return { status: r.status, body: await r.text() };
}

console.log(`Proyecto: ${base}`);
console.log(`Clave: ${key.slice(0, 14)}…  (${key.startsWith("sb_publishable_") ? "publicable, la nueva" : "antigua, se retira a finales de 2026"})`);
console.log("");

// 1. ¿Responde la API?
const ping = await rest("foods?select=id&limit=1");
if (ping.status === 401 || ping.status === 403) {
  problemas.push(`La API rechaza la clave (${ping.status}). ¿Está bien copiada?`);
} else if (ping.status >= 500) {
  problemas.push(`El proyecto no responde (${ping.status}).`);
} else {
  bien.push("La API responde y acepta la clave");
}

// 2. ¿Están las tablas? (si faltan, PostgREST devuelve 404 con PGRST205)
for (const t of ["foods", "profiles", "log_entries", "meal_slots", "goals"]) {
  const r = await rest(`${t}?select=*&limit=1`);
  if (r.status === 404 || r.body.includes("PGRST205")) {
    problemas.push(`Falta la tabla "${t}". ¿Se aplicaron las migraciones?`);
  } else {
    bien.push(`Tabla "${t}" existe`);
  }
}

// 3. ¿Están los 49 alimentos? El catálogo es de lectura pública.
const foods = await rest("foods?select=id");
if (foods.status === 200) {
  let n = 0;
  try {
    n = JSON.parse(foods.body).length;
  } catch {}
  if (n === 0) problemas.push("La tabla foods está vacía. Falta cargar supabase/seed.sql.");
  else if (n < 49) bien.push(`foods tiene ${n} filas (esperábamos 49; puede ser el límite por defecto)`);
  else bien.push(`foods tiene al menos ${n} filas`);
}

// 4. LO IMPORTANTE: sin sesión, los datos de usuario NO deben verse.
for (const t of ["profiles", "log_entries", "weight_entries", "goals"]) {
  const r = await rest(`${t}?select=*`);
  let filas = -1;
  try {
    filas = JSON.parse(r.body).length;
  } catch {}
  if (filas > 0) {
    problemas.push(
      `RLS NO PROTEGE "${t}": sin sesión se leen ${filas} filas. Esto es grave.`
    );
  } else {
    bien.push(`RLS tapa "${t}" sin sesión`);
  }
}

console.log("Bien:");
bien.forEach((b) => console.log("  ✓", b));
if (problemas.length) {
  console.log("\nProblemas:");
  problemas.forEach((p) => console.log("  ✗", p));
  console.log(
    "\nOJO: esto comprueba que un desconocido no ve nada. Que un usuario no vea\n" +
      "los datos de OTRO usuario hay que probarlo con dos cuentas, en /replica-test."
  );
  process.exit(1);
}
console.log(
  "\nTodo correcto.\nFalta la prueba de los dos usuarios, que necesita dos cuentas reales: /replica-test."
);
