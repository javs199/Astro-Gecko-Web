# Spec 001 — Mover la portada pública, /privacidad y /firma/ a este repo

- **Estado:** lista
- **Ejecuta:** Codex (código y tests). El corte de dominio (sección "Despliegue") lo hace JV.
- **Revisa:** Gemini CLI
- **Diseño:** n/a (no hay UI nueva: la portada y la política se mueven sin cambios visuales)
- **Rama:** `spec/001-migrar-portada`

## Objetivo
astrogecko.com pasa a servirse desde este repo, sin cambios visibles para quien entra hoy:
- `https://astrogecko.com/academia` muestra la portada actual de la academia (la de `landing/index.html` del repo AGA).
- `https://astrogecko.com/privacidad` sigue mostrando la misma política (la URL **no cambia**: Google Auth Platform la tiene registrada).
- `https://astrogecko.com/firma/*.png` sirve las 3 imágenes de las firmas de correo, para que Gmail las muestre.
- `/` redirige temporalmente (302) a `/academia` hasta que exista la página de inicio de la agencia (spec 003).

## Archivos que toca
Ya están en esta rama, copiados sin cambios (insumos):
- `public/academia/index.html` — copia de `landing/index.html` del repo AGA (commit `5617c89`).
- `public/privacidad.html` — copia de `landing/privacidad.html` del repo AGA (commit `5617c89`).
- `public/firma/isotipo-firma.png`, `logotipo-firma-claro.png`, `logotipo-firma-oscuro.png` — imágenes de las firmas aprobadas el 2026-11-03.

A cambiar:
- `public/academia/index.html` y `public/privacidad.html` — el logo de la cabecera (`<a class="brand" href="/">`) pasa a `href="/academia"`; en `privacidad.html`, el pie "Volver al inicio" también a `/academia`. Nada más.

Nuevos:
- `package.json` — `"type": "module"`, `engines.node >= 22`, devDependency `wrangler` ^4 (única dependencia). Scripts: `dev` = `wrangler dev`, `test` = `node --test tests/*.test.mjs`, `deploy:check` = `npm test && wrangler deploy --dry-run`, `deploy` = `npm test && wrangler deploy`.
- `package-lock.json` — generado por `npm install`.
- `wrangler.jsonc` — ver "Configuración".
- `src/worker.mjs` — ver "Comportamiento".
- `tests/worker.test.mjs` — ver "Criterio de verificación".
- `AGENTS.md` — solo la sección "Estado actual" al cerrar.

## Configuración (`wrangler.jsonc`)
```jsonc
{
  "name": "astro-gecko-welcome",          // MISMO nombre que el Worker actual: el deploy reemplaza su código sin pelear por los dominios
  "main": "src/worker.mjs",
  "compatibility_date": "2026-11-01",
  "workers_dev": true,
  "preview_urls": false,
  "assets": { "directory": "./public", "binding": "ASSETS", "run_worker_first": true, "html_handling": "none", "not_found_handling": "none" },
  "routes": [
    { "pattern": "astrogecko.com", "custom_domain": true, "zone_name": "astrogecko.com" },
    { "pattern": "www.astrogecko.com", "custom_domain": true, "zone_name": "astrogecko.com" }
  ]
}
```
Sin `account_id` (el repo es público). Si wrangler lo pide, JV usa la variable `CLOUDFLARE_ACCOUNT_ID` en su terminal.

## Comportamiento (`src/worker.mjs`)
`export default { async fetch(request, env) }`, en este orden:
1. Método distinto de GET/HEAD → 405 con `Allow: GET, HEAD`.
2. Host `www.astrogecko.com` → 301 a `https://astrogecko.com` + misma ruta y query.
3. `/sw.js` → el mismo script de retiro que hoy tiene `worker/landing.mjs` del repo AGA (copiar el texto tal cual), `Content-Type: application/javascript; charset=utf-8`.
4. `/` e `/index.html` → 302 a `/academia`.
5. Barra final: `/academia/` → 301 a `/academia`; `/privacidad/` → 301 a `/privacidad` (conservando query).
6. Rutas permitidas (lista cerrada; el resto 404 en texto plano "Página no encontrada."):
   - `/academia` → asset `/academia/index.html`
   - `/privacidad` → asset `/privacidad.html`
   - `/firma/isotipo-firma.png`, `/firma/logotipo-firma-claro.png`, `/firma/logotipo-firma-oscuro.png` → el asset con esa ruta
   Se piden con `env.ASSETS.fetch(new Request(new URL(rutaAsset, request.url), request))`.
7. Todas las respuestas (incluidas 301/302/404/405) llevan las cabeceras de hoy: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y la CSP actual con un único cambio, `img-src 'self' data:`. Además:
   - HTML y redirecciones: `Cache-Control: no-store` (como hoy).
   - `/firma/*.png`: `Cache-Control: public, max-age=86400`, `Content-Type: image/png`.
8. HEAD responde con las mismas cabeceras y cuerpo vacío.

## Restricciones
- No añadir dependencias salvo `wrangler`.
- No cambiar el contenido ni el estilo de las dos páginas HTML, salvo los enlaces indicados.
- No crear páginas de la agencia (eso es la spec 003, con diseño de Stitch).
- No tocar el repo Astro-Gecko-Academy desde esta spec (lo hace su spec 006).
- No ejecutar `npm run deploy`.

## Criterio de verificación
- [ ] `npm ci && npm test` pasa. Los tests importan `src/worker.mjs` y le pasan un `env.ASSETS` falso que lee los archivos de `public/`:
  - `/academia` → 200 `text/html`, contiene "Iniciar sesión con Google", `href="/privacidad"` y `https://app.astrogecko.com/`; no contiene `notion.so`, `notebook.google`, `gmail.com` ni `data.json`.
  - `/privacidad` → 200 con las mismas cabeceras que `/academia`; contiene "Política de privacidad"; quitando el botón de login, no contiene `app.astrogecko.com`, `data.json`, `notion.so` ni `notebooklm`; sin `<script` ni `<img`.
  - `/` → 302 a `/academia`; `/academia/?x=1` → 301 a `/academia?x=1`; `/privacidad/?lang=es` → 301 a `https://astrogecko.com/privacidad?lang=es`.
  - `https://www.astrogecko.com/privacidad?a=1` → 301 a `https://astrogecko.com/privacidad?a=1`.
  - Cada `/firma/*.png` → 200 `image/png`, `max-age=86400`, cuerpo idéntico al archivo.
  - `/data.json`, `/app.js`, `/manifest.webmanifest`, `/privacidad.html`, `/academia/index.html`, `/firma/` → 404.
  - POST `/academia` → 405; HEAD `/academia` → 200 con cuerpo vacío.
  - `/sw.js` → 200 `application/javascript` y contiene `unregister`.
- [ ] `npm run deploy:check` termina sin errores (dry-run).
- [ ] `npm run dev` y en el navegador: `/academia` y `/privacidad` se ven igual que hoy en astrogecko.com, y el logo lleva a `/academia`.

## Despliegue (lo hace JV, después de la revisión)
Orden para no tener caída ni dos repos peleando por el mismo Worker:
1. Mergear esta spec y la spec 006 del repo AGA (que quita la portada de allá). Desde ese momento, `npm run deploy` en AGA ya no publica `astro-gecko-welcome`.
2. En este repo: `npm ci && npm run deploy`. Como el Worker se llama igual, solo se reemplaza su código; los dominios siguen asignados.
3. Comprobar en una ventana privada: `astrogecko.com` → `/academia`; `/privacidad` 200; `www.astrogecko.com` → raíz; `https://astrogecko.com/firma/isotipo-firma.png` se ve; el botón "Iniciar sesión" entra a la academia.
4. En Google Auth Platform → Información de la marca: cambiar la **página principal** de la app a `https://astrogecko.com/academia` (la política se queda en `/privacidad`). Motivo: Google exige que la página principal describa la app, y `/` será la agencia. [Probable]
5. Volver a enviarte una firma de prueba a Gmail y comprobar que se ven las imágenes.

Vuelta atrás: en el repo AGA, `git checkout 5617c89 -- wrangler.landing.jsonc worker/landing.mjs landing/` y `npx wrangler deploy --config wrangler.landing.jsonc`.

## Decisiones
- Mismo nombre de Worker (`astro-gecko-welcome`) en vez de uno nuevo: evita quitar y volver a poner los custom domains, que deja minutos sin sitio. El nombre se puede cambiar más adelante con calma.
- Worker con lista cerrada de rutas sobre static assets, en lugar de servir `public/` entero: mantiene la regla de privacidad de AGA (nada se publica por accidente) y permite probarlo con `node --test`.
- `/` con 302 (temporal) y no 301: el navegador no lo memoriza, así que cuando llegue el inicio de la agencia basta con quitar la regla.
- Las imágenes de firma se versionan aquí (aunque el repo es público): ya son públicas por diseño, porque los clientes de correo las descargan.

## Resultado de la revisión
