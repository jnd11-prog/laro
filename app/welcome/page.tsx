import type { Metadata } from 'next';
import { CATALOG } from '@/lib/catalog';
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

const STEPS = [
  { n: '01', title: 'They teach.', body: 'Your partner, your lola or your tita adds the phrases they actually say, recorded in their own voice.' },
  { n: '02', title: 'You play.', body: 'Spin your way through a football career: clubs, trophies, transfers and the odd plot twist.' },
  { n: '03', title: 'Tagalog wins the match.', body: 'Every big moment is a quick Tagalog question. Get it right and your player gets better.' },
];

export default function Welcome() {
  return (
    <div className="welcome">
      <TrackView page="landing" />
      <header className="w-nav">
        <a className="w-brand" href="/">LARO</a>
        <a className="w-nav-link" href="/play">Play the demo</a>
      </header>

      <section className="w-hero">
        <div className="w-hero-copy">
          <p className="w-kicker">TAGALOG THROUGH PLAY</p>
          <h1>Learn your partner’s language by playing a game.</h1>
          <p className="w-lede">
            Laro is a pixel-art football career game where every big moment is a Tagalog lesson. The phrases can be recorded by the
            person you’re learning for, so you learn the Tagalog they actually speak.
          </p>
          <WaitlistForm compact />
        </div>
        <div className="w-phone" aria-hidden="true">
          <div className="w-screen">
            <img className="w-scene" src="/art/base-day.png" alt="" />
            <img className="w-clouds" src="/art/clouds-day.png" alt="" />
            <img className="w-jeep" src="/art/jeep.png" alt="" />
            <div className="w-quiz">
              <span>Ano ang meaning nito?</span>
              <b>Ang galing mo!</b>
              <i>You’re so good!</i>
              <i className="w-wrong">I miss you.</i>
            </div>
          </div>
        </div>
      </section>

      <section className="w-steps" aria-labelledby="how">
        <h2 id="how">How it works</h2>
        <ol>
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="w-step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="w-phrases" aria-labelledby="learn">
        <h2 id="learn">The Tagalog people actually say</h2>
        <p className="w-section-lede">Not textbook sentences. The lambing, the group chat and the dinner table, with every word explained.</p>
        <ul>
          {SAMPLES.map((p) => (
            <li key={p.id}>
              <span className="w-tag">{p.category === 'Barkada' ? 'Group chat' : p.category}</span>
              <b lang="tl">{p.phrase}</b>
              <span>{p.meaning}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="w-story" aria-labelledby="why">
        <h2 id="why">Why we’re building it</h2>
        <blockquote>
          Laro started as a gift: a game a Filipina made so her partner could follow her family’s jokes, her lola’s questions and the
          lambing in between. We think many people learning Tagalog are doing it for someone they love, and that it should feel like
          play, not homework.
        </blockquote>
      </section>

      <section className="w-join" id="join" aria-labelledby="join-title">
        <h2 id="join-title">Be one of the first to play</h2>
        <p className="w-section-lede">We’re inviting a small group of couples and families to the beta.</p>
        <WaitlistForm />
      </section>

      <footer className="w-footer">
        <span>LARO</span>
        <span>© 2026 Laro. Made with lambing.</span>
      </footer>
    </div>
  );
}
