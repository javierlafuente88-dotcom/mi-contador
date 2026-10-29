# Plan de pruebas

Flujos de `replica/recon.md`. Hito 1, así que solo están construidos F01, F02, F08
parcial y F09 parcial. Lo que no existe todavía se marca **no construido** y no se
cuenta como fallo.

**La regla:** se prueba lo nuestro. La app original no se toca ni se somete a carga.

---

## F01 — Alta y cálculo de objetivos

| caso | qué se hace | qué debe pasar |
| --- | --- | --- |
| F01-H1 | Rellenar sexo, año, altura, peso, actividad y objetivo | Aparece el objetivo calculado y el botón de empezar |
| F01-E1 | Dejar los campos vacíos | No se puede continuar; se explica qué falta |
| F01-E2 | Año 1800, altura 5, peso 2 | Error por campo, en su sitio, sin bloquear la app |
| F01-E3 | Peso y altura con decimales y coma («72,5») | Se acepta |
| F01-E4 | Recargar a mitad | Vuelve al principio sin datos a medias |
| F01-E5 | Ancho de móvil (375px) | Nada se corta ni desborda |
| F01-E6 | Solo teclado | Se completa el flujo entero sin ratón |
| F01-N1 | Objetivo que caería por debajo de 1.200 kcal | **Se bloquea** y se explica sin culpar |
| F01-N2 | Año de nacimiento de hace 12 años | No se admite |

## F02 — Registrar una comida

| caso | qué se hace | qué debe pasar |
| --- | --- | --- |
| F02-H1 | Buscar «lentejas», elegir, 250 g, registrar | Aparece en el diario y el total sube |
| F02-E1 | Buscar algo que no existe | Estado con salida, no pantalla vacía |
| F02-E2 | Buscar «platano» sin tilde | Encuentra «Plátano» |
| F02-E3 | Cantidad como operación: «150+100» | Resuelve a 250 g |
| F02-E4 | Cantidad 0, negativa o texto | Error claro, botón deshabilitado |
| F02-E5 | Doble clic en «Registrar» | **Un solo registro**, no dos |
| F02-E6 | Cantidad enorme (99.999 g) | Se admite o se rechaza, pero sin romperse |
| F02-E7 | Nombre largo de alimento | Se parte en dos líneas, no desborda |
| F02-E8 | Recargar tras registrar | El registro sigue ahí |
| F02-N1 | Mantener pulsado para borrar | Desaparece y el total baja |

## F08 — Peso y progreso

| caso | estado |
| --- | --- |
| F08-* | **No construido** (hito 2) |

## F09 — Cuenta y sesión *(solo con Supabase)*

| caso | qué se hace | qué debe pasar |
| --- | --- | --- |
| F09-H1 | Entrar con credenciales correctas | Entra al diario |
| F09-N1 | Contraseña incorrecta | Mensaje que **no revela** si el correo existe |
| F09-N2 | Correo mal formado | Error por campo |
| F09-E1 | Sin sesión, pedir datos a la API | **Cero filas** (ya probado en `rls_test.sql`) |

## Aislamiento entre usuarios

Cubierto por `supabase/rls_test.sql`, ejecutado contra la base real: **8 de 8
aislado**. Es una prueba más estricta que hacerlo por la interfaz, porque habla
directamente con Postgres.

---

## Cómo se ejecuta

Los automáticos corren contra un servidor en **modo local** (`DATA_SOURCE=fake`),
en el puerto 8082, para que no dependan de cuentas ni de red:

```bash
cd mobile && npx playwright test
```

Cada spec falla si hay **un solo error de consola** o una respuesta 5xx, y pasa un
escáner de accesibilidad por cada pantalla.

## F12 — Respetar las alergias declaradas (`e2e/f12-alergias.spec.ts`)

Origen: reseña de la original en la que una persona declaró alergia al pescado y le
propusieron merluza dos veces en cinco platos. Es la única `must` del plan que, si
falla, hace daño en vez de molestar.

| id | qué comprueba |
| --- | --- |
| F12-H1 | con el alérgeno declarado, el plato **no se añade de un toque**: el botón de añadir no existe hasta confirmar a sabiendas |
| F12-H2 | un plato que no choca sigue siendo de un toque: el aviso no se dispara de más |
| F12-E1 | la confirmación **no se queda pegada** al pasar a otro plato |
| F12-E2 | dos alérgenos declarados se nombran los dos |
| F12-E3 | un alérgeno que no sabemos detectar se dice en pantalla, no se finge |
| F12-E4 | las alergias declaradas sobreviven a recargar |
| F12-E5 | una receta creada por el usuario **hereda** los alérgenos de sus ingredientes |
| F12-H3 | en la **búsqueda** (S06), un alimento suelto con el alérgeno tampoco se registra de un toque |
| F12-H4 | un alimento que no choca sigue siendo de un toque |
| F12-E6 | la confirmación no se arrastra de un alimento a otro |
| F12-E7 | lo declarado en la carta se respeta en la búsqueda: **una sola lista**, no dos |
| F12-H5 | un alimento **creado por ti** con alergeno declarado avisa igual |
| F12-E8 | no marcar ningun alergeno al crearlo queda como «no declarado», y la pantalla lo dice |
| F12-E9 | una receta hereda el alergeno de un alimento que creaste tu |
| F12-A1 | la pantalla de alergias pasa axe (wcag2a + wcag2aa, sin graves) |

## F13 — El desglose de macros del día (`e2e/f13-macros.spec.ts`)

Los macros estaban en el detalle del alimento, que es donde no sirven: lo que
quieres saber es cómo va **el día**, no cuánta proteína llevaba aquella lata.

Lo que de verdad prueban estos casos no es la suma. Es el hueco: un alimento
puede traer calorías y no traer fibra, y sumar cero sería decir «cero gramos de
fibra» cuando lo cierto es «no lo sé».

| id | qué comprueba |
| --- | --- |
| F13-H1 | lo registrado se desglosa en proteína, carbohidratos, grasa y fibra |
| F13-H2 | dos registros suman |
| F13-E1 | el día vacío muestra cero contra la meta, no «sin datos» |
| F13-E2 | si a **algún** registro le falta la fibra, el total se da y se avisa de que va corto |
| F13-E3 | si a **ninguno** le consta, dice «sin datos»: nunca «0 g», y sin el aviso de «se queda corto», que lo contradiría |
| F13-E4 | los totales sobreviven a recargar |
| F13-E5 | un plato de la carta también desglosa, no solo los alimentos sueltos |
| F13-A1 | el diario con macros pasa axe (wcag2a + wcag2aa, sin graves) |

## F14 — Editar las comidas del día (`e2e/f14-comidas.spec.ts`)

La original te deja cinco comidas, y cuatro en el plan gratis. El tope no sale de
la nutrición: sale del precio. Aquí son filas en una tabla y no hay tope.

El caso que de verdad importa es **E3**, y su hermano **E8**: quitar una comida no
puede borrar lo que comiste. Que dejes de merendar hoy no cambia lo que
merendaste el martes pasado, y un contador que pierde registros al tocar los
ajustes es un contador en el que no se puede confiar.

| id | qué comprueba |
| --- | --- |
| F14-H1 | renombrar una comida se ve en el diario |
| F14-H2 | se pueden añadir: seis, cuando la original da cuatro gratis |
| F14-H3 | subir y bajar cambia el orden del diario |
| F14-E1 | una comida sin nombre no se puede guardar |
| F14-E2 | sin cambios, Guardar está apagado |
| F14-E3 | quitar una comida **mueve** lo registrado y lo dice antes de tocarlo; el total no se mueve |
| F14-E4 | «Dejarlo» no quita nada |
| F14-E5 | con una sola comida no se ofrece quitarla: el diario necesita un sitio donde anotar |
| F14-E6 | los cambios sobreviven a recargar |
| F14-E7 | quitar una comida recién añadida no habla de mover nada, porque no hay nada |
| F14-E8 | lo registrado **otros días** también se mueve (se mete por debajo: no hay interfaz para anotar en otro día) |
| F14-A1 | la pantalla pasa axe (wcag2a + wcag2aa, sin graves) |

## F15 — Cambiar el objetivo (`e2e/f15-objetivo.spec.ts`)

En la original esto es premium: el cuestionario calcula un número y, si no te
convence, pagas o te aguantas.

El caso que manda es **N1**. Dos reseñas independientes cuentan que la original
acepta déficits peligrosos, y los 1.200 kcal son nuestra respuesta a eso. Dejar
que se editen sin suelo sería quitarnos lo único con lo que de verdad podemos
decir que somos más seguros.

| id | qué comprueba |
| --- | --- |
| F15-H1 | cambiar las calorías se ve en el diario |
| F15-H2 | cambiar los macros se ve en el desglose del diario |
| F15-N1 | **por debajo de 1.200 no se guarda**: error en el campo, explicación y botón apagado |
| F15-N2 | 1.200 justo sí se puede: el suelo es suelo, no pared |
| F15-E1 | si los macros no suman las calorías se avisa, pero **se deja guardar**: es tu cuenta |
| F15-E2 | «Cuadrar» ajusta los carbohidratos, que son el resto en la fórmula del alta |
| F15-E3 | «Volver a calcularlo» usa el **peso más reciente**, no el del alta |
| F15-E4 | sin pesarse, dice que usa el del alta en vez de callárselo |
| F15-E5 | el objetivo cambiado sobrevive a recargar |
| F15-E6 | el campo en blanco dice «escribe un número», no «no bajamos de 1200» |
| F15-A1 | la pantalla pasa axe (wcag2a + wcag2aa, sin graves) |
