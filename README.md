# Laro FC

A full-stack Tagalog learning app built around a soccer career simulator. Made for Chris, a Korean American learner from NY/NJ, by his Filipina partner Shelomi.

**Play it:** [laro-fc.jnd11.workers.dev](https://laro-fc.jnd11.workers.dev). No sign-up needed; each browser gets its own guest career.

![The Laro FC home screen with the career wheel on its first question](docs/career-wheel.png)

Each round follows the full career builder: position, nationality, debut age, height, career length, attributes, dominant foot, clubs, upgrades, domestic and European competitions, international results, goals, assists, and individual awards. Conditional follow-up questions reflect earlier results. The wheel shows the possible answers and the backend applies the selected result; numeric goal and assist totals use an animated counter. The run ends with a career card rather than an arbitrary spin limit.

Each attribute round is followed by a Tagalog training question that can raise or lower that stat, a Tagalog checkpoint comes every third round, and each section of the career ends with a checkpoint and a wildcard that swings XP. Exercises get harder with each correct review: choosing the meaning, filling in a missing word, picking the right Tagalog for an English sentence, ordering words with extra decoys, and finally writing the phrase from memory. Checkpoint wheels show categories rather than full phrases. The quiz removes the career screen, wheel, and recent history from the rendered page, and hides the English gloss and usage explanation until the answer is correct, including after mistakes. The phrasebook remains available for studying.

## Included

- Persistent career runs, position-specific attributes, club histories, eleven trophy categories, event history, XP, and kit unlocks.
- Manual spins with an explicit next-question step, auto-spin, two speeds, and reduced motion. Auto-spin pauses for Tagalog and stops at the completed career card.
- Local Web Audio synthesis: decelerating wheel ticks, result jingles, trophy fanfares, and answer sounds. Sound starts after a user gesture and can be muted.
- A Night Match look with jeepney-sign lettering and Kuya Coach, a Taglish coach who reacts to each round, with quizzes framed as penalty kicks.
- A pixel arcade layout with a 128×128 canvas wheel, self-hosted pixel font, square controls, larger question and result headings, and readable body text. Wheel angles reflect the backend weights; blocked outcomes cannot be selected.
- Eighty-four built-in phrases with meanings, usage context, and tap-a-word breakdowns, including lambing, family references, and PBB’s Kuya.
- A phrasebook and creator studio with audio recording or file upload.
- Creator/learner invitations, with server-side role checks and private audio access.
- Optimistic concurrency checks and idempotent mutations that prevent duplicated rewards.
- Automatic review scheduling, with higher selection weights for overdue and weak phrases.

## Architecture

React + TypeScript run on the Vinext app router. API routes execute on Cloudflare Workers. Cloudflare D1 stores careers, clubs, memberships, custom phrases, and mutation records. R2 holds audio objects. On the managed host, sign-in comes from that host and signed-in visitors use their stable site-specific user ID. Anonymous visitors, and every visitor on a self-hosted copy, use an opaque HttpOnly device cookie.

```mermaid
flowchart TD
  UI["React game and creator studio"] --> API["Worker API: authorization and validation"]
  API --> Engine["Career simulation and review scheduler"]
  API --> DB["D1: careers, members, phrases, event ledger"]
  API --> Audio["R2: private recordings"]
```

Career mutations compare the expected version with the stored version. A D1 batch atomically updates the career and inserts an idempotency record only when the update succeeds. Stale clients receive a conflict response and reload. Replayed request IDs return the saved result without awarding additional XP. Answer correctness and kit eligibility are validated on the server.

`lib/player-career.js` adapts the question families and probability rules from a single-file HTML game, “The Wheel — Build a Footballer”. Each request reconstructs its own simulation from a career seed and recorded choices. Replay validates stage IDs and available outcomes, and there is no mutable simulation state shared between careers. The TypeScript declaration exposes a typed boundary to the API and UI. Each event records the exact question, weights, and selected index for animation.

An invite grants learner membership in the selected career, not creator permissions. Audio requests must belong to the requester's current club. Site-level sharing is a separate access boundary: the initial deployment is owner-private, so Chris needs site access before an in-app invite works.

### Where to look

| Path | What it does |
| --- | --- |
| `lib/engine.ts` | Grades exercises, schedules review, awards XP, and connects the career simulator to the game. |
| `lib/catalog.ts`, `lib/phrase-guide.ts` | The phrases and their word-by-word notes. |
| `lib/player-career.js`, `lib/player-career-v1.js` | The seeded career builder and its branching questions; v1 is a frozen copy for older saves. |
| `lib/server.ts`, `app/api/[...route]/route.ts` | Identity, membership, atomic saves, and the HTTP API. |
| `app/game.tsx`, `app/art.tsx` | The game UI, quiz, phrasebook, studio, pixel art, and weighted wheel. |

`components/ui/`, `vendor/`, and most of `scripts/` are framework and hosting scaffolding. `app/game.tsx`, `app/art.tsx`, `app/globals.css`, and `lib/player-career-v1.js` were recovered from a compiled deployment, so their local names are short and the stylesheet is compiled.

## Local development

Requires Node.js 22.13+ and the lockfile's package manager.

1. Install dependencies with `pnpm install --frozen-lockfile`.
2. Run `pnpm build` to emit the local Worker configuration.
3. Apply each pending SQL migration once, in order:

   ```sh
   node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_sticky_vengeance.sql
   ```

4. Run `pnpm dev` and open http://localhost:5173.

The database bindings are declared in `.openai/hosting.json`. Deployments apply the committed Drizzle migrations. No LLM API key or external paid service is needed.

## Deploy a public copy to Cloudflare

The app runs anonymously without the managed host's sign-in (visitors get an opaque device cookie), so it can be deployed to any Cloudflare account. Requires Node.js 22.13+.

```sh
pnpm install --frozen-lockfile
npx wrangler login
npx wrangler d1 create laro              # copy the database_id it prints
npx wrangler r2 bucket create laro-audio
pnpm build
LARO_D1_ID=<database_id> LARO_R2_BUCKET=laro-audio LARO_APPLY_SCHEMA=1 node scripts/deploy-cloudflare.mjs
```

Later deploys: `pnpm build && LARO_D1_ID=<database_id> node scripts/deploy-cloudflare.mjs` (omit `LARO_APPLY_SCHEMA`). Wrangler prints the public `*.workers.dev` URL at the end. Add `LARO_DRY_RUN=1` to bundle and validate without changing your Cloudflare account.

The managed host's "sign in with ChatGPT" route is not available on a self-hosted copy; everything else works anonymously. The deploy script sets `LARO_DISABLE_HOST_AUTH=1` so the Worker ignores the host's identity header, which anyone could forge without that host in front of it.

## Checks

```sh
pnpm typecheck
pnpm test
```

The domain suite checks quiz answer visibility, wrong-answer scoring, review scheduling, weighted wheel geometry, deterministic replay, request isolation, and complete career runs across thirty seeds. The identity suite checks forged-header and origin handling. The SQLite suite verifies the real schema, atomic reward updates, request replay, and membership constraints.

`tests/integration.mjs` exercises the real HTTP API against an isolated development database, creating disposable test careers. It covers duplicate requests, simultaneous spins, scoring, continuation, audio uploads and isolation, invitations, role enforcement, kit gating, and malformed requests. Run it only against a test instance, with `pnpm dev` running:

```sh
LARO_TEST_URL=http://localhost:5173 node tests/integration.mjs
```

## Audio and learning scope

No generated audio is represented as Shelomi's voice. Starter phrases use a Filipino device voice only when one is installed. Real recordings uploaded in the studio take precedence. Microphone recording requires browser permission and a secure context; uploads work without microphone permission.

Scoring depends on difficulty: a first-try answer earns 20, 40, or 60 XP, a first mistake costs 5, 10, or 15 XP once, a retry earns 5, 10, or 15 XP, and XP never falls below zero. Review intervals are deliberately transparent: a missed-then-correct phrase returns after five minutes; first-try successes advance through four hours, one day, three days, and seven days. Exercise selection is heuristic. Three consecutive first-try successes is shown as practice progress, not a claim of fluency.

## Saved-career compatibility

Careers replay from recorded answers, so the questions are versioned (`CAREER_RULES` in `lib/engine.ts`). A career started under the original questions keeps replaying `lib/player-career-v1.js`; the realism rules apply to careers started afterward. Attributes and overall rating display as unknown until the corresponding builder questions are resolved. Pending older recall exercises are upgraded to Tagalog cues while preserving their attempt count.

## Next development steps

Validate phrase understanding and delayed recall with Chris, add richer lesson authoring and accessibility testing, and support recoverable guest-to-account migration before a public launch. No email, external notifications, payments, or AI model calls are involved in this version.
