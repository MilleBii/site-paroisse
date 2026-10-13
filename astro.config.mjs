import { defineConfig } from 'astro/config';
import { cpSync, createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHEMIN_SITE, NOM_SITE } from './src/choix-site.mjs';

// En développement, Astro ne sert pas public/admin/index.html sous /admin/ : on l'y renvoie (Sveltia CMS).
const pageAdmin = {
  name: 'page-admin',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/admin' || req.url === '/admin/') req.url = '/admin/index.html';
      next();
    });
  },
};

// Fichiers publics de la paroisse (sites/<nom>/public : photos, calendriers, carte), servis à la racine du site
// en plus de public/ (fichiers communs). En cas de doublon, celui de la paroisse l'emporte.
const PUBLIC_SITE = join(CHEMIN_SITE, 'public') + sep;
const TYPES = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ics': 'text/calendar; charset=utf-8', '.json': 'application/json', '.pdf': 'application/pdf',
  '.woff2': 'font/woff2', '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html; charset=utf-8',
};
const publicDuSite = {
  name: 'public-du-site',
  hooks: {
    'astro:config:done': ({ logger }) => logger.info(`Site construit : sites/${NOM_SITE}`),
    'astro:server:setup': ({ server }) => {
      server.middlewares.use((req, res, next) => {
        const chemin = normalize(join(PUBLIC_SITE, decodeURIComponent((req.url ?? '').split('?')[0])));
        if (!chemin.startsWith(PUBLIC_SITE) || !existsSync(chemin) || !statSync(chemin).isFile()) return next();
        res.setHeader('Content-Type', TYPES[extname(chemin).toLowerCase()] ?? 'application/octet-stream');
        createReadStream(chemin).pipe(res);
      });
    },
    'astro:build:done': ({ dir }) => {
      if (existsSync(PUBLIC_SITE)) cpSync(PUBLIC_SITE, fileURLToPath(dir), { recursive: true });
    },
  },
};

export default defineConfig({
  site: 'http://localhost:4321',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },  // styles dans la page : pas de requête qui retarde l'affichage
  integrations: [publicDuSite],
  // @site désigne le dossier du site choisi (src/choix-site.mjs)
  vite: { plugins: [pageAdmin], resolve: { alias: { '@site': CHEMIN_SITE } } },
});
