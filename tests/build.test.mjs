// Vérifie le site produit par `npm run build` : npm run test:build
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const out = 'dist/laurent-bury/browser';
const read = (path) => readFileSync(`${out}/${path}`, 'utf8');
const PAGES = {
  'index.html': 'Laurent Bury, traducteur',
  'traduction/index.html': 'Traductions | Laurent Bury',
  'dernieres-parutions/index.html': 'Dernières parutions | Laurent Bury',
  'travaux-presse/index.html': 'Travaux pour la presse | Laurent Bury',
  'cv-contact/index.html': 'CV / Contact | Laurent Bury',
  'mentions-legales/index.html': 'Mentions légales | Laurent Bury',
  'confidentialite/index.html': 'Politique de confidentialité | Laurent Bury',
};

describe('pages pré-rendues', () => {
  for (const [path, title] of Object.entries(PAGES)) {
    test(path, () => {
      const html = read(path);
      assert.ok(html.includes(`<title>${title}</title>`), 'titre de la page');
      assert.match(html, /<h1[^>]*>/, 'un titre h1');
      assert.match(html, /name="description" content="[^"]{20,}"/, 'une description');
      assert.match(html, /name="robots" content="index, follow"/, 'indexable');
      assert.ok(html.includes('href="/mentions-legales"'), 'lien vers les mentions légales');
      assert.ok(html.includes('href="/confidentialite"'), 'lien vers la confidentialité');
    });
  }

  test('le catalogue est dans le HTML, pas seulement dans le JavaScript', () => {
    const books = read('traduction/index.html').match(/<article class="book"/g) ?? [];
    const total = JSON.parse(read('data/livres.json')).filter((row) => String(row.titre ?? '').trim()).length;
    assert.equal(books.length, total);
  });

  test('l’accueil montre les dernières parutions', () => {
    assert.ok((read('index.html').match(/class="tome"/g) ?? []).length > 0);
  });
});

describe('pages rendues dans le navigateur', () => {
  test('l’administration n’est pas pré-rendue', () => {
    assert.equal(existsSync(`${out}/admin/index.html`), false);
    assert.ok(existsSync(`${out}/index.csr.html`));
  });

  test('une page 404 existe pour l’hébergeur', () => {
    assert.ok(existsSync(`${out}/404.html`));
    assert.ok(read('404.html').includes('<app-root'));
  });
});

describe('confidentialité', () => {
  const files = readdirSync(out, { recursive: true }).filter((file) => /\.(html|css|js)$/.test(file));

  test('aucune police chargée depuis Google', () => {
    for (const file of files) {
      const content = read(file);
      assert.ok(!content.includes('fonts.googleapis.com'), file);
      assert.ok(!content.includes('fonts.gstatic.com'), file);
    }
  });

  test('les polices sont servies par le site', () => {
    assert.ok(readdirSync(`${out}/media`).some((file) => file.endsWith('.woff2')));
  });

  test('aucune mesure d’audience n’est chargée', () => {
    for (const file of files) {
      assert.ok(!read(file).includes('googletagmanager.com'), file);
    }
  });
});

describe('hébergement Vercel', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));

  test('Vercel publie le dossier produit par le build', () => {
    assert.equal(config.outputDirectory, out);
    assert.equal(config.buildCommand, 'npm run vercel-build');
  });

  test('l’admin est servi par la coquille de l’application', () => {
    assert.deepEqual(config.rewrites, [{ source: '/admin/:path*', destination: '/index.csr.html' }]);
  });

  test('les anciennes adresses restent sans barre finale', () => {
    assert.equal(config.trailingSlash, false);
  });

  test('les en-têtes de sécurité sont posés', () => {
    const keys = config.headers.find((rule) => rule.source === '/(.*)').headers.map((header) => header.key);
    for (const key of ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy']) {
      assert.ok(keys.includes(key), key);
    }
  });

  test('Firebase ne sert plus que les règles Firestore', () => {
    assert.deepEqual(Object.keys(JSON.parse(readFileSync('firebase.json', 'utf8'))), ['firestore']);
  });

  test('le sitemap liste toutes les pages publiques', () => {
    const sitemap = read('sitemap.xml');
    for (const path of Object.keys(PAGES)) {
      const url = `https://www.laurentburytraducteur.com/${path.replace(/\/?index\.html$/, '')}`;
      assert.ok(sitemap.includes(`<loc>${url}</loc>`), url);
    }
  });
});
