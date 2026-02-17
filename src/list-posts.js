// src/list-posts.js
// Lista todos los posts programados.
// Uso: npm run list

const fs = require('fs');
const path = require('path');

const POSTS_PATH = path.join(__dirname, '..', 'data', 'posts.json');

const postsData = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf-8'));
const posts = postsData.posts;

console.log('\n🔗 LinkedIn Publisher — Lista de Posts');
console.log('═'.repeat(60));

if (posts.length === 0) {
  console.log('\n   (vacío) — Agrega posts con: npm run add\n');
  process.exit(0);
}

// Group by status
const groups = {
  scheduled: posts.filter(p => p.status === 'scheduled').sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
  published: posts.filter(p => p.status === 'published'),
  failed: posts.filter(p => p.status === 'failed')
};

if (groups.scheduled.length > 0) {
  console.log(`\n⏳ PROGRAMADOS (${groups.scheduled.length}):`);
  console.log('─'.repeat(60));
  groups.scheduled.forEach(p => {
    const preview = p.content.substring(0, 55).replace(/\n/g, ' ');
    console.log(`  📅 ${p.scheduledDate} ${p.scheduledTime || '09:00'} | ${preview}...`);
    console.log(`     ID: ${p.id}${p.imageUrl ? ' 🖼️' : ''}`);
  });
}

if (groups.published.length > 0) {
  console.log(`\n✅ PUBLICADOS (${groups.published.length}):`);
  console.log('─'.repeat(60));
  groups.published.forEach(p => {
    const preview = p.content.substring(0, 55).replace(/\n/g, ' ');
    const date = p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('es-CL') : '?';
    console.log(`  ✅ ${date} | ${preview}...`);
  });
}

if (groups.failed.length > 0) {
  console.log(`\n❌ FALLIDOS (${groups.failed.length}):`);
  console.log('─'.repeat(60));
  groups.failed.forEach(p => {
    const preview = p.content.substring(0, 45).replace(/\n/g, ' ');
    console.log(`  ❌ ${p.scheduledDate} | ${preview}...`);
    console.log(`     Error: ${p.errorMessage || 'desconocido'}`);
  });
}

console.log('\n' + '═'.repeat(60));
console.log(`📊 Total: ${posts.length} | ⏳ ${groups.scheduled.length} | ✅ ${groups.published.length} | ❌ ${groups.failed.length}\n`);
