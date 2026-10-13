// Aperçu du back-office identique au site : on reprend sur le site lui-même son cadre (bandeau, en-tête, menu, pied de page),
// ses styles, et le rendu réel des blocs alimentés par Enoria (horaires, clochers, articles, tuiles des sous-pages).
import { PhotoCadree, adresse } from './image-cadree.js';

const CMS = window.CMS;
const { createElement: h, useEffect, useState } = CMS.React;
const md = (texte) => ({ __html: window.marked.parse(texte || '') });

// Pages du site déjà publiées, lues une fois puis gardées en mémoire
const pagesLues = new Map();
const lire = (chemin) => {
  if (!pagesLues.has(chemin)) {
    pagesLues.set(chemin, fetch(chemin).then((r) => (r.ok ? r.text() : '')).then((t) => new DOMParser().parseFromString(t, 'text/html')).catch(() => null));
  }
  return pagesLues.get(chemin);
};
const html = (el) => (el ? el.outerHTML.replace(/ data-astro-source-(file|loc)="[^"]*"/g, '') : '');
const blocAvec = (doc, selecteur) => doc?.querySelector(selecteur)?.closest('section.bloc');

// Styles du site, y compris ceux propres à chaque composant (horaires, articles…)
// Les pages des horaires et des clochers dépendent de l'arborescence de chaque site : l'accueil les indique
const accueil = await lire('/');
const chemins = JSON.parse(accueil?.body?.dataset.chemins || '{}');
const SOURCES = { horaires: chemins.horaires, clochers: chemins.clochers, articles: '/actualites/' };
const docs = { accueil, ...Object.fromEntries(await Promise.all(Object.entries(SOURCES).map(async ([cle, chemin]) => [cle, chemin ? await lire(chemin) : null]))) };
const styles = new Set();
for (const doc of Object.values(docs)) {
  doc?.querySelectorAll('link[rel="stylesheet"]').forEach((l) => styles.add(new URL(l.getAttribute('href'), location.origin).href));
  doc?.querySelectorAll('style').forEach((s) => styles.add(s.textContent));
}
for (const s of styles) CMS.registerPreviewStyle(s, { raw: !/^https?:/.test(s) });
CMS.registerPreviewStyle(`
  .apercu-brouillon { display: inline-block; background: #fff3cd; color: #6b4e00; padding: 4px 12px; border-radius: 999px; font-size: .85rem; }
  .apercu-note { font-size: .82rem; color: var(--texte-doux); margin: -4px 0 8px; }
  nav.menu { position: static; }
`, { raw: true });

const cadre = {
  haut: [docs.accueil?.querySelector('.bandeau'), docs.accueil?.querySelector('.entete'), docs.accueil?.querySelector('nav.menu')].map(html).join(''),
  bas: html(docs.accueil?.querySelector('footer')),
};
const extrait = {
  horaires: (() => {  // les trois premiers jours suffisent pour se représenter le bloc
    const s = blocAvec(docs.horaires, '.jour')?.cloneNode(true);
    s?.querySelector('h2')?.remove();
    s?.querySelectorAll('.jour').forEach((j, i) => i > 2 && j.remove());
    return html(s);
  })(),
  clochers: (() => {
    const s = blocAvec(docs.clochers, '.liste-lieux')?.cloneNode(true);
    s?.querySelector('h2')?.remove();
    s?.querySelector('.carte-lieux')?.replaceWith(Object.assign(document.createElement('p'), { className: 'a-rediger', textContent: 'Ici, la carte interactive de la paroisse.' }));
    return html(s);
  })(),
  articles: html(docs.articles?.querySelector('.grille.articles')),
};

const brut = (contenu, note) => [note ? h('p', { key: 'n', className: 'apercu-note' }, note) : null, h('div', { key: 'c', dangerouslySetInnerHTML: { __html: contenu } })];
const encadre = (texte) => h('p', { className: 'a-rediger' }, texte);
const titre = (b) => (b.titre ? h('h2', { key: 'h' }, b.titre) : null);

function SousPages({ chemin }) {
  const [tuiles, setTuiles] = useState(null);
  useEffect(() => { lire(chemin).then((d) => setTuiles(html(d?.querySelector('.grille')))); }, [chemin]);
  return tuiles ? h('div', { dangerouslySetInnerHTML: { __html: tuiles } }) : encadre('Ici : une tuile par sous-page, ajoutée automatiquement.');
}

function Photo({ valeur, legende, getAsset }) {
  const [url, setUrl] = useState(null);
  const src = valeur?.src;
  useEffect(() => { adresse(src, getAsset).then(setUrl); }, [src]);
  return h(PhotoCadree, { valeur, url, legende });
}

function bloc(b, i, chemin, getAsset) {
  const rendu = {
    image: () => [h(Photo, { key: 'p', valeur: b.photo, legende: b.legende, getAsset })],
    texte: () => [titre(b), h('div', { key: 't', dangerouslySetInnerHTML: md(b.contenu) })],
    sous_pages: () => [titre(b), h(SousPages, { key: 's', chemin })],
    horaires: () => [titre(b), ...brut(extrait.horaires, `Horaires repris d'Enoria : la page publiée affiche les ${b.nombre || 35} prochains jours.`)],
    clochers: () => [titre(b), ...brut(extrait.clochers)],
    articles: () => [titre(b), ...brut(extrait.articles)],
    formulaire_iframe: () => [titre(b), b.url && !/[?&]fl=/.test(b.url)
      ? h('iframe', { key: 'f', className: 'iframe-enoria', src: b.url, title: b.titre || 'Formulaire Enoria', style: { width: '100%', height: '600px', border: '1px solid var(--bord)', borderRadius: '6px' } })
      : encadre('Adresse du formulaire Enoria à renseigner (copiée depuis Enoria déconnecté, sans « fl= »).')],
    a_rediger: () => [encadre(b.contenu || 'À rédiger.')],
  }[b.type];
  return h('section', { className: 'bloc', key: i }, rendu ? rendu() : encadre(`Bloc « ${b.type} »`));
}

const donnees = (entry) => {
  const d = entry.getIn ? entry.getIn(['data']) : entry.data;
  return (d && d.toJS ? d.toJS() : d) || {};
};
// sites/demo/pages/adultes/parcours-alpha/index.md → /adultes/parcours-alpha/
const cheminDe = (entry) => {
  const fichier = (entry.getIn ? entry.getIn(['path']) : entry.path) || '';
  return fichier.replace(/^.*sites\/[^/]+\/pages/, '').replace(/index\.md$/, '') || '/';
};

const page = (d, ...contenu) => h('div', null,
  h('div', { dangerouslySetInnerHTML: { __html: cadre.haut } }),
  h('main', null, h('div', { className: 'conteneur' },
    d.statut === 'brouillon' ? h('p', { className: 'apercu-brouillon' }, 'Brouillon : pas encore visible sur le site') : null,
    h('h1', null, d.titre || 'Sans titre'), ...contenu)),
  h('div', { dangerouslySetInnerHTML: { __html: cadre.bas } }));

CMS.registerPreviewTemplate('pages', ({ entry, getAsset }) => {
  const d = donnees(entry);
  const chemin = cheminDe(entry);
  return page(d, (d.blocs || []).map((b, i) => bloc(b, i, chemin, getAsset)));
});

CMS.registerPreviewTemplate('articles', ({ entry, widgetFor, getAsset }) => {
  const d = donnees(entry);
  const date = d.date ? new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return page(d,
    h('p', { className: 'doux' }, [date, d.rubrique].filter(Boolean).join(' · ')),
    d.image ? h(Photo, { valeur: d.image, getAsset }) : null,
    d.resume ? h('p', null, h('strong', null, d.resume)) : null,
    h('div', null, widgetFor('body')));
});
