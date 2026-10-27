import { expect, test } from "@playwright/test";
import { accesibilidad, altaCompleta, empezarLimpio, sinErrores, vigilar } from "./helpers";

test.describe("F02 — Registrar una comida", () => {
  test.beforeEach(async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await expect(page.getByText("Hoy")).toBeVisible();
  });

  test("F02-H1: buscar, elegir cantidad y registrar suma en el día", async ({ page }) => {
    const errores = vigilar(page);

    await expect(page.getByText(/Te quedan \d+ kcal/)).toBeVisible();

    await page.getByRole("button", { name: "Añadir" }).nth(1).click();
    await page.getByLabel("Buscar alimento").fill("lentejas");
    await page.getByRole("button", { name: /Lentejas cocidas/ }).click();
    await page.getByLabel("Cantidad en gramos").fill("250");

    // 116 kcal/100 g en la semilla de USDA -> 290 kcal
    await expect(page.getByText("290 kcal")).toBeVisible();
    await page.getByRole("button", { name: /Registrar en/ }).click();

    await expect(page.getByRole("button", { name: /Lentejas cocidas, 290 kcal/ })).toBeVisible();
    await expect(page.getByText("290", { exact: true })).toBeVisible();
    sinErrores(errores);
  });

  test("F02-E1: sin resultados ofrece una salida, no una pantalla vacía", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("galletas artiach");
    await expect(page.getByText(/No encontramos/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear este alimento" })).toBeVisible();
  });

  test("F02-E2: buscar sin tilde encuentra el alimento con tilde", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("platano");
    await expect(page.getByRole("button", { name: /Plátano/ })).toBeVisible();
  });

  test("F02-E3: la cantidad acepta una operación", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("lentejas");
    await page.getByRole("button", { name: /Lentejas cocidas/ }).click();
    await page.getByLabel("Cantidad en gramos").fill("150+100");
    await expect(page.getByText("290 kcal")).toBeVisible();
  });

  test("F02-E4: cantidades inválidas bloquean el registro", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("lentejas");
    await page.getByRole("button", { name: /Lentejas cocidas/ }).click();

    for (const valor of ["0", "-50", "abc", ""]) {
      await page.getByLabel("Cantidad en gramos").fill(valor);
      await expect(page.getByText("Escribe un número mayor que cero")).toBeVisible();
      await expect(page.getByRole("button", { name: /Registrar en/ })).toBeDisabled();
    }
  });

  test("F02-E5: doble clic en registrar NO crea dos entradas", async ({ page }) => {
    const errores = vigilar(page);
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("lentejas");
    await page.getByRole("button", { name: /Lentejas cocidas/ }).click();
    await page.getByLabel("Cantidad en gramos").fill("100");

    const boton = page.getByRole("button", { name: /Registrar en/ });
    await boton.dblclick();

    await expect(page.getByRole("button", { name: /Lentejas cocidas/ })).toHaveCount(1);
    await expect(page.getByText("116", { exact: true })).toBeVisible();
    sinErrores(errores);
  });

  test("F02-E8: el registro sobrevive a una recarga", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("huevo");
    await page.getByRole("button", { name: /Huevo cocido/ }).click();
    await page.getByLabel("Cantidad en gramos").fill("100");
    await page.getByRole("button", { name: /Registrar en/ }).click();
    await expect(page.getByRole("button", { name: /Huevo cocido/ })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: /Huevo cocido/ })).toBeVisible();
  });

  test("F02-N1: mantener pulsado borra y el total baja", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("huevo");
    await page.getByRole("button", { name: /Huevo cocido/ }).click();
    await page.getByLabel("Cantidad en gramos").fill("100");
    await page.getByRole("button", { name: /Registrar en/ }).click();

    const fila = page.getByRole("button", { name: /Huevo cocido/ });
    await expect(fila).toBeVisible();
    await fila.click({ delay: 900 });
    await expect(fila).toHaveCount(0);
    await expect(page.getByText("0", { exact: true })).toBeVisible();
  });

  test("F02-A11y: el diario y la búsqueda no tienen fallos graves", async ({ page }) => {
    await accesibilidad(page, "diario");
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await accesibilidad(page, "buscar alimento");
  });
});
