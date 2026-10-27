import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Engancha la consola y la red. Un solo error de consola o un 5xx
 *  tumban la prueba: si la app se queja, queremos enterarnos. */
export function vigilar(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errores.push(m.text());
  });
  page.on("pageerror", (e) => errores.push(String(e)));
  page.on("response", (r) => {
    if (r.status() >= 500) errores.push(`${r.status()} en ${r.url()}`);
  });
  return errores;
}

export function sinErrores(errores: string[]) {
  expect(errores, `errores de consola o red:\n${errores.join("\n")}`).toEqual([]);
}

/** El almacén local vive en localStorage (AsyncStorage en web).
 *  Cada prueba empieza con la casa limpia. */
export async function empezarLimpio(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    try {
      window.localStorage.clear();
    } catch {}
  });
  await page.reload();
}

export async function accesibilidad(page: Page, nombre: string) {
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const graves = r.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious"
  );
  expect(
    graves,
    `accesibilidad en ${nombre}:\n` +
      graves.map((v) => `  ${v.id}: ${v.help}`).join("\n")
  ).toEqual([]);
}

/** Completa el cuestionario de alta con datos válidos. */
export async function altaCompleta(page: Page, opciones?: { objetivo?: string }) {
  await page.getByRole("button", { name: "Mujer" }).click();
  await page.getByLabel("Año de nacimiento").fill("1988");
  await page.getByLabel("Altura (cm)").fill("178");
  await page.getByLabel("Peso (kg)").fill("82");
  await page.getByRole("button", { name: "Ligero" }).click();
  await page.getByRole("button", { name: opciones?.objetivo ?? "Mantener" }).click();
  await page.getByRole("button", { name: "Empezar" }).click();
}
