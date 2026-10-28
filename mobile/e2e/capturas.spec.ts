import { test } from "@playwright/test";
import { altaCompleta, empezarLimpio } from "./helpers";

/** Captura las pantallas de NUESTRA app en replica/clone-screens/.
 *
 *  No son para compararlas con la original: nuestro diseno es distinto a
 *  proposito. Son la referencia contra la que detectar regresiones nuestras
 *  (imgdiff.py --mode pixel, hoy contra la semana pasada).
 *
 *  Se ejecutan aparte:  npx playwright test e2e/capturas.spec.ts --project=movil
 */

const DESTINO = "../replica/clone-screens";

test.describe("capturas de referencia", () => {
  test("S01 cuestionario de alta", async ({ page }) => {
    await empezarLimpio(page);
    await page.screenshot({ path: `${DESTINO}/S01-alta.png`, fullPage: true });
  });

  test("S02 objetivos calculados", async ({ page }) => {
    await empezarLimpio(page);
    await page.getByRole("button", { name: "Mujer" }).click();
    await page.getByLabel("Año de nacimiento").fill("1988");
    await page.getByLabel("Altura (cm)").fill("178");
    await page.getByLabel("Peso (kg)").fill("82");
    await page.getByRole("button", { name: "Bajar peso" }).click();
    await page.screenshot({ path: `${DESTINO}/S02-objetivos.png`, fullPage: true });
  });

  test("S04 diario vacio y con comida", async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await page.screenshot({ path: `${DESTINO}/S04-diario-vacio.png`, fullPage: true });

    for (const [comida, gramos] of [["lentejas", "250"], ["huevo", "120"]] as const) {
      await page.getByRole("button", { name: "Añadir" }).first().click();
      await page.getByLabel("Buscar alimento").fill(comida);
      await page.getByRole("button", { name: new RegExp(comida, "i") }).first().click();
      await page.getByLabel("Cantidad en gramos").fill(gramos);
      await page.getByRole("button", { name: /Registrar en/ }).click();
    }
    await page.screenshot({ path: `${DESTINO}/S04-diario-con-comida.png`, fullPage: true });
  });

  test("S06 buscar alimento, con y sin resultados", async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("le");
    await page.screenshot({ path: `${DESTINO}/S06-buscar.png`, fullPage: true });

    await page.getByLabel("Buscar alimento").fill("galletas artiach");
    await page.screenshot({ path: `${DESTINO}/S06-sin-resultados.png`, fullPage: true });
  });

  test("S07 detalle de alimento", async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("lentejas");
    await page.getByRole("button", { name: /Lentejas cocidas/ }).click();
    await page.getByLabel("Cantidad en gramos").fill("250");
    await page.screenshot({ path: `${DESTINO}/S07-detalle.png`, fullPage: true });
  });

  test("S14 alergias y plato bloqueado", async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await page.getByRole("button", { name: "Declarar alergias" }).click();
    await page.getByRole("button", { name: "Pescado", exact: true }).click();
    await page.screenshot({ path: `${DESTINO}/S14-alergias.png`, fullPage: true });

    await page.getByRole("button", { name: "Volver" }).click();
    await page.getByRole("button", { name: /Merluza al horno con patata/ }).click();
    await page.screenshot({ path: `${DESTINO}/S14-plato-bloqueado.png`, fullPage: true });
  });

  test("S06 busqueda con alergia declarada", async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByRole("button", { name: "Declarar alergias" }).click();
    await page.getByRole("button", { name: "Pescado", exact: true }).click();
    await page.getByRole("button", { name: "Volver" }).click();
    await page.getByLabel("Buscar alimento").fill("a");
    await page.screenshot({ path: `${DESTINO}/S06-con-alergia.png`, fullPage: true });
  });

  test("S11 crear alimento con alergenos", async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("hummus de mi barrio");
    await page.getByRole("button", { name: "Crear este alimento" }).click();
    await page.getByLabel("Calorías por 100 g").fill("180");
    await page.getByLabel("Proteína por 100 g (g)").fill("8");
    await page.getByLabel("Carbohidratos por 100 g (g)").fill("14");
    await page.getByLabel("Grasa por 100 g (g)").fill("10");
    await page.getByRole("button", { name: "Sésamo", exact: true }).click();
    await page.screenshot({ path: `${DESTINO}/S11-crear-alimento.png`, fullPage: true });
  });
});
