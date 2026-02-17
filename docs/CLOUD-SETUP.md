# ☁️ Publicación Automática 24/7 (Sin PC Encendido)

## Cómo funciona

```
cron-job.org  ──webhook──▶  GitHub Actions  ──▶  Publica en LinkedIn
 (gratis)                   (gratis)              (API v2)
    ⏰ cada 15 min          🤖 ejecuta publish.js    📤 posts listos
```

**Ventajas:**
- ✅ Funciona 24/7 sin computador encendido
- ✅ 100% gratuito (cron-job.org + GitHub Actions)
- ✅ Los cambios en `posts.json` se guardan automáticamente en el repo
- ✅ Puedes ver los logs en la pestaña "Actions" de GitHub

---

## Paso 1: Crear un Personal Access Token (PAT) de GitHub

1. Ve a: **https://github.com/settings/tokens?type=beta** (Fine-grained tokens)
2. Click **"Generate new token"**
3. Configura:
   - **Token name:** `linkedin-publisher-webhook`
   - **Expiration:** 90 días (o el máximo que desees)
   - **Repository access:** "Only select repositories" → selecciona `linkedin_v1`
   - **Permissions:**
     - **Contents:** Read and Write
     - **Actions:** Read and Write (necesario para `repository_dispatch`)
4. Click **"Generate token"**
5. **¡Copia el token!** (empieza con `github_pat_...`). No lo podrás ver de nuevo.

---

## Paso 2: Configurar los Secrets en GitHub

1. Ve a: **https://github.com/qcorespa2027-bit/linkedin_v1/settings/secrets/actions**
2. Agrega estos secrets (click "New repository secret"):

| Secret | Valor |
|--------|-------|
| `LINKEDIN_CONFIG` | El contenido de `config.json` codificado en base64 (ver abajo) |

### Generar el base64 de config.json:

```bash
# En la terminal del proyecto:
base64 -w 0 config.json
```

Copia todo el output y pégalo como valor del secret `LINKEDIN_CONFIG`.

---

## Paso 3: Configurar cron-job.org (el reloj en la nube)

1. Crea una cuenta gratis en: **https://cron-job.org**
2. Click **"Create cronjob"**
3. Configura:

| Campo | Valor |
|-------|-------|
| **Title** | LinkedIn Publisher |
| **URL** | `https://api.github.com/repos/qcorespa2027-bit/linkedin_v1/dispatches` |
| **Schedule** | Every 15 minutes (o elige los horarios que prefieras) |
| **Request method** | POST |
| **Request headers** | Ver abajo |
| **Request body** | Ver abajo |

### Headers (pestaña "Advanced"):

```
Accept: application/vnd.github+json
Authorization: Bearer TU_GITHUB_PAT_AQUÍ
Content-Type: application/json
```

> ⚠️ Reemplaza `TU_GITHUB_PAT_AQUÍ` con el token del Paso 1.

### Body:

```json
{"event_type": "publish-linkedin"}
```

4. En **Schedule**, configura según tu preferencia. Ejemplo recomendado:
   - **Días:** Lunes a Viernes
   - **Horas:** 08:00 a 20:00 (hora Chile)
   - **Cada:** 15 minutos

5. Click **"Create"**

---

## Paso 4: Probar que funciona

### Opción A: Probar desde la terminal
```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer TU_GITHUB_PAT_AQUÍ" \
  https://api.github.com/repos/qcorespa2027-bit/linkedin_v1/dispatches \
  -d '{"event_type": "publish-linkedin"}'
```

Si devuelve **204 No Content** → ¡Funciona! 🎉

### Opción B: Ejecutar manualmente desde GitHub
1. Ve a: **https://github.com/qcorespa2027-bit/linkedin_v1/actions**
2. Selecciona el workflow **"LinkedIn Auto-Publisher"**
3. Click **"Run workflow"** → **"Run workflow"**

### Verificar ejecución:
- Ve a la pestaña **Actions** del repo para ver los logs
- Revisa `data/posts.json` para ver si el status cambió a `"published"`

---

## Alternativa: EasyCron

Si prefieres EasyCron (https://www.easycron.com):

1. Crea cuenta gratis
2. "Add Cron Job"
3. **URL:** `https://api.github.com/repos/qcorespa2027-bit/linkedin_v1/dispatches`
4. **Method:** POST
5. **Headers:**
   ```
   Accept: application/vnd.github+json
   Authorization: Bearer TU_GITHUB_PAT_AQUÍ
   Content-Type: application/json
   ```
6. **POST body:** `{"event_type": "publish-linkedin"}`
7. **Cron expression:** `*/15 8-20 * * 1-5` (cada 15 min, lun-vie, 8am-20pm)

---

## Diagrama completo del flujo

```
┌─────────────┐     webhook POST        ┌──────────────────┐
│ cron-job.org │ ──────────────────────▶ │  GitHub Actions   │
│  (cada 15m)  │  event_type:            │                   │
└─────────────┘  "publish-linkedin"      │  1. Checkout repo │
                                         │  2. npm ci        │
                                         │  3. publish.js    │
                                         │  4. git commit    │
                                         └────────┬─────────┘
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │  LinkedIn API v2  │
                                         │  📤 Publica post  │
                                         └──────────────────┘
```

---

## Mantenimiento

### Renovar token de LinkedIn
Cuando el token expire (~60 días):
1. Ejecuta `npm run token` en tu PC
2. Regenera el base64: `base64 -w 0 config.json`
3. Actualiza el secret `LINKEDIN_CONFIG` en GitHub

### Renovar PAT de GitHub
Cuando expire el PAT:
1. Genera uno nuevo en https://github.com/settings/tokens
2. Actualiza el header `Authorization` en cron-job.org

### Agregar nuevos posts
1. Edita `data/posts.json` (puedes hacerlo directo en GitHub.com)
2. O usa `npm run add` en tu PC y haz push

---

## Costos

| Servicio | Plan | Costo |
|----------|------|-------|
| cron-job.org | Free | $0 (hasta 1 cron job, máx cada 15 min) |
| GitHub Actions | Free | $0 (2,000 min/mes en repos públicos, 500 min en privados) |
| **Total** | | **$0/mes** |
