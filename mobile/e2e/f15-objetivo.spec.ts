import { expect, test } from "@playwright/test";
import { accesibilidad, altaCompleta, empezarLimpio, sinErrores, vigilar } from "./helpers";

/** F15 — cambiar el objetivo.
 *
 *  En la original esto es premium: el cuestionario calcula un número y, si no
 *  te convence, pagas o te aguantas.
 *
 *  El caso que manda es N1. Dos reseñas independientes cuentan que la original
 *  acepta déficits peligrosos, y los 1.200 kcal son nuestra respuesta a eso.
 *  Dejar que se editen sin suelo sería quitarnos lo único con lo que de verdad
 *  podemos decir que somos más seguros. */

async function abrirObjetivo(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Cambiar el objetivo" }).click();
  await expect(page.getByText("Tu objetivo")).toBeVisible();
}

test.describe("F15 — Cambiar el objetivo", () => {
  test.beforeEach(async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await expect(page.getByText("Hoy")).toBeVisible();
  });

  test("F15-H1: cambiar las calorías se ve en el diario", async ({ page }) => {
    const errores = vigilar(page);

    await abrirObjetivo(page);
    await page.getByLabel("Calorías al día", { exact: true }).fill("2000");
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByText("Te quedan 2000 kcal")).toBeVisible();
    sinErrores(errores);
  });

  test("F15-H2: cambiar los macros se ve en el desglose del diario", async ({ page }) => {
    await abrirObjetivo(page);
    await page.getByLabel("Proteína", { exact: true }).fill("150");
    await page.getByRole("button", { name: "Cuadrar los carbohidratos" }).click();
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByText("0 de 150 g")).toBeVisible();
  });

  test("F15-N1: por debajo de 1.200 kcal no se guarda", async ({ page }) => {
    await abrirObjetivo(page);
    await page.getByLabel("Calorías al día", { exact: true }).fill("900");

    await expect(page.getByText("No bajamos de 1200")).toBeVisible();
    await expect(page.getByText(/no se come bien/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  test("F15-N2: 1.200 justo sí se puede: el suelo es suelo, no pared", async ({
    page,
  }) => {
    await abrirObjetivo(page);
    await page.getByLabel("Calorías al día", { exact: true }).fill("1200");
    await expect(page.getByRole("button", { name: "Guardar" })).toBeEnabled();
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Te quedan 1200 kcal")).toBeVisible();
  });

  test("F15-E1: avisa si los macros no suman las calorías, pero deja guardar", async ({
    page,
  }) => {
    await abrirObjetivo(page);
    await page.getByLabel("Calorías al día", { exact: true }).fill("2000");
    await page.getByLabel("Proteína", { exact: true }).fill("50");
    await page.getByLabel("Carbohidratos", { exact: true }).fill("50");
    await page.getByLabel("Grasa", { exact: true }).fill("20");

    // 4·50 + 4·50 + 9·20 = 580
    await expect(page.getByText("580 kcal")).toBeVisible();
    await expect(page.getByText(/1420 kcal menos que tu meta/)).toBeVisible();
    // Es tu cuenta: se avisa, no se bloquea.
    await expect(page.getByRole("button", { name: "Guardar" })).toBeEnabled();
  });

  test("F15-E2: «Cuadrar» ajusta los carbohidratos a las calorías", async ({ page }) => {
    await abrirObjetivo(page);
    await page.getByLabel("Calorías al día", { exact: true }).fill("2000");
    await page.getByLabel("Proteína", { exact: true }).fill("150");
    await page.getByLabel("Grasa", { exact: true }).fill("60");
    await page.getByRole("button", { name: "Cuadrar los carbohidratos" }).click();

    // (2000 - 150·4 - 60·9) / 4 = 215
    await expect(page.getByLabel("Carbohidratos", { exact: true })).toHaveValue("215");
    await expect(page.getByRole("button", { name: "Cuadrar los carbohidratos" })).toHaveCount(0);
  });

  test("F15-E3: «Volver a calcularlo» usa el peso más reciente, no el del alta", async ({
    page,
  }) => {
    // El alta fue con 82 kg. Nos pesamos con 75.
    await page.getByRole("button", { name: "Progreso" }).click();
    await page.getByLabel(/Peso de hoy/).fill("75");
    await page.getByRole("button", { name: /Anotar|Guardar/ }).first().click();
    await page.getByRole("button", { name: /Volver/ }).click();

    await abrirObjetivo(page);
    await expect(page.getByText(/con los 75 kg que anotaste la última vez/)).toBeVisible();

    await page.getByRole("button", { name: "Volver a calcularlo" }).click();
    // 7 kg menos bajan el gasto: la meta tiene que bajar también.
    const kcal = await page.getByLabel("Calorías al día", { exact: true }).inputValue();
    expect(Number(kcal)).toBeLessThan(2175);
    expect(Number(kcal)).toBeGreaterThan(1200);
  });

  test("F15-E4: sin pesarse, dice que usa el peso del alta", async ({ page }) => {
    await abrirObjetivo(page);
    await expect(page.getByText(/con los 82 kg que pusiste al empezar/)).toBeVisible();
    await expect(page.getByText(/Si te pesas en Progreso, usaremos ese/)).toBeVisible();
  });

  test("F15-E5: el objetivo cambiado sobrevive a recargar", async ({ page }) => {
    await abrirObjetivo(page);
    await page.getByLabel("Calorías al día", { exact: true }).fill("1800");
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.reload();
    await expect(page.getByText("Te quedan 1800 kcal")).toBeVisible();
  });

  test("F15-E6: dejar las calorías en blanco no guarda", async ({ page }) => {
    await abrirObjetivo(page);
    await page.getByLabel("Calorías al día", { exact: true }).fill("");
    await expect(page.getByText("Escribe un número")).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  test("F15-A1: la pantalla del objetivo es accesible", async ({ page }) => {
    await abrirObjetivo(page);
    await accesibilidad(page, "cambiar objetivo");
  });
});
