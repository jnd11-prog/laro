import {randomUUID} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {EVENT_NAMES, EVENTS_INDEX_SQL, EVENTS_SQL, STATS_QUERIES, cleanEvents} from '../lib/analytics.ts';
import {WAITLIST_SQL, parseSignup} from '../lib/waitlist.ts';

const NOW = Date.UTC(2026, 10, 16, 12);
const DAY = 864e5;
const VID = 'a'.repeat(32);
const ev = (n, t = NOW, p) => (p === undefined ? {n, t} : {n, t, p});

// ---------- cleanEvents ----------

test('cleanEvents rejects bad bodies, visitor IDs and non-array events', () => {
  for (const body of [null, undefined, 'x', 42, []]) assert.equal(cleanEvents(body, NOW), null);
  for (const vid of [undefined, 7, '', 'a'.repeat(31), 'a'.repeat(33), 'A'.repeat(32), 'g'.repeat(32), `${'a'.repeat(31)} `]) {
    assert.equal(cleanEvents({vid, events: []}, NOW), null, `vid ${JSON.stringify(vid)}`);
  }
  for (const events of [undefined, null, {}, 'page_view', 3]) assert.equal(cleanEvents({vid: VID, events}, NOW), null);
  assert.deepEqual(cleanEvents({vid: VID, events: []}, NOW), {vid: VID, events: []});
});

test('cleanEvents drops unknown names, malformed entries and non-number timestamps', () => {
  const out = cleanEvents({vid: VID, events: [
    null, 'spin', 5, ev('hack'), ev('PAGE_VIEW'), {n: 'spin', t: String(NOW)}, {n: 'spin'}, ev('spin'),
  ]}, NOW);
  assert.deepEqual(out.events, [{n: 'spin', t: NOW, p: {}}]);
  for (const n of EVENT_NAMES) assert.equal(cleanEvents({vid: VID, events: [ev(n)]}, NOW).events.length, 1, n);
});

test('cleanEvents keeps late offline events but not future or very old ones', () => {
  const ts = [NOW + 36e5 + 1, NOW + 36e5, NOW - 30 * DAY, NOW - 30 * DAY - 1, NOW - 5 * DAY, NOW + 0.4];
  const out = cleanEvents({vid: VID, events: ts.map((t) => ev('spin', t))}, NOW);
  assert.deepEqual(out.events.map((e) => e.t), [NOW + 36e5, NOW - 30 * DAY, NOW - 5 * DAY, NOW]);
  assert.equal(cleanEvents({vid: VID, events: [ev('spin', Infinity), ev('spin', -Infinity)]}, NOW).events.length, 0);
});

test('cleanEvents rejects a NaN timestamp', () => {
  assert.equal(cleanEvents({vid: VID, events: [ev('spin', NaN)]}, NOW).events.length, 0);
});

test('cleanEvents caps a batch at 50 events', () => {
  const events = Array.from({length: 80}, (_, i) => ev('spin', NOW - i));
  const out = cleanEvents({vid: VID, events}, NOW);
  assert.equal(out.events.length, 50);
  assert.equal(out.events.at(-1).t, NOW - 49);
  // The cap applies before filtering: bad events count toward the 50.
  const mixed = [...Array.from({length: 50}, () => ev('bogus')), ev('spin')];
  assert.equal(cleanEvents({vid: VID, events: mixed}, NOW).events.length, 0);
});

test('cleanEvents keeps only a few short, well-formed properties', () => {
  const p = (props) => cleanEvents({vid: VID, events: [ev('quiz_answer', NOW, props)]}, NOW).events[0].p;
  assert.deepEqual(p({a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8}), {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6});
  // Only the first six keys are considered, even if some of them are dropped.
  assert.deepEqual(p({Bad: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7}), {b: 2, c: 3, d: 4, e: 5, f: 6});
  assert.deepEqual(p({Page: 1, 'a-b': 2, a1: 3, '': 4, [`${'x'.repeat(21)}`]: 5, ok_key: 6}), {ok_key: 6});
  assert.deepEqual(p({[`${'y'.repeat(20)}`]: 1}), {[`${'y'.repeat(20)}`]: 1});
  assert.deepEqual(p({s: 'z'.repeat(100)}), {s: 'z'.repeat(40)});
  assert.deepEqual(p({n: NaN, i: Infinity, j: -Infinity, ok: 1.5}), {ok: 1.5});
  assert.deepEqual(p({o: {x: 1}, a: [1], nul: null, u: undefined, t: true, f: false}), {t: true, f: false});
  assert.deepEqual(p('nope'), {});
  assert.deepEqual(cleanEvents({vid: VID, events: [ev('spin')]}, NOW).events[0].p, {});
});

// ---------- SQL against a real SQLite ----------

let DatabaseSync = null, sqliteError = '';
try {
  ({DatabaseSync} = await import('node:sqlite'));
} catch (e) {
  sqliteError = `node:sqlite unavailable in ${process.version}: ${e.message}`;
}

function freshDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(EVENTS_SQL);
  db.exec(EVENTS_INDEX_SQL);
  db.exec(WAITLIST_SQL);
  // Run twice: IF NOT EXISTS should make setup idempotent.
  db.exec(EVENTS_SQL); db.exec(EVENTS_INDEX_SQL); db.exec(WAITLIST_SQL);
  return db;
}
// Same path as the server: cleanEvents, then props stored as JSON.stringify(e.p || {}).
function store(db, vid, events, now = NOW) {
  const data = cleanEvents({vid, events}, now);
  assert.ok(data, 'events should be accepted');
  // Same as the server: INSERT OR IGNORE keyed by (vid, event ID), with a random ID when none was sent.
  const insert = db.prepare('INSERT OR IGNORE INTO analytics (vid,eid,name,at,props,received) VALUES (?,?,?,?,?,?)');
  for (const e of data.events) insert.run(data.vid, e.i || randomUUID().replaceAll('-', ''), e.n, e.t, JSON.stringify(e.p || {}), now);
  return data.events.length;
}
const plain = (row) => (row ? {...row} : row);
const vid = (c) => c.repeat(32);

test('json_extract on stored JSON true compares equal to 1', (t) => {
  if (!DatabaseSync) return t.skip(sqliteError);
  const db = freshDb();
  store(db, vid('a'), [ev('quiz_answer', NOW, {correct: true}), ev('quiz_answer', NOW, {correct: false})]);
  const rows = db.prepare("SELECT props, json_extract(props,'$.correct')=1 AS m FROM analytics ORDER BY id").all().map(plain);
  assert.deepEqual(rows, [{props: '{"correct":true}', m: 1}, {props: '{"correct":false}', m: 0}]);
});

test('totals counts visitors, answers, correct answers and offline events', (t) => {
  if (!DatabaseSync) return t.skip(sqliteError);
  const db = freshDb();
  const since = NOW - 7 * DAY;
  store(db, vid('a'), [
    ev('page_view', NOW - DAY, {page: 'landing'}), ev('play_start', NOW - DAY), ev('spin', NOW - DAY), ev('spin', NOW - DAY + 1),
    ev('quiz_answer', NOW - DAY, {correct: true}), ev('quiz_answer', NOW - DAY, {correct: false}),
    ev('quiz_answer', NOW - DAY, {correct: true, offline: true}), ev('career_complete', NOW - DAY),
  ]);
  store(db, vid('b'), [
    ev('page_view', NOW - 2 * DAY, {page: 'landing'}), ev('page_view', NOW - 2 * DAY, {page: 'landing'}),
    ev('offline_open', NOW - 2 * DAY, {offline: true}), ev('spin', NOW - 2 * DAY, {offline: true}),
    ev('quiz_answer', NOW - 2 * DAY, {correct: 1}), ev('quiz_answer', NOW - 2 * DAY, {correct: 'true'}),
  ]);
  store(db, vid('c'), [ev('page_view', NOW - 3 * DAY, {page: 'play'}), ev('restart', NOW - 3 * DAY, {offline: false})]);
  // Outside the window: must not be counted.
  store(db, vid('d'), [ev('play_start', NOW - 10 * DAY), ev('quiz_answer', NOW - 10 * DAY, {correct: true, offline: true})]);

  const totals = plain(db.prepare(STATS_QUERIES.totals).get(since));
  assert.deepEqual(totals, {
    visitors: 3, landing_visitors: 2, players: 1, spins: 3, answers: 5,
    correct: 3, // a: two true; b: numeric 1 also matches. The string 'true' does not.
    careers_completed: 1, offline_events: 3, offline_visitors: 2,
  });
  // All-time window includes visitor d.
  const all = plain(db.prepare(STATS_QUERIES.totals).get(0));
  assert.equal(all.visitors, 4);
  assert.equal(all.correct, 4);
  assert.equal(all.offline_events, 4);
});

test('totals on an empty table returns zero visitors and null sums', (t) => {
  if (!DatabaseSync) return t.skip(sqliteError);
  const totals = plain(freshDb().prepare(STATS_QUERIES.totals).get(0));
  assert.equal(totals.visitors, 0);
  assert.equal(totals.answers, null);
});

test('daily groups by UTC day', (t) => {
  if (!DatabaseSync) return t.skip(sqliteError);
  const db = freshDb();
  const d1 = Date.UTC(2026, 10, 14, 0, 0, 0), d2 = Date.UTC(2026, 10, 15, 23, 59, 59);
  store(db, vid('a'), [ev('page_view', d1), ev('play_start', d1 + 1000), ev('quiz_answer', d1 + 2000), ev('quiz_answer', d2)]);
  store(db, vid('b'), [ev('page_view', d1 - 1), ev('spin', d2), ev('quiz_answer', d2)]);
  store(db, vid('c'), [ev('page_view', d2)]);
  const rows = db.prepare(STATS_QUERIES.daily).all(d1 - DAY).map(plain);
  assert.deepEqual(rows, [
    {day: '2026-11-13', visitors: 1, players: 0, answers: 0},
    {day: '2026-11-14', visitors: 1, players: 1, answers: 1},
    {day: '2026-11-15', visitors: 3, players: 1, answers: 2},
  ]);
  assert.deepEqual(db.prepare(STATS_QUERIES.daily).all(d1).map((r) => r.day), ['2026-11-14', '2026-11-15']);
});

test('retention computes day-1 and day-7 eligibility and returns', (t) => {
  if (!DatabaseSync) return t.skip(sqliteError);
  const db = freshDb();
  // Store each visitor relative to its own timestamps; cleanEvents uses `now` = the latest event so old ones pass.
  const put = (c, events) => store(db, vid(c), events, NOW);
  put('a', [ev('play_start', NOW - 10 * DAY), ev('spin', NOW - 2 * DAY)]); // d1 ret, d7 ret
  put('b', [ev('play_start', NOW - 10 * DAY), ev('page_view', NOW - 10 * DAY + 3600e3)]); // d1 & d7 eligible, not returned
  put('c', [ev('spin', NOW - 3 * DAY), ev('page_view', NOW - 3 * DAY + DAY)]); // spins but no first-play event: not in the cohort
  put('9', [ev('play_start', NOW - 10 * DAY, {existing: true}), ev('spin', NOW)]); // had a career before analytics: excluded
  put('d', [ev('play_start', NOW - DAY / 2), ev('spin', NOW)]); // too new for d1
  put('e', [ev('page_view', NOW - 20 * DAY), ev('page_view', NOW)]); // never played: excluded
  put('f', [ev('page_view', NOW - 9 * DAY), ev('play_start', NOW - 8 * DAY), ev('spin', NOW - DAY / 2)]); // t0 is first play, d1 & d7 returned
  const r = plain(db.prepare(STATS_QUERIES.retention).get(NOW));
  assert.deepEqual(r, {d1_eligible: 3, d1_returned: 2, d7_eligible: 3, d7_returned: 2});
  // The current time parameter shifts eligibility.
  const earlier = plain(db.prepare(STATS_QUERIES.retention).get(NOW - 5 * DAY));
  assert.equal(earlier.d1_eligible, 3);
  assert.equal(earlier.d7_eligible, 0);
});

test('waitlist and sources aggregate signups', (t) => {
  if (!DatabaseSync) return t.skip(sqliteError);
  const db = freshDb();
  const insert = db.prepare('INSERT OR IGNORE INTO waitlist (id,email,learning_for,role,source,remove_hash,created) VALUES (?,?,?,?,?,?,?)');
  const signups = [
    {email: 'A@x.com', learningFor: 'partner', role: 'learner', source: 'reddit'},
    {email: 'b@x.com', learningFor: 'family', role: 'teacher', source: 'reddit'},
    {email: 'c@x.com', learningFor: 'myself', role: 'learner', source: ''},
    {email: 'd@x.com', learningFor: 'partner', role: 'teacher', source: 'tiktok<script>'},
    {email: 'e@x.com', learningFor: 'partner', role: 'learner', source: 'reddit'},
    {email: 'a@x.com ', learningFor: 'family', role: 'learner', source: 'dupe'}, // duplicate after normalising
  ];
  signups.forEach((s, i) => {
    const e = parseSignup(s);
    assert.ok(!('error' in e), JSON.stringify(e));
    insert.run(`id${i}`, e.email, e.learningFor, e.role, e.source, 'h'.repeat(64), NOW);
  });
  assert.deepEqual(plain(db.prepare(STATS_QUERIES.waitlist).get()), {total: 5, teachers: 2, for_partner: 3, for_family: 1, for_self: 1});
  const rows = db.prepare(STATS_QUERIES.sources).all().map(plain);
  assert.deepEqual(rows[0], {source: 'reddit', signups: 3});
  // Tied rows have no defined order, so compare them sorted.
  assert.deepEqual(rows.slice(1).sort((a, b) => a.source.localeCompare(b.source)), [
    {source: '(direct)', signups: 1},
    {source: 'tiktokscript', signups: 1},
  ]);
});

test('sources lists at most 10 sources, busiest first', (t) => {
  if (!DatabaseSync) return t.skip(sqliteError);
  const db = freshDb();
  const insert = db.prepare('INSERT INTO waitlist (id,email,learning_for,role,source,remove_hash,created) VALUES (?,?,?,?,?,?,?)');
  let i = 0;
  for (let s = 0; s < 12; s++) for (let k = 0; k <= s; k++) insert.run(`id${i}`, `u${i++}@x.com`, 'myself', 'learner', `src${s}`, 'h', NOW);
  const rows = db.prepare(STATS_QUERIES.sources).all().map(plain);
  assert.equal(rows.length, 10);
  assert.deepEqual(rows[0], {source: 'src11', signups: 12});
  assert.deepEqual(rows.at(-1), {source: 'src2', signups: 3});
});

test('a batch sent twice (two tabs, a retry) is stored once', async (t) => {
  if (!DatabaseSync) return t.skip(sqliteError);
  const db = freshDb();
  const batch = [{i: 'aaaaaaaa1', n: 'spin', t: NOW, p: {}}, {i: 'aaaaaaaa2', n: 'spin', t: NOW, p: {}}];
  store(db, vid('a'), batch);
  store(db, vid('a'), batch);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM analytics').get().n, 2);
});
