// Waitlist signups for the landing page. Stores only what the form asks for: an email, two short
// answers and where the visitor came from. No IP address or browser details are kept.
// Each signup gets a private removal token; only its SHA-256 hash is stored.
export const LEARNING_FOR = ['partner', 'family', 'myself'] as const;
export const ROLES = ['learner', 'teacher'] as const;
export type WaitlistEntry = { email: string; learningFor: string; role: string; source: string };

export const WAITLIST_SQL = `CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  learning_for TEXT NOT NULL,
  role TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  remove_hash TEXT NOT NULL,
  created INTEGER NOT NULL
)`;

/** Validates a signup; returns an error message for the visitor, or the cleaned entry. */
export function parseSignup(body: unknown): { error: string } | WaitlistEntry {
  if (typeof body !== 'object' || body === null) return { error: 'Please check the form.' };
  const b = body as Record<string, unknown>;
  // A hidden field people never see; bots that fill every input get a quiet success and nothing is stored.
  if (typeof b.website === 'string' && b.website.trim()) return { error: '' };
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: 'Please enter a valid email address.' };
  const learningFor = String(b.learningFor || '');
  const role = String(b.role || '');
  if (!(LEARNING_FOR as readonly string[]).includes(learningFor)) return { error: 'Tell us who you’re learning for.' };
  if (!(ROLES as readonly string[]).includes(role)) return { error: 'Tell us if you’d be learning or teaching.' };
  const source = typeof b.source === 'string' ? b.source.replace(/[^\w.-]/g, '').slice(0, 40) : '';
  return { email, learningFor, role, source };
}

export async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
