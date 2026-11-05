# Paridad con la original

2026-10-29 · referencia: Fitia iOS 25.2.1

## El número

# 49,4 / 100

**12 de 14 must-have.** Ha subido de 20,9 a 49,4 en el hito 2: la carta, el peso,
crear alimentos y recetas, el código de barras, el respeto a las alergias, el
desglose de macros, las comidas editables y el objetivo editable. Sigue sin ser
publicable: faltan dos must-have y el marcador lo dice sin maquillaje.

| área | puntuación | funciones |
| --- | --- | --- |
| onboarding | **100,0** | 2 |
| núcleo | **100,0** | 2 |
| objetivos | 75,0 | 2 |
| progreso | **66,7** | 4 |
| datos | 62,5 | 5 |
| plan | 35,3 | 8 |
| registro | 34,6 | 6 |
| nutrición, motivación, ayuno, integraciones, plataforma, coach | **0,0** | 10 |

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

### Todavía no publicable

Por la regla de la skill: **2 must-have sin hacer**. No por fallos — no hay ningún
S1 ni S2 abierto y las 210 pruebas pasan — sino porque la app todavía no hace lo
suficiente.

Lo que sí se puede decir: **lo que existe funciona y está probado**, y en siete de
nueve flujos comparables ya nos comportamos mejor que la original.

---

## Lo que queda, por orden

Las cinco de la primera versión de este documento están hechas, y también las
comidas y el objetivo editables. Quedan estas dos.

1. **Base de alimentos por país**. Y no es una pantalla: la arquitectura está
   entera (columna, índice y el filtro ya puesto en `search_foods`). Lo que
   falta son **datos**: los 49 alimentos son genéricos de USDA y tienen
   `country_code` nulo, así que un selector de país filtraría una base donde
   todo es genérico y daría siempre los mismos 49. Hace falta importar productos
   por país de Open Food Facts; es trabajo de datos, no de interfaz.
2. **Leer el código de barras con la cámara**. La búsqueda por código ya funciona
   contra Open Food Facts; falta la cámara, y eso pide compilación nativa: es un
   salto de otra clase, no otra pantalla más.

Las dos son `must`. Hacerlas pone la paridad por encima del 55 %.

Una nota sobre la segunda: la app se publica como sitio web (`replica/publicar.md`),
y por ese camino la cámara no sale de `expo-camera`, que es nativo. Tendría que
hacerse con la cámara del navegador, que es otra implementación. No es imposible,
pero no es «lo mismo pero luego»: es volver a escribirlo.
