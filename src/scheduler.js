// src/scheduler.js
// Scheduler automático de publicaciones en LinkedIn.
// Revisa cada 15 minutos si hay posts listos para publicar.
// Uso: npm run scheduler
//
// También se puede cambiar la frecuencia con la variable de entorno:
//   CRON_SCHEDULE="*/30 * * * *" npm run scheduler   (cada 30 min)

const cron = require('node-cron');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const POSTS_PATH = path.join(__dirname, '..', 'data', 'posts.json');
const LOG_PATH = path.join(__dirname, '..', 'data', 'scheduler-log.txt');
const PUBLISH_SCRIPT = path.join(__dirname, 'publish.js');

// Default: cada 15 minutos, lunes a viernes, de 8am a 20pm
const DEFAULT_SCHEDULE = '*/15 8-20 * * 1-5';
const schedule = process.env.CRON_SCHEDULE || DEFAULT_SCHEDULE;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + '\n');
}

function preflight() {
  // Check config.json exists
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('❌ No hay config.json — Ejecuta primero: npm run token');
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  if (new Date(config.expires_at) < new Date()) {
    console.error('❌ El token expiró. Renuévalo con: npm run token');
    process.exit(1);
  }

  // Check posts.json exists
  if (!fs.existsSync(POSTS_PATH)) {
    console.error('❌ No hay data/posts.json');
    process.exit(1);
  }

  return config;
}

function countPending() {
  try {
    const postsData = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf-8'));
    return postsData.posts.filter(p => p.status === 'scheduled').length;
  } catch {
    return 0;
  }
}

function runPublish() {
  return new Promise((resolve) => {
    log('🔄 Ejecutando publish.js...');
    execFile(process.execPath, [PUBLISH_SCRIPT], { cwd: path.join(__dirname, '..') }, (err, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      if (err) {
        log(`❌ Error en publish: ${err.message}`);
      } else {
        log('✅ Ciclo de publicación completado');
      }
      resolve();
    });
  });
}

// ─── Main ───
const config = preflight();

console.log('\n🔗 LinkedIn Publisher — Scheduler Automático');
console.log('═'.repeat(55));
console.log(`👤 ${config.person_name || 'Usuario'}`);
console.log(`📅 Token expira: ${new Date(config.expires_at).toLocaleDateString('es-CL')}`);
console.log(`⏰ Cron: ${schedule}`);
console.log(`📋 Posts pendientes: ${countPending()}`);
console.log(`📝 Log: data/scheduler-log.txt`);
console.log('═'.repeat(55));
console.log('🟢 Scheduler activo — Ctrl+C para detener\n');

log('🟢 Scheduler iniciado');

// Validate cron expression
if (!cron.validate(schedule)) {
  console.error(`❌ Expresión cron inválida: ${schedule}`);
  process.exit(1);
}

// Run once immediately on start
runPublish();

// Schedule recurring runs
cron.schedule(schedule, async () => {
  const pending = countPending();
  if (pending === 0) {
    log('⏭️  Sin posts pendientes, saltando ciclo');
    return;
  }
  log(`📤 ${pending} post(s) pendiente(s), verificando...`);
  await runPublish();
}, {
  timezone: 'America/Santiago'
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('🔴 Scheduler detenido por el usuario');
  console.log('\n👋 Scheduler detenido.\n');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('🔴 Scheduler detenido (SIGTERM)');
  process.exit(0);
});
