import { expect, test } from "@playwright/test";
import { accesibilidad, altaCompleta, empezarLimpio, sinErrores, vigilar } from "./helpers";

/** F13 — el desglose de macros en el diario (S04).
 *
 *  La original los tiene; nosotros los teníamos solo en el detalle del
 *  alimento, que es justo donde no sirven: lo que quieres saber es cómo va
 *  EL DÍA, no cuánta proteína llevaba aquella lata.
 *
 *  Lo que de verdad prueban estos casos no es la suma, es el hueco: un
 *  alimento puede traer calorías y no traer fibra, y sumar cero sería decir
 *  "cero gramos de fibra" cuando lo cierto es "no lo sé". */

/** Crea un alimento desde la búsqueda. Sin fibra si no se pide. */
async function crearAlimento(
  page: import("@playwright/test").Page,
  nombre: string,
  macros: { kcal: string; prot: string; carb: string; gras: string; fibra?: string },
) {
  await page.getByLabel("Buscar alimento").fill(nombre);
  await page.getByRole("button", { name: "Crear este alimento" }).click();
  await page.getByLabel("Calorías por 100 g").fill(macros.kcal);
  await page.getByLabel("Proteína por 100 g (g)").fill(macros.prot);
  await page.getByLabel("Carbohidratos por 100 g (g)").fill(macros.carb);
  await page.getByLabel("Grasa por 100 g (g)").fill(macros.gras);
  if (macros.fibra !== undefined) {
    await page.getByLabel("Fibra por 100 g (g, opcional)").fill(macros.fibra);
  }
  await page.getByRole("button", { name: "Guardar alimento" }).click();
}

async function registrar(
  page: import("@playwright/test").Page,
  busqueda: string,
  gramos: string,
) {
  await page.getByLabel("Buscar alimento").fill(busqueda);
  await page.getByRole("button", { name: new RegExp(busqueda, "i") }).first().click();
  await page.getByLabel("Cantidad en gramos").fill(gramos);
  await page.getByRole("button", { name: /Registrar en/ }).click();
}

test.describe("F13 — Macros del día", () => {
  test.beforeEach(async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await expect(page.getByText("Hoy")).toBeVisible();
  });

  test("F13-H1: lo registrado se desglosa en los cuatro macros", async ({ page }) => {
    const errores = vigilar(page);

    await page.getByRole("button", { name: "Añadir" }).nth(1).click();
    await registrar(page, "lentejas", "250");

    // Lentejas cocidas en la semilla de USDA, por 100 g: 9,02 P / 20,1 C /
    // 0,38 G / 7,9 F. A 250 g: 23 / 50 / 1 / 20.
    await expect(page.getByText(/^23 de \d+ g$/)).toBeVisible();
    await expect(page.getByText(/^50 de \d+ g$/)).toBeVisible();
    await expect(page.getByText(/^1 de \d+ g$/)).toBeVisible();

    // La fibra va sin meta: el objetivo que calcula el alta no la incluye y
    // no nos inventamos una.
    await expect(page.getByText("20 g", { exact: true })).toBeVisible();

    sinErrores(errores);
  });

  test("F13-H2: dos registros suman", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).nth(1).click();
    await registrar(page, "lentejas", "250");
    await page.getByRole("button", { name: "Añadir" }).nth(1).click();
    await registrar(page, "lentejas", "250");

    await expect(page.getByText(/^46 de \d+ g$/)).toBeVisible();
    await expect(page.getByText("40 g", { exact: true })).toBeVisible();
  });

  test("F13-E1: el día vacío muestra cero contra la meta, no «sin datos»", async ({
    page,
  }) => {
    await expect(page.getByText(/^0 de \d+ g$/).first()).toBeVisible();
    await expect(page.getByText("sin datos")).toHaveCount(0);
  });

  test("F13-E2: si a un registro le falta la fibra, el total lo dice", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    // Sin fibra: el campo es opcional y mucha etiqueta no la trae.
    await crearAlimento(page, "galletas sin etiqueta", {
      kcal: "450",
      prot: "7",
      carb: "72",
      gras: "15",
    });
    await registrar(page, "galletas sin etiqueta", "100");

    // Las lentejas sí la traen: así el total de fibra existe pero va corto.
    await page.getByRole("button", { name: "Añadir" }).nth(1).click();
    await registrar(page, "lentejas", "100");

    await expect(page.getByText(/Falta el dato de fibra en un registro/)).toBeVisible();
    await expect(page.getByText(/se queda corto/)).toBeVisible();
  });

  test("F13-E3: si NINGÚN registro trae fibra, dice «sin datos», no «0 g»", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await crearAlimento(page, "galletas sin etiqueta", {
      kcal: "450",
      prot: "7",
      carb: "72",
      gras: "15",
    });
    await registrar(page, "galletas sin etiqueta", "100");

    await expect(page.getByText("sin datos")).toBeVisible();
    // Cero gramos de fibra es una afirmación, y no la estamos haciendo.
    await expect(page.getByText("0 g", { exact: true })).toHaveCount(0);

    // Y NO se avisa de que «ese total se queda corto»: no hay total que se
    // quede corto. Las dos frases juntas se contradicen.
    await expect(page.getByText(/se queda corto/)).toHaveCount(0);
  });

  test("F13-E4: los totales sobreviven a recargar", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).nth(1).click();
    await registrar(page, "lentejas", "250");
    await page.reload();

    await expect(page.getByText(/^23 de \d+ g$/)).toBeVisible();
    await expect(page.getByText("20 g", { exact: true })).toBeVisible();
  });

  test("F13-E5: un plato de la carta también desglosa", async ({ page }) => {
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await page.getByRole("button", { name: /Avena con plátano/ }).click();
    await page.getByRole("button", { name: /^Añadir a/ }).click();

    // Por ración: 16,3 P / 65,9 C / 3,9 G.
    await expect(page.getByText(/^16 de \d+ g$/)).toBeVisible();
    await expect(page.getByText(/^66 de \d+ g$/)).toBeVisible();
    await expect(page.getByText(/^4 de \d+ g$/)).toBeVisible();
  });

  test("F13-A1: el diario con macros es accesible", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).nth(1).click();
    await registrar(page, "lentejas", "250");
    await accesibilidad(page, "diario con macros");
  });
});
