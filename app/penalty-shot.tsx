'use client';
// The penalty shot after a wrong Tagalog answer. Each shot is one of two mini-games, picked at random:
// - Target practice: the keeper slides across the goal with a target on his chest; shoot when it crosses
//   the crosshair. Dead centre saves the score, his body costs 100 XP, a miss costs 200.
// - Kick it in: an aim marker sweeps along the goal while the keeper moves. A top corner saves the score,
//   any other goal costs 100 XP, and a save (or the keeper being there) costs 200.
import { useEffect, useRef, useState } from 'react';

type Result = 'bullseye' | 'hit' | 'miss';
type Game = 'target' | 'kick';
// The keeper is drawn on a 110×80 art grid; his chest centre is column 55, row 36; torso and forearms span columns 37–72.
const SCALE = 1.5, KEEPER_W = 110 * SCALE, KEEPER_H = 80 * SCALE, CHEST_X = 55 * SCALE, CHEST_Y = 36 * SCALE;
// Tuned to be hard: a small bullseye, a narrow body, a keeper whose reach covers his forearms, and small corners.
const BULLSEYE = 5, BODY = 14 * SCALE, REACH = 24 * SCALE, CORNER = 16;
export const SHOT_LABEL: Record<Result, string> = { bullseye: 'BULLSEYE! Score saved', hit: 'Hit him. −100 XP', miss: 'Missed! −200 XP' };
const KICK_LABEL: Record<Result, string> = { bullseye: 'TOP CORNER! Score saved', hit: 'Goal, but not the corner. −100 XP', miss: 'Saved! −200 XP' };

/** The keeper in a red Man United–style kit: red shirt, white shorts, black socks. */
export function Keeper({ width = KEEPER_W, className = '' }: { width?: number; className?: string }) {
  const skin = '#d89a6a', red = '#da291c', dark = '#a51d14', ink = '#1b1a2a';
  return (
    <svg className={className} width={width} height={(width * 80) / 110} viewBox="0 0 110 80" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="46" y="6" width="18" height="6" fill={ink} />
      <rect x="46" y="12" width="18" height="12" fill={skin} />
      <rect x="51" y="16" width="2" height="2" fill={ink} /><rect x="57" y="16" width="2" height="2" fill={ink} />
      <rect x="10" y="26" width="27" height="6" fill={skin} /><rect x="73" y="26" width="27" height="6" fill={skin} />
      <rect x="37" y="26" width="36" height="6" fill={red} />
      <rect x="37" y="32" width="6" height="10" fill={skin} /><rect x="67" y="32" width="6" height="10" fill={skin} />
      <rect x="43" y="24" width="24" height="21" fill={red} /><rect x="43" y="24" width="24" height="2" fill="#ffffff" />
      <rect x="43" y="40" width="24" height="5" fill={dark} /><rect x="61" y="28" width="3" height="4" fill="#ffd86a" />
      <rect x="45" y="45" width="20" height="9" fill="#ffffff" />
      <rect x="46" y="54" width="6" height="5" fill={skin} /><rect x="58" y="54" width="6" height="5" fill={skin} />
      <rect x="46" y="59" width="6" height="7" fill={ink} /><rect x="58" y="59" width="6" height="7" fill={ink} />
      <rect x="43" y="66" width="9" height="3" fill="#ffffff" /><rect x="58" y="66" width="9" height="3" fill="#ffffff" />
    </svg>
  );
}


export default function PenaltyShot({ onShot, disabled, slow }: { onShot: (r: Result) => void; disabled?: boolean; slow?: boolean }) {
  const [game] = useState<Game>(() => (Math.random() < 0.5 ? 'target' : 'kick'));
  const track = useRef<HTMLDivElement>(null), keeper = useRef<HTMLDivElement>(null), aim = useRef<HTMLDivElement>(null), frame = useRef(0);
  const kx = useRef(0), ax = useRef(0);
  const [result, setResult] = useState<Result | null>(null), [ballX, setBallX] = useState<number | null>(null);
  useEffect(() => {
    const el = track.current;
    if (!el || result) return;
    const pace = slow ? 0.5 : 1;
    let last = 0, t = 0, dir = 1, nextFlip = 0.8 + Math.random(), aimDir = 1;
    kx.current = Math.random() * Math.max(40, el.clientWidth - KEEPER_W);
    ax.current = 14;
    const step = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now; t += dt;
      const w = el.clientWidth, range = Math.max(40, w - KEEPER_W);
      if (game === 'target') {
        // Uneven speed and random turns, so the timing can't be learned.
        const speed = 240 * pace * (0.55 + 0.9 * Math.abs(Math.sin(t * 2.3)));
        if (t > nextFlip) { dir = -dir; nextFlip = t + 0.5 + Math.random() * 1.2; }
        kx.current += dir * speed * dt;
      } else {
        // The aim sweeps fast; the keeper chases it with a lag, so the corners are open only briefly.
        ax.current += aimDir * 300 * pace * dt;
        if (ax.current > w - 14) { ax.current = w - 14; aimDir = -1; }
        if (ax.current < 14) { ax.current = 14; aimDir = 1; }
        const want = ax.current - CHEST_X, gap = want - kx.current;
        kx.current += Math.sign(gap) * Math.min(Math.abs(gap), 210 * pace * dt);
        if (aim.current) aim.current.style.transform = `translateX(${Math.round(ax.current)}px)`;
      }
      if (kx.current < 0) { kx.current = 0; dir = 1; }
      if (kx.current > range) { kx.current = range; dir = -1; }
      if (keeper.current) keeper.current.style.transform = `translateX(${Math.round(kx.current)}px)`;
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [result, slow, game]);

  function shoot() {
    const el = track.current;
    if (!el || result || disabled) return;
    cancelAnimationFrame(frame.current);
    const w = el.clientWidth, chest = kx.current + CHEST_X;
    let r: Result, landed: number;
    if (game === 'target') {
      const offset = Math.abs(chest - w / 2);
      r = offset <= BULLSEYE ? 'bullseye' : offset <= BODY ? 'hit' : 'miss';
      landed = w / 2;
    } else {
      landed = ax.current;
      const saved = Math.abs(landed - chest) <= REACH;
      const corner = landed <= CORNER + 8 || landed >= w - CORNER - 8; // inside a corner box
      r = saved ? 'miss' : corner ? 'bullseye' : 'hit';
    }
    setBallX(landed); setResult(r);
    setTimeout(() => onShot(r), 1400);
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); shoot(); } };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const labels = game === 'target' ? SHOT_LABEL : KICK_LABEL;
  return (
    <div className={`shot shot-${game}`}>
      <p className="shot-title"><span>MALI!</span>{game === 'target' ? ' Target practice: hit the bullseye on his chest to save your score.' : ' Kick it in: aim for a top corner to save your score.'}</p>
      <div className="shot-range" ref={track} onClick={shoot} role="presentation">
        <div className="shot-net" />
        {game === 'kick' && <><div className="shot-corner left" /><div className="shot-corner right" /></>}
        <div className="shot-keeper" ref={keeper} style={{ width: KEEPER_W, height: KEEPER_H }}>
          <Keeper />
          {game === 'target' && <svg className="shot-target" style={{ left: CHEST_X - 13, top: CHEST_Y - 13 }} width="26" height="26" viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden="true">
            <path d="M3 0h4v1h2v2h1v4H9v2H7v1H3V9H1V7H0V3h1V1h2Z" fill="#1b1a2a" /><path d="M3 2h4v1h1v4H7v1H3V7H2V3h1Z" fill="#ffc83d" /><path d="M4 3h2v1h1v2H6v1H4V6H3V4h1Z" fill="#1b1a2a" /><path d="M4 4h2v2H4Z" fill="#ffffff" />
          </svg>}
        </div>
        {game === 'target' ? <div className="shot-cross" aria-hidden="true" /> : !result && <div className="shot-aim" ref={aim} aria-hidden="true" />}
        {result && ballX !== null && <div className={`shot-ball ${game}`} style={{ left: ballX - 10 }} aria-hidden="true" />}
      </div>
      {result
        ? <p className={`shot-result ${result}`} role="status">{labels[result]}</p>
        : <button className="game-cta" onClick={shoot} disabled={disabled}>{game === 'target' ? 'SHOOT' : 'KICK'}</button>}
      <p className="shot-help">{game === 'target' ? 'Bullseye: no XP lost · His body: −100 XP · Miss: −200 XP' : 'Top corner: no XP lost · Other goal: −100 XP · Saved: −200 XP'}</p>
    </div>
  );
}
