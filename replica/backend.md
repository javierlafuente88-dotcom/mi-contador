# Backend

Estado: **EN DUDA. No consta que se haya ejecutado.** 2026-10-27

> **2026-10-27, 15:10. Corrección.** Marqué este documento como «ejecutado y
> verificado» a partir de lo que se me dijo en la conversación, sin comprobarlo yo.
> Al abrir el panel de Supabase en el Chrome del usuario, la cuenta
> `javierlafuente88@gmail.com` **no tiene ninguna organización ni ningún proyecto**.
> Sin proyecto no hay base de datos, así que el esquema no puede haberse aplicado ahí.
>
> Lo que sigue estando comprobado por mí: el SQL pasa la revisión estructural, y se le
> corrigieron dos errores reales (el `on conflict` contra el índice **parcial** y el
> `search_path` de `unaccent`). Lo que **no** está comprobado es que haya corrido.
>
> Hasta aclararlo, las casillas vuelven a estar sin marcar. Un documento que afirme
> que algo se verificó cuando nadie lo vio es peor que uno que diga que falta.
>
> Antes de ejecutarlo se corrigieron dos errores que lo habrían roto: el `on conflict`
> no repetía el predicado del índice **parcial**, y `search_foods` no tenía
> `extensions` en su `search_path`, así que `unaccent` no se habría resuelto.

---

## Lo primero, porque condiciona todo lo demás

**El esquema nunca se ha ejecutado contra un Postgres de verdad.** En esta máquina
no hay Docker ni `psql`, así que `supabase start` no puede levantar nada local.
`tools/check_schema.py` revisa la estructura y no encuentra problemas, pero eso **no
es un Postgres**: es un lector de texto con criterio.

La primera prueba real será tu `supabase db push`. Es normal que ahí salte algo a la
primera; cuando pase, lo arreglamos.

**Y lo segundo:** yo no creo cuentas en tu nombre. El proyecto de Supabase lo creas
tú. Yo escribo el código, las migraciones y el `.env.example`; las claves las pones
tú en `.env.local`, que está en `.gitignore` y no se sube.

---

## Lo que hay escrito

| fichero | qué es |
| --- | --- |
| `supabase/migrations/20261027000001_schema.sql` | Las 20 tablas, índices y RLS |
| `supabase/migrations/20261027000002_supabase_extras.sql` | Triggers, perfil al registrarse, borrado de cuenta, exportación, búsqueda sin acentos |
| `supabase/seed.sql` | Los 49 alimentos, con `upsert` por `fdcId` |
| `mobile/src/data/supabaseStore.ts` | La capa de datos real |
| `mobile/src/data/index.ts` | Decide qué almacén se usa |
| `mobile/src/screens/Auth.tsx` | Entrar y crear cuenta |
| `mobile/.env.example` | Los nombres de las variables, sin ningún valor |

**Ninguna pantalla cambió.** El almacén falso y el de Supabase implementan el mismo
contrato (`Store` en `types.ts`), que es justo para lo que se diseñó así en
`/replica-architect`. Con `EXPO_PUBLIC_DATA_SOURCE=fake` la app sigue funcionando sin
cuenta ni red, y eso se queda como está: es la forma de trastear sin depender de nada.

### Cosas que el esquema base no podía saber

- **Perfil al registrarse.** Un disparador sobre `auth.users` crea la fila de
  `profiles`, las cuatro comidas por defecto y las preferencias. Sin esto, alguien se
  registra, RLS le niega todo y la app parece rota.
- **Borrado real de la cuenta**, en una llamada. Apple lo exige en cualquier app con
  registro, y la original tiene 106 reseñas con nota media 1,4 sobre lo difícil que es
  salirse. Aquí no hay laberinto.
- **Exportar tus datos** a JSON, también en una llamada.
- **Búsqueda sin acentos** con `unaccent`, en el servidor, para que «platano»
  encuentre «plátano» sin traerse la tabla entera al móvil.
- **El suelo de 1.200 kcal** ya era una restricción de la base. La capa de datos
  traduce ese error de Postgres a una frase que se entiende.

---

## Lo que tienes que hacer tú

**1. Crear el proyecto** en `supabase.com`. Plan gratuito. Elige la región más cercana
a donde vayan a estar los usuarios; con España y Latinoamérica, `eu-west` o
`us-east` son razonables.

**2. Copiar la URL y la clave pública** a `mobile/.env.local`:

```bash
cp mobile/.env.example mobile/.env.local
```

Están en *Settings → API Keys*, o en el botón **Connect** del proyecto, que muestra
las dos juntas. Rellena `EXPO_PUBLIC_SUPABASE_URL` y
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, y pon `EXPO_PUBLIC_DATA_SOURCE=supabase`.

> **Sobre las claves.** Supabase cambió el sistema: ahora son **publishable**
> (`sb_publishable_…`) y **secret** (`sb_secret_…`). Las antiguas `anon` y
> `service_role` siguen funcionando pero **se retiran a finales de 2026**, o sea ya.
> Usa la publicable. Es pública por diseño: va dentro de la app y lo único que la
> protege es RLS, que es como debe ser.
> La **secreta no entra aquí jamás**, ni en el móvil: se salta todas las políticas.

**3. Entrar con el CLI y aplicar migraciones y semilla:**

```bash
npx supabase login
npx supabase link
npx supabase db push --include-seed
```

`login` abre el navegador para generar un token. `link` te deja elegir el proyecto de
una lista. `--include-seed` carga también los 49 alimentos, así que no hace falta
pegar nada a mano en el editor SQL.

**4. Comprobar que quedó bien:**

```bash
node tools/check_supabase.mjs
```

Verifica que la API responde, que están las tablas, que los alimentos se cargaron y
—lo que de verdad importa— que **sin sesión no se ve ni una fila** de los datos de
usuario. Si RLS estuviera mal, ahí salta.

**5. Confirmación por correo** en *Authentication → Providers → Email*: revisa que
*Enable email confirmations* esté activo.

---

## Lista de seguridad

- [x] Secretos solo en variables de entorno. `.env*.local` en `.gitignore`
- [x] La clave `service_role` no aparece en ningún sitio del proyecto
- [x] Autorización en **todas** las tablas: 22 políticas RLS, ninguna tabla sin cubrir
- [x] `security definer` siempre con `set search_path` fijado (lo comprueba `check_schema.py`)
- [x] Idempotencia en el registro de comidas: índice único `(user_id, client_token)`
- [x] Borrado de cuenta que borra de verdad, en cascada
- [x] Mensajes de error de login que no revelan si el correo existe
- [x] Restricciones de cordura en la base: gramos, peso, suelo de calorías
- [ ] **Migraciones ejecutadas** — EN DUDA: no se encuentra ningún proyecto en la cuenta
- [ ] Ninguna tabla con RLS y sin política — comprobado solo sobre el texto, no sobre un Postgres
- [ ] **Probado con un segundo usuario** — pendiente, y sigue siendo la casilla que importa
- [ ] Límite de intentos en el login — pendiente, Supabase trae uno por defecto que hay que revisar
- [ ] Copias de seguridad — el plan gratuito las hace a diario; hay que confirmarlo en el panel
- [ ] `npm audit` limpio — **no lo está**: ver abajo
- [ ] Política de privacidad con todos los encargados del tratamiento — cuando haya algo publicado

**La casilla que más importa es la de «probado con un segundo usuario».** RLS escrito
y RLS funcionando no son lo mismo, y la única prueba válida es crear dos cuentas e
intentar leer los datos de la otra. Eso lo haremos en `/replica-test` en cuanto el
proyecto exista.

---

### El resultado de `npm audit`, tal cual

**4 vulnerabilidades altas**, todas dentro de la cadena de `@expo/cli`:

| paquete | problema |
| --- | --- |
| `zod` | puede agotar la memoria validando colecciones enormes |
| `node-forge` | verificación de firmas RSA PKCS#1 v1.5 acepta elementos anidados de más |
| `@expo/cli`, `expo` | arrastran los dos anteriores |

**Qué significa de verdad:** `@expo/cli` es la herramienta que compila y sirve la app;
corre en **tu máquina**, no dentro de la app que se instala el usuario. Ese código no
viaja en el paquete final. El riesgo es para el equipo de desarrollo, no para quien
use la app.

**Por qué no lo he arreglado:** `npm audit fix` no puede resolverlo sin `--force`, que
cambia versiones mayores y puede romper el proyecto que acabamos de dejar
funcionando. Prefiero decírtelo y que lo decidas a romperlo por una casilla verde.
Se revisa de nuevo antes de `/replica-deploy`.

---

## Lo que NO hay, a propósito

**Pagos.** No hay Stripe, ni suscripciones, ni nada que cobre. No es un olvido: la
arquitectura dice `ninguno en la v1`, y la posición entera del producto es que esto
no tiene microtransacciones. Cuando haya que cobrar, se hace con Stripe Checkout y el
portal de cliente, y **cancelar será un botón**, porque es donde la original pierde a
su gente.

**Correo transaccional propio.** De momento el correo de confirmación lo manda
Supabase. Para producción hace falta dominio propio y Resend o Postmark, y eso toca
en `/replica-deploy`.

**Integraciones.** Apple Health y Health Connect están en la matriz como `should`, no
en este hito. Las dos necesitan compilación nativa, así que dejan de funcionar en
Expo Go y obligan a un *development build*. Conviene saberlo antes de empezarlas.

---

**Siguiente paso: `/replica-test`**, y la primera prueba es la de los dos usuarios.

---

## 2026-10-27, 15:25 — Estado real, verificado por mí

**El proyecto existe de verdad ahora.** Lo creé yo desde el Chrome del usuario, con
su autorización: organización personal, plan gratuito, proyecto **`mi-contador`**,
región **West EU (Irlanda)**, ref **`azsxooxujlbyckxakzgv`**,
URL `https://azsxooxujlbyckxakzgv.supabase.co`.

El `apply_all.sql` se ejecutó en el editor SQL y devolvió **«Success. No rows
returned»**. Esta vez lo vi yo en pantalla.

`verify.sql` da **10 de 11 en OK**:

| # | comprobación | resultado |
| --- | --- | --- |
| 1-2 | 20 tablas, 20 con RLS | OK |
| 3 | tablas con RLS y sin política | **0** — OK |
| 4 | políticas | 22 — OK |
| 5 | alimentos cargados | 49 — OK |
| 6-9 | funciones, perfil al alta, suelo de kcal, índice anti duplicado | OK |
| **10** | **búsqueda sin acentos** | **MAL** |
| 11 | pechuga de pollo 165 kcal | OK |

### El fallo 10, diagnosticado

**No es `unaccent`.** `select unaccent('Plátano')` devuelve `Platano`: la extensión
funciona y el arreglo del `search_path` era correcto.

**Son los datos.** Están guardados como `AtÃºn`, `AzÚcar`, `BrÃ³coli`, `CalabacÃ­n`.
Pasé el SQL al navegador por un servidor local que mandaba `text/plain` **sin
declarar charset**, y el navegador lo leyó como latin-1. Culpa mía, no de Supabase.

El mensaje de la fila 10 de `verify.sql` dice «unaccent no resuelve» y **es
engañoso**: hay que cambiarlo por algo neutro.

### Lo que queda, en orden

1. **Rehacer la semilla con UTF-8.** `tools/serve_utf8.py` ya sirve con
   `charset=utf-8`. Basta con volver a pasar `supabase/seed.sql` por el editor: el
   `on conflict ... do update` corrige los 49 nombres sin duplicar nada.
2. Volver a pasar `verify.sql`. La fila 10 debe quedar en OK.
3. Leer la **clave publicable** del diálogo *Connect* y escribir `mobile/.env.local`
   junto con la URL de arriba.
4. `node tools/check_supabase.mjs`.
5. **La prueba de los dos usuarios.** Sigue sin hacer y sigue siendo la que decide.

### Nota de método

Marqué estas casillas una vez sin comprobarlas y hubo que deshacerlo. Lo de arriba
está visto en pantalla por mí, salvo lo que dice explícitamente que falta.

---

## 2026-10-27, 15:55 — Semilla corregida y aislamiento probado

**Semilla.** Repasada con `tools/serve_utf8.py`, que declara `charset=utf-8`. El
`on conflict ... do update` corrigió los 49 nombres sin duplicar nada.

**`verify.sql`: 13 de 13 en OK.** Añadí dos filas para no volver a confundir las
causas de un fallo de búsqueda:

| # | comprobación | resultado |
| --- | --- | --- |
| 10 | búsqueda sin acentos («platano») | 1 — OK |
| 12 | `unaccent` funciona | 1 — OK |
| 13 | nombres con acentos rotos | **0** — OK |

La 12 y la 13 separan «la extensión no va» de «los datos entraron mal», que es
exactamente el error de diagnóstico que cometí antes.

### La prueba que importa: dos usuarios

`supabase/rls_test.sql`. Crea dos usuarios en `auth.users`, les da objetivos, pesos
y registros, se hace pasar por el primero con `set local role authenticated` más
`request.jwt.claims`, y mira qué alcanza. **Todo dentro de una transacción que
termina en `rollback`: no queda ni un dato de prueba.**

| # | comprobación | resultado | estado |
| --- | --- | --- | --- |
| 1 | perfiles visibles | 1 | aislado |
| 2 | objetivos visibles | 1 | aislado |
| 3 | pesos visibles | 1 | aislado |
| 4 | registros de comida visibles | 1 | aislado |
| 5 | comidas del día visibles | 4 | aislado (y el disparador de alta funciona) |
| 6 | el objetivo visible es el propio | **2000**, no 1800 | correcto |
| 7 | catálogo de alimentos | 49 | visible, público a propósito |
| 8 | leer al otro usuario por su id | **0** | aislado |

La fila 8 es la que cuenta: pedir explícitamente las filas del otro usuario devuelve
cero. **RLS no solo está escrito: funciona.**

Esta prueba es más estricta que hacerlo por la API, porque habla directamente con
Postgres: no hay capa intermedia que pueda estar tapando una fuga.

### Lista de seguridad, al día

- [x] Migraciones ejecutadas y verificadas (13/13)
- [x] Ninguna tabla con RLS y sin política — 0, comprobado en el catálogo de Postgres
- [x] **Probado con un segundo usuario** — 8/8 aislado, con rollback
- [x] Disparador de alta: perfil, comidas y preferencias se crean solos
- [x] Suelo de 1.200 kcal activo como restricción de base
- [x] Índice único contra el registro doble
- [ ] Clave publicable en `.env.local` — **falta**: la extensión del navegador me
      bloquea la lectura de claves, y no pienso rodear esa protección
- [ ] `npm audit` — 4 altas en `@expo/cli`, herramienta de compilación
- [ ] Copias de seguridad — confirmar en el panel

### Proyecto

`mi-contador` · ref `azsxooxujlbyckxakzgv` · West EU (Irlanda) · plan gratuito
URL: `https://azsxooxujlbyckxakzgv.supabase.co` (ya puesta en `mobile/.env.local`)
