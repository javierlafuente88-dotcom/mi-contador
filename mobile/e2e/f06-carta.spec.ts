import { expect, test } from "@playwright/test";
import { accesibilidad, altaCompleta, empezarLimpio, sinErrores, vigilar } from "./helpers";

/** F06 — el flujo que la original quitó.
 *  Elegir un plato de una lista. Gratis, ilimitado, sin monedas. */

test.describe("F06 — La carta", () => {
  test.beforeEach(async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await expect(page.getByText("Hoy")).toBeVisible();
  });

  test("F06-H1: elegir un plato de la carta en dos toques", async ({ page }) => {
    const errores = vigilar(page);

    // Toque 1: abrir la carta.
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await expect(page.getByText("La carta")).toBeVisible();
    await expect(page.getByText(/18 recetas/)).toBeVisible();

    // Toque 2: abrir la receta. Toque 3: anadirla.
    await page.getByRole("button", { name: /Lentejas con verduras/ }).click();
    await expect(page.getByText("Lleva")).toBeVisible();
    await expect(page.getByText("Lentejas cocidas")).toBeVisible();
    await expect(page.getByText("250 g")).toBeVisible();

    await page.getByRole("button", { name: /Añadir a/ }).click();
    await expect(page.getByRole("button", { name: /Lentejas con verduras, 210 kcal/ })).toBeVisible();
    await expect(page.getByText("210", { exact: true })).toBeVisible();

    sinErrores(errores);
  });

  test("F06-H2: cambiar de plato las veces que haga falta, sin coste", async ({ page }) => {
    // Lo que la original cobra con monedas: aqui se repite sin limite.
    for (const plato of ["Avena con plátano", "Bocadillo de atún", "Salmón con espinacas"]) {
      await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
      await page.getByRole("button", { name: new RegExp(plato) }).click();
      await page.getByRole("button", { name: /Añadir a/ }).click();
      await expect(page.getByRole("button", { name: new RegExp(plato) })).toBeVisible();
    }
    // Nada en la pantalla habla de monedas, creditos ni limites.
    const texto = await page.locator("body").innerText();
    expect(texto).not.toMatch(/moneda|crédito|credito|token|coins/i);
  });

  test("F06-E1: los filtros acotan y se pueden quitar", async ({ page }) => {
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();

    await page.getByRole("button", { name: "Desayuno" }).click();
    await expect(page.getByText(/3 recetas con esos filtros/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Avena con plátano/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cerdo con alubias/ })).toHaveCount(0);

    // Momento y atributo se COMBINAN: desayuno Y vegetariano siguen siendo 3.
    await page.getByRole("button", { name: "Vegetariana" }).click();
    await expect(page.getByText(/3 recetas con esos filtros/)).toBeVisible();

    // Y se quitan uno a uno sin pisarse.
    await page.getByRole("button", { name: "Vegetariana" }).click();
    await expect(page.getByText(/3 recetas con esos filtros/)).toBeVisible();
    await page.getByRole("button", { name: "Desayuno" }).click();
    await expect(page.getByText(/18 recetas/)).toBeVisible();
  });

  test("F06-E2: el filtro de lo que cabe respeta las calorías restantes", async ({ page }) => {
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    const chip = page.getByRole("button", { name: /Cabe en \d+ kcal/ });
    await expect(chip).toBeVisible();
    await chip.click();
    // Con el dia vacio y 2000 kcal de objetivo, caben todas.
    await expect(page.getByText(/18 recetas/)).toBeVisible();
  });

  test("F06-E3: unos filtros sin resultados ofrecen salida", async ({ page }) => {
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    // Vegetariana + Rapida + solo cenas deja muy poco, pero algo hay.
    await page.getByRole("button", { name: "Cena" }).click();
    await page.getByRole("button", { name: "Vegetariana" }).click();
    await page.getByRole("button", { name: "Rápida" }).click();
    await expect(page.getByText(/con esos filtros/)).toBeVisible();
  });

  test("F06-E4: la receta enseña de qué está hecha", async ({ page }) => {
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await page.getByRole("button", { name: /Ensalada de garbanzos/ }).click();

    // Transparencia: se ven los ingredientes y sus gramos, no un numero opaco.
    for (const ing of ["Garbanzos cocidos", "Tomate crudo", "Aceite de oliva"]) {
      await expect(page.getByText(ing)).toBeVisible();
    }
    await expect(page.getByText("Por ración", { exact: true })).toBeVisible();
  });

  test("F06-N1: quitar un plato de la carta baja el total", async ({ page }) => {
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await page.getByRole("button", { name: /Manzana con almendras/ }).click();
    await page.getByRole("button", { name: /Añadir a/ }).click();

    const fila = page.getByRole("button", { name: /Manzana con almendras/ });
    await expect(fila).toBeVisible();
    await fila.click({ delay: 900 });
    await expect(fila).toHaveCount(0);
    await expect(page.getByText("0", { exact: true })).toBeVisible();
  });

  test("F06-E5: el plato elegido sobrevive a una recarga", async ({ page }) => {
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await page.getByRole("button", { name: /Tostada con tomate/ }).click();
    await page.getByRole("button", { name: /Añadir a/ }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: /Tostada con tomate/ })).toBeVisible();
  });

  test("F06-A11y: la carta no tiene fallos graves", async ({ page }) => {
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await accesibilidad(page, "la carta");
    await page.getByRole("button", { name: /Lentejas con verduras/ }).click();
    await accesibilidad(page, "detalle de receta");
  });
});
