// Football-culture readings of a career: what fans would call the player, the shirt
// they would wear, the derbies they crossed and how they would be remembered.
// Everything here is derived from the career profile, so saved careers need no changes.
import type { SimProfile } from './player-career';

type Stats = Record<string, number>;
const statsOf = (p: SimProfile): Stats => Object.fromEntries(p.stats.map((s) => [s.key, s.value ?? 0]));
const inches = (height?: string) => {
  const m = /(\d+)'(\d+)/.exec(height || '');
  return m ? Number(m[1]) * 12 + Number(m[2]) : 0;
};

/** The role a fan or scout would give this player. */
export function archetype(p: SimProfile): string {
  const s = statsOf(p), pos = p.position || '', tall = inches(p.height) >= 74;
  switch (pos) {
    case 'GK':
      if (s.passing >= 80) return 'Sweeper keeper';
      if (s.dribbling >= 85) return 'Shot-stopper';
      return 'Old-school keeper';
    case 'CB':
      if (s.passing >= 75) return 'Ball-playing centre-back';
      if (s.strength >= 85 && s.defending >= 80) return 'No-nonsense stopper';
      if (s.pace >= 80) return 'Recovery defender';
      return 'Centre-back';
    case 'RB':
    case 'LB':
      if (s.passing >= 80 && s.dribbling >= 70) return 'Inverted full-back';
      if (s.pace >= 80) return 'Overlapping wing-back';
      if (s.defending >= 80) return 'Defensive full-back';
      return 'Full-back';
    case 'CDM':
      if (s.passing >= 85) return 'Regista';
      if (s.defending >= 85 && s.strength >= 75) return 'Destroyer';
      return 'Anchor';
    case 'CM':
      if (s.passing >= 85 && s.dribbling >= 80) return 'Deep-lying playmaker';
      if (s.dribbling >= 80) return 'Mezzala';
      if (s.passing >= 85) return 'Metronome';
      return 'Box-to-box midfielder';
    case 'CAM':
      if (s.dribbling >= 85 && s.passing >= 85) return 'Trequartista';
      if (s.shooting >= 80) return 'Shadow striker';
      return 'Number 10';
    case 'RM':
    case 'LM':
    case 'RW':
    case 'LW': {
      const wide = pos[0];
      if (s.shooting >= 80 && s.dribbling < 60 && s.pace < 70) return 'Raumdeuter';
      if ((wide === 'R' && p.foot === 'Left') || (wide === 'L' && p.foot === 'Right')) return 'Inverted winger';
      if (pos.endsWith('M') && s.passing >= 80) return 'Wide playmaker';
      if (s.pace >= 85) return 'Touchline winger';
      return pos.endsWith('W') ? 'Traditional winger' : 'Wide midfielder';
    }
    case 'ST':
      if (s.passing >= 80 && s.dribbling >= 75) return 'False 9';
      if (s.strength >= 80 && tall) return 'Target man';
      if (s.shooting >= 90) return 'Fox in the box';
      if (s.pace >= 85) return 'Channel runner';
      if (Math.min(s.pace, s.shooting, s.dribbling, s.strength) >= 75) return 'Complete forward';
      return 'Striker';
    default:
      return 'Player';
  }
}

/** The shirt number tradition gives the position; the best attackers take the 10. */
export function shirtNumber(p: SimProfile): number {
  const pos = p.position || '';
  if (['CAM', 'RW', 'LW', 'ST'].includes(pos) && p.overall >= 90) return 10;
  return ({ GK: 1, RB: 2, LB: 3, CB: p.foot === 'Left' ? 5 : 4, CDM: 6, CM: 8, CAM: 10, RM: 7, RW: 7, LM: 11, LW: 11, ST: 9 } as Record<string, number>)[pos] ?? 14;
}

// Club names from both question sets, folded to one spelling.
const ALIAS: Record<string, string> = { Atletico: 'Atlético Madrid', Bilbao: 'Athletic Club', Betis: 'Real Betis', Sporting: 'Sporting CP' };
const DERBIES: [string, string, string][] = [
  ['Barcelona', 'Real Madrid', 'El Clásico'],
  ['Real Madrid', 'Atlético Madrid', 'the Madrid derby'],
  ['Sevilla', 'Real Betis', 'El Gran Derbi'],
  ['Athletic Club', 'Real Sociedad', 'the Basque derby'],
  ['Arsenal', 'Tottenham', 'the North London derby'],
  ['Liverpool', 'Everton', 'the Merseyside derby'],
  ['Man City', 'Man United', 'the Manchester derby'],
  ['Liverpool', 'Man United', 'the North West derby'],
  ['Inter', 'AC Milan', 'the Derby della Madonnina'],
  ['Inter', 'Juventus', "the Derby d'Italia"],
  ['Roma', 'Lazio', 'the Derby della Capitale'],
  ['Bayern Munich', 'Dortmund', 'Der Klassiker'],
  ['PSG', 'Marseille', 'Le Classique'],
  ['Ajax', 'Feyenoord', 'De Klassieker'],
  ['Benfica', 'Porto', 'O Clássico'],
  ['Benfica', 'Sporting CP', 'the Lisbon derby'],
  ['Celtic', 'Rangers', 'the Old Firm'],
  ['NYCFC', 'NY Red Bulls', 'the Hudson River derby'],
  ['LA Galaxy', 'LAFC', 'El Tráfico'],
  ['Al-Hilal', 'Al-Nassr', 'the Riyadh derby'],
  ['Club América', 'Chivas', 'El Súper Clásico'],
  ['Tigres', 'Monterrey', 'El Clásico Regio'],
  ['Boca Juniors', 'River Plate', 'the Superclásico'],
  ['Flamengo', 'Corinthians', 'the Clássico do Povo'],
  ['Palmeiras', 'Corinthians', 'the Derby Paulista'],
];
const canon = (name: string) => ALIAS[name] || name;

/** The derby a move between two clubs crosses, if any. */
export function derbyBetween(from: string, to: string): string | null {
  const a = canon(from), b = canon(to);
  const hit = DERBIES.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
  return hit ? hit[2] : null;
}

/** Story beats a fan would bring up: derby defections, homecomings, the late-career move. */
export function moments(p: SimProfile): string[] {
  const clubs = p.clubs || [], out: string[] = [];
  clubs.forEach((club, i) => {
    const crossed = clubs.slice(0, i).map((prev) => ({ prev, derby: derbyBetween(prev.name, club.name) })).find((x) => x.derby);
    if (crossed) out.push(`Crossed ${crossed.derby}: ${crossed.prev.name} to ${club.name}`);
    if (club.ret) out.push(`Homecoming at ${club.name}`);
  });
  const last = clubs.at(-1);
  if (clubs.length > 1 && last && ['MLS', 'Saudi Pro League'].includes(last.league)) out.push(`Final chapter in ${last.league}`);
  const won = clubs.find((c) => c.lt > 0 && c.dc > 0 && (c.euroWon || []).includes('UCL'));
  if (won) out.push(`Won the lot at ${won.name}`);
  if ((p.goals || 0) >= 700) out.push('Joined the 700-goal club');
  return out;
}

/** How the player would be remembered. */
export function verdict(p: SimProfile): string {
  const clubs = p.clubs || [], ballon = p.ballonN || 0;
  if (ballon >= 3 || (ballon >= 1 && (p.wcWins || 0) >= 1)) return 'All-time great';
  if (ballon >= 1) return "Ballon d'Or winner";
  if (clubs.length === 1 && (p.seasons || 0) >= 12) return 'One-club legend';
  if (clubs.length >= 7) return 'Journeyman';
  if ((p.leaguesN || 0) >= 8) return 'Serial winner';
  if (p.overall >= 88) return 'World class';
  if (p.overall >= 80) return 'International regular';
  if (p.overall >= 70) return 'Top-flight pro';
  return 'Cult hero';
}

/** A one-line fan reaction to a round, shown with its result. */
export function roundNote(questionId: string, p: SimProfile): string | null {
  const club = /^tm(\d+)$/.exec(questionId);
  if (!club) return null;
  const clubs = p.clubs || [], now = clubs[Number(club[1])];
  if (!now) return null;
  const earlier = clubs.slice(0, Number(club[1]));
  const crossed = earlier.map((prev) => derbyBetween(prev.name, now.name)).find(Boolean);
  if (crossed) return `Crossed ${crossed}. The old fans won't forget.`;
  if (now.ret) return 'Homecoming! The fans never forgot you.';
  return null;
}
