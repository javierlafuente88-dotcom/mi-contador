import { expect, test } from "@playwright/test";
import { accesibilidad, altaCompleta, empezarLimpio, sinErrores, vigilar } from "./helpers";

/** F14 — editar las comidas del día.
 *
 *  La original te deja cinco, y cuatro en el plan gratis. El tope no sale de
 *  la nutrición, sale del precio. Aquí son filas en una tabla y no hay tope.
 *
 *  El caso que de verdad importa es E3: quitar una comida NO puede borrar lo
 *  que comiste. Que dejes de merendar hoy no cambia lo que merendaste el
 *  martes pasado, y un contador que pierde registros al tocar los ajustes es
 *  un contador en el que no se puede confiar. */

async function abrirComidas(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Editar las comidas" }).click();
  await expect(page.getByText("Tus comidas")).toBeVisible();
}

async function registrarEn(
  page: import("@playwright/test").Page,
  nComida: number,
  busqueda: string,
  gramos: string,
) {
  await page.getByRole("button", { name: "Añadir" }).nth(nComida).click();
  await page.getByLabel("Buscar alimento").fill(busqueda);
  await page.getByRole("button", { name: new RegExp(busqueda, "i") }).first().click();
  await page.getByLabel("Cantidad en gramos").fill(gramos);
  await page.getByRole("button", { name: /Registrar en/ }).click();
}

test.describe("F14 — Editar las comidas", () => {
  test.beforeEach(async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await expect(page.getByText("Hoy")).toBeVisible();
  });

  test("F14-H1: renombrar una comida se ve en el diario", async ({ page }) => {
    const errores = vigilar(page);

    await abrirComidas(page);
    await page.getByLabel("Nombre de la comida 3").fill("Media tarde");
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByText("Media tarde")).toBeVisible();
    await expect(page.getByText("Merienda")).toHaveCount(0);
    sinErrores(errores);
  });

  test("F14-H2: añadir una comida: sin tope de cuatro ni de cinco", async ({ page }) => {
    await abrirComidas(page);
    for (const nombre of ["Media mañana", "Resopón"]) {
      await page.getByRole("button", { name: "Añadir una comida" }).click();
      await page.getByLabel(/^Nombre de la comida \d+$/).last().fill(nombre);
    }
    await page.getByRole("button", { name: "Guardar" }).click();

    // Seis, cuando la original te da cuatro gratis.
    await expect(page.getByText("Media mañana")).toBeVisible();
    await expect(page.getByText("Resopón")).toBeVisible();
    await expect(page.getByRole("button", { name: "Añadir" })).toHaveCount(6);
  });

  test("F14-H3: reordenar cambia el orden en el diario", async ({ page }) => {
    await abrirComidas(page);
    // Cena sube una posición: queda por delante de Merienda.
    await page.getByLabel("Nombre de la comida 4").fill("Cena");
    await page.getByRole("button", { name: "Subir Cena", exact: true }).click();
    await expect(page.getByLabel("Nombre de la comida 3")).toHaveValue("Cena");
    await page.getByRole("button", { name: "Guardar" }).click();

    const nombres = await page.getByText(/^(Desayuno|Almuerzo|Merienda|Cena)$/).allInnerTexts();
    expect(nombres).toEqual(["Desayuno", "Almuerzo", "Cena", "Merienda"]);
  });

  test("F14-E1: una comida sin nombre no se puede guardar", async ({ page }) => {
    await abrirComidas(page);
    await page.getByLabel("Nombre de la comida 2").fill("");
    await expect(page.getByText("Ponle un nombre")).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  test("F14-E2: sin cambios, Guardar está apagado", async ({ page }) => {
    await abrirComidas(page);
    await expect(page.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  test("F14-E3: quitar una comida MUEVE lo registrado, no lo borra", async ({ page }) => {
    // 250 g de lentejas en la Merienda (la tercera).
    await registrarEn(page, 2, "lentejas", "250");
    await expect(page.getByText("290", { exact: true })).toBeVisible();

    await abrirComidas(page);
    await page.getByRole("button", { name: "Quitar Merienda", exact: true }).click();
    // Se dice a dónde va antes de tocar nada.
    await expect(page.getByText(/se mueve a «Almuerzo»/)).toBeVisible();
    await expect(page.getByText(/No se borra nada de lo que comiste/)).toBeVisible();
    await page.getByRole("button", { name: "Quitar y mover" }).click();
    await page.getByRole("button", { name: "Volver al diario" }).click();

    // La comida ya no está, el plato sí, y el total no se ha movido.
    await expect(page.getByText("Merienda")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Lentejas cocidas/ })).toBeVisible();
    await expect(page.getByText("290", { exact: true })).toBeVisible();
  });

  test("F14-E4: «Dejarlo» no quita nada", async ({ page }) => {
    await abrirComidas(page);
    await page.getByRole("button", { name: "Quitar Merienda", exact: true }).click();
    await page.getByRole("button", { name: "Dejarlo" }).click();
    await expect(page.getByLabel("Nombre de la comida 3")).toHaveValue("Merienda");
  });

  test("F14-E5: con una sola comida no se ofrece quitarla", async ({ page }) => {
    await abrirComidas(page);
    // Quitar las tres de abajo; lo registrado va subiendo a la de arriba.
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: /^Quitar / }).last().click();
      await page.getByRole("button", { name: "Quitar y mover" }).click();
    }
    await expect(page.getByRole("button", { name: /^Quitar / })).toHaveCount(0);
    await expect(page.getByText(/el diario necesita al menos un sitio/)).toBeVisible();
  });

  test("F14-E6: los cambios sobreviven a recargar", async ({ page }) => {
    await abrirComidas(page);
    await page.getByLabel("Nombre de la comida 1").fill("Café");
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.reload();
    await expect(page.getByText("Café")).toBeVisible();
  });

  test("F14-E7: quitar una comida recién añadida no toca nada registrado", async ({
    page,
  }) => {
    await abrirComidas(page);
    await page.getByRole("button", { name: "Añadir una comida" }).click();
    await page.getByLabel("Nombre de la comida 5").fill("Resopón");
    await page.getByRole("button", { name: "Quitar Resopón", exact: true }).click();

    // No habla de mover nada: no hay nada que mover.
    await expect(page.getByText(/todavía no habías guardado/)).toBeVisible();
    await expect(page.getByText(/No se borra nada de lo que comiste/)).toHaveCount(0);
  });

  test("F14-E8: lo registrado OTROS días también se mueve, no se pierde", async ({
    page,
  }) => {
    // No hay forma de anotar en otro día desde la interfaz todavía, y esta es
    // justo la pérdida que más dolería: la de lo que ya no puedes volver a
    // mirar. Así que el registro viejo se mete por debajo.
    await page.evaluate(() => {
      const viejas = JSON.parse(window.localStorage.getItem("v1.entries") ?? "[]");
      viejas.push({
        id: "prueba-martes",
        localDate: "2026-01-13",
        mealSlotId: "merienda",
        foodId: "172421",
        grams: 100,
        method: "text",
        clientToken: "prueba-martes",
      });
      window.localStorage.setItem("v1.entries", JSON.stringify(viejas));
    });
    await page.reload();

    await abrirComidas(page);
    await page.getByRole("button", { name: "Quitar Merienda", exact: true }).click();
    await page.getByRole("button", { name: "Quitar y mover" }).click();

    const guardadas = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("v1.entries") ?? "[]"),
    );
    const martes = guardadas.find((e: { id: string }) => e.id === "prueba-martes");
    expect(martes, "el registro del martes ha desaparecido").toBeTruthy();
    expect(martes.mealSlotId).toBe("almuerzo");
  });

  test("F14-A1: la pantalla de comidas es accesible", async ({ page }) => {
    await abrirComidas(page);
    await accesibilidad(page, "editar comidas");
  });
});
