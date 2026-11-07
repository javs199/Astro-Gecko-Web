# Spec 003 — Herramientas de diseño: Impeccable y stop-slop-es

- **Estado:** en revisión
- **Ejecuta:** Claude Code (instalación de skills y reglas del sistema de agentes)
- **Revisa:** Gemini CLI
- **Diseño:** n/a (no toca UI; cambia la fuente de diseño)
- **Rama:** `claude/project-thread-sutekt`

## Objetivo
Que cualquier agente que diseñe o escriba para el sitio tenga criterio de diseño y de copy:
[Impeccable](https://github.com/pbakaus/impeccable) (Apache 2.0) para crear, criticar y auditar la UI, y una versión
en español de [stop-slop](https://github.com/hardikpandya/stop-slop) (MIT) para el copy. `DESIGN.md` sustituye a Stitch
como fuente de diseño.

## Archivos que toca
- (Nuevos) `.claude/skills/impeccable/` y `.claude/agents/impeccable-*.md` — Impeccable para Claude Code.
- (Nuevos) `.agents/skills/impeccable/` (Codex), `.gemini/skills/impeccable/` (Gemini CLI), `.agent/skills/impeccable/` (Antigravity).
- (Nuevo) `.claude/skills/stop-slop-es/SKILL.md` — copy sin tics de IA, en español.
- `.gitignore` — ignora `*/skills/impeccable/scripts/bin/` (motor binario).
- `AGENTS.md` — estructura, sección Diseño, regla 9, principio 4 y Estado actual.
- `design/LEEME.md` — la carpeta pasa a referencias y capturas de revisión.
- (Nuevo) `specs/003-herramientas-diseno.md` — esta spec.

## Restricciones
- No tocar: `public/`, `src/`, `tests/`, `wrangler.jsonc`.
- No añadir dependencias npm: ninguna (`npx impeccable` se usa sin instalarlo en `package.json`).
- Sin hooks automáticos (`--no-hooks`).

## Criterio de verificación
- [ ] `npm test` pasa y `npm run deploy:check` termina sin errores.
- [ ] `.claude/skills/impeccable/scripts/impeccable context` responde en un checkout limpio (descarga y verifica el motor).
- [ ] `git ls-files | grep scripts/bin` no devuelve nada.

## Decisiones
- **Instalado en el repo y no en la cuenta o el PC:** así llega a los hilos en la nube, a Codex, Gemini CLI y Antigravity, y a cualquier clon.
- **Sin hooks:** los hooks de Impeccable corren un análisis tras cada edición y al cerrar cada turno, también en tareas que no son de UI. Se ejecuta a mano (`critique`, `audit`, `detect`). Se pueden activar después con `npx impeccable install --force` sin `--no-hooks`.
- **Motor fuera de git:** cada binario pesa ~21 MB por plataforma; el lanzador lo descarga y verifica por checksum en el primer uso.
- **stop-slop adaptado, no copiado:** las listas originales son de frases en inglés y reglas como "ninguna frase empieza por Wh-" no aplican al español. Se reescribió con muletillas y jerga del mercado hispano. Una sola copia en `.claude/skills/`; las otras herramientas la leen por indicación de `AGENTS.md`.
- **Descartados en esta ronda:** UI UX Pro Max (catálogo de estilos, se solapa con Impeccable) y taste-skill (asigna paleta y fuentes propias, choca con el brand kit; 40 MB; hook de cierre obligatorio). Canvas Design ya está disponible en claude.ai y no aplica a web.
- La spec de contenido de la home pasa a ser la 004.

## Resultado de la revisión
<!-- La herramienta revisora pega aquí su veredicto: OK / Cambios requeridos + lista. -->
