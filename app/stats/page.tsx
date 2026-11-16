'use client';
// Founder dashboard. Only aggregate numbers, and only with the STATS_KEY secret. The key is read from
// the address's #key=… part, which browsers never send to the server, then kept for this tab only.
import { useEffect, useState } from 'react';
import './stats.css';

type Row = Record<string, number | string | null>;
type Stats = { days: number; totals: Row; daily: Row[]; retention: Row; waitlist: Row; sources: Row[]; generated: string };
const n = (v: unknown) => Number(v) || 0;
const pct = (a: unknown, b: unknown) => (n(b) ? `${Math.round((n(a) / n(b)) * 100)}%` : '—');

export default function StatsPage() {
  const [key, setKey] = useState('');
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const fromHash = new URLSearchParams(location.hash.slice(1)).get('key');
    if (fromHash) { sessionStorage.setItem('laro-stats-key', fromHash); history.replaceState(null, '', '/stats'); }
    setKey(fromHash || sessionStorage.getItem('laro-stats-key') || '');
  }, []);
  useEffect(() => {
    if (!key) return;
    setError('');
    fetch(`/api/stats?days=${days}`, { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' })
      .then(async (r) => { if (!r.ok) throw new Error(r.status === 404 ? 'That key doesn’t match, or the stats key isn’t set up yet.' : 'Could not load the numbers.'); return r.json() as Promise<Stats>; })
      .then(setData).catch((e) => { setData(null); setError(e.message); });
  }, [key, days]);

  if (!key || (!data && error)) return (
    <main className="stats"><h1>Laro stats</h1>
      <form className="stats-key" onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get('key') || ''); sessionStorage.setItem('laro-stats-key', v); setKey(v); }}>
        <label>Stats key<input name="key" type="password" autoComplete="off" /></label><button>Open</button>
      </form>{error && <p className="stats-error">{error}</p>}</main>
  );
  if (!data) return <main className="stats"><h1>Laro stats</h1><p>Loading…</p></main>;
  const t = data.totals, r = data.retention, w = data.waitlist, peak = Math.max(1, ...data.daily.map((d) => n(d.visitors)));
  const tiles: [string, string, string][] = [
    ['Visitors', String(n(t.visitors)), `${n(t.landing_visitors)} saw the landing page`],
    ['Waitlist', String(n(w.total)), `${pct(w.total, t.landing_visitors)} of landing visitors · all time`],
    ['Players', String(n(t.players)), `${n(t.spins)} spins`],
    ['Quiz answers', String(n(t.answers)), `${pct(t.correct, t.answers)} correct`],
    ['Back after 1 day', pct(r.d1_returned, r.d1_eligible), `${n(r.d1_returned)} of ${n(r.d1_eligible)} players`],
    ['Back after 7 days', pct(r.d7_returned, r.d7_eligible), `${n(r.d7_returned)} of ${n(r.d7_eligible)} players`],
    ['Careers finished', String(n(t.careers_completed)), ''],
    ['Played offline', String(n(t.offline_visitors)), `${n(t.offline_events)} events sent after reconnecting`],
  ];
  return (
    <main className="stats">
      <header><h1>Laro stats</h1>
        <div className="stats-range" role="group" aria-label="Time range">{[7, 30, 90].map((d) => <button key={d} className={d === days ? 'on' : ''} onClick={() => setDays(d)}>{d} days</button>)}</div>
      </header>
      <section className="stats-tiles">{tiles.map(([label, value, note]) => <div key={label}><span>{label}</span><b>{value}</b>{note && <small>{note}</small>}</div>)}</section>
      <section className="stats-panel"><h2>Daily visitors</h2>
        {data.daily.length ? <ol className="stats-bars">{data.daily.map((d) => <li key={String(d.day)} title={`${d.day}: ${d.visitors} visitors, ${d.players} players, ${d.answers} answers`}>
          <i style={{ height: `${(n(d.visitors) / peak) * 100}%` }}><em style={{ height: `${n(d.visitors) ? (n(d.players) / n(d.visitors)) * 100 : 0}%` }} /></i><span>{String(d.day).slice(5)}</span></li>)}</ol> : <p>No visits yet.</p>}
        <p className="stats-legend"><i className="all" />Visitors <i className="play" />Of those, played</p>
      </section>
      <div className="stats-split">
        <section className="stats-panel"><h2>Who’s on the waitlist</h2><table><tbody>
          <tr><td>Learning for a partner</td><td>{n(w.for_partner)}</td></tr><tr><td>For family</td><td>{n(w.for_family)}</td></tr>
          <tr><td>For themselves</td><td>{n(w.for_self)}</td></tr><tr><td>Speak it and would teach</td><td>{n(w.teachers)}</td></tr></tbody></table></section>
        <section className="stats-panel"><h2>Where signups came from</h2>{data.sources.length ? <table><tbody>{data.sources.map((s) => <tr key={String(s.source)}><td>{s.source}</td><td>{n(s.signups)}</td></tr>)}</tbody></table> : <p>No signups yet.</p>}</section>
      </div>
      <p className="stats-foot">Last {data.days} days unless marked all time. Visitors are anonymous device IDs, so one person on two devices counts twice. Updated {new Date(data.generated).toLocaleString()}.</p>
    </main>
  );
}
