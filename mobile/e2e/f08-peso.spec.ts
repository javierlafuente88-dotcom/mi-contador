import { expect, test } from "@playwright/test";
import { accesibilidad, altaCompleta, empezarLimpio, sinErrores, vigilar } from "./helpers";

/** F08 — Peso y progreso. */

test.describe("F08 — Progreso", () => {
  test.beforeEach(async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await expect(page.getByText("Hoy")).toBeVisible();
    await page.getByRole("button", { name: "Progreso" }).click();
    await expect(page.getByText("Progreso", { exact: true })).toBeVisible();
  });

  test("F08-H1: anotar un peso lo muestra como cifra del día", async ({ page }) => {
    const errores = vigilar(page);
    await expect(page.getByText(/Todavía no has anotado ningún peso/)).toBeVisible();

    await page.getByLabel("Peso de hoy (kg)").fill("82,4");
    await page.getByRole("button", { name: "Anotar" }).click();

    await expect(page.getByText("Peso de hoy", { exact: true })).toBeVisible();
    await expect(page.getByText(/82\,4 kg/).first()).toBeVisible();
    await expect(page.getByText(/Con un solo registro no hay tendencia/)).toBeVisible();
    sinErrores(errores);
  });

  test("F08-E1: un peso imposible no se admite", async ({ page }) => {
    for (const v of ["5", "900", "abc"]) {
      await page.getByLabel("Peso de hoy (kg)").fill(v);
      await expect(page.getByText("Un peso entre 20 y 400 kg")).toBeVisible();
      await expect(page.getByRole("button", { name: "Anotar" })).toBeDisabled();
    }
  });

  test("F08-E2: dos pesos el mismo día no se acumulan, se corrige", async ({ page }) => {
    await page.getByLabel("Peso de hoy (kg)").fill("82");
    await page.getByRole("button", { name: "Anotar" }).click();
    await expect(page.getByText(/82\,0 kg/).first()).toBeVisible();

    // El campo cambia de nombre: ya no es anotar, es corregir.
    await page.getByLabel("Corregir el peso de hoy").fill("81,5");
    await page.getByRole("button", { name: "Corregir" }).click();

    await expect(page.getByText(/81\,5 kg/).first()).toBeVisible();
    // Un solo registro en el historial, no dos.
    await expect(page.getByRole("button", { name: /kg$/ })).toHaveCount(1);
  });

  test("F08-E3: el peso sobrevive a una recarga", async ({ page }) => {
    await page.getByLabel("Peso de hoy (kg)").fill("79,8");
    await page.getByRole("button", { name: "Anotar" }).click();
    await page.reload();
    await expect(page.getByText("Hoy")).toBeVisible();
    await page.getByRole("button", { name: "Progreso" }).click();
    await expect(page.getByText(/79\,8 kg/).first()).toBeVisible();
  });

  test("F08-N1: mantener pulsado quita un registro", async ({ page }) => {
    await page.getByLabel("Peso de hoy (kg)").fill("82");
    await page.getByRole("button", { name: "Anotar" }).click();
    const fila = page.getByRole("button", { name: /kg$/ });
    await expect(fila).toHaveCount(1);
    await fila.click({ delay: 900 });
    await expect(page.getByText(/Todavía no has anotado ningún peso/)).toBeVisible();
  });

  test("F08-A11y: progreso no tiene fallos graves y la gráfica se describe", async ({ page }) => {
    await page.getByLabel("Peso de hoy (kg)").fill("82");
    await page.getByRole("button", { name: "Anotar" }).click();
    // La grafica no puede ser solo pixels: lleva descripcion.
    await expect(page.getByRole("img", { name: /Gráfica de peso/ })).toBeVisible();
    await accesibilidad(page, "progreso");
  });

  test("F08-E4: no se felicita ni se reprocha", async ({ page }) => {
    await page.getByLabel("Peso de hoy (kg)").fill("82");
    await page.getByRole("button", { name: "Anotar" }).click();
    const texto = await page.locator("body").innerText();
    expect(texto).not.toMatch(/enhorabuena|felicidades|bien hecho|mal|deberías|fracas/i);
  });
});
