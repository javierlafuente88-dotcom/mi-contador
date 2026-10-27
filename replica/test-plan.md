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
