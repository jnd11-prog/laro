// First-party product analytics. Events carry an anonymous random visitor ID created on the device,
// never an email, name or IP address. Events recorded offline are queued on the device and sent later
// with their original timestamps, so offline play still shows up in the numbers.
export const EVENT_NAMES = [
  'page_view', 'waitlist_join', 'play_start', 'spin', 'quiz_answer', 'shot', 'career_complete', 'restart', 'offline_open', 'install',
] as const;
export type EventName = (typeof EVENT_NAMES)[number];
/** i is a random per-event ID, so a batch sent twice (two tabs, a retry) is stored once. */
export type TrackedEvent = { i?: string; n: EventName; t: number; p?: Record<string, string | number | boolean> };

export const EVENTS_SQL = `CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vid TEXT NOT NULL,
  eid TEXT NOT NULL,
  name TEXT NOT NULL,
  at INTEGER NOT NULL,
  props TEXT NOT NULL DEFAULT '{}',
  received INTEGER NOT NULL,
  UNIQUE (vid, eid)
)`;
export const EVENTS_INDEX_SQL = 'CREATE INDEX IF NOT EXISTS analytics_name_at ON analytics (name, at)';
export const EVENTS_VID_INDEX_SQL = 'CREATE INDEX IF NOT EXISTS analytics_vid_at ON analytics (vid, at)';
/** Most events one device can send in a day; anything past it is dropped as spam. */
export const DAILY_CAP = 2000;

const DAY = 864e5;
/** Keeps only well-formed events: known names, sane timestamps, a few short properties. */
export function cleanEvents(body: unknown, now = Date.now()): { vid: string; events: TrackedEvent[] } | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as { vid?: unknown; events?: unknown };
  if (typeof b.vid !== 'string' || !/^[a-f0-9]{32}$/.test(b.vid) || !Array.isArray(b.events)) return null;
  const events: TrackedEvent[] = [];
  for (const raw of b.events.slice(0, 50)) {
    if (typeof raw !== 'object' || raw === null) continue;
    const e = raw as { n?: unknown; t?: unknown; p?: unknown };
    const e2 = raw as { i?: unknown };
    if (!(EVENT_NAMES as readonly unknown[]).includes(e.n) || typeof e.t !== 'number' || !Number.isFinite(e.t)) continue;
    // Offline events can arrive late, but not from the future or from long ago.
    if (e.t > now + 36e5 || e.t < now - 30 * DAY) continue;
    const p: Record<string, string | number | boolean> = {};
    if (typeof e.p === 'object' && e.p !== null) {
      for (const [k, v] of Object.entries(e.p).slice(0, 6)) {
        if (!/^[a-z_]{1,20}$/.test(k)) continue;
        if (typeof v === 'string') p[k] = v.slice(0, 40);
        else if ((typeof v === 'number' && Number.isFinite(v)) || typeof v === 'boolean') p[k] = v;
      }
    }
    // The event's own ID when the device sent one; the server makes up a random one otherwise.
    const i = typeof e2.i === 'string' && /^[a-z0-9]{8,32}$/.test(e2.i) ? e2.i : undefined;
    events.push({ ...(i ? { i } : {}), n: e.n as EventName, t: Math.round(e.t), p });
  }
  return { vid: b.vid, events };
}

/** The numbers on the stats page, as SQL over the events and waitlist tables. */
export const STATS_QUERIES = {
  totals: `SELECT
    COUNT(DISTINCT vid) AS visitors,
    COUNT(DISTINCT CASE WHEN name='page_view' AND json_extract(props,'$.page')='landing' THEN vid END) AS landing_visitors,
    COUNT(DISTINCT CASE WHEN name='play_start' THEN vid END) AS players,
    SUM(name='spin') AS spins,
    SUM(name='quiz_answer') AS answers,
    SUM(name='quiz_answer' AND json_extract(props,'$.correct')=1) AS correct,
    SUM(name='career_complete') AS careers_completed,
    SUM(json_extract(props,'$.offline')=1) AS offline_events,
    COUNT(DISTINCT CASE WHEN json_extract(props,'$.offline')=1 THEN vid END) AS offline_visitors
    FROM analytics WHERE at >= ?`,
  daily: `SELECT date(at/1000,'unixepoch') AS day, COUNT(DISTINCT vid) AS visitors,
    COUNT(DISTINCT CASE WHEN name='play_start' OR name='spin' THEN vid END) AS players,
    SUM(name='quiz_answer') AS answers
    FROM analytics WHERE at >= ? GROUP BY day ORDER BY day`,
  // Of players first seen at least N days ago, how many came back on or after day N.
  // Players who already had a career before analytics existed are marked existing and left out.
  retention: `WITH first AS (SELECT vid, MIN(at) AS t0 FROM analytics WHERE name='play_start' AND json_extract(props,'$.existing') IS NOT 1 GROUP BY vid)
    SELECT
      SUM(f.t0 <= ?1 - 1*86400000) AS d1_eligible,
      SUM(f.t0 <= ?1 - 1*86400000 AND EXISTS (SELECT 1 FROM analytics e WHERE e.vid=f.vid AND e.at >= f.t0 + 1*86400000)) AS d1_returned,
      SUM(f.t0 <= ?1 - 7*86400000) AS d7_eligible,
      SUM(f.t0 <= ?1 - 7*86400000 AND EXISTS (SELECT 1 FROM analytics e WHERE e.vid=f.vid AND e.at >= f.t0 + 7*86400000)) AS d7_returned
    FROM first f`,
  waitlist: `SELECT COUNT(*) AS total, SUM(role='teacher') AS teachers, SUM(learning_for='partner') AS for_partner,
    SUM(learning_for='family') AS for_family, SUM(learning_for='myself') AS for_self FROM waitlist`,
  sources: `SELECT CASE WHEN source='' THEN '(direct)' ELSE source END AS source, COUNT(*) AS signups FROM waitlist GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
};
