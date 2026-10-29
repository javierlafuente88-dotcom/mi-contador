# Componentes

Tokens: `replica/design/tokens.json` · CSS: `tokens.css` · Tailwind: `tailwind.config.js`
Contraste comprobado: **16 pares, 0 fallos AA**.

---

## La dirección, en una frase

**La cuenta, no el marcador.**

La pantalla del día se lee como la cuenta de un restaurante: una lista de platos que
suma, con el total abajo. No hay anillo. No hay barra que grite. No hay amarillo.

Es una decisión de producto, no de gusto. Una app de calorías que te pone un medidor
delante te está diciendo todo el rato cuánto te falta para fallar; 11 reseñas hablan de
ansiedad y obsesión, y una de las más votadas de Google Play (66 personas) es de alguien
que bajó 20 kilos y acabó con un trastorno alimentario. Una lista que suma informa.
Un medidor juzga.

**Dónde gastamos el atrevimiento:** en el renglón de carta. Todo lo demás, callado.

```
Desayuno
  Tostada con tomate y aceite ·································  280 kcal
  Café con leche ············································   90 kcal

Almuerzo
  Lentejas con verduras ······································  420 kcal
                                                               ─────────
                                                    Hoy        1.840 kcal
                                       Te quedan entre 160 y 360
```

**El rango, no la cifra.** "Te quedan entre 160 y 360" en vez de "te quedan 260".
Ningún método de registro es exacto ni al 5%, y fingir precisión es lo que convierte
contar calorías en una obsesión. La original muestra un número exacto y luego te regaña
al final del día. Nosotros mostramos la franja honesta.

---

## Tipografía

| rol | familia | por qué |
| --- | --- | --- |
| Interfaz y **todas las cifras** | **IBM Plex Sans** | Tiene cifras tabulares de verdad. Sin eso, una columna de kcal baila al cambiar de dígito |
| Nombres de platos y recetas | **Source Serif 4** | Es la voz de la carta. Solo ahí |
| Monoespaciada | reservada, sin uso | No se usa de adorno en etiquetas |

Ambas son de licencia abierta (SIL OFL). Ninguna es la de la original.

---

## Componentes

### MenuLine — el renglón de carta
```
variantes  catalogo (elegible), registrado (ya comido), plan (propuesto)
estados    normal, pulsado, elegido, bloqueado-por-alergia, cargando
tokens     nombre: dish/serif/text · guía: border-input punteada ·
           valor: sm/tabular/text-muted · alto mínimo 48px
a11y       es un <button> o Pressable real con rol de botón.
           El lector de pantalla lee "Lentejas con verduras, 420 kilocalorías,
           añadir". La guía de puntos es decorativa: aria-hidden.
           Nunca se transmite el estado solo con color.
pantallas  S04, S06, S13
```

### DayBill — la cuenta del día
```
variantes  hoy, dia pasado, dia futuro planificado
estados    vacio, parcial, completo, por-encima
tokens     total: total/tabular · rango: sm/text-muted ·
           por encima: danger (texto Y etiqueta, nunca solo el color)
movimiento el único de la app: al registrar, el total cuenta del valor viejo al nuevo
           (200ms, ease). Con prefers-reduced-motion, salta.
a11y       aria-live="polite" en el total, para que el cambio se anuncie una vez
pantallas  S04
```

### MacroRow — el desglose del día
```
donde      bajo DayBill, en S04. Los macros del DIA, no los de un alimento:
           en el detalle del alimento ya estaban y ahi no sirven
filas      proteina, carbohidratos, grasa, fibra. El agua NO: no se registra,
           y una fila a cero seria inventarse el dato
valor      "23 de 131 g" — con palabras, no "23 / 131 g": la barra el lector de
           pantalla la lee "barra". Una sola frase para todos; nunca un texto
           visible y otro escondido en aria-label, que se separan con el tiempo
fibra      sin meta: el objetivo del alta no calcula una, y ponerle los 25 g de
           la EFSA seria una meta que el usuario nunca acepto
estados    sabido: "23 de 131 g" · falta en algunos: el total MAS un aviso de
           que se queda corto · no consta en ninguno: "sin datos", NUNCA "0 g"
tokens     etiqueta: sm/text-muted · valor: base/text/tabular ·
           separador: borde inferior 1px border. Sin color de veredicto:
           los macros no se riñen, se cuentan
a11y       texto plano en orden etiqueta-valor; sin aria-label duplicado
pantallas  S04
```

### MealEditor — editar las comidas (S26)
```
que hace  renombrar, reordenar, anadir y quitar. Sin tope: la original da 5,
          y 4 gratis, pero ese numero sale del precio, no de la nutricion
guardado  nombres y orden van con el boton Guardar. QUITAR va aparte y es
          inmediato: toca lo registrado, y eso se pregunta en el momento,
          no se mete en un lote junto a un cambio de nombre
quitar    lo registrado NO se borra: se MUEVE a la comida de encima (o la de
          debajo si es la primera), y se dice cual antes de tocar nada.
          "de todos los dias", porque es de todos los dias
orden     primero mover los registros, DESPUES borrar la comida. Al reves,
          `on delete set null` los deja huerfanos: invisibles en el diario
          agrupado por comida, y sumando en el total
limite    la ultima no se quita. El diario necesita un sitio donde anotar
a11y      el texto visible es corto ("Subir") porque la columna es estrecha;
          el leido nombra su comida ("Subir Merienda"). Cuatro botones con
          el mismo nombre pasan axe y son inusables con lector de pantalla
tokens    campo: Field · acciones: Button ghost · aviso: Notice danger ·
          confirmar: Button danger. Sin iconos de flecha: palabras
pantallas  S26, entrada desde S04
```

### MealGroup — bloque de comida
```
variantes  cualquier nombre que el usuario cree (Desayuno, Merienda, Pre-entreno...)
estados    vacia, con items
vacio      "Aún no has anotado nada aquí." + boton "Añadir"
           (invitación a actuar, no un dibujo triste)
nota       sin tope de 3 ni de 4. Son filas de meal_slots
pantallas  S04, S13
```

### FoodSearch — búsqueda
```
estados    inactivo, escribiendo, resultados, SIN RESULTADOS, sin conexion, error
sin result "No encontramos «galletas María Artiach».
            Crear este alimento  ·  Buscar en Open Food Facts"
           Nunca una pantalla vacía. El hueco de la base es nuestro punto débil
           conocido: la interfaz lo convierte en una acción, no en un callejón.
a11y       combobox con aria-expanded y navegación por teclado; resultados en listbox
pantallas  S06
```

### Button
```
variantes  primario, secundario, fantasma, peligro
tamaños    sm 36px, md 44px, lg 52px   (mínimo táctil 44px)
estados    normal, pulsado, foco-visible (anillo 2px accent, separado 2px),
           desactivado, cargando
tokens     primario: bg accent, texto on-accent, radio input ·
           peligro: bg danger, texto on-accent
a11y       elemento de botón real. Cargando mantiene la etiqueta y añade
           aria-busy; el texto no se sustituye por un spinner mudo.
           Cuando el texto visible se repite y solo tiene sentido por dónde
           está (cuatro "Subir" en una lista), `a11yLabel` da el nombre
           completo: "Subir Merienda". Varios botones con el mismo nombre
           pasan axe y son inusables con lector de pantalla.
copy       dice lo que hace: "Registrar", "Guardar cambios", "Borrar receta".
           Nunca "Enviar". Nunca una flecha pegada al texto.
```

### Stepper de cantidad
```
variantes  gramos, porciones
estados    normal, foco, invalido
detalle    acepta aritmética: "1200/3.5" se resuelve al salir del campo.
           Sale de una petición literal de un usuario de la original.
a11y       input numérico con inputmode="decimal", etiqueta visible, error
           asociado por aria-describedby
pantallas  S07
```

### AllergenGuard — aviso de alergia
```
estados    oculto, aviso (evitar), bloqueo (alergia declarada)
tokens     danger sobre surface, con icono Y texto
regla      si hay alergia declarada, el plato NO se puede añadir con un toque:
           exige confirmación explícita. La original propuso merluza a alguien
           que había declarado alergia al pescado.
donde      la carta (S13), la busqueda de alimentos (S06) y el detalle de ambas.
           La misma regla por las dos puertas: el riesgo no cambia segun por
           donde entres.
lista      en la fila, el aviso va DELANTE de las calorias y en danger, pero no
           las tapa. Un aviso en el gris del dato no se lee como aviso.
vacio      ausencia de alergeno NO es "no lleva", es "no declarado", y se dice.
           Al crear un alimento se piden los 14 y se avisa de esa diferencia.
a11y       role="alert" al aparecer. El color nunca va solo: la palabra
           ("lleva pescado") esta escrita en la fila.
```

### GoalGuard — suelo de seguridad
```
estados    oculto, advertencia, bloqueo
regla      por debajo de 1.200 kcal la base de datos rechaza el objetivo.
           La interfaz lo explica antes, sin dramatizar y sin culpar:
           "Este objetivo está por debajo de lo que recomendamos.
            No podemos ponerlo como meta."
nota       el texto definitivo lo debe revisar alguien con formación en nutrición.
           No es mi decisión y no debería serlo.
```

### Chip de filtro
```
variantes  dieta, tiempo de preparación, ingrediente, kcal
estados    normal, elegido, desactivado
tokens     radio chip, borde border, elegido: bg accent / texto on-accent
pantallas  S13 (el catálogo de recetas: nuestro diferenciador)
```

### Sheet — hoja inferior
```
usos       elegir método de registro, detalle de alimento, confirmaciones
tokens     radio sheet (20px), sombra sheet
a11y       foco atrapado dentro, Esc cierra, el fondo queda inerte
pantallas  S05, S07, S15
```

### Tarjetas, sombras y bordes
```
regla      las tarjetas NO llevan sombra. Se separan con borde.
           Solo lleva sombra lo que flota: Sheet y menús emergentes.
razon      la misma sombra gris bajo cada tarjeta es la marca de interfaz
           hecha en serie, y además no aporta información.
```

---

## Iconos e ilustraciones

**Lucide** (licencia ISC) para los iconos. Ilustraciones: ninguna por ahora; cuando
hagan falta, propias o encargadas. **No se calca ningún icono ni ilustración de la
original**, ni se usa ninguna de sus fotos de platos.

---

## Voz de los textos

- Activa y en infinitivo o imperativo claro: "Registrar", no "Enviar".
- El mismo nombre en todo el recorrido: el botón "Registrar" produce "Registrado".
- Los errores dicen qué pasó y qué hacer. No piden perdón y no son vagos.
- **Nunca se regaña.** La original "te regaña al final del día porque no comiste lo
  correcto" según una reseña. Aquí no se evalúa el día de nadie.
- Nada de mayúsculas sostenidas en etiquetas, ni puntos medios encadenados.

---

## Lo que queda pendiente

1. **Los primitivos en código.** La skill pide construirlos aislados antes de ninguna
   pantalla. Eso pertenece al hito 1 de `/replica-build`: ahí se montan en una ruta
   `/design` y se revisan con una captura.
2. **El modo oscuro.** Los roles están; los valores no. Hay que definirlos y **volver a
   pasar `contrast.py`**, porque una paleta nueva es justo donde se rompe el contraste.
3. **El color de acento es un marcador de posición.** `#24557f` es un azul tinta
   neutro que cumple contraste y no es de nadie. `/replica-brand` pondrá el nuestro
   y habrá que repetir la comprobación.

**Siguiente paso: `/replica-build`.**
