// Configuration du back-office : partie commune (src/admin/config-cms.yml) précédée du dépôt et de l'adresse
// propres à la paroisse (paroisse.json > cms), avec le dossier du site choisi.
import type { APIRoute } from 'astro';
import commun from '../../admin/config-cms.yml?raw';
import { paroisse } from '../../lib/config';
import { DOSSIER_SITE } from '../../choix-site.mjs';

const { depot, branche = 'main', url_site } = paroisse.cms;

export const GET: APIRoute = () =>
  new Response(
    `backend:\n  name: github\n  repo: ${depot}\n  branch: ${branche}\n${url_site ? `site_url: ${url_site}\n` : ''}${commun.replaceAll('{{site}}', DOSSIER_SITE)}`,
    { headers: { 'Content-Type': 'text/yaml; charset=utf-8' } },
  );
