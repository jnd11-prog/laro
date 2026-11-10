// @ts-nocheck
'use client';
// Recovered from the deployed site's compiled bundle, so local names are short.
import { useEffect, useRef } from 'react';
import { wheelSegments } from '@/lib/wheel';

export function PixelBall({ size: e2 = 32 }) {
    return <svg width={e2} height={e2} viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges" aria-hidden="true"><path d="M5 0h6v1h2v2h2v2h1v6h-1v2h-2v2h-2v1H5v-1H3v-2H1v-2H0V5h1V3h2V1h2Z" fill="#eaf1e4"/><path d="M6 5h4v1h1v4h-1v1H6v-1H5V6h1ZM5 0h6v2H9v1H7V2H5ZM0 5h2v2h1v2H2v2H0ZM14 5h2v6h-2V9h-1V7h1ZM5 14h2v-1h2v1h2v2H5Z" fill="#0a1320"/><path d="M3 2h2v1H4v2H2V3h1ZM11 2h2v1h1v2h-2V3h-1ZM2 11h2v2h1v1H3v-1H2ZM12 11h2v2h-1v1h-2v-1h1Z" fill="#93a29a"/></svg>;
}

export const KIT_COLORS = { lime: `#c5f46d`, blue: `#69c9ff`, rose: `#ff8ba8`, gold: `#ffd86a` };

export function Jersey({ kit: e2 = `lime`, size: t2 = 120 }) {
    return <svg width={t2} height={t2} viewBox="0 0 64 64" shapeRendering="crispEdges" role="img" aria-label={`${e2} number seven jersey`}><path d="M20 8h8v4h8V8h8v4h4v4h4v4h4v12H44v24H20V32H8V20h4v-4h4v-4h4Z" fill="#070c15" transform="translate(0 3)"/><path d="M20 8h8v4h8V8h8v4h4v4h4v4h4v12H44v24H20V32H8V20h4v-4h4v-4h4Z" fill={KIT_COLORS[e2] || KIT_COLORS.lime}/><path d="M20 12h4v40h-4ZM40 12h4v40h-4M8 28h12v4H8ZM44 28h12v4H44Z" fill="#143d35" opacity=".45"/><path d="M28 8v4h8V8h4v8H24V8Z" fill="#10251c"/><path d="M28 24h12v4h-4v4h-4v4h-4v8h-4v-8h4v-4h4v-4h-4Z" fill="#11291d"/><path d="M44 12h4v4h4v4h4v4h-8v-4h-4ZM20 8h8v4h-8Z" fill="#f2ffca" opacity=".6"/><rect x="23" y="19" width="4" height="3" fill="#fffde6"/></svg>;
}

export function PixelHeart({ size: e2 = 24 }) {
    return <svg width={e2} height={e2} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true"><path d="M2 2h4v2h4V2h4v2h2v6h-2v2h-2v2h-2v2H6v-2H4v-2H2v-2H0V4h2Z" fill="#ff8aa9"/><path d="M2 4h4v2H2Z" fill="#ffd1dd"/></svg>;
}

export function PixelTrophy({ size: e2 = 24 }) {
    return <svg width={e2} height={e2} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true"><path d="M4 0h8v2h4v6h-4v2h-2v3h3v3H3v-3h3v-3H4V8H0V2h4ZM2 4v2h2V4Zm10 0v2h2V4Z" fill="#ffd86a"/><path d="M8 1h3v6H8ZM4 14h8v1H4Z" fill="#fff1b3"/></svg>;
}

export const WHEEL = [{ key: `goal`, label: `GOAL!`, color: `#c5f46d`, ink: `#182915`, symbol: `★` }, { key: `training`, label: `TRAINING`, color: `#72bfff`, ink: `#132941`, symbol: `↗` }, { key: `match`, label: `MATCHDAY`, color: `#b5a0ee`, ink: `#28213d`, symbol: `⚑` }, { key: `transfer`, label: `TRANSFER`, color: `#ffd47d`, ink: `#463616`, symbol: `⇄` }, { key: `message`, label: `SHELOMI`, color: `#f69ab1`, ink: `#492230`, symbol: `♥` }, { key: `rest`, label: `RECOVERY`, color: `#7ed7bf`, ink: `#133e33`, symbol: `✦` }];

// One pixel of the wheel: a riveted gold rim around shaded slices.
function wheelPixel(radius, edgeDistance, fromStart, span, x, y, color) {
    const lighten = (c) => c.map((v) => (v + 255) >> 1), darken = (c) => c.map((v) => v * 0.68 | 0), checker = (x + y) % 2 === 0;
    if (radius > 61.4) return [123, 63, 18];
    if (radius > 55.5) return (x + y) % 5 ? [255, 217, 94] : [255, 241, 176];
    if (radius > 53.5) return [168, 98, 22];
    if (radius < 15) return [42, 36, 85];
    if (radius < 17) return [27, 21, 51];
    if (edgeDistance < Math.min(1.6, 42 / radius)) return [27, 21, 51];
    if (radius > 49.5) return darken(color);
    if (fromStart < span * 0.16 && checker) return lighten(color);
    if (fromStart > span * 0.84 && checker) return darken(color);
    return color;
}
export function Wheel({ question: e2, rotation: t2, spinning: n2, onSpin: r2, disabled: i2, reduced: a2, duration: o2 = 2200 }) {
    let s2 = useRef(null), c2 = wheelSegments(e2.options);
    return useEffect(() => {
        let t3 = s2.current?.getContext(`2d`);
        if (!t3 || !e2.options.length)
            return;
        let n3 = t3.createImageData(128, 128), r3 = wheelSegments(e2.options), i3 = (e3) => [parseInt(e3.slice(1, 3), 16), parseInt(e3.slice(3, 5), 16), parseInt(e3.slice(5, 7), 16)];
        for (let t4 = 0; t4 < 128; t4++)
            for (let a3 = 0; a3 < 128; a3++) {
                let o3 = a3 - 63.5, s3 = t4 - 63.5, c3 = Math.sqrt(o3 * o3 + s3 * s3);
                if (c3 > 63)
                    continue;
                let l2 = (Math.atan2(s3, o3) * 180 / Math.PI + 90 + (r3[0]?.offset || 0) + 360) % 360, u2 = r3.find((e3) => l2 < e3.end && e3.span > 0) || r3[r3.length - 1], d2 = Math.min(l2 - u2.start, u2.end - l2), f2 = wheelPixel(c3, d2, l2 - u2.start, u2.span, a3, t4, i3(e2.options[u2.index].color)), p2 = (t4 * 128 + a3) * 4;
                n3.data[p2] = f2[0], n3.data[p2 + 1] = f2[1], n3.data[p2 + 2] = f2[2], n3.data[p2 + 3] = 255;
            }
        t3.putImageData(n3, 0, 0), t3.fillStyle = `#fff7cf`;
        for (let e3 = 0; e3 < 20; e3++) {
            let n4 = e3 * 18 * Math.PI / 180;
            t3.fillRect(Math.round(62.5 + 57.5 * Math.cos(n4)), Math.round(62.5 + 57.5 * Math.sin(n4)), 3, 3);
        }
    }, [e2]), <div className={`wheel-stage ${n2 ? `is-spinning` : ``}`}><svg className="pixel-pointer" width="30" height="24" viewBox="0 0 24 20" shapeRendering="crispEdges" aria-hidden="true"><path d="M0 0h24v4h-4v4h-4v4h-4v4H8v-4H4V8H0Z" fill="#ffe27a"/><path d="M4 0h16v3H4Z" fill="#fff2bf"/></svg><div className="wheel-disc" style={{ transform: `rotate(${t2}deg)`, transitionDuration: a2 ? `0.01s` : `${o2}ms` }}><canvas width="128" height="128" ref={s2} className="pixel-wheel" aria-hidden="true"/><svg viewBox="0 0 400 400" className="wheel-labels" role="img" aria-label={e2.options.filter((e3) => !e3.blocked).map((e3) => e3.label).join(`, `)}>{c2.filter((e3) => e3.span >= 7).map((t3) => {
        let n3 = e2.options[t3.index], r3 = Math.min(24, t3.span * 0.55, Math.max(10, 100 / (n3.label.length * 0.6))), i3 = Math.floor(100 / (r3 * 0.6)), a3 = n3.label.length > i3 ? n3.label.slice(0, i3 - 1) + `…` : n3.label;
        return <text key={n3.id} transform={`rotate(${t3.mid - 90} 200 200)`} x="352" y="200" textAnchor="end" dominantBaseline="central" fontFamily="Pixelify Sans,monospace" fontSize={r3} fill="#1b1533">{a3}</text>;
    })}</svg></div><button onClick={r2} disabled={i2} className="wheel-center" aria-label="Spin career wheel"><PixelBall size={25}/><span>{n2 ? `...` : `SPIN!`}</span></button></div>;
}
