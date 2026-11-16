// Latest Manchester United headlines from BBC Sport's public RSS feed, shown with a link back
// to each story. Only titles, summaries and links are used, and results are cached for 15 minutes.
const FEED = 'https://feeds.bbci.co.uk/sport/football/teams/manchester-united/rss.xml';
const TTL = 15 * 60 * 1000;

export type Headline = { title: string; summary: string; link: string; published: string | null };
let cache: { at: number; items: Headline[] } | null = null;

const decode = (s: string) => s
  .replace(/^<!\[CDATA\[|\]\]>$/g, '')
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .trim();
const tag = (xml: string, name: string) => { const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(xml); return m ? decode(m[1]) : ''; };

/** Parses RSS items, keeping only BBC links so the page never links anywhere unexpected. */
export function parseHeadlines(xml: string, limit = 24): Headline[] {
  const out: Headline[] = [];
  for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const title = tag(item, 'title'), link = tag(item, 'link'), date = Date.parse(tag(item, 'pubDate'));
    let url: URL;
    try { url = new URL(link); } catch { continue; }
    if (!title || url.protocol !== 'https:' || !/(^|\.)bbc\.(co\.uk|com)$/.test(url.hostname)) continue;
    out.push({ title: title.slice(0, 200), summary: tag(item, 'description').replace(/<[^>]*>/g, '').slice(0, 320), link: url.href, published: Number.isNaN(date) ? null : new Date(date).toISOString() });
    if (out.length >= limit) break;
  }
  return out;
}

export async function unitedHeadlines(): Promise<Headline[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.items;
  try {
    const res = await fetch(FEED, { headers: { Accept: 'application/rss+xml, application/xml' }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`Feed ${res.status}`);
    const items = parseHeadlines(await res.text());
    if (items.length) cache = { at: Date.now(), items };
    return items.length ? items : cache?.items || [];
  } catch {
    return cache?.items || [];
  }
}
