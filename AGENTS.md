# AGENTS.md — Astro Gecko Web

> Fuente única de contexto para cualquier agente (Claude Code, Codex, Antigravity/Gemini).
> CLAUDE.md y GEMINI.md solo importan este archivo. Si algo cambia, se cambia AQUÍ.
> Este repo es el sitio público de la marca y la agencia. La academia privada vive en otro repo (Astro-Gecko-Academy): no mezcles código ni datos de ella aquí.

## Proyecto
- **Marca:** Astro Gecko (marca madre y agencia de desarrollo web + IA, Costa Rica). Proyecto propio de JV, no de un cliente.
- **Qué es:** sitio público de astrogecko.com: presenta la agencia (servicios, proyectos, proceso, contacto) y aloja la portada pública de la academia en `/academia`, la política de privacidad en `/privacidad` y las imágenes de las firmas de correo en `/firma/`.
- **URL producción:** https://astrogecko.com (www → 301 al dominio raíz) · **URL staging:** no hay; `npm run deploy:check` hace un dry-run
- **Repo:** github.com/javs199/astro-gecko-web (**público**: no subas datos de clientes, precios internos, notas de estrategia ni secretos)
- **Brief del sitio:** https://claude.ai/artifact/C4ezjbRwPdSRZcYqD2czrT

## Stack
- Frontend: HTML/CSS estático sin framework, en `public/` (Workers static assets)
- Edge: 1 Cloudflare Worker, `astro-gecko-welcome` (`src/worker.mjs`, `run_worker_first`): redirecciones, cabeceras de seguridad y lista de rutas públicas
- Datos: ninguno (v1). Formulario de contacto a D1 previsto para v1.1
- Auth: ninguna; todo es público. La academia privada (app.astrogecko.com, con Access) no se toca desde aquí
- Node ≥ 22 · npm · wrangler 4 (devDependency, se usa con `npx`)

## Comandos
| Acción | Comando |
|---|---|
| Instalar | `npm ci` |
| Desarrollo local | `npm run dev` (`wrangler dev`) |
| Build | no hay: `public/` se publica tal cual |
| Tests / verificación | `npm test` (`node --test`) |
| Lint / formato | no hay |
| Prueba de deploy | `npm run deploy:check` (test + `wrangler deploy --dry-run`) |
| Deploy | `npm run deploy` — **solo lo ejecuta JV o Claude Code con permiso explícito** |

## Estructura
```
public/       lo que se publica: academia/, privacidad.html, firma/, sw.js (y luego las páginas de la agencia)
src/          worker.mjs
tests/        node --test
design/       referencia visual exportada de Google Stitch (ver design/LEEME.md)
specs/        una spec por tarea (ver specs/_plantilla.md)
```

## Infraestructura
- **Hosting / runtime:** Cloudflare Workers (cuenta Workers Paid de Astro Gecko). Hostinger Business queda para sitios de clientes y el correo.
- **Datos:** ninguno
- **Correo:** buzones en Hostinger (MX en Cloudflare DNS). No activar Email Routing de Cloudflare: rompe los MX de Hostinger.
- **Dominio y DNS:** astrogecko.com registrado en Hostinger, DNS en Cloudflare. Nunca cambiar los nameservers a Hostinger.
- **Contratación extra:** ninguna. Analítica prevista: Cloudflare Web Analytics (gratis, sin cookies).

## Diseño
- La **referencia visual es `design/`**: pantallas exportadas de Google Stitch (captura PNG + HTML opcional por pantalla).
- El HTML de Stitch es **referencia, no código de producción**: replica layout, espaciado y jerarquía en HTML/CSS plano; no importes Tailwind.
- **Marca: brand kit 1** (Identidad Visual/Sistema_Identidad_AstroGecko, `09_Color/tokens.css`). Navy `#0F1322` de base; **acento de la agencia = tangerine** (el violeta `#8E6CFF` es de la academia).
- **Tipografía:** JetBrains Mono en títulos, wordmark y números; Satoshi en texto; Geist Pixel solo para usos pixel-art. Fallbacks `Consolas,monospace` y `Segoe UI,system-ui,sans-serif`.

## Reglas para agentes
1. **Una sesión = una spec.** No trabajes sin una spec en `specs/`. Si no existe, pídela o créala con el comando `nueva-spec`.
2. **Toca solo los archivos listados en la spec.** Si necesitas otro, detente y dilo.
3. **No hagas deploy, no borres ramas, no toques secretos** (`.env`, `.dev.vars`, tokens). En `wrangler.jsonc` no cambies `name` ni `routes` sin que la spec lo pida, y no añadas `account_id` (el repo es público).
4. **Antes de terminar**, corre `npm test && npm run deploy:check` y pega el resultado.
5. Commits pequeños, en español, formato: `tipo: descripción` (`feat`, `fix`, `docs`, `refactor`, `chore`).
6. Trabaja en una rama `spec/NNN-nombre`, nunca directo en `main`.
7. **Privacidad:** este sitio nunca enlaza ni incluye catálogo, datos o rutas privadas de la academia; el único enlace a la academia privada es el botón "Iniciar sesión" a `https://app.astrogecko.com/`.
8. **`/privacidad` no cambia de URL**: es la política que Google Auth Platform tiene registrada para la app de la academia.
9. Toda spec de UI referencia su pantalla en `design/`. Sin pantalla, no se implementa UI nueva.
10. Si algo es ambiguo, elige la lectura más probable y anótala en la spec bajo "Decisiones".

## Roles de herramientas
| Herramienta | Hace | No hace |
|---|---|---|
| Claude Code | Escribe las specs (plan mode) y hace lo delicado: Worker, dominios, scripts | Cambios masivos (su cuota es la más escasa) |
| Codex | **Ejecutor principal** de specs de lógica y cambios mecánicos | Deploy, decisiones de arquitectura |
| Antigravity | **Ejecutor de UI**: convierte pantallas de `design/` (Stitch) en código | Lógica, Worker |
| Gemini CLI | **Revisor por defecto** del diff contra la spec | Escribir código de producción |

Regla de revisión: revisa Gemini CLI. Si Gemini fue quien ejecutó (caso raro), revisa Codex.

## Estado actual
- **Última actualización:** 2026-11-07
- **Hecho:** repo creado desde la plantilla de IA; brief v0.1 del sitio; decidido que la portada de la academia va en `/academia`.
- **En curso:** spec 001 (mover aquí la portada pública, `/privacidad` y `/firma/`).
- **Siguiente:** textos del sitio de la agencia (spec 002), pantallas en Stitch, UI (spec 003).
- **Bloqueos / decisiones pendientes:** cliente objetivo y 3 servicios principales; precios "desde" publicados o no; permiso para mostrar SE Alquileres y Grupo Kuwago como casos; misión y visión.
