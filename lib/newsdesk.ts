// Turns a flat list of headlines into storylines: the names that keep coming back across
// stories (a manager, a signing, a rival) become lines on a transit map of the news.
import type { Headline } from './united';

export type Tone = 'good' | 'bad' | 'neutral';
export type Story = Headline & { at: number; tone: Tone; line: string };
export type Storyline = { name: string; stories: Story[]; color: string };

const COLORS = ['#ffc83d', '#4fd1b5', '#ff8ba8', '#69c9ff', '#c5a3ff'];
export const ELSEWHERE = 'Elsewhere';

// Capitalized words that never name a storyline on their own.
const STOP = new Set(`A An And As At After Before But By Can Could Do Does For From Has Have He His How I If In Into Is It Its
  Me My New No Not Now Of On Or Our Over She So That The Their There They This To Up Was We Were What When Where Which Who Why Will With
  Would You Your Man Manchester United Utd United's Utd's Red Devils Old Trafford BBC Sport Premier League Football Club Watch Live
  Analysis Report Reaction Gossip Podcast Video Quiz Today Monday Tuesday Wednesday Thursday Friday Saturday Sunday
  January February March April May June July August September October November December`.split(/\s+/));

/** The proper names in a headline, with possessives folded ("Carrick's" → "Carrick"). */
export function names(text: string): string[] {
  const found = new Set<string>();
  for (const [word] of text.matchAll(/\p{Lu}[\p{L}'’-]+/gu)) {
    const clean = word.replace(/['’]s$/, '').replace(/['’-]+$/, '');
    if (clean.length > 2 && !STOP.has(clean)) found.add(clean);
  }
  return [...found];
}

const BAD = /\b(sack(ed|ing)?|exit|axe[ds]?|loss|lose[sr]?|lost|defeat(ed)?|beaten|injur(y|ed|ies)|crisis|pressure|ban(ned)?|fail(s|ed|ure)?|worst|blow|setback|row|criticis(e|ed|m)|doubt|future|decide[sd]?|decision|uncertain(ty)?|out)\b/i;
const GOOD = /\b(wins?|won|victory|beat(s)?|sign(s|ed|ing)?|boost|returns?|back|best|record|hero|stars?|brilliant|equalis(er|es|ed)|scores?|scored|delight|deal agreed|title|promot(ed|ion))\b/i;

/** "Aston" reads better as "Aston Villa": use the word that almost always follows a name. */
function fullName(name: string, texts: string[]): string {
  const next = new Map<string, number>();
  let seen = 0;
  for (const text of texts) for (const m of text.matchAll(new RegExp(`\\b${name}(?:['’]s)?(?:\\s+(\\p{Lu}[\\p{L}-]+))?`, 'gu'))) {
    seen++;
    if (m[1] && !STOP.has(m[1])) next.set(m[1], (next.get(m[1]) || 0) + 1);
  }
  const [word, n] = [...next].sort((a, b) => b[1] - a[1])[0] || [];
  return word && n >= Math.max(2, seen * 0.6) ? `${name} ${word}` : name;
}

/** A rough reading of how a United fan would take the headline. */
export function tone(text: string): Tone {
  const bad = BAD.test(text), good = GOOD.test(text);
  return bad && !good ? 'bad' : good && !bad ? 'good' : 'neutral';
}

/** What a tito says at the TV, matched to the headline's tone. These are reactions, never news. */
export const REACTIONS: Record<Tone, { tl: string; en: string }[]> = {
  good: [{ tl: 'Ayos!', en: 'Nice!' }, { tl: 'Grabe, ang galing!', en: 'Wow, so good!' }, { tl: 'Laban lang!', en: 'Keep it going!' }],
  bad: [{ tl: 'Ay nako.', en: 'Oh dear.' }, { tl: 'Kalma lang.', en: 'Stay calm.' }, { tl: 'Kaya pa ’yan.', en: 'We can still turn it around.' }],
  neutral: [{ tl: 'Abangan.', en: 'Wait and see.' }, { tl: 'Tingnan natin.', en: 'Let’s see.' }, { tl: 'Hmm, sige.', en: 'Hmm, okay.' }],
};
export const reaction = (story: Story, index: number) => { const list = REACTIONS[story.tone]; return list[index % list.length]; };

/**
 * Groups headlines into at most `max` storylines. The name shared by the most stories wins first;
 * a storyline needs at least two stories. Anything left over rides the "Elsewhere" line.
 */
export function storylines(items: Headline[], now = Date.now(), max = 4): Storyline[] {
  const stories: Story[] = items.map((h) => ({ ...h, at: h.published ? Date.parse(h.published) : now, tone: tone(`${h.title} ${h.summary}`), line: ELSEWHERE }));
  const tags = stories.map((s) => new Set([...names(s.title), ...names(s.summary)]));
  const lines: Storyline[] = [];
  const free = new Set(stories.map((_, i) => i));
  while (lines.length < max) {
    const count = new Map<string, number>();
    for (const i of free) for (const name of tags[i]) count.set(name, (count.get(name) || 0) + 1);
    // Most stories first; ties go to the name that appears in more headlines than summaries.
    const best = [...count].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    if (!best) break;
    const members = [...free].filter((i) => tags[i].has(best[0]));
    members.forEach((i) => { free.delete(i); stories[i].line = best[0]; });
    lines.push({ name: fullName(best[0], members.flatMap((i) => [stories[i].title, stories[i].summary])), stories: members.map((i) => stories[i]).sort((a, b) => a.at - b.at), color: COLORS[lines.length % COLORS.length] });
  }
  if (free.size) lines.push({ name: ELSEWHERE, stories: [...free].map((i) => stories[i]).sort((a, b) => a.at - b.at), color: '#8b93c9' });
  return lines;
}

/** "12m", "3h", "2d": compact enough for a map label. */
export function ago(at: number, now = Date.now()): string {
  const m = Math.max(0, Math.round((now - at) / 60000));
  return m < 60 ? `${m}m` : m < 60 * 24 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
}
