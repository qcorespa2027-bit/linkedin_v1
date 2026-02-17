// src/add-post.js
// Agrega un nuevo post al calendario de publicaciones.
// Uso: npm run add
// Te pide contenido, fecha y hora de forma interactiva.

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const POSTS_PATH = path.join(__dirname, '..', 'data', 'posts.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log('\n🔗 LinkedIn Publisher — Agregar Post');
  console.log('═'.repeat(50));

  // Content (multi-line)
  console.log('\n📝 Escribe el contenido del post.');
  console.log('   (Escribe "FIN" en una línea sola para terminar)\n');
  
  const lines = [];
  const collectLines = () => {
    return new Promise(resolve => {
      const askLine = () => {
        rl.question('', (line) => {
          if (line.trim().toUpperCase() === 'FIN') {
            resolve(lines.join('\n'));
          } else {
            lines.push(line);
            askLine();
          }
        });
      };
      askLine();
    });
  };

  const content = await collectLines();

  if (!content.trim()) {
    console.log('❌ El contenido no puede estar vacío.');
    rl.close();
    return;
  }

  console.log(`\n📊 Caracteres: ${content.length}/3000`);
  if (content.length > 3000) {
    console.log('⚠️ LinkedIn permite máximo 3000 caracteres.');
  }

  // Date
  const today = new Date().toISOString().split('T')[0];
  const dateInput = await ask(`\n📅 Fecha (YYYY-MM-DD) [${today}]: `);
  const scheduledDate = dateInput.trim() || today;

  // Time
  const timeInput = await ask('🕐 Hora (HH:MM) [09:00]: ');
  const scheduledTime = timeInput.trim() || '09:00';

  // Image
  const imageUrl = await ask('🖼️  URL imagen (Enter para omitir): ');

  // Confirm
  console.log('\n' + '─'.repeat(50));
  console.log('📋 RESUMEN:');
  console.log('─'.repeat(50));
  console.log(`📅 ${scheduledDate} a las ${scheduledTime}`);
  console.log(`📝 ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
  if (imageUrl.trim()) console.log(`🖼️  ${imageUrl.trim()}`);
  console.log('─'.repeat(50));

  const confirm = await ask('\n¿Guardar? (s/n) [s]: ');
  if (confirm.trim().toLowerCase() === 'n') {
    console.log('❌ Cancelado.');
    rl.close();
    return;
  }

  // Save
  const postsData = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf-8'));
  
  const newPost = {
    id: `post-${Date.now()}`,
    content: content.trim(),
    scheduledDate,
    scheduledTime,
    status: 'scheduled',
    imageUrl: imageUrl.trim() || null,
    publishedAt: null,
    linkedinPostId: null,
    createdAt: new Date().toISOString()
  };

  postsData.posts.push(newPost);
  fs.writeFileSync(POSTS_PATH, JSON.stringify(postsData, null, 2));

  const total = postsData.posts.filter(p => p.status === 'scheduled').length;
  console.log(`\n✅ Post guardado! (${newPost.id})`);
  console.log(`📋 Total programados: ${total}\n`);

  rl.close();
}

main().catch(err => {
  console.error('💥', err.message);
  rl.close();
  process.exit(1);
});
