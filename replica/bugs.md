# Fallos

Formato de `bug-report.md`. Solo se registra lo que se ha reproducido.
Lo dudoso va al final, en «por comprobar».

---

### BUG-001: el diario no cambia de día con la app abierta

- Severidad: **S3** — se ve mal y confunde, pero hay apaño (recargar)
- Flujo / caso: F04-E1
- Pantalla: S04
- Build: `8ad9a50` · Chrome 141, 1280px y Pixel 7

Pasos
1. Abrir el diario a las 23:58.
2. Dejar la app abierta sin tocarla.
3. Esperar a que pasen las 00:03.

Esperado: el diario pasa al día nuevo, vacío.
Actual: sigue mostrando el día anterior, con sus registros y su total.

Evidencia: `e2e/f03-limites.spec.ts` → *F04-E1*, que fallaba con el reloj simulado.

Causa: `today` era un cálculo suelto en el cuerpo del componente
(`const today = todayLocal()`), así que solo se refrescaba cuando algo provocaba un
redibujado. Con la app quieta, nunca.

**Lo que casi me lo oculta:** la primera versión de la prueba pulsaba «Añadir» antes
de comprobar la fecha, y ese clic forzaba el redibujado. La fecha salía correcta y
di el caso por bueno. Solo al quitar la interacción apareció el fallo.

Peor aún: un registro añadido en ese estado iba al día **nuevo** (porque el clic sí
recalculaba) pero no aparecía en la lista, que seguía siendo la del día viejo.

Estado: **arreglado en `e52f5a1`**. `today` pasa a ser estado, con un intervalo de
30 s que lo actualiza, y la etiqueta de la fecha se deriva de él en vez de de un
`Date` nuevo, para que etiqueta y datos no puedan discrepar.

---

### BUG-002: se aceptan cantidades que la base de datos rechaza

- Severidad: **S3** — rompe al sincronizar, no al registrar
- Flujo / caso: F02-E6
- Pantalla: S07
- Build: `8ad9a50`

Pasos
1. Añadir un alimento.
2. Escribir `99999` en la cantidad.
3. Registrar.

Esperado: se avisa de que es demasiado.
Actual: se acepta sin rechistar y se guarda en local.

Causa: la base tiene `check (grams > 0 and grams <= 10000)`, y el cliente no tenía
ningún techo. En modo local funciona; contra Supabase, el mismo gesto da un error de
restricción que el usuario no entendería.

Es el tipo de incoherencia que solo aparece cuando cliente y servidor se escriben por
separado y nadie los compara.

Estado: **arreglado en `e52f5a1`**. Tope de 10.000 g en el cliente, con el mismo
número que la restricción de la base y un mensaje en claro.

---

## Resultado de la batería

**46 pruebas, 46 pasan**, en perfil de escritorio y de móvil (Pixel 7).

Cada prueba falla si aparece **un solo error de consola**, si alguna respuesta es 5xx,
o si el escáner de accesibilidad encuentra algo grave. Ninguna lo hizo.

| severidad | encontrados | arreglados | abiertos |
| --- | --- | --- | --- |
| S1 | 0 | — | **0** |
| S2 | 0 | — | 0 |
| S3 | 2 | 2 | 0 |
| S4 | 0 | — | 0 |

**Ningún S1 abierto.**

---

## Por comprobar

No son fallos: son cosas que no he podido reproducir pero que no descarto.

- **Dos pestañas a la vez.** La prueba F02-E9 pasa, pero el almacén local lee la lista
  entera, la modifica y la reescribe. Dos escrituras *realmente* simultáneas podrían
  pisarse. No he conseguido provocarlo porque las acciones del navegador van en serie.
  Con Supabase el problema desaparece: cada registro es una fila.
- **Sin conexión.** No está construido (hito 4), así que no hay nada que probar.
- **Sesión caducada.** Con Supabase, el cliente renueva el token solo. Falta ver qué
  ve el usuario si la renovación falla.
- **Nombres de alimento muy largos.** Los 49 de la semilla son cortos. Se podrá probar
  cuando exista «crear alimento» (hito 2).
- **Horario de verano.** El cambio de hora no mueve la medianoche local, así que no
  debería afectar, pero no lo he probado.

---

## Cómo volver a pasarlas

```bash
cd mobile && npx playwright test
```

Necesita el servidor en modo local, que no depende de cuentas ni de red:

```bash
cd mobile && EXPO_PUBLIC_DATA_SOURCE=fake npx expo start --web --port 8082
```
