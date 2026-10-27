import { expect, test } from "@playwright/test";
import { accesibilidad, altaCompleta, empezarLimpio, sinErrores, vigilar } from "./helpers";

test.describe("F01 — Alta y cálculo de objetivos", () => {
  test("F01-H1: rellenar los datos muestra el objetivo y deja empezar", async ({ page }) => {
    const errores = vigilar(page);
    await empezarLimpio(page);

    await expect(page.getByText("Tus datos")).toBeVisible();
    await expect(page.getByText("Rellena los tres campos")).toBeVisible();

    await page.getByRole("button", { name: "Mujer" }).click();
    await page.getByLabel("Año de nacimiento").fill("1988");
    await page.getByLabel("Altura (cm)").fill("178");
    await page.getByLabel("Peso (kg)").fill("82");
    await page.getByRole("button", { name: "Ligero" }).click();
    await page.getByRole("button", { name: "Bajar peso" }).click();

    // Mifflin-St Jeor para mujer de 38 anos, 178 cm, 82 kg, factor 1,375.
    await expect(page.getByText(/Con este objetivo, tu meta diaria es de \d+ kcal/)).toBeVisible();
    await expect(page.getByText(/Proteína \d+ g/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Empezar" })).toBeEnabled();

    sinErrores(errores);
  });

  test("F01-E1: sin datos no se puede continuar", async ({ page }) => {
    await empezarLimpio(page);
    await expect(page.getByRole("button", { name: "Empezar" })).toHaveCount(0);
    await expect(page.getByText("Rellena los tres campos")).toBeVisible();
  });

  test("F01-E2: valores imposibles dan error por campo", async ({ page }) => {
    const errores = vigilar(page);
    await empezarLimpio(page);

    await page.getByLabel("Año de nacimiento").fill("1800");
    await expect(page.getByText(/Introduce un año entre 1920/)).toBeVisible();

    await page.getByLabel("Altura (cm)").fill("5");
    await expect(page.getByText("Entre 80 y 260 cm")).toBeVisible();

    await page.getByLabel("Peso (kg)").fill("2");
    await expect(page.getByText("Entre 20 y 400 kg")).toBeVisible();

    await expect(page.getByRole("button", { name: "Empezar" })).toHaveCount(0);
    sinErrores(errores);
  });

  test("F01-E3: decimales con coma se aceptan", async ({ page }) => {
    await empezarLimpio(page);
    await page.getByLabel("Año de nacimiento").fill("1988");
    await page.getByLabel("Altura (cm)").fill("178,5");
    await page.getByLabel("Peso (kg)").fill("82,4");
    await expect(page.getByText("Entre 80 y 260 cm")).toHaveCount(0);
    await expect(page.getByText("Entre 20 y 400 kg")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Empezar" })).toBeVisible();
  });

  test("F01-N1: un objetivo por debajo del suelo se bloquea y se explica", async ({ page }) => {
    const errores = vigilar(page);
    await empezarLimpio(page);

    // Persona pequena, sedentaria, con deficit: el calculo cae bajo 1200 kcal.
    await page.getByRole("button", { name: "Mujer" }).click();
    await page.getByLabel("Año de nacimiento").fill("1960");
    await page.getByLabel("Altura (cm)").fill("150");
    await page.getByLabel("Peso (kg)").fill("45");
    await page.getByRole("button", { name: "Sedentario" }).click();
    await page.getByRole("button", { name: "Bajar peso" }).click();

    await expect(page.getByText(/por debajo de 1200 kcal/)).toBeVisible();
    // No culpa al usuario ni dramatiza.
    await expect(page.getByText(/No podemos ponerlo como meta/)).toBeVisible();
    sinErrores(errores);
  });

  test("F01-N2: no se admite a menores de 13", async ({ page }) => {
    await empezarLimpio(page);
    const hace12 = new Date().getFullYear() - 12;
    await page.getByLabel("Año de nacimiento").fill(String(hace12));
    await expect(page.getByText(/Introduce un año entre 1920/)).toBeVisible();
  });

  test("F01-E4: recargar a mitad no deja datos a medias", async ({ page }) => {
    await empezarLimpio(page);
    await page.getByLabel("Altura (cm)").fill("178");
    await page.reload();
    await expect(page.getByLabel("Altura (cm)")).toHaveValue("");
    await expect(page.getByText("Tus datos")).toBeVisible();
  });

  test("F01-E6: se completa solo con teclado", async ({ page }) => {
    await empezarLimpio(page);
    await page.getByLabel("Año de nacimiento").focus();
    await page.keyboard.type("1988");
    await page.keyboard.press("Tab");
    await page.keyboard.type("178");
    await page.keyboard.press("Tab");
    await page.keyboard.type("82");
    await expect(page.getByRole("button", { name: "Empezar" })).toBeVisible();
  });

  test("F01-A11y: la pantalla de alta no tiene fallos graves", async ({ page }) => {
    await empezarLimpio(page);
    await accesibilidad(page, "alta");
  });

  test("F01-E5: a 375px nada desborda", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await empezarLimpio(page);
    await altaCompleta(page);
    const desborda = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(desborda, "la página se desplaza en horizontal a 375px").toBe(false);
  });
});
