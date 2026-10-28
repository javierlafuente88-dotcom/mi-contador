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

## 2026-10-26 — Semilla de alimentos, rehecha

De 18 alimentos verificados a mano a **49 emparejados por identificador exacto**.

### Lo que cambió en el método

La API pública de USDA se quedó sin cupo (`OVER_RATE_LIMIT`), así que bajamos el
volcado completo de SR Legacy (13,4 MB comprimidos, **7.793 alimentos**) y el
emparejamiento pasó a ser local, exacto y reproducible.

Cada alimento tiene que pasar **cuatro filtros** o no entra:

1. palabras obligatorias
2. palabras prohibidas — `breaded`, `imitation`, `candies`, `roasted`, `skin`…
3. **rango de cordura en kcal** — el filtro que faltaba, el que caza el error de
   categoría aunque las palabras encajen
4. desempate por el `fdcId` más bajo, y se anota cuántos candidatos había

Cada fila guarda su `fdcId` y las reglas con las que se eligió: se puede auditar y
se puede repetir con el mismo resultado.

### Dos pasadas, porque la primera no bastó

La primera tirada dio 46/49 y **cinco colados**: «Avena» era un cereal de desayuno de
marca, «Queso curado» era queso de **imitación**, «Espinacas» era **mostaza china**,
«Almendras crudas» eran tostadas con sal, y la carne picada salió la más grasa de 25
candidatos. Miré las descripciones reales del volcado, ajusté las reglas y la segunda
tirada dio **49/49** correctos.

También: SR Legacy **no tiene pasta común cocida**, solo fortificada con proteína o
de espinacas. En vez de etiquetar fideos de huevo como «pasta», entró con su nombre
real: **Fideos de huevo cocidos**.

### Una verificación que no depende de las reglas

`tools/verify_seed.py` no mira cómo se eligió nada: mira los números.

- **Atwater**: 4 kcal/g de proteína y carbohidrato digerible, 9 de grasa, 2 de fibra.
  Si la suma no se parece a las kcal declaradas, falla.
- Rangos imposibles, `fdcId` duplicados o ausentes, licencia inesperada.

Sale con código 1 si algo falla, así que sirve de barrera. **Las 49 pasan.**

### Un fallo encontrado al recargar la app

Al cambiar la semilla, los `fdcId` cambiaron, y el registro de lentejas del día
anterior apuntaba a uno que ya no existe. La app lo **descartaba en silencio**: la
entrada desaparecía de la pantalla y el total bajaba sin explicación. Eso es
exactamente la pérdida de datos invisible de la que se quejan los usuarios de la
original («se me borraron dos días»).

Corregido: una entrada huérfana se muestra como «Alimento que ya no está en la base»,
se puede borrar, y el pie del día dice cuántas hay y que no suman.

### Comprobado en la app

- «pollo» → Pechuga de pollo cocida, **165 kcal/100 g**
- «platano» sin tilde → **Plátano**, 89 kcal/100 g
- Los 49 cargan en el buscador
- Huérfana visible y explicada

Pendiente: los 49 son alimento **genérico**. El producto envasado con código de barras
sigue sin cubrir, y ahí es donde Open Food Facts tiene los huecos de España y
Latinoamérica que medimos en la arquitectura.

## 2026-10-27, 17:00 — La carta (S13), el diferenciador

| pantalla | estado | qué falta |
| --- | --- | --- |
| S13 catálogo de recetas | **hecho** | Crear recetas propias (hito 2) |
| S13 detalle de receta | **hecho** | — |

**18 recetas, escritas aquí.** No se ha copiado ninguna receta de ninguna app: son
combinaciones de cocina casera hechas con nuestros 49 ingredientes. Los valores
nutricionales **no están escritos a mano**: `tools/build_recipes.py` los calcula
sumando los ingredientes, cuyos datos vienen de USDA.

**Tres toques y gratis:** abrir la carta, abrir la receta, añadirla. Sin monedas, sin
créditos, sin generar nada y sin límite de cambios. Una prueba comprueba
explícitamente que **en ninguna pantalla aparecen las palabras moneda, crédito, token
ni coins**.

La receta enseña **de qué está hecha**: sus ingredientes con sus gramos, y los macros
por ración. Nada de un número opaco salido de una IA.

### Un defecto de diseño que encontró la prueba

Los filtros eran de selección única: elegir «Vegetariana» borraba «Desayuno». Un
usuario espera combinarlos. Ahora son **dos grupos**: el momento del día es
excluyente (un plato es desayuno o es cena) y los atributos se acumulan. No lo vi al
escribirlo; lo vi cuando la prueba de filtros no cuadró.

### Comprobado en la base real

Las 18 recetas y sus 64 ingredientes están también en Supabase. La consulta de
comprobación da **0 nombres con acentos rotos** y, lo que más me gusta:

> **210 kcal por ración de «Lentejas con verduras»**, calculadas por Postgres sumando
> los ingredientes — exactamente lo mismo que calculó el generador en local, por su
> cuenta.

Dos caminos independientes, el mismo número. Eso es lo que hace creíble un dato.

### Pruebas

**9 casos nuevos** para F06, y la batería entera en verde: **37 pruebas**.

### Lo que esto NO mueve, y por qué

La paridad sube de 20,9 a **22,8**, y casi todo ese punto y medio viene de otra fila.
El catálogo **no puntúa**, porque `parity.py` solo cuenta funciones que la original
tiene, y la original **quitó** su catálogo en julio de 2026.

Es decir: **nuestro mayor diferenciador es invisible para el marcador de paridad.**
No es un fallo de la herramienta: la paridad mide «hace lo mismo que la original», y
aquí hacemos a propósito lo que ella dejó de hacer. Conviene no confundir ese número
con el valor del producto.

## 2026-10-27, 17:15 — Peso y gráfica (S17)

Dos must-have de un golpe. **Paridad: 22,8 → 30,4. 6 de 14 must-have.**

**Un peso por día.** Volver a anotar el mismo día **corrige**, no acumula: el campo
cambia de «Peso de hoy» a «Corregir el peso de hoy» y el botón, de «Anotar» a
«Corregir». En la base lo garantiza el índice único `(user_id, local_date)`.

### La gráfica, y por qué es como es

Antes de escribirla cargué la guía de visualización. Las decisiones:

- **Una sola serie, sin leyenda.** El título ya la nombra. Una caja de leyenda para
  una línea es ruido.
- **Un solo eje.** Nunca dos escalas.
- **Etiquetas selectivas:** solo el primer y el último punto llevan cifra. Un número
  sobre cada punto no se lee.
- **El texto no va del color de la serie.** Va en tinta, como el resto de la app.
  La línea es lo único con color saturado.
- **Banda mínima de 2 kg.** Con poca variación, el eje no se estira: así una
  diferencia de 300 g no parece un desplome. Esto importa aquí más que en otros
  sitios.
- **Descrita para lector de pantalla:** «Gráfica de peso. N registros, de X a Y kg».
  Una gráfica que solo son píxeles deja fuera a quien no la ve.

### El tono

La cifra grande es el peso, no «lo que te falta». El cambio se dice en seco:
«−1,4 kg desde el 3 de octubre». **Sin flechas verdes ni rojas, sin felicitaciones y
sin reproches.** Hay una prueba que falla si aparecen las palabras «enhorabuena»,
«bien hecho», «deberías» o «fracas-».

Y un recordatorio honesto bajo la gráfica: *«El peso sube y baja por agua, sal y hora
del día. Lo que cuenta es la línea, no el punto.»*

### Pruebas

7 casos nuevos. **Batería entera: 44 en verde.**

Tres fallaron al principio y **ninguno era de la app**: mis selectores eran ambiguos
porque «82,4 kg» aparece dos veces en la pantalla, en la cifra grande y en el
historial. Lo que falló fue mi forma de buscarlo, y así queda anotado en vez de
inflar la lista de fallos.

## 2026-10-27, 17:40 — Crear alimentos y recetas propias (S11, S12)

**Paridad: 30,4 → 36,1. 8 de 14 must-have.** Tres funciones nuevas, una de ellas
algo que la original **no deja hacer**.

### Crear un alimento (S11)

Los valores van por 100 g, como en la etiqueta. Lo creado se guarda y aparece en las
búsquedas a partir de entonces.

Lleva **la comprobación de Atwater**: si los macros no cuadran con las calorías,
avisa — «los macros dan unas 460 kcal y has puesto 10». **Avisa, no bloquea**: las
etiquetas redondean y a veces no cuadran de verdad. Lo que sí bloquea es lo
imposible: más de 900 kcal/100 g, o macros que suman más de 100 g por cada 100 g.

Es la misma comprobación que usamos para validar la semilla de USDA, puesta ahora al
servicio del usuario.

### Crear una receta (S12)

Los macros **se calculan en vivo** mientras añades ingredientes, igual que en el
catálogo. No se escriben a mano en ningún sitio del proyecto.

### Y borrarla

Reseña literal de la original: *«al crear tú una receta ya no sale la opción de
borrar y si tienes un error se van acumulando recetas que no sirven»*.

Aquí **las tuyas se borran**; las del catálogo no, y no aparece el botón. Hay una
prueba para cada caso.

### El fallo que apareció, y por qué se vio

Crear el alimento funcionaba. **Usarlo, no**: al registrarlo, el diario lo mostraba
como «ya no está en la base». `foodById` solo miraba la semilla estática.

Lo detectó la prueba, pero lo hizo *visible* el manejo de huérfanos que añadimos al
arreglar BUG-001. Sin él la entrada habría desaparecido sin ruido y el total habría
salido mal sin explicación. **Arreglar bien un fallo hizo visible el siguiente.**

### Pruebas

8 casos nuevos. **Batería entera: 52 en verde.**

Dos fallaron primero y ninguno era de la app: buscar «huevo» encuentra antes «Fideos
de huevo cocidos», así que mi aritmética esperada estaba mal. La app calculaba bien;
yo había supuesto mal. Corregido en la prueba, con nombres exactos.

## 2026-10-28 — Código de barras (S10), a medias y dicho

**Paridad: 36,1 → 38,0.** La fila queda en `partial`, no en `yes`, y el motivo
importa.

### Lo que hay

Buscar un producto **tecleando el código** del envase, contra la API pública de
Open Food Facts. Lo encontrado se guarda, así que el mismo código no se vuelve a
pedir: una API abierta y gratuita no se castiga sin motivo.

### Lo que no hay

**Leer el código con la cámara.** Necesita compilación nativa y no funciona desde
el navegador ni en Expo Go web. La pantalla lo dice en claro en vez de dejar un
botón que no hace nada, y hay una prueba que comprueba que lo dice.

Por eso la fila es `partial`. Marcarla `yes` sería inflar el marcador: la mitad que
da el valor —apuntar con la cámara— no está.

### Honestidad sobre la cobertura

Cuando un código no aparece, la pantalla **no se queda en blanco**: explica que Open
Food Facts es una base abierta con huecos grandes fuera de Europa, con las cifras que
medimos en la arquitectura —18.000 productos en México, menos de 3.000 en Perú— y
ofrece crear el alimento a mano.

Y si el producto está pero **sin calorías por 100 g**, se rechaza: un dato a medias
es peor que ninguno, porque parece que hay información cuando no la hay.

### La licencia, que no es decorativa

Los datos de Open Food Facts son **ODbL**, y mostrarlos exige atribución. Cada
alimento traído de ahí la lleva en pantalla: «Datos de Open Food Facts, bajo licencia
ODbL». Hay una prueba que falla si desaparece.

Lo que sigue pendiente de abogado es el *share-alike*: volcar esos datos a una base
propia y distribuirla es otra cosa distinta de mostrarlos. Está anotado desde
`/replica-architect`.

### Pruebas

7 casos nuevos, **con las respuestas de Open Food Facts interceptadas**: una prueba no
debe depender de una API de terceros ni cargarla. Se prueba nuestro comportamiento
ante cada respuesta posible: encontrado, no está, sin calorías, servicio caído,
código inválido y código repetido.

Aparte de las pruebas, **una consulta real** a la API para comprobar que los nombres
de campo son los correctos: `energy-kcal_100g`, `proteins_100g`,
`carbohydrates_100g`, `fat_100g`, `fiber_100g`. Los cinco, confirmados. Simular
respuestas sin haber visto una de verdad es simular tus propias suposiciones.
