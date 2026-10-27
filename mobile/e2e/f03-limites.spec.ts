import { expect, test } from "@playwright/test";
import { altaCompleta, empezarLimpio, sinErrores, vigilar } from "./helpers";

/** Los casos borde que no se prueban solos. Aqui es donde esperaba encontrar algo. */

test.describe("Límites y casos borde", () => {
  test("F02-E6: una cantidad absurda no debe aceptarse en silencio", async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("lentejas");
    await page.getByRole("button", { name: /Lentejas cocidas/ }).click();
    await page.getByLabel("Cantidad en gramos").fill("99999");

    // La base de datos tiene "grams <= 10000". Si el cliente lo deja pasar,
    // el registro funciona en local y revienta contra Supabase.
    await expect(
      page.getByText(/Escribe un número|demasiado|máximo/i),
      "el cliente acepta 99.999 g pero la base de datos lo rechazará"
    ).toBeVisible();
  });

  test("F02-E9: dos pestañas registrando a la vez no deben perder datos", async ({ browser }) => {
    const ctx = await browser.newContext();
    const a = await ctx.newPage();
    await a.goto("/");
    await a.evaluate(() => { try { window.localStorage.clear(); } catch {} });
    await a.reload();
    await altaCompleta(a);
    await expect(a.getByText("Hoy")).toBeVisible();

    const b = await ctx.newPage();
    await b.goto("/");
    await expect(b.getByText("Hoy")).toBeVisible();

    // Cada pestana registra un alimento distinto, sin recargar la otra.
    for (const [pagina, comida] of [[a, "lentejas"], [b, "huevo"]] as const) {
      await pagina.getByRole("button", { name: "Añadir" }).first().click();
      await pagina.getByLabel("Buscar alimento").fill(comida);
      await pagina.getByRole("button", { name: new RegExp(comida, "i") }).first().click();
      await pagina.getByLabel("Cantidad en gramos").fill("100");
      await pagina.getByRole("button", { name: /Registrar en/ }).click();
    }

    await a.reload();
    const filas = await a.getByRole("button", { name: /kcal$/ }).count();
    expect(filas, "se ha perdido un registro: la segunda pestaña pisó a la primera").toBe(2);
    await ctx.close();
  });

  test("F04-E1: con la app abierta, pasada la medianoche el diario cambia de día", async ({ page }) => {
    // Con el reloj simulado NO se puede interactuar: page.clock congela los
    // temporizadores que React Native usa para detectar pulsaciones, y los
    // botones dejan de responder. Es limitacion de la prueba, no de la app.
    // Asi que aqui se comprueba solo lo que importa: que la fecha avanza.
    await page.clock.install({ time: new Date("2026-03-10T23:58:00") });
    await empezarLimpio(page);
    await altaCompleta(page);
    await expect(page.getByText(/10 de marzo/i)).toBeVisible();

    await page.clock.fastForward("00:05:00");
    await page.waitForTimeout(500);

    await expect(
      page.getByText(/11 de marzo/i),
      "el diario sigue mostrando el dia anterior pasada la medianoche"
    ).toBeVisible();
  });

  test("pasarse del objetivo se dice sin reproches", async ({ page }) => {
    const errores = vigilar(page);
    await empezarLimpio(page);
    await altaCompleta(page);

    // Aceite de oliva, 884 kcal/100 g. Tres raciones grandes pasan de 2000.
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Añadir" }).first().click();
      await page.getByLabel("Buscar alimento").fill("aceite");
      await page.getByRole("button", { name: /Aceite de oliva/ }).click();
      await page.getByLabel("Cantidad en gramos").fill("100");
      await page.getByRole("button", { name: /Registrar en/ }).click();
    }

    await expect(page.getByText(/Te has pasado/)).toBeVisible();
    // Nada de juzgar al usuario.
    await expect(page.getByText(/deberías|mal|error|incorrecto/i)).toHaveCount(0);
    sinErrores(errores);
  });
});
