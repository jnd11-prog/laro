// Kuya Coach's Taglish commentary. Lines are chosen from the round number, so a
// reload shows the same line instead of a new random one.
type Moment = {
  spins: number;
  complete: boolean;
  questionId?: string;
  result?: { awardId?: string } | null;
  pending?: { solved: boolean; tries: number; training?: unknown } | null;
};

const LINES = {
  play: ['Spin na, Hyung!', 'Kaya mo ’yan, idol.', 'Laban lang, Hyung!', 'Focus lang. One more spin.', 'Galingan mo, ha!'],
  stat: ['Training time. Pagpawisan mo ’yan, Hyung.', 'Show me what you got, idol.'],
  checkpoint: ['Tagalog time! Bawal ang kopya.', 'Game ka na? Tagalog muna.'],
  wildcard: ['Bahala na si Batman. Draw na, Hyung!', 'Good luck, idol. Dasal lang.'],
  trophy: ['Ayun! Dagdag trophy!', 'Grabe ka, Hyung! Champion!'],
  result: ['Ayos! Next na.', 'Okay ’yan, Hyung.', 'Sige, tuloy lang.'],
  quiz: ['Chill lang, Hyung. Isip muna.', 'Walang timer, idol. Take your time.'],
  miss: ['Sayang! Try ulit, kaya mo ’yan.', 'Muntik na! One more, Hyung.'],
  goal: ['Ayun! Ang galing mo!', 'GOAL! Pasado ka kay Tita, Hyung!'],
  rebound: ['Rebound! Pasok pa rin.', 'Nakabawi ka, idol!'],
  done: ['Ang galing mo, idol. One more?', 'Legend ka na, Hyung.'],
};

const pick = (lines: string[], spins: number) => lines[spins % lines.length];

export function coachLine({ spins, complete, questionId, result, pending }: Moment): string {
  if (pending?.solved) return pick(pending.tries === 1 ? LINES.goal : LINES.rebound, spins);
  if (pending) return pick(pending.tries ? LINES.miss : LINES.quiz, spins);
  if (complete) return pick(LINES.done, spins);
  if (result) return pick(result.awardId ? LINES.trophy : LINES.result, spins);
  if (questionId === 'wildcard') return pick(LINES.wildcard, spins);
  if (questionId === 'phrase') return pick(LINES.checkpoint, spins);
  if (questionId && /^stat[0-5]$/.test(questionId)) return pick(LINES.stat, spins);
  return pick(LINES.play, spins);
}
