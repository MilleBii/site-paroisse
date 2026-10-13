// Champ « image_cadree » pour Sveltia CMS (API registerWidget, compatible Decap CMS) : choisir une photo puis la cadrer,
// comme dans WordPress. La photo d'origine n'est jamais modifiée : on enregistre son chemin, le format et le cadrage
// (fractions de la largeur et de la hauteur), et le site découpe l'image à la construction.
// Valeur : { src: "/img/contenu/x.webp", format: "16:9", cadrage: { x, y, l, h } }
const CMS = window.CMS;
const { createElement: h, useEffect, useRef, useState } = CMS.React;

const FORMATS = { '16:9': 16 / 9, '4:3': 4 / 3, '1:1': 1, '4:5': 4 / 5, 'libre': NaN };
const enJS = (v) => (v && v.toJS ? v.toJS() : v);
const option = (field, cle) => enJS(field?.get ? field.get(cle) : field?.[cle]);
const arrondi = (n) => Math.round(n * 10000) / 10000;

// Adresse affichable d'une image : enregistrée (fichier du site) ou en attente d'enregistrement (fichier en mémoire)
async function adresse(src, getAsset) {
  if (!src) return null;
  try {
    const a = await getAsset?.(src);
    const u = a?.url ?? a?.blobURL ?? (typeof a === 'string' ? a : a?.toString?.());
    if (u && u !== '[object Object]') return u;
  } catch { /* on retombe sur le chemin public */ }
  return src;
}

const bouton = (texte, onClick, actif = false, titre) =>
  h('button', { type: 'button', onClick, title: titre, className: 'cadre-bouton' + (actif ? ' actif' : '') }, texte);

function Controle({ value, onChange, addFile, pickFile, getAsset, field, forID }) {
  const v = enJS(value) || {};
  const formats = option(field, 'formats') || Object.keys(FORMATS);
  const format = formats.includes(v.format) ? v.format : formats[0];
  const [url, setUrl] = useState(null);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const img = useRef(null);
  const cropper = useRef(null);
  const fichier = useRef(null);
  const valeur = useRef(v);
  valeur.current = { ...v, format };

  useEffect(() => { let fini = false; adresse(v.src, getAsset).then((u) => !fini && setUrl(u)); return () => { fini = true; }; }, [v.src]);

  // Cropper.js sur l'image affichée ; le cadrage enregistré est remis en place à l'ouverture
  useEffect(() => {
    if (!url || !img.current) return;
    const c = new window.Cropper(img.current, {
      viewMode: 1, dragMode: 'move', autoCropArea: 1, aspectRatio: FORMATS[format], background: false, responsive: true,
      toggleDragModeOnDblclick: false,
      ready() {
        const { naturalWidth: W, naturalHeight: H } = c.getImageData();
        const k = valeur.current.cadrage;
        if (k) c.setData({ x: k.x * W, y: k.y * H, width: k.l * W, height: k.h * H });
        else enregistrer();
      },
      cropend: () => enregistrer(),
      zoom: () => setTimeout(enregistrer, 0),
    });
    cropper.current = c;
    return () => { c.destroy(); cropper.current = null; };
  }, [url]);

  function enregistrer(f = valeur.current.format) {
    const c = cropper.current;
    if (!c) return;
    const { naturalWidth: W, naturalHeight: H } = c.getImageData();
    const d = c.getData(true);
    const x = Math.max(0, d.x), y = Math.max(0, d.y);
    const cadrage = { x: arrondi(x / W), y: arrondi(y / H), l: arrondi(Math.min(d.width, W - x) / W), h: arrondi(Math.min(d.height, H - y) / H) };
    onChange({ ...valeur.current, format: f, cadrage });
  }

  function choisirFormat(f) {
    valeur.current = { ...valeur.current, format: f };
    cropper.current?.setAspectRatio(FORMATS[f]);
    enregistrer(f);
  }

  async function envoyer(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setErreur(''); setEnvoi(true);
    try {
      const r = await addFile(f);  // Sveltia réduit et convertit la photo selon la configuration (2 000 px, WebP)
      const src = typeof r === 'string' ? r : r?.value ?? r?.path;
      if (!src) throw new Error('chemin inconnu');
      onChange({ src, format, cadrage: null });
    } catch (err) {
      setErreur(`La photo n'a pas pu être ajoutée (${err.message}).`);
    } finally { setEnvoi(false); }
  }

  async function mediatheque() {
    const r = await pickFile?.();
    const choix = Array.isArray(r) ? r[0] : r;
    const src = typeof choix === 'string' ? choix : choix?.value ?? choix?.url ?? choix?.path;
    if (src) onChange({ src, format, cadrage: null });
  }

  const choisir = h('div', { className: 'cadre-actions' },
    h('input', { ref: fichier, type: 'file', accept: 'image/*,.heic,.heif', style: { display: 'none' }, onChange: envoyer }),
    bouton(envoi ? 'Envoi en cours…' : v.src ? 'Changer de photo' : 'Choisir une photo', () => fichier.current?.click()),
    pickFile ? bouton('Photo déjà envoyée', mediatheque) : null,
    v.src ? bouton('Retirer', () => onChange(null)) : null);

  if (!v.src) return h('div', { id: forID, className: 'cadre' }, choisir, erreur && h('p', { className: 'cadre-erreur' }, erreur));

  return h('div', { id: forID, className: 'cadre' },
    h('div', { className: 'cadre-zone' }, url && h('img', { ref: img, src: url, alt: '', style: { display: 'block', maxWidth: '100%' } })),
    h('div', { className: 'cadre-actions' },
      formats.length > 1 ? h('span', { className: 'cadre-libelle' }, 'Format') : null,
      formats.length > 1 ? formats.map((f) => h('span', { key: f }, bouton(f === 'libre' ? 'Libre' : f, () => choisirFormat(f), f === format))) : null,
      h('span', { className: 'cadre-libelle' }, 'Zoom'),
      bouton('−', () => cropper.current?.zoom(-0.1), false, 'Dézoomer'),
      bouton('+', () => cropper.current?.zoom(0.1), false, 'Zoomer'),
      bouton('Toute l’image', () => { cropper.current?.reset(); setTimeout(() => enregistrer(), 0); }, false, 'Revenir au cadrage de départ')),
    choisir,
    erreur && h('p', { className: 'cadre-erreur' }, erreur));
}

// Aperçu par défaut du champ : la photo recadrée en CSS (sert aussi dans apercu.js)
export function PhotoCadree({ valeur, url, legende }) {
  const v = enJS(valeur) || {};
  const [taille, setTaille] = useState(null);  // utile au format libre, dont les proportions dépendent de la photo
  if (!v.src || !url) return null;
  const k = v.cadrage || { x: 0, y: 0, l: 1, h: 1 };
  const proportion = v.format && FORMATS[v.format] ? FORMATS[v.format] : taille ? (k.l * taille.l) / (k.h * taille.h) : 16 / 9;
  return h('figure', { className: 'photo-cadree', style: { margin: '0 0 1em' } },
    h('div', { style: { position: 'relative', overflow: 'hidden', borderRadius: '6px', aspectRatio: String(proportion) } },
      h('img', {
        src: url, alt: legende || '', onLoad: (e) => setTaille({ l: e.target.naturalWidth, h: e.target.naturalHeight }),
        style: { position: 'absolute', maxWidth: 'none', width: `${100 / k.l}%`, height: `${100 / k.h}%`, left: `${(-k.x / k.l) * 100}%`, top: `${(-k.y / k.h) * 100}%` },
      })),
    legende ? h('figcaption', { className: 'petit doux' }, legende) : null);
}

function Apercu({ value, getAsset }) {
  const v = enJS(value) || {};
  const [url, setUrl] = useState(null);
  useEffect(() => { adresse(v.src, getAsset).then(setUrl); }, [v.src]);
  return h(PhotoCadree, { valeur: v, url });
}
export { adresse };

CMS.registerWidget('image_cadree', Controle, Apercu);
