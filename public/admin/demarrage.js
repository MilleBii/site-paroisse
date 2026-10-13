// Démarrage du back-office : Sveltia CMS (version figée), puis ses extensions (photo recadrée, aperçu).
// Sur un site de démonstration (mode d'essai), le contenu du site est d'abord recopié dans l'espace de stockage
// du navigateur où Sveltia travaille en mode d'essai : chacun peut tout modifier, rien n'est enregistré sur le site.
const SVELTIA = 'https://unpkg.com/@sveltia/cms@0.235.1/dist/sveltia-cms.js';
const DOSSIER_ESSAI = 'sveltia-cms-test';  // nom utilisé par Sveltia pour le mode d'essai
const REPERE = 'contenu-demo.txt';

async function preparerEssai() {
  const config = await fetch('/admin/config.yml').then((r) => r.text());
  if (!/^\s*name:\s*test-repo\s*$/m.test(config) || !navigator.storage?.getDirectory) return;
  const { version, fichiers } = await fetch('/admin/contenu-essai.json').then((r) => r.json());
  if (!fichiers.length) return;
  const racine = await (await navigator.storage.getDirectory()).getDirectoryHandle(DOSSIER_ESSAI, { create: true });
  const lire = async (nom) => { try { return await (await (await racine.getFileHandle(nom)).getFile()).text(); } catch { return null; } };
  if ((await lire(REPERE)) === version) return;  // déjà prêt (les modifications du visiteur sont gardées)
  for await (const nom of racine.keys()) await racine.removeEntry(nom, { recursive: true });
  const ecrire = async (chemin, contenu) => {
    const parties = chemin.split('/');
    let dossier = racine;
    for (const p of parties.slice(0, -1)) dossier = await dossier.getDirectoryHandle(p, { create: true });
    const flux = await (await dossier.getFileHandle(parties.at(-1), { create: true })).createWritable();
    await flux.write(contenu);
    await flux.close();
  };
  for (const f of fichiers) await ecrire(f.chemin, f.contenu);
  await ecrire(REPERE, version);
}

try { await preparerEssai(); } catch (e) { console.warn('Contenu de démonstration non préparé', e); }
// Chargé après la page, Sveltia ne démarre pas seul : on le lance une fois les extensions enregistrées
window.CMS_MANUAL_INIT = true;
await import(SVELTIA);
await import('/admin/image-cadree.js');
await import('/admin/apercu.js');
window.CMS.init();
