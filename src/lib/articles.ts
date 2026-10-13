// Articles publiés par la paroisse : saisis dans Sveltia CMS, un fichier Markdown par article dans sites/<nom>/articles/.

export type Article = { slug: string; titre: string; date: Date; resume: string; rubrique?: string; html: string; image?: { src: string; format?: string; cadrage?: any } };

const modules = import.meta.glob<{ frontmatter: any; compiledContent: () => string }>('@site/articles/*.md', { eager: true });

export const articles: Article[] = Object.entries(modules)
  .filter(([, m]) => (m.frontmatter.statut ?? 'publie') === 'publie')
  .map(([chemin, m]) => ({
    slug: chemin.split('/').pop()!.replace(/\.md$/, ''), ...m.frontmatter, date: new Date(m.frontmatter.date), html: m.compiledContent(),
  }))
  .sort((a, b) => b.date.getTime() - a.date.getTime());

export const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
