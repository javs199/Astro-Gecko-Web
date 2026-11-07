# Spec 002 — Principios de trabajo (Karpathy) en AGENTS.md

- **Estado:** en revisión
- **Ejecuta:** Claude Code (cambio de reglas del sistema de agentes)
- **Revisa:** Gemini CLI
- **Diseño:** n/a
- **Rama:** `claude/project-thread-sutekt` (ver Decisiones)

## Objetivo
Que todos los agentes (Claude Code, Codex, Antigravity, Gemini CLI) sigan los 4 principios de las
[karpathy-guidelines](https://github.com/multica-ai/andrej-karpathy-skills) (MIT): pensar antes de programar,
simplicidad primero, cambios quirúrgicos y ejecución guiada por criterios verificables.

## Archivos que toca
- `AGENTS.md` — nueva sección "Principios de trabajo" y actualización de "Estado actual".
- (Nuevo) `specs/002-principios-karpathy.md` — esta spec.

## Restricciones
- No tocar: `public/`, `src/`, `tests/`, `wrangler.jsonc`.
- No añadir dependencias: ninguna.
- No instalar el plugin; las reglas viven en `AGENTS.md` para que las lean todas las herramientas.

## Criterio de verificación
- [ ] `npm test` pasa.
- [ ] `npm run deploy:check` termina sin errores.
- [ ] `AGENTS.md` contiene los 4 principios, adaptados al flujo de specs y en español.

## Decisiones
- Se integran como texto en `AGENTS.md` y no como plugin de Claude Code: un plugin solo lo vería Claude Code en el PC de JV; `AGENTS.md` lo leen todas las herramientas y los hilos en la nube.
- Se adaptan, no se copian literal: "si hay varias interpretaciones, preséntalas" choca con la regla 10 (elegir la más probable y anotarla). Se mantiene la regla 10 y se pide anotar la alternativa descartada.
- Numerada 002 porque es la siguiente libre; la spec de copy del sitio pasa a 003.
- Rama `claude/project-thread-sutekt` en lugar de `spec/002-…` porque la sesión en la nube solo puede empujar a esa rama.

## Resultado de la revisión
<!-- La herramienta revisora pega aquí su veredicto: OK / Cambios requeridos + lista. -->
