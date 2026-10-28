# Paridad con la original

2026-10-28 · referencia: Fitia iOS 25.2.1

## El número

# 41,8 / 100

**9 de 14 must-have.** Ha subido de 20,9 a 41,8 en dos días de hito 2: la carta, el
peso, crear alimentos y recetas, el código de barras y el respeto a las alergias.
Sigue sin ser publicable: faltan cinco must-have y el marcador lo dice sin maquillaje.

| área | puntuación | funciones |
| --- | --- | --- |
| onboarding | **100,0** | 2 |
| núcleo | **75,0** | 2 |
| progreso | **66,7** | 4 |
| datos | 62,5 | 5 |
| registro | 34,6 | 6 |
| plan | 26,5 | 8 |
| objetivos, nutrición, motivación, ayuno, integraciones, plataforma, coach | **0,0** | 12 |

Lo construido está bien construido; lo que falta es casi todo lo demás.

---

## Diff visual: no se ha hecho, y es deliberado

La skill propone comparar capturas pantalla a pantalla. **No se ha hecho, por dos
razones, y ninguna es pereza.**

**Primera: no tenemos capturas de la original y no las vamos a guardar.** En
`/replica-recon` decidí mirarlas en el navegador para hacer el inventario pero no
descargarlas. Una carpeta con las capturas de Fitia dentro de este proyecto es
exactamente lo que acaba filtrándose a un repositorio.

**Segunda, y más importante: comparar nuestro diseño con el suyo mediría lo que no
queremos.** La dirección aprobada en `/replica-design` es **«la cuenta, no el
marcador»**: una lista que suma, sin anillo, sin barra, sin amarillo. Fitia tiene
anillo, barra y amarillo. Un diff de maquetación nos daría una puntuación baja
**porque lo estamos haciendo a propósito**, y perseguir esa cifra sería ir hacia
atrás. La propia skill lo avisa: *parity means it does the same job, not that it
looks the same*.

### Lo que sí se ha hecho

Capturas de **nuestras** pantallas en `replica/clone-screens/`, siete en total, a
ancho de móvil. No son para compararlas con nadie: son la referencia contra la que
detectar **regresiones nuestras**, hoy contra la semana que viene.

```bash
python3 imgdiff.py replica/clone-screens/S04-diario-vacio.png <nueva> --mode pixel
```

Herramienta comprobada en los dos sentidos: **100,0 MATCHES** con una imagen contra
sí misma, **26,8 DIFFERENT** al enfrentar el diario vacío con el diario lleno.

---

## Diff de comportamiento

Lo que las puntuaciones no ven. La columna «la original» sale de su centro de ayuda,
su ficha de tienda y las 2.451 reseñas de `replica/reviews.csv`.

| flujo | la original | la nuestra | veredicto |
| --- | --- | --- | --- |
| **F01 alta** | Cuestionario largo y **el precio aparece al final**. Queja repetida: «me hicieron marcar un montón de cosas para al final decirme que tiene un costo» | El objetivo aparece **en cuanto hay tres campos**, en la misma pantalla. No hay precio porque no se cobra | **ganamos** |
| **F01 seguridad** | Acepta objetivos de déficit extremo. Reseña titulada «Dañina»: 1.000 kcal a un peso sano | Suelo de 1.200 kcal **como restricción de base de datos**, no como aviso saltable | **ganamos** |
| **F02 registrar** | 4-5 toques. Código de barras gratis y base enorme | 3 toques y 2 escrituras. **49 alimentos**: nuestra debilidad conocida | **perdemos en cobertura, empatamos en fricción** |
| **F02 cantidad** | Hay que salir a la calculadora para dividir | Acepta `1200/3.5` en el propio campo | **ganamos** |
| **F02 registro doble** | «no registra los alimentos o los registra doble o triple» | Índice único por `client_token`. Probado: doble clic crea **una** entrada | **ganamos** |
| **F06 elegir plato** | Catálogo retirado en julio de 2026; ahora IA racionada por monedas. 67 reseñas, nota media **1,46** | **No construido todavía.** Es el diferenciador entero | **pendiente** |
| **F09 cancelar** | 106 reseñas, nota media 1,4. «es imposible cancelar la suscripción» | No hay suscripción. Borrar la cuenta es **una llamada** que borra de verdad | **ganamos** |
| **errores** | Te regaña al final del día por no comer lo correcto | No se evalúa el día de nadie. «Te quedan entre X e Y», y si te pasas se dice sin reproche | **ganamos** |
| **memoria entre visitas** | Sincroniza en la nube | Igual, y además el objetivo sobrevive a recargar en local | **empate** |

---

## Veredicto

### No publicable

Por la regla de la skill: **10 must-have sin hacer**. No por fallos — no hay ningún
S1 ni S2 abierto y las 46 pruebas pasan — sino porque la app todavía no hace lo
suficiente.

Lo que sí se puede decir: **lo que existe funciona y está probado**, y en siete de
nueve flujos comparables ya nos comportamos mejor que la original.

---

## Las cinco cosas a construir, por orden

1. **Catálogo de recetas navegable y elegible** (F06). No es una función más: es
   **todo el producto**. 131 reseñas hablan de recetas y 67 de las monedas que ahora
   hacen falta para generarlas. Sin esto, somos un contador de calorías flojo.
2. **Seguimiento de peso y su gráfica** (S17). Dos must-have de un golpe, y la tabla
   ya está en la base.
3. **Crear alimento y crear receta** (S11, S12). Desatasca nuestro punto débil: con
   49 alimentos, lo que no está lo pone el usuario. Incluido **poder borrarlas**, que
   la original no deja.
4. **Código de barras** (S10). En la original es gratis y funciona. Aquí chocará con
   los huecos de Open Food Facts que medimos: 18.075 productos en México, 6.870 en
   Chile, 2.861 en Perú.
5. **Respetar alergias** en el plan. Hoy la tabla existe y nada la usa. En la
   original, alguien declaró alergia al pescado y le propusieron merluza.

Las cinco son `must`. Hacerlas sube la paridad por encima del 50 %.

**Siguiente paso: `/replica-build`** para el hito 2.
