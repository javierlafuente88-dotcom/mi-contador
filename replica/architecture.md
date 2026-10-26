# Architecture — contador de calorías (reconstrucción del núcleo, referencia: Fitia)

Fecha: 2026-10-26 · Lee `replica/recon.md` y `replica/features.csv` · SQL en `replica/schema.sql`

**Tus dos condiciones:** que puedas usarlo en tu móvil, y **sin pagar servidores**.
Las dos están respetadas, con una salvedad sobre el iPhone que explico abajo y que
conviene leer antes de nada.

---

## 0. Lo primero, porque cambia decisiones: qué cuesta de verdad 0 €

| cosa | coste real | nota |
| --- | --- | --- |
| Supabase (base de datos, auth, ficheros) | **0 €** | Plan gratuito: 500 MB de base, 1 GB de ficheros, 50.000 usuarios activos. El proyecto **se pausa tras una semana sin uso** y se reactiva con un clic |
| Expo + EAS (compilación) | **0 €** | Plan gratuito con cola de compilación más lenta |
| Open Food Facts | **0 €** | Licencia ODbL — ojo a la sección 5 |
| USDA FoodData Central | **0 €** | Dominio público, sin condiciones |
| Hosting | **0 €** | No hay servidor propio. La app habla directamente con Supabase |
| **Instalarlo en un Android tuyo** | **0 €** | APK firmado, instalación directa. Para siempre |
| **Instalarlo en un iPhone tuyo** | **0 €… con asterisco** | Ver abajo |
| Publicar en Google Play | 25 $ **una vez** | Solo si quieres distribuirlo |
| Publicar en App Store | 99 $ **al año** | Solo si quieres distribuirlo |
| Reconocimiento de comida por foto | **no es gratis** | Cualquier modelo de visión se paga por llamada. Fuera de la v1 |

**El asterisco del iPhone.** Apple no deja instalar una app propia de forma permanente
sin cuenta de desarrollador. Las opciones gratis son: usarla dentro de **Expo Go** (la
app de Expo, funciona y es gratis, pero no es "tu app" con su icono), o **firmarla con
tu Apple ID gratuito**, que caduca y hay que reinstalar **cada 7 días**. Para tenerla
instalada de verdad y para siempre en un iPhone hacen falta los **99 $/año**.
En Android esto no pasa: un APK se instala y se queda.

No puedo hacer nada contra eso, es política de Apple. Pero prefiero que lo sepas ahora
y no en el paso de `/replica-deploy`.

---

## 1. Stack

| capa | elección | por qué |
| --- | --- | --- |
| móvil | **Expo (React Native) + TypeScript** | Una base de código para iOS y Android. Se prueba en tu móvil al instante sin compilar nada |
| estilos | **Nativewind** (Tailwind para React Native), tokens de `/replica-design` | Mismo vocabulario que usará el paso de diseño |
| base de datos | **Postgres en Supabase** | Gestionado, gratis, y RLS nos da la seguridad en la propia base en vez de en el cliente |
| acceso a datos | **supabase-js** directo, sin ORM | No hay servidor propio. El cliente habla con Postgres a través de PostgREST, y RLS decide qué puede ver |
| auth | **Supabase Auth** (correo + Apple + Google) | Incluido. Apple obliga a ofrecer "Iniciar sesión con Apple" si ofreces Google |
| estado local y offline | **TanStack Query + SQLite (expo-sqlite)** | El diario tiene que funcionar sin cobertura. Es petición de usuarios desde 2020 |
| trabajos periódicos | **Supabase Edge Functions + pg_cron** | Importar alimentos y recordatorios. Dentro del plan gratuito |
| pagos | **ninguno en la v1** | No cobramos. Cuando toque, Stripe o las tiendas. **Nunca microtransacciones** |
| ficheros | **Supabase Storage** | Fotos de progreso. 1 GB gratis |

**Una base de datos. Sin microservicios. Sin backend propio.** No necesitamos la
arquitectura de la original, necesitamos sus funciones.

---

## 2. Esquema

**20 tablas.** Reglas de acceso: **RLS de Postgres**, política por tabla. SQL completo
en `replica/schema.sql`.

Decisiones que vienen directamente de lo que falla en la original:

| decisión en el esquema | la queja que la motiva |
| --- | --- |
| `log_entries.client_token` con índice único | "no registra los alimentos o los registra doble o triple" |
| `log_entries.local_date` (fecha local, no UTC) | Un diario de comidas se parte por la medianoche **del usuario** |
| `meal_slots` como filas, sin límite | El tope de 3-4 comidas. Merienda, pre-entreno, lo que sea |
| `goals.kcal_floor >= 1200` | "Estando en un peso saludable me marca 1000 calorías". Reseña titulada "Dañina" |
| `goal_changes` como registro | Para poder detectar a alguien que baja su objetivo una y otra vez |
| `recipes.deleted_at` | En la original no se pueden borrar las recetas propias |
| `meal_plan_items.locked` | Recalcular **no** borra los días futuros. Respeta lo que ya elegiste |
| `user_allergens` + `foods.allergens` con índice GIN | Declaró alergia al pescado y le propusieron merluza |
| `foods.license` obligatorio | Porque mezclamos dominio público con ODbL y hay que saber qué es qué |
| `type` incluye `'recomp'` | La original solo ofrece bajar, mantener o ganar |
| **no existe tabla de monedas** | Es la posición del producto entera |

---

## 3. API

No hay API propia: el cliente llama a PostgREST de Supabase y **RLS es la autorización**.
Lo que sí son funciones de servidor va en Edge Functions.

| operación | qué hace | quién | entrada | salida | flujo |
| --- | --- | --- | --- | --- | --- |
| `select foods` | buscar alimento por nombre, con trigram y filtro de país | autenticado | texto, país | lista | F02 |
| `select foods?barcode=eq.X` | buscar por código de barras | autenticado | código | alimento o vacío | F04 |
| `insert log_entries` | registrar comida (idempotente por `client_token`) | dueño | alimento, gramos, comida, fecha local | fila | F02-F04 |
| `delete log_entries` | deshacer | dueño | id | — | F02 |
| `insert foods` (source=user) | crear alimento propio | dueño | nutrientes | fila | F02 |
| `insert recipes` + ingredientes | crear receta | dueño | ingredientes | receta con macros | F02 |
| `select recipes` | **catálogo navegable y filtrable** | autenticado | etiquetas, kcal, tiempo | lista | **F06** |
| `insert meal_plans` | elegir el plan del día desde el catálogo | dueño | items | plan | **F06** |
| `fn suggest_plan` (Edge) | sugerir un plan que cuadre con los objetivos | dueño | preferencias, alergias | propuesta | F05 |
| `patch meal_plan_items` | cambiar un plato, bloquear otro | dueño | id, nuevo item | item | **F06** |
| `fn shopping_list` (Edge) | agregar el plan en lista de la compra | dueño | rango de fechas | lista | F07 |
| `insert weight_entries` | registrar peso | dueño | kg, fecha | fila | F08 |
| `insert food_reports` | reportar dato erróneo | dueño | campo, valor | fila | F10 |
| `fn export_my_data` (Edge) | descargar todo en CSV/JSON | dueño | — | fichero | RGPD |
| `fn delete_my_account` (Edge) | borrado real, en cascada | dueño | confirmación | — | RGPD |

**Webhooks de entrada:** ninguno en la v1 (no hay pagos).
**Webhooks de salida:** ninguno.

**Trabajos periódicos:**

| nombre | cuándo | qué hace |
| --- | --- | --- |
| `import_usda` | manual, una vez y luego mensual | Carga los alimentos genéricos de USDA (dominio público) |
| `import_off_country` | semanal, por país | Trae productos de Open Food Facts del país del usuario. Respeta su ritmo: **su API devuelve 503 y corta si la aprietas**, comprobado |
| `plan_lookahead` | 03:00 hora del usuario | Prepara sugerencias de los próximos días, si están activadas |
| `cleanup_reports` | diario | Cierra reportes resueltos |

Solo APIs públicas y oficiales, con claves propias. **Ningún endpoint privado de la
aplicación original**, aunque fuera visible desde un navegador.

---

## 4. Las partes que muerden

- **Zonas horarias.** Lo más fácil de hacer mal en un diario de comidas. "Hoy" es el día
  en la zona del usuario, no en UTC. Por eso `local_date` es `date` y se calcula en el
  cliente con la zona del perfil. Si alguien viaja, su día no se parte en dos.
- **Idempotencia.** El móvil reintenta cuando hay mala cobertura. `client_token` único
  por usuario resuelve el registro duplicado que sufre la original.
- **Carreras.** Dos móviles editando el mismo día. Se resuelve con `updated_at` y
  última escritura gana por campo, no por fila entera.
- **Sin conexión.** SQLite local como verdad provisional y cola de sincronización. No es
  un extra: es la diferencia entre registrar en el supermercado o no registrar.
- **Límite de ritmo de Open Food Facts.** Medido hoy: en ráfaga devuelve errores, y
  durante estas pruebas llegó a responder **503**. La importación va por lotes, lenta,
  en segundo plano, nunca desde la pantalla del usuario.
- **Búsqueda.** `pg_trgm` aguanta bien hasta unos cientos de miles de alimentos. Si
  crece, se pasa a un índice dedicado. No antes.
- **Borrado RGPD.** `on delete cascade` en todo lo que cuelga del perfil, más una
  función que borra también los ficheros de Storage. Probarlo de verdad.
- **Datos de salud.** Peso, medidas y fotos son datos sensibles. Cifrados en tránsito y
  en reposo por Supabase, nunca en analítica, y la exportación es del usuario.
- **Seguridad del usuario.** El suelo de 1.200 kcal es una restricción de base de datos,
  no un aviso que se pueda saltar en el cliente.

---

## 5. El problema de la base de alimentos — medido, no estimado

Consulté hoy la API de Open Food Facts. Esto es lo que hay realmente:

| país | productos en Open Food Facts |
| --- | --- |
| México | **18.075** |
| Chile | **6.870** |
| Perú | **2.861** |
| España, Argentina, Colombia | no medido — su API devolvió 503 |

Fitia dice tener **5.000.000 de alimentos verificados**. Aunque esa cifra sea marketing,
el orden de magnitud no se discute: **tienen entre cien y mil veces más producto
envasado latinoamericano que nosotros.**

**Qué significa, sin adornos:** el escáner de código de barras, que en la original es
gratis y funciona, **en la nuestra va a fallar a menudo** con marcas locales. Es el
punto donde un usuario puede abandonar en el primer minuto.

**Qué hacemos con eso:**

1. **USDA FoodData Central para el alimento genérico.** Dominio público, sin
   condiciones. Cubre "arroz blanco cocido", "pechuga de pollo", "lentejas". La mayoría
   de la comida casera latinoamericana y española **es genérica**, no envasada. Aquí
   estamos bien.
2. **Open Food Facts para el envasado**, asumiendo huecos y diciéndolo en la app: "este
   producto no está, ¿lo añades?" en vez de un resultado vacío.
3. **Que el usuario aporte**, y que lo aportado vuelva a Open Food Facts. Es colaborativa
   por diseño. Curiosamente, la original presume justo de lo contrario: *"nunca generado
   por usuarios ni colaborativo"*. Es una diferencia de filosofía defendible en los dos
   sentidos, y hay que elegirla a conciencia.
4. **No prometer precisión que no tenemos.** No decimos "verificado por nutricionistas"
   mientras no haya un nutricionista.

### Y un aviso legal que no es menor

**Open Food Facts es ODbL.** Esa licencia tiene *share-alike*: si creas una base de datos
derivada y la **distribuyes**, tienes que publicarla bajo ODbL. Mostrar valores en una
app (lo que ODbL llama *Produced Work*) solo exige **atribución**, pero el límite entre
"muestro datos" y "distribuyo una base derivada" es exactamente donde se mete una app
que se sincroniza a un móvil.

**Esto hay que consultarlo con un abogado antes de monetizar.** USDA no tiene este
problema: es dominio público. Una salida conservadora es **USDA como base propia y OFF
consultado en vivo con atribución**, sin volcarlo a nuestra base. Lo dejo planteado,
no resuelto, porque no es una decisión técnica.

---

## 6. Orden de construcción

**Hito 1 — Rebanada vertical** *(prueba que el stack funciona, y fea a propósito)*
Pantallas S01, S02, S04, S05, S06, S07 · Tablas `profiles`, `goals`, `foods`,
`food_servings`, `meal_slots`, `log_entries` · Alta → objetivos → buscar un alimento →
registrarlo → ver el total del día. Alimentos: solo USDA genérico.
**Esto ya es útil para ti en tu móvil.**

**Hito 2 — Los must-have** (27 filas de `features.csv`)
Código de barras con OFF (S10), crear alimento y receta con borrado (S11, S12),
peso y gráfica (S17), comidas configurables sin tope, suelo de seguridad,
cancelación sin fricción (no aplica aún: no cobramos), precio visible (no aplica aún).

**Hito 3 — El diferenciador** *(esto es el producto, no un extra)*
**Catálogo de recetas navegable y filtrable** (lo que quitaron) + **elegir el plato de
una lista en 2 toques y gratis** (F06) + intercambiar sin rehacer el plan +
respetar alergias. Pantallas S13, S14, S16 · Tablas `recipes`, `meal_plans`,
`meal_plan_items`, `user_allergens`, `food_preferences`.

**Hito 4 — Los should y los could**
Sin conexión, Health, exportar, iPad, widgets, voz.

**Hito 5 — Lo que salga de `/replica-entrepreneur`** *(ya ha corrido)*
Las 13 filas `must` con `original = no` están repartidas por los hitos 2 y 3. Las
restantes de seguridad (verificación de edad real, modo sin cifras para riesgo de TCA)
van aquí, y merecen criterio de alguien con formación, no mío.

---

## Resumen

**Stack:** Expo + TypeScript contra Postgres en Supabase, sin servidor propio, 0 € hasta
que haya usuarios. **20 tablas**, RLS en todas. **15 operaciones** y 4 trabajos
periódicos. **Las tres partes más arriesgadas:** la cobertura de la base de alimentos en
España y Latinoamérica, la licencia ODbL si esto llega a cobrar, y el funcionamiento sin
conexión. **Siguiente paso: `/replica-design`.**
