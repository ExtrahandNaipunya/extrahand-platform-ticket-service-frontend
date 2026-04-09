/**
 * Public marketing / support site base URL for links opened from the ticket portal (e.g. knowledge base articles).
 * Set NEXT_PUBLIC_SUPPORT_SITE_URL in production (e.g. https://support.extrahand.in).
 */
export function getSupportSiteBaseUrl(): string {
  const fromEnv =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPPORT_SITE_URL?.replace(/\/$/, '')) ||
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')) ||
    '';
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://support.extrahand.in';
}

export function getSupportArticleUrl(articleId: string): string {
  const id = encodeURIComponent(String(articleId));
  return `${getSupportSiteBaseUrl()}/article/${id}`;
}
