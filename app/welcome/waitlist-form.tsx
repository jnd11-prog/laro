'use client';
import { useEffect, useId, useState } from 'react';
import { track } from '../track';

const FOR = [['partner', 'My partner'], ['family', 'My family'], ['myself', 'Myself']] as const;
const ROLE = [['learner', 'I’m learning'], ['teacher', 'I speak it and would teach']] as const;

/** The waitlist form. `compact` shows only the email field until someone starts typing. */
export default function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [learningFor, setLearningFor] = useState('');
  const [role, setRole] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'removed'>('idle');
  const [error, setError] = useState('');
  const [removeToken, setRemoveToken] = useState<string | null>(null);
  const [source, setSource] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    setSource(q.get('ref') || q.get('utm_source') || '');
  }, []);
  const open = !compact || email.length > 0;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!learningFor || !role) { setError(!learningFor ? 'Tell us who you’re learning for.' : 'Tell us if you’d be learning or teaching.'); return; }
    setState('sending'); setError('');
    try {
      const website = String(new FormData(e.currentTarget).get('website') || '');
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, learningFor, role, source, website }) });
      const data = await res.json() as { error?: string; removeToken?: string | null };
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
      setRemoveToken(data.removeToken || null); setState('done'); track('waitlist_join', { for: learningFor, role, source: source || 'direct' });
    } catch (err) { setError((err as Error).message); setState('idle'); }
  }
  async function remove() {
    if (!removeToken) return;
    await fetch('/api/waitlist/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: removeToken }) }).catch(() => null);
    setState('removed');
  }
  async function share() {
    const url = `${location.origin}/?ref=share`;
    try {
      if (navigator.share) await navigator.share({ title: 'Laro', text: 'Learn Tagalog by playing a football career game', url });
      else { await navigator.clipboard.writeText(url); setCopied(true); }
    } catch { /* The visitor closed the share sheet. */ }
  }

  if (state === 'removed') return <div className="w-done" role="status"><b>You’re off the list.</b><p>We deleted your email. Thanks for taking a look.</p></div>;
  if (state === 'done') return (
    <div className="w-done" role="status">
      <b>You’re on the list. Salamat!</b>
      <p>We’ll email you when your beta invite is ready. Know someone who’d play it?</p>
      <div className="w-done-actions">
        <button type="button" className="w-button" onClick={share}>{copied ? 'Link copied' : 'Share Laro'}</button>
        <a className="w-link" href="/play">Play the demo now</a>
      </div>
      {removeToken && <button type="button" className="w-remove" onClick={remove}>Changed your mind? Remove my email</button>}
    </div>
  );

  return (
    <form className={`w-form ${open ? 'open' : ''}`} onSubmit={submit} noValidate>
      <div className="w-email-row">
        <label className="w-sr" htmlFor={`${id}-email`}>Email address</label>
        <input id={`${id}-email`} type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {!open && <button type="button" className="w-button" onClick={() => document.getElementById(`${id}-email`)?.focus()}>Join the waitlist</button>}
      </div>
      {open && <>
        <fieldset className="w-choices">
          <legend>Who are you learning Tagalog for?</legend>
          <div>{FOR.map(([v, l]) => <label key={v} className={learningFor === v ? 'on' : ''}><input type="radio" name={`${id}-for`} value={v} checked={learningFor === v} onChange={() => setLearningFor(v)} />{l}</label>)}</div>
        </fieldset>
        <fieldset className="w-choices">
          <legend>Which side are you on?</legend>
          <div>{ROLE.map(([v, l]) => <label key={v} className={role === v ? 'on' : ''}><input type="radio" name={`${id}-role`} value={v} checked={role === v} onChange={() => setRole(v)} />{l}</label>)}</div>
        </fieldset>
        <input className="w-trap" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button className="w-button w-submit" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Joining…' : 'Join the waitlist'}</button>
      </>}
      {error && <p className="w-error" role="alert">{error}</p>}
      <p className="w-privacy">We’ll only email you about the Laro beta, and never sell or share your address. You can remove it right after joining, and every email we send will let you leave the list.</p>
    </form>
  );
}
