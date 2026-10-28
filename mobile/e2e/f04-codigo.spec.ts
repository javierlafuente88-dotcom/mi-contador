import { expect, test, type Page } from "@playwright/test";
import { altaCompleta, empezarLimpio, sinErrores, vigilar } from "./helpers";

/** F04 — Código de barras.
 *
 *  Las respuestas de Open Food Facts se interceptan: una prueba no debe
 *  depender de una API de terceros ni cargarla. Lo que se prueba es NUESTRO
 *  comportamiento ante cada respuesta posible.
 */

const CODIGO = "8410076472151";

async function irAlCodigo(page: Page) {
  await page.getByRole("button", { name: "Añadir" }).first().click();
  await page.getByRole("button", { name: "Buscar por código de barras" }).click();
  await expect(page.getByText("Código de barras")).toBeVisible();
}

async function responderOFF(page: Page, cuerpo: unknown, status = 200) {
  await page.route("**/world.openfoodfacts.org/**", async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(cuerpo),
    });
  });
}

test.describe("F04 — Código de barras", () => {
  test.beforeEach(async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await expect(page.getByText("Hoy")).toBeVisible();
  });

  test("F04-H1: un código conocido trae el producto y se puede registrar", async ({ page }) => {
    const errores = vigilar(page);
    await responderOFF(page, {
      status: 1,
      product: {
        product_name_es: "Galletas María",
        brands: "Artiach",
        nutriments: {
          "energy-kcal_100g": 450,
          proteins_100g: 7,
          carbohydrates_100g: 72,
          fat_100g: 15,
        },
      },
    });

    await irAlCodigo(page);
    await page.getByLabel("Código").fill(CODIGO);
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page.getByText("Galletas María (Artiach)")).toBeVisible();
    // La atribución de la licencia es obligatoria, no decorativa.
    await expect(page.getByText(/Open Food Facts, bajo licencia ODbL/)).toBeVisible();
    await expect(page.getByText("450 kcal/100 g")).toBeVisible();

    await page.getByRole("button", { name: /Usar en/ }).click();
    await expect(page.getByRole("button", { name: /Galletas María/ })).toBeVisible();
    sinErrores(errores);
  });

  test("F04-E1: un código que no está explica el hueco y ofrece crearlo", async ({ page }) => {
    await responderOFF(page, { status: 0 });
    await irAlCodigo(page);
    await page.getByLabel("Código").fill(CODIGO);
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page.getByText(/no está en Open Food Facts/)).toBeVisible();
    // Honestidad sobre la cobertura, con las cifras que medimos.
    await expect(page.getByText(/M[ée]xico hay unos 18.000 productos/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear este alimento" })).toBeVisible();
  });

  test("F04-E2: un producto sin calorías no se acepta a medias", async ({ page }) => {
    await responderOFF(page, {
      status: 1,
      product: { product_name: "Algo", nutriments: { proteins_100g: 3 } },
    });
    await irAlCodigo(page);
    await page.getByLabel("Código").fill(CODIGO);
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page.getByText(/sin calorías por 100 g/)).toBeVisible();
    await expect(page.getByText(/dato a medias es peor que ninguno/)).toBeVisible();
  });

  test("F04-E3: si el servicio falla, se dice y se ofrece salida", async ({ page }) => {
    await responderOFF(page, {}, 503);
    await irAlCodigo(page);
    await page.getByLabel("Código").fill(CODIGO);
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page.getByText(/respondió 503/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear este alimento" })).toBeVisible();
  });

  test("F04-E4: un código mal formado no llega a consultarse", async ({ page }) => {
    let llamadas = 0;
    await page.route("**/world.openfoodfacts.org/**", async (route) => {
      llamadas++;
      await route.fulfill({ status: 200, body: "{}" });
    });

    await irAlCodigo(page);
    await page.getByLabel("Código").fill("123");
    await expect(page.getByText(/8 o 13 dígitos/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Buscar" })).toBeDisabled();
    expect(llamadas, "se consultó la API con un código inválido").toBe(0);
  });

  test("F04-E5: el segundo escaneo del mismo código no vuelve a pedirlo", async ({ page }) => {
    let llamadas = 0;
    await page.route("**/world.openfoodfacts.org/**", async (route) => {
      llamadas++;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 1,
          product: {
            product_name: "Producto repetido",
            nutriments: { "energy-kcal_100g": 200 },
          },
        }),
      });
    });

    await irAlCodigo(page);
    await page.getByLabel("Código").fill(CODIGO);
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page.getByText("Producto repetido")).toBeVisible();
    expect(llamadas).toBe(1);

    await page.getByRole("button", { name: "Buscar otro código" }).click();
    await page.getByLabel("Código").fill(CODIGO);
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page.getByText("Producto repetido")).toBeVisible();

    // Lo guardado se reutiliza: no se castiga a una API abierta y gratuita.
    expect(llamadas, "se volvió a consultar un código ya conocido").toBe(1);
  });

  test("F04-E6: la pantalla dice que la cámara todavía no está", async ({ page }) => {
    await irAlCodigo(page);
    await expect(page.getByText(/cámara llega en cuanto la app se compile/)).toBeVisible();
  });
});
