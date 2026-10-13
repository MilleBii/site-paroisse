// Configuration du back-office : partie commune (src/admin/config-cms.yml) précédée du dépôt et de l'adresse
// propres à la paroisse (paroisse.json > cms), avec le dossier du site choisi.
// cms.essai = true (site de démonstration) : en ligne, back-office ouvert à tous en mode d'essai (« test-repo ») ;
// les modifications restent dans le navigateur du visiteur. En local, le dépôt local reste proposé.
import type { APIRoute } from 'astro';
import commun from '../../admin/config-cms.yml?raw';
import { paroisse } from '../../lib/config';
import { DOSSIER_SITE } from '../../choix-site.mjs';

const { depot, branche = 'main', url_site, essai = false } = paroisse.cms as { depot: string; branche?: string; url_site?: string; essai?: boolean };
const backend = essai && !import.meta.env.DEV
  ? 'backend:\n  name: test-repo\n'
  : `backend:\n  name: github\n  repo: ${depot}\n  branch: ${branche}\n`;

export const GET: APIRoute = () =>
  new Response(
    `${backend}${url_site ? `site_url: ${url_site}\n` : ''}${commun.replaceAll('{{site}}', DOSSIER_SITE)}`,
    { headers: { 'Content-Type': 'text/yaml; charset=utf-8' } },
  );
