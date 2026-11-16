'use client';
// Client side of the analytics: events go into a small queue in localStorage and are sent in batches.
// When the device is offline they wait in the queue (marked offline) and are sent once it reconnects.
// Each event has its own ID: sent events are removed by ID (so two tabs never drop each other's events),
// and the server stores each ID once (so a batch sent twice is not counted twice).
import type { EventName, TrackedEvent } from '@/lib/analytics';

const QUEUE = 'laro-events', VID = 'laro-vid', MAX = 400;
const read = (): TrackedEvent[] => { try { return JSON.parse(localStorage.getItem(QUEUE) || '[]'); } catch { return []; } };
const write = (q: TrackedEvent[]) => { try { localStorage.setItem(QUEUE, JSON.stringify(q.slice(-MAX))); } catch { /* storage full or blocked */ } };
function visitor() {
  try {
    let v = localStorage.getItem(VID);
    if (!v) { v = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join(''); localStorage.setItem(VID, v); }
    return v;
  } catch { return null; }
}

let timer: ReturnType<typeof setTimeout> | null = null, sending = false;
export function track(n: EventName, p: Record<string, string | number | boolean> = {}) {
  if (typeof window === 'undefined') return;
  const i = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');
  write([...read(), { i, n, t: Date.now(), p: navigator.onLine ? p : { ...p, offline: true } }]);
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 2000);
}
export async function flush(beacon = false) {
  if (typeof window === 'undefined' || sending || !navigator.onLine) return;
  const vid = visitor(), batch = read().slice(0, 50);
  if (!vid || !batch.length) return;
  const body = JSON.stringify({ vid, events: batch });
  sending = true;
  try {
    const ok = beacon && navigator.sendBeacon
      ? navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }))
      : (await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })).ok;
    if (ok) { const sent = new Set(batch.map((e) => e.i)); write(read().filter((e) => !sent.has(e.i))); if (read().length && !beacon) setTimeout(flush, 500); }
  } catch { /* still offline or the request failed; the queue keeps the events */ } finally { sending = false; }
}
let started = false;
/** Sends queued events when the device comes back online or the page is hidden. */
export function startTracking() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('online', () => void flush());
  document.addEventListener('visibilitychange', () => { if (document.hidden) void flush(true); });
  void flush();
}
