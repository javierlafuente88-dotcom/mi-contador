# Build log

## 2026-10-26 — Hito 1, rebanada vertical

| pantalla | estado | qué falta |
| --- | --- | --- |
| S01 cuestionario de alta | **hecho** | — |
| S02 objetivos calculados | **hecho** | Fundido con S01 a propósito (ver abajo) |
| S04 diario del día | **hecho** | Macros en el diario; editar una entrada |
| S06 buscar alimento | **hecho** | Solo 18 alimentos en la base |
| S07 detalle y cantidad | **hecho** | Medidas caseras (taza, rebanada) |
| S05 métodos de registro | pendiente | Hoy solo texto. Foto, voz y código de barras son del hito 2 |
| S11 crear alimento | **esqueleto** | El botón existe y no hace nada. Está dicho en pantalla |

**Paridad: 17,1 / 100.** 3 de 14 must-have. Es el marcador correcto para un hito 1.

### Verificado de verdad, no supuesto

Arranqué la app en el navegador y recorrí el bucle entero: alta → objetivo →
buscar «lentejas» → 250 g → registrar → ver la suma.

- Objetivo calculado para 82 kg / 178 cm / 1988 / ligero / bajar peso:
  mantenimiento **2.175 kcal**, meta **1.675 kcal**, proteína 131 g. Cuadra con
  Mifflin-St Jeor a mano.
- Lentejas 250 g → **285 kcal**, 23 g de proteína. Cuadra con 114 kcal/100 g.
- El objetivo sobrevive a recargar la página: AsyncStorage funciona.
- **Cero errores de consola.**
- Nombre accesible del renglón: «Lentejas cocidas, 114 kcal/100 g». La guía de
  puntos no la lee el lector de pantalla, que es lo que se buscaba.

### Dos decisiones que se apartan del recon

**S01 y S02 van juntas.** El recon las separaba porque la original las separa. Pero
la queja repetida es rellenar un formulario largo para descubrir el precio al final.
Aquí el objetivo aparece en cuanto hay tres campos, en la misma pantalla.

**El diario no tiene anillo.** `features.csv` lo marca `partial` por eso, no por
estar a medias: está hecho como una cuenta que suma. Es la dirección aprobada en
`/replica-design`.

### Un fallo mío, encontrado al mirar la app funcionando

La primera versión decía «te quedan **entre 1.507 y 1.843**» con el día vacío. Está
mal: si no has comido nada, sabes exactamente lo que te queda. Yo había hecho que el
margen creciera con **lo que falta** en vez de con **lo registrado**, que es justo al
revés. Corregido: el margen es el 10 % de lo registrado, y por debajo de 25 kcal se
da la cifra exacta. Con el día vacío ahora dice «Te quedan 1.675 kcal».

No lo habría visto sin abrir la app. El `tsc` pasaba igual.

### Lo que fue más difícil de lo que parecía

**La base de alimentos, otra vez, y peor de lo esperado.** El emparejamiento
automático contra USDA produjo **18 errores de 32**: «Almendras» apuntaba a almendras
garrapiñadas, «Mantequilla» a manteca de cacao, «Leche entera» a yogur, «Pechuga de
pollo» a tiras empanadas y «Patata cocida» a la **piel** de la patata.

Revisé las 32 a mano contra su descripción de USDA, conservé **18** y dejé **23 en
cuarentena** en `replica/seed/foods.json` bajo `_pendientes`, fuera de la app, con el
motivo de cada descarte. En una app de calorías un dato mal es exactamente el defecto
que le criticamos a la original; prefiero 18 correctos que 32 dudosos.

Falta pollo, huevo, leche, arroz, aceite y toda la fruta. Para arreglarlo hace falta
emparejar por identificador exacto de USDA en vez de por palabras, y la clave pública
de demostración se agotó (error 429). Con una clave gratuita tuya se resuelve en una
pasada.

### Pendiente antes del hito 2

1. Rehacer la semilla con emparejamiento por `fdcId` y un rango de cordura por
   categoría, para que un fallo así no vuelva a pasar desapercibido.
2. Capturas por pantalla en `replica/clone-screens/` para `/replica-diff`.
3. `/replica-backend`: sustituir el almacén falso por Supabase. Las firmas ya son las
   definitivas, así que no debería tocarse ninguna pantalla.
