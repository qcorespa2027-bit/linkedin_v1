# 🔗 LinkedIn Publisher

Publicador automático de posts en LinkedIn para Smart Student.  
100% local, sin servidores. Funciona en **Windows, Linux y macOS**.

## Setup rápido

### 1. Obtener token (1 sola vez, dura 2 meses)

Primero agrega `http://localhost:3456/callback` en [LinkedIn Developer → Auth → Redirect URLs](https://www.linkedin.com/developers/apps).

```bash
npm run token
```

Se abre el navegador → autorizas → token guardado.

### 2. Agregar posts

```bash
npm run add
```

O edita directamente `data/posts.json`.

### 3. Publicar

**Manual:**
```bash
npm run publish
```

**Automático (Scheduler — Linux/Mac/Windows):**
```bash
# Interactivo (ver output en terminal):
npm run scheduler

# En background:
npm run scheduler:bg
```

⚠️ Este scheduler es **local**. Si cierras VS Code/Codespace o apagas tu equipo, deja de correr.

El scheduler revisa cada 15 minutos (lunes a viernes, 8am–8pm, hora Chile) si hay posts listos y los publica automáticamente.

## Publicación automática con Codespace cerrado (GitHub Actions)

Para que publique aunque no tengas el entorno abierto:

1. Configura el secret `LINKEDIN_CONFIG` (base64 de `config.json`).
2. Agrega/edita posts en `data/posts.json`.
3. Haz commit y push a `main`.

El workflow `.github/workflows/publish.yml` corre automáticamente cada 10 minutos (lunes a sábado) y publica los posts cuyo horario ya pasó (hora `America/Santiago`).

Si no haces push, GitHub Actions no verá los nuevos posts.

Contexto operativo y checklist de continuidad: `docs/HANDOFF-2026-02-17.md`.

**Personalizar horario:**
```bash
# Cada 30 minutos, todos los días:
CRON_SCHEDULE="*/30 * * * *" npm run scheduler

# Cada hora, solo lunes y miércoles:
CRON_SCHEDULE="0 * * * 1,3" npm run scheduler
```

**Automático (Windows Task Scheduler):**
```bash
# Ejecutar como Administrador:
setup-scheduler.bat
```

## Comandos

| Comando | Descripción |
|---|---|
| `npm run token` | Obtener/renovar token de LinkedIn |
| `npm run add` | Agregar post interactivamente |
| `npm run list` | Ver todos los posts |
| `npm run publish` | Publicar posts pendientes (1 vez) |
| `npm run scheduler` | Scheduler automático (interactivo) |
| `npm run scheduler:bg` | Scheduler en background |
| `npm run scheduler:stop` | Detener scheduler en background |
| `npm run scheduler:status` | Ver si el scheduler está activo |
| `npm run scheduler:log` | Ver últimas 50 líneas del log |

## Estructura

```
linkedin-publisher/
├── src/
│   ├── get-token.js    ← OAuth local (cross-platform)
│   ├── publish.js      ← Publicador
│   ├── scheduler.js    ← Scheduler automático con node-cron
│   ├── add-post.js     ← Agregar posts
│   └── list-posts.js   ← Listar posts
├── data/
│   ├── posts.json      ← Base de datos de posts
│   └── scheduler-log.txt ← Log del scheduler
├── config.json          ← Token (NO se sube a git)
├── run-scheduler.sh     ← Ejecuta scheduler en background (Linux/Mac)
├── stop-scheduler.sh    ← Detiene scheduler (Linux/Mac)
├── run-publisher.bat    ← Para Task Scheduler (Windows)
└── setup-scheduler.bat  ← Crear tarea automática (Windows)
```
