import { expect, test } from "@playwright/test";
import { accesibilidad, altaCompleta, empezarLimpio, sinErrores, vigilar } from "./helpers";

/** S11 y S12 — crear alimentos y recetas propias.
 *  Lo que desatasca nuestro punto débil: 49 alimentos es poco. */

test.describe("Crear alimentos y recetas", () => {
  test.beforeEach(async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await expect(page.getByText("Hoy")).toBeVisible();
  });

  test("S11-H1: crear un alimento y poder registrarlo", async ({ page }) => {
    const errores = vigilar(page);

    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("galletas artiach");
    await page.getByRole("button", { name: "Crear este alimento" }).click();

    // El nombre buscado llega puesto: no hay que escribirlo dos veces.
    await expect(page.getByLabel("Nombre")).toHaveValue("galletas artiach");

    await page.getByLabel("Calorías por 100 g").fill("450");
    await page.getByLabel("Proteína por 100 g (g)").fill("7");
    await page.getByLabel("Carbohidratos por 100 g (g)").fill("72");
    await page.getByLabel("Grasa por 100 g (g)").fill("15");
    await page.getByRole("button", { name: "Guardar alimento" }).click();

    // Vuelve a la búsqueda y ahora sí aparece.
    await page.getByLabel("Buscar alimento").fill("galletas");
    await expect(page.getByRole("button", { name: /galletas artiach/ })).toBeVisible();

    await page.getByRole("button", { name: /galletas artiach/ }).click();
    await page.getByLabel("Cantidad en gramos").fill("30");
    await expect(page.getByText("135 kcal")).toBeVisible();
    await page.getByRole("button", { name: /Registrar en/ }).click();
    await expect(page.getByText("135", { exact: true })).toBeVisible();

    sinErrores(errores);
  });

  test("S11-E1: avisa si los macros no cuadran con las calorías", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("invento");
    await page.getByRole("button", { name: "Crear este alimento" }).click();

    // 10 kcal con 50 g de grasa es imposible: 450 kcal solo de grasa.
    await page.getByLabel("Calorías por 100 g").fill("10");
    await page.getByLabel("Grasa por 100 g (g)").fill("50");
    await expect(page.getByText(/Los macros dan unas \d+ kcal/)).toBeVisible();
    // Avisa, pero no bloquea: las etiquetas a veces no cuadran de verdad.
    await expect(page.getByRole("button", { name: "Guardar alimento" })).toBeEnabled();
  });

  test("S11-E2: valores imposibles sí se bloquean", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("x");
    await page.getByRole("button", { name: "Crear este alimento" }).click();

    await page.getByLabel("Calorías por 100 g").fill("5000");
    await expect(page.getByText("Entre 0 y 900 kcal por 100 g")).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar alimento" })).toBeDisabled();

    await page.getByLabel("Calorías por 100 g").fill("400");
    await page.getByLabel("Proteína por 100 g (g)").fill("60");
    await page.getByLabel("Carbohidratos por 100 g (g)").fill("60");
    await page.getByLabel("Grasa por 100 g (g)").fill("60");
    await expect(page.getByText(/suman más de 100 g/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar alimento" })).toBeDisabled();
  });

  test("S12-H1: crear una receta calcula sus calorías sola", async ({ page }) => {
    const errores = vigilar(page);

    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await page.getByRole("button", { name: "Crear una receta" }).click();

    await page.getByLabel("Nombre").fill("Mi ensalada");
    await page.getByLabel("Raciones").fill("2");

    // Dos ingredientes conocidos: huevo 155 kcal/100 g, tomate 18.
    // Nombres exactos: buscar "huevo" encuentra antes "Fideos de huevo cocidos".
    for (const [comida, exacto, g] of [
      ["huevo cocido", "Huevo cocido", "200"],
      ["tomate", "Tomate crudo", "100"],
    ] as const) {
      await page.getByLabel("Buscar ingrediente").fill(comida);
      await page.getByRole("button", { name: new RegExp(`^${exacto},`) }).click();
      await page.getByLabel("Cantidad en gramos").fill(g);
      await page.getByRole("button", { name: "Añadir a la receta" }).click();
    }

    // (155*2 + 18*1) / 2 raciones = 164 kcal
    await expect(page.getByText("164 kcal")).toBeVisible();

    await page.getByRole("button", { name: "Guardar receta" }).click();
    await expect(page.getByRole("button", { name: /Mi ensalada.*tuya/ })).toBeVisible();
    sinErrores(errores);
  });

  test("S12-H2: una receta propia SÍ se puede borrar", async ({ page }) => {
    // Es la queja literal de la original: las recetas con error se acumulan.
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await page.getByRole("button", { name: "Crear una receta" }).click();
    await page.getByLabel("Nombre").fill("Receta con error");
    await page.getByLabel("Buscar ingrediente").fill("huevo cocido");
    await page.getByRole("button", { name: /^Huevo cocido,/ }).click();
    await page.getByLabel("Cantidad en gramos").fill("100");
    await page.getByRole("button", { name: "Añadir a la receta" }).click();
    await page.getByRole("button", { name: "Guardar receta" }).click();

    await page.getByRole("button", { name: /Receta con error/ }).click();
    await page.getByRole("button", { name: "Borrar esta receta" }).click();

    await expect(page.getByRole("button", { name: /Receta con error/ })).toHaveCount(0);
  });

  test("S12-E1: las del catálogo NO se pueden borrar", async ({ page }) => {
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await page.getByRole("button", { name: /Lentejas con verduras/ }).click();
    await expect(page.getByRole("button", { name: "Borrar esta receta" })).toHaveCount(0);
  });

  test("S12-E2: lo creado sobrevive a una recarga", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("mi invento");
    await page.getByRole("button", { name: "Crear este alimento" }).click();
    await page.getByLabel("Calorías por 100 g").fill("200");
    await page.getByRole("button", { name: "Guardar alimento" }).click();

    await page.reload();
    await expect(page.getByText("Hoy")).toBeVisible();
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("invento");
    await expect(page.getByRole("button", { name: /mi invento/ })).toBeVisible();
  });

  test("A11y: crear alimento y crear receta", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("zzz");
    await page.getByRole("button", { name: "Crear este alimento" }).click();
    await accesibilidad(page, "crear alimento");
  });
});
