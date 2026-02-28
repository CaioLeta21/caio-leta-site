import { translations, type Locale, type TranslationKey } from './translations';

export function getLocaleFromUrl(url: URL): Locale {
  const firstSegment = url.pathname.split('/')[1];
  if (firstSegment === 'en') return 'en';
  return 'pt';
}

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key];
}

export function getHtmlLang(locale: Locale): string {
  return locale === 'pt' ? 'pt-BR' : 'en';
}

/** Maps PT route slugs to EN route slugs */
const routeMap: Record<string, string> = {
  '': '',
  'sobre': 'about',
  'artigos': 'articles',
  'participacoes': 'appearances',
  'relatorios': 'reports',
  'contato': 'contact',
  'indicadoresbtc': 'btcindicators',
};

/** Maps EN route slugs to PT route slugs */
const reverseRouteMap: Record<string, string> = Object.fromEntries(
  Object.entries(routeMap).map(([pt, en]) => [en, pt])
);

export function getAlternateUrl(url: URL, targetLocale: Locale): string {
  const pathname = url.pathname.replace(/\/$/, '') || '';

  if (targetLocale === 'en') {
    // PT -> EN: /sobre -> /en/about, /artigos/slug -> /en/articles/slug
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0] || '';
    const enSegment = routeMap[firstSegment] ?? firstSegment;
    const rest = segments.slice(1);
    const enPath = ['/en', enSegment, ...rest].filter(Boolean).join('/');
    return enPath.startsWith('/') ? enPath : '/' + enPath;
  } else {
    // EN -> PT: /en/about -> /sobre, /en/articles/slug -> /artigos/slug
    const segments = pathname.split('/').filter(Boolean);
    // Remove 'en' prefix
    const withoutEn = segments[0] === 'en' ? segments.slice(1) : segments;
    const firstSegment = withoutEn[0] || '';
    const ptSegment = reverseRouteMap[firstSegment] ?? firstSegment;
    const rest = withoutEn.slice(1);
    const parts = [ptSegment, ...rest].filter(Boolean);
    return parts.length > 0 ? '/' + parts.join('/') : '/';
  }
}

export function formatDate(dateStr: string, locale: Locale): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatMonthYear(dateStr: string, locale: Locale): string {
  const [year, month] = dateStr.split('-');
  const monthKey = `month.${month}` as TranslationKey;
  return `${t(locale, monthKey)} ${year}`;
}

/** Navigation links for each locale */
export function getNavLinks(locale: Locale) {
  if (locale === 'en') {
    return [
      { href: '/en/about', label: t(locale, 'nav.about') },
      { href: '/en/articles', label: t(locale, 'nav.articles') },
      { href: '/en/appearances', label: t(locale, 'nav.appearances') },
      { href: '/en/reports', label: t(locale, 'nav.reports') },
      { href: '/en/contact', label: t(locale, 'nav.contact') },
      { href: '/en/btcindicators', label: t(locale, 'nav.indicators') },
    ];
  }
  return [
    { href: '/sobre', label: t(locale, 'nav.about') },
    { href: '/artigos', label: t(locale, 'nav.articles') },
    { href: '/participacoes', label: t(locale, 'nav.appearances') },
    { href: '/relatorios', label: t(locale, 'nav.reports') },
    { href: '/contato', label: t(locale, 'nav.contact') },
    { href: '/indicadoresbtc', label: t(locale, 'nav.indicators') },
  ];
}

export type { Locale, TranslationKey };
