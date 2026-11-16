'use client';
// A wide pixel-art world built from the game's own art. The scene is 195×422 art pixels, so it is
// tiled side by side with every other copy mirrored; mirrored edges meet seamlessly, turning one
// volcano into a range. Layers (clouds, smoke, jeepney, grass) move like they do in the game.
import { PAROL, Sprite } from '../art';

const COPIES = [-3, -2, -1, 0, 1, 2, 3];

export default function PixelWorld({ mode, fireworks = false, parols = false }: { mode: 'day' | 'night'; fireworks?: boolean; parols?: boolean }) {
  return (
    <div className={`pw pw-${mode}`} aria-hidden="true">
      {COPIES.map((k) => (
        <img key={k} className={`pw-base ${k % 2 ? 'mirror' : ''}`} style={{ '--k': k } as React.CSSProperties} src={`/art/base-${mode}.png`} alt="" />
      ))}
      {mode === 'night' && <div className="pw-stars" />}
      <div className="pw-clouds" style={{ backgroundImage: `url(/art/clouds-${mode}.png)` }} />
      <div className="pw-smoke" style={{ backgroundImage: `url(/art/smoke-${mode}.png)` }} />
      {mode === 'day' && <><div className="pw-birds" /><img className="pw-jeep" src="/art/jeep.png" alt="" /></>}
      {parols && <><Sprite {...PAROL} className="pw-parol one" /><Sprite {...PAROL} className="pw-parol two" /><Sprite {...PAROL} className="pw-parol three" /></>}
      {fireworks && <><div className="pw-burst gold" /><div className="pw-burst pink" /><div className="pw-burst mint" /></>}
      <div className="pw-grass" style={{ backgroundImage: `url(/art/grass-${mode}.png)` }} />
    </div>
  );
}
