// src/get-token.js
// Obtiene el Access Token de LinkedIn mediante OAuth 2.0 local.
// Uso: npm run token
//
// 1. Abre tu navegador automáticamente
// 2. Autorizas en LinkedIn
// 3. Token se guarda en config.json (dura 2 meses)

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { exec } = require('child_process');

// ─── Load .env ───
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

// ─── LinkedIn App credentials ───
const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Falta LINKEDIN_CLIENT_ID o LINKEDIN_CLIENT_SECRET en .env');
  process.exit(1);
}

const SCOPES = 'openid profile email w_member_social';
const PORT = 3456;

// Auto-detect Codespaces environment
const isCodespaces = process.env.CODESPACES === 'true';
const REDIRECT_URI = isCodespaces
  ? `https://${process.env.CODESPACE_NAME}-${PORT}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/callback`
  : `http://localhost:${PORT}/callback`;

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

const authUrl = [
  'https://www.linkedin.com/oauth/v2/authorization',
  `?response_type=code`,
  `&client_id=${CLIENT_ID}`,
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
  `&scope=${encodeURIComponent(SCOPES)}`
].join('');

console.log('\n🔗 LinkedIn Publisher — Obtener Token');
console.log('═'.repeat(50));
if (isCodespaces) {
  console.log('\n☁️  Detectado: GitHub Codespaces');
}
console.log('\n⚠️  Asegúrate de tener en LinkedIn Developer → Auth → Redirect URLs:');
console.log(`   ${REDIRECT_URI}\n`);
console.log('⏳ Abriendo navegador...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Redirect root to LinkedIn
  if (url.pathname !== '/callback') {
    res.writeHead(302, { Location: authUrl });
    return res.end();
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    console.error(`❌ Error: ${error}`);
    sendHtml(res, '❌ Error', `<p style="color:#f87171;">${error}: ${url.searchParams.get('error_description') || ''}</p>`);
    return shutdown(1);
  }

  if (!code) {
    sendHtml(res, '⚠️ Sin código', '<p>No se recibió código de autorización.</p>');
    return;
  }

  console.log('✅ Código recibido, intercambiando por token...');

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      }).toString()
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error || 'Fallo al obtener token');
    }

    // Get profile info
    let name = 'Desconocido', personId = null;
    try {
      const pRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      if (pRes.ok) {
        const p = await pRes.json();
        name = p.name || `${p.given_name} ${p.family_name}`;
        personId = p.sub;
      }
    } catch {}

    // Save config
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000).toISOString();
    const config = {
      access_token: tokenData.access_token,
      person_id: personId,
      person_name: name,
      expires_at: expiresAt,
      refresh_token: tokenData.refresh_token || null,
      created_at: new Date().toISOString()
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

    const expDate = new Date(expiresAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

    console.log(`\n👤 Autorizado como: ${name}`);
    console.log(`🆔 Person ID: ${personId}`);
    console.log(`📅 Token expira: ${expDate}`);
    console.log(`💾 Guardado en: config.json`);
    console.log(`\n✅ ¡Listo! Ahora puedes:`);
    console.log(`   npm run add       → Agregar un post`);
    console.log(`   npm run publish   → Publicar posts pendientes`);
    console.log(`   npm run list      → Ver todos los posts\n`);

    sendHtml(res, '✅ ¡Token obtenido!', `
      <p style="font-size:18px;">Autorizado como <strong>${name}</strong></p>
      <p style="color:#94a3b8;">Token guardado — expira ${expDate}</p>
      <p style="color:#94a3b8;margin-top:30px;">Ya puedes cerrar esta ventana.</p>
    `);

    shutdown(0);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    sendHtml(res, '❌ Error', `<p style="color:#f87171;">${err.message}</p>`);
    shutdown(1);
  }
});

server.listen(PORT, () => {
  if (isCodespaces) {
    console.log(`☁️  URL del servidor: ${REDIRECT_URI.replace('/callback', '')}`);
    console.log(`\n🔗 Abre este link en tu navegador para autorizar:\n   ${authUrl}\n`);
  } else {
    console.log(`🖥️  Servidor local: http://localhost:${PORT}\n`);
    // Cross-platform browser open
    const platform = process.platform;
    const cmd = platform === 'win32' ? `start "" "${authUrl}"`
              : platform === 'darwin' ? `open "${authUrl}"`
              : `xdg-open "${authUrl}" 2>/dev/null || echo "🔗 Abre manualmente: ${authUrl}"`;
    exec(cmd, (err) => {
      if (err) console.log(`🔗 Abre manualmente en tu navegador:\n   ${authUrl}\n`);
    });
  }
});

function sendHtml(res, title, body) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html><html><body style="font-family:system-ui;padding:60px;background:#0f172a;color:#e2e8f0;text-align:center;">
    <h1 style="color:${title.includes('✅') ? '#34d399' : '#f87171'}">${title}</h1>${body}</body></html>`);
}

function shutdown(code) {
  setTimeout(() => { server.close(); process.exit(code); }, 500);
}
