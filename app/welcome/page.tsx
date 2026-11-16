import type { Metadata } from 'next';
import { CATALOG } from '@/lib/catalog';
import { Jersey, PixelBall, PixelHeart, PixelTrophy } from '../art';
import PixelWorld from './pixel-world';
import WaitlistForm from './waitlist-form';
import TrackView from './track-view';
import './welcome.css';

export const metadata: Metadata = {
  title: 'Laro — learn Tagalog through play',
  description: 'A pixel-art football career game where every big moment is a Tagalog lesson, recorded by the person you are learning it for. Join the waitlist.',
};

// Real phrases from the game's built-in catalog, one from each kind of conversation.
const SAMPLES = ['galing', 'miss', 'tara', 'kilig', 'okay', 'ano']
  .map((id) => CATALOG.find((p) => p.id === id))
  .filter((p): p is (typeof CATALOG)[number] => !!p);

const STAGES = [
  { n: 1, icon: <PixelHeart size={44} />, title: 'They teach', body: 'Your partner, your lola or your tita adds the phrases they actually say, recorded in their own voice.' },
  { n: 2, icon: <PixelBall size={44} />, title: 'You play', body: 'Spin your way through a football career: clubs, trophies, transfers and the odd plot twist.' },
  { n: 3, icon: <PixelTrophy size={44} />, title: 'Tagalog wins', body: 'Every big moment is a quick Tagalog question. Get it right and your player gets better.' },
];

export default function Welcome() {
  return (
    <div className="welcome">
      <TrackView page="landing" />

      <section className="w-hero">
        <PixelWorld mode="day" parols />
        <header className="w-nav">
          <a className="w-brand" href="/"><PixelBall size={22} />LARO</a>
          <a className="w-nav-link" href="/play">Play the demo ▸</a>
        </header>
        <div className="w-title">
          <p className="w-chip">TAGALOG THROUGH PLAY</p>
          <h1><span className="w-logo">LARO</span><span className="w-tagline">Learn your partner’s language by playing a game.</span></h1>
          <a className="w-start-link" href="#start">▸ PRESS START</a>
        </div>
      </section>

      <div className="w-dialog w-intro" id="start">
        <span className="w-dialog-name">HOW IT STARTS</span>
        <p className="w-lede">
          Laro is a pixel-art football career game where every big moment is a Tagalog lesson. The phrases can be recorded by the person
          you’re learning for, so you learn the Tagalog they actually speak.
        </p>
        <WaitlistForm compact />
      </div>

      <section className="w-band w-stages" aria-labelledby="how">
        <h2 id="how" className="w-heading"><span>STAGE SELECT</span>How it works</h2>
        <ol>
          {STAGES.map((s) => (
            <li key={s.n} className="w-card">
              <span className="w-stage-n">STAGE {s.n}</span>
              <div className="w-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="w-band w-phrases" aria-labelledby="learn">
        <h2 id="learn" className="w-heading"><span>PHRASEBOOK</span>The Tagalog people actually say</h2>
        <p className="w-section-lede">Not textbook sentences. The lambing, the group chat and the dinner table, with every word explained.</p>
        <ul>
          {SAMPLES.map((p) => (
            <li key={p.id} className="w-bubble">
              <span className="w-tag">{p.category === 'Barkada' ? 'Group chat' : p.category}</span>
              <b lang="tl">{p.phrase}</b>
              <span>{p.meaning}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="w-band w-story" aria-labelledby="why">
        <h2 id="why" className="w-heading"><span>STORY MODE</span>Why we’re building it</h2>
        <div className="w-dialog w-rpg">
          <div className="w-portrait"><Jersey kit="rose" size={72} /></div>
          <div>
            <span className="w-dialog-name">THE FOUNDER</span>
            <p>
              Laro started as a gift: a game a Filipina made so her partner could follow her family’s jokes, her lola’s questions and the
              lambing in between. We think many people learning Tagalog are doing it for someone they love, and that it should feel like
              play, not homework.
            </p>
            <span className="w-more" aria-hidden="true">▼</span>
          </div>
        </div>
      </section>

      <section className="w-night" aria-labelledby="join-title">
        <PixelWorld mode="night" fireworks />
        <div className="w-dialog w-join" id="join">
          <span className="w-dialog-name">PLAYER 2, JOIN IN</span>
          <h2 id="join-title">Be one of the first to play</h2>
          <p className="w-section-lede">We’re inviting a small group of couples and families to the beta.</p>
          <WaitlistForm />
        </div>
      </section>

      <footer className="w-footer">
        <span className="w-brand"><PixelBall size={18} />LARO</span>
        <span>© 2026 Laro. Made with lambing.</span>
      </footer>
    </div>
  );
}
