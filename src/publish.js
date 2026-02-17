// src/publish.js
// Publica en LinkedIn los posts cuya fecha/hora ya pasó.
// Uso: npm run publish

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const POSTS_PATH = path.join(__dirname, '..', 'data', 'posts.json');
const LOG_PATH = path.join(__dirname, '..', 'data', 'publish-log.txt');

// ─── Upload image to LinkedIn ───
async function uploadImage(config, imageUrl) {
  try {
    // 1. Register upload
    const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: `urn:li:person:${config.person_id}`,
          serviceRelationships: [{
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent'
          }]
        }
      })
    });

    if (!registerRes.ok) {
      const errText = await registerRes.text();
      console.error(`   ⚠️  Register upload failed: ${errText}`);
      return null;
    }

    const registerData = await registerRes.json();
    const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = registerData.value.asset;

    // 2. Download image from URL
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      console.error(`   ⚠️  Failed to download image: ${imgRes.status}`);
      return null;
    }
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    // 3. Upload binary to LinkedIn
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${config.access_token}`,
        'Content-Type': 'application/octet-stream'
      },
      body: imgBuffer
    });

    if (!uploadRes.ok && uploadRes.status !== 201) {
      console.error(`   ⚠️  Upload failed: ${uploadRes.status}`);
      return null;
    }

    return asset;
  } catch (err) {
    console.error(`   ⚠️  Image upload error: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('\n🔗 LinkedIn Publisher — Publicar');
  console.log('═'.repeat(50));
  console.log(`⏰ ${new Date().toLocaleString('es-CL')}\n`);

  // 1. Load config (from file or environment variables for CI/CD)
  let config;
  if (process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_PERSON_ID) {
    console.log('☁️  Modo CI/CD (GitHub Actions)');
    config = {
      access_token: process.env.LINKEDIN_ACCESS_TOKEN,
      person_id: process.env.LINKEDIN_PERSON_ID,
      person_name: process.env.LINKEDIN_PERSON_NAME || 'CI',
      expires_at: process.env.LINKEDIN_TOKEN_EXPIRES || new Date(Date.now() + 86400000).toISOString()
    };
  } else if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } else {
    console.error('❌ No hay config.json ni variables de entorno — Ejecuta primero: npm run token');
    process.exit(1);
  }

  // Check token expiration
  if (new Date(config.expires_at) < new Date()) {
    console.error('❌ El token expiró. Renuévalo con: npm run token');
    process.exit(1);
  }

  // 2. Load posts
  const postsData = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf-8'));
  const now = new Date();

  // 3. Find posts ready to publish
  const ready = postsData.posts.filter(p => {
    if (p.status !== 'scheduled') return false;
    const scheduled = new Date(`${p.scheduledDate}T${p.scheduledTime || '09:00'}:00`);
    return scheduled <= now;
  });

  const scheduled = postsData.posts.filter(p => p.status === 'scheduled').length;
  const published = postsData.posts.filter(p => p.status === 'published').length;

  console.log(`📋 Total: ${postsData.posts.length} | Programados: ${scheduled} | Publicados: ${published}`);
  console.log(`📤 Listos para publicar ahora: ${ready.length}\n`);

  if (ready.length === 0) {
    const upcoming = postsData.posts
      .filter(p => p.status === 'scheduled')
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    if (upcoming.length > 0) {
      console.log('📅 Próximos:');
      upcoming.slice(0, 5).forEach(p => {
        console.log(`   ${p.scheduledDate} ${p.scheduledTime || '09:00'} — ${p.content.substring(0, 55)}...`);
      });
    }
    return;
  }

  // 4. Ensure we have person_id
  if (!config.person_id) {
    console.log('🔍 Obteniendo Person ID...');
    const pRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${config.access_token}` }
    });
    if (!pRes.ok) {
      console.error('❌ Error al obtener perfil. ¿Token válido?');
      process.exit(1);
    }
    const profile = await pRes.json();
    config.person_id = profile.sub;
    config.person_name = profile.name;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`👤 ${profile.name} (${profile.sub})\n`);
  }

  // 5. Publish
  let okCount = 0, failCount = 0;

  for (const post of ready) {
    const preview = post.content.substring(0, 50).replace(/\n/g, ' ');
    console.log(`📤 "${preview}..."`);

    try {
      let imageAsset = null;

      // Upload image if provided
      if (post.imageUrl) {
        console.log(`   🖼️  Subiendo imagen...`);
        imageAsset = await uploadImage(config, post.imageUrl);
        if (imageAsset) {
          console.log(`   🖼️  Imagen subida: ${imageAsset}`);
        } else {
          console.log(`   ⚠️  No se pudo subir imagen, publicando sin imagen`);
        }
      }

      const body = {
        author: `urn:li:person:${config.person_id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: post.content },
            shareMediaCategory: imageAsset ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      if (imageAsset) {
        body.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          media: imageAsset,
          description: { text: 'Smart Student' },
          title: { text: 'Smart Student' }
        }];
      }

      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();

        // Handle DUPLICATE_POST: the content already exists on LinkedIn
        if (res.status === 422 && errText.includes('DUPLICATE_POST')) {
          post.status = 'published';
          post.publishedAt = now.toISOString();
          post.linkedinPostId = 'duplicate-detected';
          okCount++;
          console.log(`   ⚠️  LinkedIn indica contenido duplicado — marcando como publicado\n`);
          log(`DUPLICATE_OK | ${post.id} | Content already exists on LinkedIn`);
          continue;
        }

        throw new Error(`API ${res.status}: ${errText}`);
      }

      const postId = res.headers.get('x-restli-id') || 'ok';
      post.status = 'published';
      post.publishedAt = now.toISOString();
      post.linkedinPostId = postId;
      okCount++;
      console.log(`   ✅ Publicado (${postId})\n`);
      log(`PUBLISHED | ${post.id} | ${postId}`);
    } catch (err) {
      post.status = 'failed';
      post.errorMessage = err.message;
      failCount++;
      console.error(`   ❌ ${err.message}\n`);
      log(`FAILED | ${post.id} | ${err.message}`);
    }
  }

  // 6. Save
  fs.writeFileSync(POSTS_PATH, JSON.stringify(postsData, null, 2));
  console.log('═'.repeat(50));
  console.log(`📊 Resultado: ${okCount} publicados, ${failCount} fallidos\n`);
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_PATH, line);
}

main().catch(err => {
  console.error('💥', err.message);
  process.exit(1);
});
