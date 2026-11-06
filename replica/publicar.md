# Publicar la app y usarla desde el móvil

> **Hecho el 2026-11-05.** Está en
> **https://javierlafuente88-dotcom.github.io/mi-contador/**, repositorio
> público `javierlafuente88-dotcom/mi-contador`, los dos secretos guardados y
> Pages sirviendo desde GitHub Actions. Quedan dos cosas que solo se pueden
> hacer desde el panel de Supabase, y están al final: **despausar el proyecto**
> y **añadir esa dirección a las URLs de redirección**.

La app funciona como sitio web estático: HTML, JavaScript y un par de imágenes.
Eso se puede colgar gratis en GitHub Pages, añadirlo a la pantalla de inicio del
móvil, y se abre como una app. Vale igual para iPhone y para Android.

**No hace falta instalar ni contratar ninguna API.** Las dos que usa ya están:
Supabase (creado, con el esquema aplicado) y Open Food Facts (abierta, sin
clave).

---

## Lo que hay que decidir antes

**El repositorio tiene que ser público.** GitHub Pages desde uno privado pide
plan de pago. No hay nada secreto: todo el código está escrito de cero y la
clave que se publica es la `sb_publishable_`, que no da acceso a nada por sí
sola. Lo que protege los datos son las políticas RLS, probadas contra la base
real con 8 de 8 aislado. La `sb_secret_` no está en el proyecto y no debe
estarlo nunca.

Dicho de otro modo: **esa clave va a ser visible en el navegador de cualquiera,
y es como tiene que ser.** Las variables `EXPO_PUBLIC_*` se incrustan dentro del
JavaScript al compilar, así que esto pasaría igual en cualquier hosting.

---

## Los pasos

**1. Crear el repositorio en GitHub** y empujar el proyecto. Hoy está solo en
disco, sin remoto.

```bash
git remote add origin https://github.com/javierlafuente88-dotcom/mi-contador.git
git push -u origin master
```

**2. Que el nombre del repositorio coincida con la ruta.** GitHub Pages sirve en
`javierlafuente88-dotcom.github.io/mi-contador/`, una subcarpeta, y la app tiene que saberlo o
sale **una página en blanco sin ningún error que lo explique**. Está puesto en
`mobile/app.json`:

```json
"experiments": { "baseUrl": "/mi-contador" }
```

Si llamas al repositorio de otra forma, cambia ahí el nombre. Si lo llamas
`javierlafuente88-dotcom.github.io`, se sirve en la raíz: entonces quita `baseUrl` entero.

**3. Guardar las dos variables como secretos del repositorio.** En
`Settings → Secrets and variables → Actions → New repository secret`, con estos
nombres exactos, y los valores que están en `mobile/.env.local`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**4. Encender Pages.** En `Settings → Pages`, en «Source» elegir **GitHub
Actions** (no «Deploy from a branch»).

**5. Ya está.** Cada vez que se empuje a `master`, el flujo de
`.github/workflows/pages.yml` compila y publica. La primera vez tarda un par de
minutos; la dirección sale en la pestaña Actions y en Settings → Pages.

**6. Decirle a Supabase cuál es esa dirección.** En el panel de Supabase,
`Authentication → URL Configuration`, añadir
`https://javierlafuente88-dotcom.github.io/mi-contador/` a las URLs de redirección. Sin esto,
el correo de confirmación de la cuenta no vuelve a la app.

> Hecho el 2026-11-06. **Site URL** puesta a esa dirección (estaba en
> `http://localhost:3000`, el valor de desarrollo) y dos URLs de redirección
> guardadas: la exacta y `…/mi-contador/**` para cualquier ruta interna.

**7. Entrar sin esperar al correo.** En `Authentication → Sign In / Providers`
está apagado **Confirm email**, así que crear la cuenta te mete dentro al
instante. No es solo comodidad: **el plan gratis manda del orden de dos o tres
correos por hora**, y con la confirmación encendida un par de intentos seguidos
dejan al usuario esperando un correo que no va a llegar, sin que la app pueda
explicarlo. Lo que se pierde es la comprobación de que el correo es tuyo —
asumible mientras la app sea de una persona; si algún día la usan otros, hay que
volver a encenderlo y subir el límite de correos con un servidor propio.

La pantalla de alta mira si Supabase ha devuelto sesión en vez de dar por
supuesto que hace falta confirmar, así que funciona con el ajuste en cualquiera
de las dos posiciones.

**8. Entrar con Google.** En `Authentication → Sign In / Providers` el
proveedor **Google** está encendido, con el identificador y el secreto del
cliente OAuth creado en Google Cloud (proyecto `tensile-cable-485620-k5`,
cliente `mi-contador web`). Ahí están puestos el origen de JavaScript
`https://javierlafuente88-dotcom.github.io` y la URL de retorno
`https://azsxooxujlbyckxakzgv.supabase.co/auth/v1/callback`.

Dos cosas que cuestan tiempo si no se saben:

- **Google ya no deja ver un secreto después de crearlo.** En la ficha del
  cliente solo aparecen los cuatro últimos caracteres. Si se pierde, no se
  recupera: hay que añadir otro con `+ Add secret` y copiarlo en ese momento.
  Un cliente admite dos como mucho, así que para crear un tercero hay que
  inhabilitar y borrar uno.
- **El botón solo sale en la web.** El viaje de ida y vuelta a Google necesita
  una dirección del navegador; en móvil nativo haría falta abrir un navegador
  aparte, que es otra implementación. Por lo mismo, `detectSessionInUrl` se
  enciende solo en web, que es donde Google deja la sesión colgada de la
  dirección al volver.

**9. En el móvil:** abrir la dirección, y en el menú del navegador «Añadir a la
pantalla de inicio». Queda con su icono y su nombre, y se abre sin la barra del
navegador.

---

## Lo que no va a funcionar, y por qué

**Leer el código de barras con la cámara.** No está construido: necesita
compilación nativa, que es justo lo que este camino evita. Buscar escribiendo el
número de código **sí funciona**, contra Open Food Facts.

**Sin conexión.** La app necesita internet para hablar con Supabase. Estaba ya
en la lista de huecos conocidos y sigue ahí.

---

## Lo que hay que mirar de vez en cuando

**Supabase pausa los proyectos del plan gratis tras una semana sin actividad.**
Usándola a diario no pasa nunca. Si se deja un mes, hay que despausarla desde su
panel: no se pierde nada, pero la app no responderá hasta que se haga.

**Y pasó el mismo día de publicar.** El 2026-11-05, recién subido el sitio,
`azsxooxujlbyckxakzgv.supabase.co` ya no resolvía por DNS: ni siquiera devuelve
un error de servidor, el nombre directamente no existe. Así se ve un proyecto
pausado desde fuera, y conviene saberlo porque **no se parece a una avería**:
la app carga perfecta, entera, y solo falla al intentar entrar en una cuenta.

Se arregla en `supabase.com/dashboard`, abriendo el proyecto y pulsando el
botón de reanudar. Tarda uno o dos minutos y no se pierde ningún dato.

---

## Dos detalles que se arreglaron al preparar esto

La plantilla HTML que genera Expo venía con `lang="en"` y el título `mobile`.
Lo primero haría que un lector de pantalla leyese un texto en español con
fonética inglesa; lo segundo es el nombre que habría quedado bajo el icono en la
pantalla de inicio. Hay una plantilla propia en `mobile/public/index.html`.

Y hay un fichero vacío, `mobile/public/.nojekyll`, que parece basura y no lo es:
GitHub Pages pasa todo por Jekyll, y **Jekyll se salta las carpetas que empiezan
por guión bajo**. El JavaScript de la app vive en `_expo/`. Sin ese fichero, el
sitio se publica sin su código y sale en blanco. Es un fallo que no se puede
reproducir en local, porque solo lo hace GitHub.
