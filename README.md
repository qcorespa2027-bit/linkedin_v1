# 🔗 LinkedIn Publisher

Publicador automático de posts en LinkedIn para Smart Student.  
100% local, sin servidores.

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

**Automático (Windows Task Scheduler):**
```bash
# Ejecutar como Administrador:
setup-scheduler.bat
```
Publica cada hora de 8am a 8pm, lunes a viernes.

## Comandos

| Comando | Descripción |
|---|---|
| `npm run token` | Obtener/renovar token de LinkedIn |
| `npm run add` | Agregar post interactivamente |
| `npm run list` | Ver todos los posts |
| `npm run publish` | Publicar posts pendientes |

## Estructura

```
linkedin-publisher/
├── src/
│   ├── get-token.js    ← OAuth local
│   ├── publish.js      ← Publicador
│   ├── add-post.js     ← Agregar posts
│   └── list-posts.js   ← Listar posts
├── data/
│   └── posts.json      ← Base de datos de posts
├── config.json          ← Token (NO se sube a git)
├── run-publisher.bat    ← Para Task Scheduler
└── setup-scheduler.bat  ← Crear tarea automática
```
