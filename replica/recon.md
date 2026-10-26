# Recon map — contador de calorías (referencia: Fitia)

Fecha: 2026-10-26 · Versión analizada de la original: iOS 25.2.1 (publicada el 23 oct 2026)

> **Qué es este documento.** Un mapa de *funcionalidad y patrones de UX*, hecho desde
> fuentes públicas. No contiene código, diseño, textos, recetas ni datos de alimentos
> de la aplicación original. No se ha hecho ingeniería inversa, ni se han leído sus
> bundles de JavaScript, ni se han registrado sus llamadas de red.
> Sus términos (art. 6.2, 6.3 y 11.3.l) prohíben exactamente eso, y no se ha hecho.

---

## 0. Alcance — APROBADO el 2026-10-26

| pregunta | propuesta |
| --- | --- |
| Qué app, qué plataforma | Referencia: Fitia (iOS, Android, web en `app.fitia.app`). Nuestra versión: **móvil primero**, plataforma por decidir en `/replica-architect` |
| Qué porción | **El bucle central: registrar comida → ver calorías y macros → planificar las comidas del día**, más el ángulo propio: **elegir** los platos de un catálogo sin microtransacciones |
| Para quién | Producto para vender. Segmento inicial: **suscriptores descontentos de contadores de calorías de habla hispana**, en concreto quienes perdieron la elección de recetas |

Fuera del alcance inicial, propuesto: red social, retos de equipo, medicamentos y
suplementos, ayuno intermitente, integración con Apple Watch.

---

## 1. Fuentes

| fuente | URL | qué aportó |
| --- | --- | --- |
| Centro de ayuda | https://fitia.app/help/ | 6 categorías, 77 artículos. La mejor fuente de funciones y ajustes |
| Matriz gratis/premium | https://fitia.app/help/categories/subscription-billing/ | Qué está detrás del muro de pago, exactamente |
| Funcionamiento del planificador | https://fitia.app/help/categories/meal-planner/ | Entradas, generación, recálculo, límites |
| Ajustes generales | https://fitia.app/help/categories/general/ | Idioma, unidades, **país de la base de alimentos**, reportar datos erróneos |
| Ficha App Store | https://apps.apple.com/es/app/fitia-contar-calorías-dietas/id1448277011 | Capturas de pantalla, historial de versiones, precios, privacidad |
| Ficha Google Play | https://play.google.com/store/apps/details?id=com.nutrition.technologies.Fitia | Descripción completa, distribución de estrellas, ranking |
| Términos y condiciones | https://fitia.app/es/terminos-condiciones/ | Qué prohíben (ing. inversa, integrar su app, scrapear Fitia Social) |
| Reseñas públicas | ver `replica/reviews.csv` | 2.451 reseñas analizadas, 8 fuentes |

**No disponible:** cuenta propia (no tenemos), Reddit (inalcanzable desde esta
sesión), Trustpilot y Capterra (la app no tiene ficha), documentación de API pública
(no existe). Todo lo de abajo viene de fuentes públicas; lo que es inferencia está
marcado como tal.

---

## 2. Inventario de pantallas

| ID | pantalla | cómo se llega | propósito | componentes clave | estados vistos |
| --- | --- | --- | --- | --- | --- |
| S01 | Cuestionario de alta | primera apertura | recoger sexo, edad, altura, peso, peso objetivo, nivel de actividad, objetivo | formulario por pasos, barra de progreso, selectores | en curso, validación |
| S02 | Objetivos calculados | fin de S01 | mostrar kcal y macros diarios | tarjeta de resumen, desglose de macros | calculado |
| S03 | Planes y prueba gratuita | tras S02 y desde cualquier función bloqueada | vender premium | comparador de planes, botón canjear código | **bloqueante**, oferta, código inválido |
| S04 | Diario del día ("Hoy") | pestaña principal | el bucle central | anillo/barra de kcal, tarjetas de macros, lista de comidas, tira de calendario | vacío, parcial, sobre objetivo, bajo objetivo |
| S05 | Elegir método de registro | botón "+" en una comida | ofrecer las 4 vías | rejilla de 4: Foto, Voz, Lista, Cód. Barras | **con candado** en 3 de 4 si es gratis |
| S06 | Buscar alimento | S05 → Lista | encontrar en la base verificada | buscador, resultados, recientes, favoritos | sin resultados, cargando |
| S07 | Detalle de alimento | S06, S08, S10 | fijar porción y confirmar | selector de porción y gramaje, macros, icono VS (comparar) | editable, no editable |
| S08 | Registro por foto | S05 → Foto | reconocer el plato | cámara, superposición de ingredientes con kcal | reconocido, mal reconocido, corregible |
| S09 | Registro por voz | S05 → Voz | dictar lo comido | grabación, transcripción, confirmación | — |
| S10 | Escáner de código de barras | S05 → Cód. Barras | leer el envase | cámara, visor | no encontrado, **se congela** (defecto reportado) |
| S11 | Crear alimento | S06 sin resultados | alta manual o con IA | formulario de nutrientes | manual, generado por IA |
| S12 | Crear receta | Plan o biblioteca | plato con varios ingredientes | lista de ingredientes, porciones | guardada, **sin opción de borrar** (defecto reportado) |
| S13 | Plan (pestaña) | pestaña | el plan de comidas del día y la semana | plan por días, tarjetas de comida, botón (…) | automático, manual, **día en blanco** |
| S14 | Ajustes del plan | S13 → icono de perfil → Meal Plan | preferencias que alimentan la generación | alimentos preferidos, variedad (Alta/Equilibrada/Mínima), nº de comidas (hasta 5), % de kcal por comida, tipo de sugerencia, tipo de dieta | — |
| S15 | Recalcular / Rehacer | S13 → (…) | regenerar días | confirmación destructiva | **borra días futuros** |
| S16 | Lista de la compra | S13 | convertir el plan en compra | rango de fechas, lista agrupada, exportar PDF | vacía, exportada |
| S17 | Progreso | pestaña | peso, grasa, medidas, fotos | gráficas, historial, galería | solo peso (gratis), completo (premium) |
| S18 | Ayuno intermitente | pestaña o perfil | 16:8, 18:6, 20:4 | temporizador, ventana | ayunando, comiendo |
| S19 | Coach | pestaña o botón | preguntas de nutrición | chat | respondiendo, **limitado** |
| S20 | Social / equipos | pestaña | retos y comparar progreso | feed, equipos | — |
| S21 | Perfil y ajustes | icono de perfil | idioma, unidades, **país de la base**, salud | lista de ajustes, interruptores | — |
| S22 | Cuenta y suscripción | S21 → Account | gestionar, cancelar, canjear | estado del plan, enlaces a tienda | activa, cancelada, caducada |
| S23 | Medicamentos y suplementos | pestaña o diario | dosis, recordatorios, historial | lista, recordatorios | nuevo (sep-oct 2026) |
| S24 | Widgets de pantalla de inicio | SO | kcal, fibra, pasos, sueño, agua, racha | widgets | **genéricos en Android** (queja reportada) |
| S25 | Reportar alimento erróneo | S07 | corregir la base | formulario | enviado, **sin respuesta** (queja reportada) |

**25 pantallas.** Los estados marcados en negrita salen de reseñas de usuarios, no de
la documentación: son defectos reales observados, y cada uno es una oportunidad.

---

## 3. Flujos de usuario

```
F01  Alta y cálculo de objetivos                                    [7-10 pasos]
     S01 cuestionario -> S02 objetivos -> S03 paywall -> S04 diario
     borde: el usuario rellena todo y DESCUBRE el precio al final  <-- queja nº1 de onboarding
     borde: menor de edad (la app no admite menos de 15 años; hay usuarios de 12)
     borde: objetivo que implica un déficit peligroso               <-- riesgo de seguridad

F02  Registrar una comida escribiendo                               [4-5 toques]
     S04 -> S05 -> S06 buscar -> S07 porción -> S04
     borde: el alimento no está; borde: la marca local no está

F03  Registrar por foto                                             [3-4 toques]
     S04 -> S05 -> S08 cámara -> S07 corregir -> S04
     borde: reconoce mal (confunde cerdo con pollo, una porción con la pieza entera)
     borde: el usuario corrige y la app NO aprende                  <-- petición explícita

F04  Escanear código de barras                                      [3 toques]
     S04 -> S05 -> S10 escáner -> S07 -> S04
     borde: código no encontrado; borde: el escáner se congela

F05  Generar el plan de comidas                                     [premium]
     S13 -> S14 preferencias -> S13 plan generado
     borde: no genera ("needs data"); borde: ignora alergias declaradas

F06  Cambiar un plato que no me gusta                               <-- EL FLUJO CLAVE
     S13 -> (…) -> S15 recalcular, o S14 cambiar preferencias
     borde: consume moneda virtual; borde: rehacer borra días futuros
     ANTES: elegir de un catálogo.  AHORA: pedírselo a una IA y pagar por intento.

F07  Lista de la compra                                             [premium]
     S13 -> S16 rango de fechas -> PDF

F08  Registrar peso y ver progreso                                  [2 toques]
     S04/S17 -> S17 gráfica

F09  Cancelar la suscripción
     S21 -> S22 -> tienda del sistema
     borde: el botón se confunde con la barra del sistema (queja reportada)
     borde: cancelado y cobrado igualmente                          <-- 106 reseñas, nota 1,4

F10  Corregir un alimento con datos erróneos
     S07 -> S25 -> (sin respuesta)
```

**El número a batir: F02 en 4-5 toques, F06 en "pagar".**
Nuestro F06 objetivo: **2 toques y gratis** — ver una lista y elegir.

---

## 4. Componentes repetidos

| componente | variantes | estados | pantallas |
| --- | --- | --- | --- |
| Anillo / barra de calorías | día, comida | bajo, en rango (verde), pasado (amarillo/rojo) | S04, S13, S24 |
| Tarjeta de macro | carbos, grasa, proteína, fibra, agua | vacía, parcial, completa | S04, S07, S13 |
| Fila de alimento | simple, receta, creado por el usuario | normal, con candado, editable | S06, S07, S12, S13 |
| Selector de porción | gramos, unidades, medidas caseras | válido, inválido | S07 |
| Tarjeta de comida | desayuno, almuerzo, cena, snack, (merienda) | vacía, planificada, registrada | S04, S13 |
| Muro de pago | pantalla completa, banner, candado en línea | — | casi todas |
| Gráfica de progreso | peso, grasa, medidas | vacía, con datos | S17 |
| Tira de calendario | semana | hoy, pasado, futuro | S04, S13 |
| Hoja modal de acciones | (…) | — | S13, S15 |
| Aviso destructivo | rehacer plan, borrar | — | S15 |
| Estado vacío | día en blanco, sin resultados | — | S04, S06, S16 |

---

## 5. Modelo de datos inferido

> Todo esto es **inferencia** a partir de pantallas, artículos de ayuda y reseñas.
> `/replica-architect` lo convierte en un esquema real.

```
User            id, email, locale, country, units (metric|imperial),
                sex, birth_date, height_cm, activity_level
                evidencia: S01, artículos de idioma y unidades · confianza: alta

Goal            id, user_id, type (lose|maintain|gain), target_weight_kg, pace,
                kcal_target, protein_g, carbs_g, fat_g, fiber_g, water_ml,
                per_day_overrides (json)
                evidencia: S02, changelog "Per-day customization of calories and macros"
                confianza: alta
                HUECO: no existe "recomposición corporal"  <-- 3 reseñas lo piden

FoodItem        id, name, brand, country_code, source (verified|user|ai),
                barcode, nutrients (json: kcal, macros, micros, sodio, azúcar añadido),
                serving_options (json)
                evidencia: S06, S07, artículo "Change the Food Database Country"
                confianza: alta
                NOTA: la base está particionada POR PAÍS. Eso es producto, no detalle.

Serving         id, food_id, label, grams
                evidencia: S07 · confianza: media

Recipe          id, user_id|null, name, servings, instructions, image
RecipeIngredient recipe_id, food_id, grams
                evidencia: S12, artículos de recetas y lista de la compra
                confianza: alta
                HUECO: no se pueden borrar las recetas propias  <-- defecto reportado

MealSlot        id, user_id, name, order, kcal_percent
                evidencia: S14 (hasta 5 comidas, % por comida) · confianza: alta
                HUECO: el plan gratuito limita a 4; un usuario pide 10 y "merienda"

LogEntry        id, user_id, date, meal_slot_id, food_id|recipe_id, grams,
                method (text|photo|voice|barcode), created_at
                evidencia: S04, S05 · confianza: alta

MealPlan        id, user_id, date, status (auto|manual|blank), generated_at
PlanPreference  user_id, variety (high|balanced|minimal), suggestion_type
                (simple|recipes|both), diet_type, preferred_food_ids[],
                excluded_food_ids[], allergies[]
                evidencia: S14, artículos del planificador · confianza: alta
                HUECO: las alergias declaradas se ignoran  <-- reseña con merluza y alergia al pescado

ShoppingList    id, user_id, date_from, date_to, items[]
                evidencia: S16 · confianza: alta

WeightEntry     id, user_id, date, kg
Measurement     id, user_id, date, type, value     (HUECO: no hay cuádriceps)
ProgressPhoto   id, user_id, date, image
                evidencia: S17 · confianza: alta

FastingSession  id, user_id, protocol, started_at, ended_at
                evidencia: S18 · confianza: media

Subscription    id, user_id, plan (monthly|annual|family), store, status,
                trial_ends_at, renews_at
                evidencia: S22, artículos de facturación · confianza: alta

CoinBalance     user_id, balance, granted_at, monthly_grant
CoinSpend       user_id, amount, reason, created_at
                evidencia: SOLO reseñas de usuarios (500/mes en el plan anual, 25/mes
                en otro caso). NO documentado en su centro de ayuda.
                confianza: media — y esta entidad es justo la que NO vamos a copiar.

MedicationDose  id, user_id, name, dose, schedule, taken_at
                evidencia: changelog sep-oct 2026 · confianza: media
```

---

## 6. Lo que NO se puede clonar

| elemento | por qué | qué hacemos |
| --- | --- | --- |
| Su base de 5 millones de alimentos verificados | Es suya. Es su foso declarado | Open Food Facts (ODbL) + USDA FoodData Central (dominio público). **Peor cobertura al principio. Es el riesgo nº1 del proyecto** |
| Menús de restaurantes | Datos propios y acuerdos | Fuera del alcance inicial |
| Sus recetas | Contenido suyo, hecho con nutricionistas | Recetas propias o de fuente abierta con licencia compatible |
| Su marca, nombre, logo y textos | Suyos | `/replica-brand` nos da los nuestros |
| Fitia Social y su red de usuarios | El valor es la gente, no el código | Fuera del alcance. Una red vacía no vale nada |
| Sus 10 millones de usuarios y su posición #4 en recaudación | No se clona | Entramos por un segmento, no por el mercado |
| Validación por nutricionistas | Requiere contratar nutricionistas | Decisión de negocio, no de ingeniería. **Si no la tenemos, no la afirmamos** |

---

## 7. Matriz de funciones

En `replica/features.csv`. **65 filas**: 27 must, 19 should, 19 could.
`clone` empieza en `no` en todas, salvo 3 marcadas `skip`.

**23 filas tienen `original = no`**: son las que salen de `/replica-entrepreneur`, lo
que sus usuarios piden y la original no da. **13 de esas 23 son `must`**, y ahí está
el producto: no estamos construyendo un Fitia con otro nombre, estamos construyendo
las 13 cosas que a sus usuarios les faltan.

`parity.py` de `/replica-diff` ya puntúa el fichero: **0,0 / 100, 14 must-have sin
hacer**. Ese es el marcador de salida.

---

## 8. Tamaño

| magnitud | cuenta |
| --- | --- |
| Pantallas | 25 (14 en el alcance propuesto) |
| Flujos | 10 (6 en el alcance propuesto) |
| Entidades | ~18 |

**Las tres partes difíciles, por orden:**

1. **La base de alimentos.** No es código, es datos y curación. Open Food Facts tiene
   buena cobertura de producto envasado europeo y peor de marcas latinoamericanas
   sueltas. Esto decide si el producto sirve o no.
2. **El reconocimiento por foto.** La original lo tiene y falla; nosotros tenemos que
   hacerlo mejor o no hacerlo. Hacerlo mal es peor que no tenerlo.
3. **Suscripciones y facturación.** 106 reseñas con nota media 1,4 dicen que aquí es
   donde la original pierde la confianza. Hay que hacerlo impecable, y eso incluye
   cancelar sin fricción.

**Tamaño: L (un trimestre)** para el alcance propuesto, con una persona y yo ayudando.
No es un fin de semana. No va a ser un clon perfecto, y no debería serlo.

---

## 9. Lo que este recon cambia respecto a la hipótesis inicial

- El planificador **ya era premium antes** de las Coins. Lo que cambió en julio de 2026
  no fue poner el plan de pago: fue **quitar la elección** y sustituirla por generación
  con IA racionada. La herida no es el precio, es la **pérdida de control**.
- La base de alimentos **está particionada por país** y tiene un artículo de ayuda para
  cambiarla. La localización no es un extra: es arquitectura, y toca decidirlo en
  `/replica-architect`.
- Hay un **hueco de seguridad real**: la app acepta objetivos de déficit extremo y su
  propio límite de edad (15 años) lo saltan menores. Dos reseñas independientes lo
  describen. Es a la vez responsabilidad y diferenciador.

**Siguiente paso: `/replica-architect`.**
