import { expect, test, type Page } from "@playwright/test";
import { accesibilidad, altaCompleta, empezarLimpio, sinErrores, vigilar } from "./helpers";

/** F12 — respetar las alergias declaradas.
 *
 *  Esto no es una comodidad. En las reseñas de la original hay una persona que
 *  declaró alergia al pescado y la app le propuso merluza dos veces en cinco
 *  platos. Un contador de calorías que ignora una alergia declarada hace daño.
 *
 *  La regla que se prueba aquí: con una alergia declarada, el plato NO se añade
 *  de un toque. Hace falta decir que lo sabes.
 */

async function declarar(page: Page, alergeno: string) {
  await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
  await page.getByRole("button", { name: "Declarar alergias" }).click();
  await expect(page.getByText("Alergias e intolerancias")).toBeVisible();
  await page.getByRole("button", { name: alergeno, exact: true }).click();
  await page.getByRole("button", { name: "Volver" }).click();
  await expect(page.getByText("La carta")).toBeVisible();
}

test.describe("F12 — Alergias", () => {
  test.beforeEach(async ({ page }) => {
    await empezarLimpio(page);
    await altaCompleta(page);
    await expect(page.getByText("Hoy")).toBeVisible();
  });

  test("F12-H1: un plato con el alérgeno declarado no se añade de un toque", async ({ page }) => {
    const errores = vigilar(page);
    await declarar(page, "Pescado");

    // En la lista se avisa antes de abrir, sin esconder las calorías.
    await expect(
      page.getByRole("button", { name: /Merluza al horno con patata.*lleva pescado/ })
    ).toBeVisible();

    await page.getByRole("button", { name: /Merluza al horno con patata/ }).click();
    await expect(page.getByText(/Este plato lleva pescado, que has declarado/)).toBeVisible();

    // Lo importante: el botón de añadir NO está. No se puede añadir de un toque.
    await expect(page.getByRole("button", { name: /^Añadir a/ })).toHaveCount(0);

    await page.getByRole("button", { name: /Lo sé, quiero añadirlo/ }).click();
    await page.getByRole("button", { name: /^Añadir a/ }).click();

    // Añadir a sabiendas sí se permite: es su comida, no la nuestra.
    await expect(page.getByRole("button", { name: /Merluza al horno con patata, 430 kcal/ })).toBeVisible();
    sinErrores(errores);
  });

  test("F12-H2: un plato sin el alérgeno sigue siendo de un toque", async ({ page }) => {
    await declarar(page, "Pescado");

    await page.getByRole("button", { name: /Lentejas con verduras/ }).click();
    await expect(page.getByText(/que has declarado/)).toHaveCount(0);
    await page.getByRole("button", { name: /^Añadir a/ }).click();
    await expect(page.getByRole("button", { name: /Lentejas con verduras, 210 kcal/ })).toBeVisible();
  });

  test("F12-E1: la confirmación no se queda pegada al salir del plato", async ({ page }) => {
    await declarar(page, "Pescado");

    await page.getByRole("button", { name: /Merluza al horno con patata/ }).click();
    await page.getByRole("button", { name: /Lo sé, quiero añadirlo/ }).click();
    await expect(page.getByRole("button", { name: /^Añadir a/ })).toBeVisible();

    await page.getByRole("button", { name: "Volver a la carta" }).click();
    await page.getByRole("button", { name: /Salmón con espinacas/ }).click();

    // Otro plato, otra decisión: el aviso vuelve a pedir confirmación.
    await expect(page.getByRole("button", { name: /^Añadir a/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Lo sé, quiero añadirlo/ })).toBeVisible();
  });

  test("F12-E2: declarar dos alérgenos los nombra los dos", async ({ page }) => {
    await declarar(page, "Pescado");
    await page.getByRole("button", { name: /Mis alergias \(1\)/ }).click();
    await page.getByRole("button", { name: "Gluten", exact: true }).click();
    await page.getByRole("button", { name: "Volver" }).click();

    await page.getByRole("button", { name: /Bocadillo de atún/ }).click();
    await expect(page.getByText(/lleva gluten y pescado|lleva pescado y gluten/)).toBeVisible();
  });

  test("F12-E3: un alérgeno que no sabemos detectar se dice, no se finge", async ({ page }) => {
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await page.getByRole("button", { name: "Declarar alergias" }).click();
    await page.getByRole("button", { name: "Apio", exact: true }).click();

    // Aceptarlo en silencio sería prometer un aviso que no va a llegar.
    await expect(page.getByText(/ninguno de nuestros alimentos trae marcado/)).toBeVisible();
  });

  test("F12-E4: las alergias declaradas sobreviven a recargar", async ({ page }) => {
    await declarar(page, "Frutos secos");
    await page.reload();
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await expect(
      page.getByRole("button", { name: /Yogur con fresas y almendras.*lleva frutos secos/ })
    ).toBeVisible();
  });

  test("F12-E5: una receta que creas tu hereda el alergeno de sus ingredientes", async ({ page }) => {
    await declarar(page, "Huevo");

    await page.getByRole("button", { name: "Crear una receta" }).click();
    await page.getByLabel("Nombre").fill("Mi revuelto");
    await page.getByLabel("Buscar ingrediente").fill("huevo cocido");
    await page.getByRole("button", { name: /^Huevo cocido,/ }).click();
    await page.getByLabel("Cantidad en gramos").fill("150");
    await page.getByRole("button", { name: "Añadir a la receta" }).click();
    await page.getByRole("button", { name: "Guardar receta" }).click();

    // El aviso no es solo para la carta de serie: lo que montes tu tambien
    // lleva lo que lleva.
    await expect(page.getByRole("button", { name: /Mi revuelto.*lleva huevo/ })).toBeVisible();
    await page.getByRole("button", { name: /Mi revuelto/ }).click();
    await expect(page.getByRole("button", { name: /^Añadir a/ })).toHaveCount(0);
  });


  /* --- La misma regla en la busqueda de alimentos sueltos (S06) --- */

  async function declararDesdeBusqueda(page: Page, alergeno: string) {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByRole("button", { name: "Declarar alergias" }).click();
    await page.getByRole("button", { name: alergeno, exact: true }).click();
    await page.getByRole("button", { name: "Volver" }).click();
    await expect(page.getByLabel("Buscar alimento")).toBeVisible();
  }

  test("F12-H3: un alimento suelto con el alérgeno tampoco se registra de un toque", async ({ page }) => {
    const errores = vigilar(page);
    // El aviso de la carta no basta: por esta puerta se llega al mismo plato.
    await declararDesdeBusqueda(page, "Pescado");

    await page.getByLabel("Buscar alimento").fill("merluza");
    await expect(page.getByRole("button", { name: /Merluza cocida.*lleva pescado/ })).toBeVisible();

    await page.getByRole("button", { name: /Merluza cocida/ }).click();
    await expect(page.getByText(/Este alimento lleva pescado, que has declarado/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Registrar en/ })).toHaveCount(0);

    await page.getByRole("button", { name: /Lo sé, quiero registrarlo/ }).click();
    await page.getByRole("button", { name: /^Registrar en/ }).click();
    await expect(page.getByRole("button", { name: /Merluza cocida/ })).toBeVisible();
    sinErrores(errores);
  });

  test("F12-H4: un alimento que no choca sigue siendo de un toque", async ({ page }) => {
    await declararDesdeBusqueda(page, "Pescado");
    await page.getByLabel("Buscar alimento").fill("lentejas");
    await page.getByRole("button", { name: /Lentejas cocidas/ }).click();
    await expect(page.getByText(/que has declarado/)).toHaveCount(0);
    await page.getByRole("button", { name: /^Registrar en/ }).click();
    await expect(page.getByRole("button", { name: /Lentejas cocidas/ })).toBeVisible();
  });

  test("F12-E6: la confirmación no se arrastra de un alimento a otro", async ({ page }) => {
    await declararDesdeBusqueda(page, "Leche");
    await page.getByLabel("Buscar alimento").fill("queso");
    await page.getByRole("button", { name: /Queso fresco/ }).click();
    await page.getByRole("button", { name: /Lo sé, quiero registrarlo/ }).click();
    await expect(page.getByRole("button", { name: /^Registrar en/ })).toBeVisible();

    await page.getByRole("button", { name: "Elegir otro alimento" }).click();
    await page.getByRole("button", { name: /Queso curado/ }).click();
    await expect(page.getByRole("button", { name: /^Registrar en/ })).toHaveCount(0);
  });

  test("F12-E7: la carta y la búsqueda comparten la misma declaración", async ({ page }) => {
    // Declarado en la carta, respetado en la busqueda. Una sola lista.
    await declarar(page, "Frutos secos");
    await page.getByRole("button", { name: "Cancelar" }).click();

    await page.getByRole("button", { name: "Añadir" }).first().click();
    await expect(page.getByRole("button", { name: /Mis alergias \(1\)/ })).toBeVisible();
    await page.getByLabel("Buscar alimento").fill("almendras");
    await expect(
      page.getByRole("button", { name: /Almendras crudas.*lleva frutos secos/ })
    ).toBeVisible();
  });


  /* --- Un alimento que creas tu tambien puede llevar alergenos (S11) --- */

  test("F12-H5: un alimento creado por ti con alérgeno avisa igual", async ({ page }) => {
    const errores = vigilar(page);
    await declararDesdeBusqueda(page, "Sésamo");

    await page.getByLabel("Buscar alimento").fill("hummus de mi barrio");
    await page.getByRole("button", { name: "Crear este alimento" }).click();
    await page.getByLabel("Calorías por 100 g").fill("180");
    await page.getByLabel("Proteína por 100 g (g)").fill("8");
    await page.getByLabel("Carbohidratos por 100 g (g)").fill("14");
    await page.getByLabel("Grasa por 100 g (g)").fill("10");

    // Sesamo no lo trae marcado ningun alimento nuestro: aqui si se puede poner.
    await page.getByRole("button", { name: "Sésamo", exact: true }).click();
    await page.getByRole("button", { name: "Guardar alimento" }).click();

    await page.getByLabel("Buscar alimento").fill("hummus");
    await expect(
      page.getByRole("button", { name: /hummus de mi barrio.*lleva sésamo/ })
    ).toBeVisible();
    await page.getByRole("button", { name: /hummus de mi barrio/ }).click();
    await expect(page.getByRole("button", { name: /^Registrar en/ })).toHaveCount(0);
    sinErrores(errores);
  });

  test("F12-E8: no marcar nada es «no declarado», y la pantalla lo dice", async ({ page }) => {
    await page.getByRole("button", { name: "Añadir" }).first().click();
    await page.getByLabel("Buscar alimento").fill("invento sin etiqueta");
    await page.getByRole("button", { name: "Crear este alimento" }).click();

    // Lo contrario —dar por hecho que no lleva nada— seria una promesa falsa.
    await expect(page.getByText(/queda como «no declarado»/)).toBeVisible();
    await expect(page.getByText(/no dirá que este alimento es seguro/)).toBeVisible();
  });

  test("F12-E9: una receta hereda el alérgeno de un alimento que creaste tú", async ({ page }) => {
    await declararDesdeBusqueda(page, "Sésamo");
    await page.getByLabel("Buscar alimento").fill("tahini casero");
    await page.getByRole("button", { name: "Crear este alimento" }).click();
    await page.getByLabel("Calorías por 100 g").fill("595");
    await page.getByLabel("Grasa por 100 g (g)").fill("54");
    await page.getByRole("button", { name: "Sésamo", exact: true }).click();
    await page.getByRole("button", { name: "Guardar alimento" }).click();
    await page.getByRole("button", { name: "Cancelar" }).click();

    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await page.getByRole("button", { name: "Crear una receta" }).click();
    await page.getByLabel("Nombre").fill("Mi salsa");
    await page.getByLabel("Buscar ingrediente").fill("tahini");
    await page.getByRole("button", { name: /^tahini casero,/ }).click();
    await page.getByLabel("Cantidad en gramos").fill("50");
    await page.getByRole("button", { name: "Añadir a la receta" }).click();
    await page.getByRole("button", { name: "Guardar receta" }).click();

    // El agujero que tapamos: el alergeno viaja del alimento propio a la receta.
    await expect(page.getByRole("button", { name: /Mi salsa.*lleva sésamo/ })).toBeVisible();
  });

  test("F12-A1: la pantalla de alergias es accesible", async ({ page }) => {
    await page.getByRole("button", { name: "Elegir de la carta" }).first().click();
    await page.getByRole("button", { name: "Declarar alergias" }).click();
    await expect(page.getByText("Alergias e intolerancias")).toBeVisible();
    await accesibilidad(page, "S14 alergias");
  });
});
