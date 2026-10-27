/**
 * Diagnostica mobile/.env.local sin enseñar los valores.
 * Mira los bytes, no el texto, porque la codificación es sospechosa habitual.
 *
 *   node tools/env_status.mjs
 */
import { readFileSync, statSync } from "node:fs";

const P = "mobile/.env.local";

let buf, st;
try {
  buf = readFileSync(P);
  st = statSync(P);
} catch (e) {
  console.log(`NO EXISTE ${P}  (${e.code})`);
  process.exit(1);
}

const head = buf.subarray(0, 4);
let bom = "sin BOM";
if (head[0] === 0xef && head[1] === 0xbb && head[2] === 0xbf) bom = "BOM UTF-8";
else if (head[0] === 0xff && head[1] === 0xfe) bom = "BOM UTF-16 LE";
else if (head[0] === 0xfe && head[1] === 0xff) bom = "BOM UTF-16 BE";

// Muchos bytes cero = UTF-16 aunque no haya BOM
const ceros = buf.subarray(0, Math.min(400, buf.length)).filter((b) => b === 0).length;
const pareceUtf16 = ceros > 20;

console.log(`fichero:    ${P}`);
console.log(`tamano:     ${buf.length} bytes`);
console.log(`modificado: ${st.mtime.toLocaleString()}`);
console.log(`cabecera:   ${bom}${pareceUtf16 ? "  (parece UTF-16: muchos bytes cero)" : ""}`);
console.log(`primeros bytes: ${head.toString("hex")}`);
console.log("");

let texto;
if (pareceUtf16 || bom.includes("UTF-16")) texto = buf.toString("utf16le");
else texto = buf.toString("utf8").replace(/^﻿/, "");

const lineas = texto.split(/\r?\n/);
console.log(`lineas: ${lineas.length}`);
console.log("");

let conValor = 0;
lineas.forEach((l, i) => {
  const n = i + 1;
  const limpia = l.trim();
  if (!limpia) return;
  if (limpia.startsWith("#")) {
    console.log(`  ${String(n).padStart(2)}  (comentario)`);
    return;
  }
  const m = limpia.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (!m) {
    console.log(`  ${String(n).padStart(2)}  SIN "=" -> "${limpia.slice(0, 24)}..."  <-- esta linea no sirve`);
    return;
  }
  const [, k, v] = m;
  if (!v) {
    console.log(`  ${String(n).padStart(2)}  ${k} = (vacio)`);
  } else {
    conValor++;
    const pista = k.includes("URL") ? v.slice(0, 32) : v.slice(0, 12) + "…";
    const avisos = [];
    if (/^["']|["']$/.test(v)) avisos.push("tiene comillas, quitalas");
    if (/\s/.test(v)) avisos.push("tiene espacios");
    console.log(`  ${String(n).padStart(2)}  ${k} = ${pista}   (${v.length} caracteres)${avisos.length ? "  <-- " + avisos.join(", ") : ""}`);
  }
});

console.log("");
console.log(conValor === 0
  ? "NINGUNA variable tiene valor."
  : `${conValor} variable(s) con valor.`);
