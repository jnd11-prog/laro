import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { env } from 'cloudflare:workers';
import { hostAuthenticatedUser } from '@/lib/identity';
import Game from './game';
import Welcome, { metadata as welcomeMetadata } from './welcome/page';

// New visitors land on the pitch for the product; anyone who has already played (they have a guest
// cookie) or is following a career invite goes straight to the game. The game is always at /play.
export const dynamic = 'force-dynamic';
// Guests carry the laro_guest cookie; players signed in through the managed host carry its identity header instead.
async function returning() {
  if ((await cookies()).get('laro_guest')) return true;
  return !!hostAuthenticatedUser(await headers(), (env as { LARO_DISABLE_HOST_AUTH?: string }).LARO_DISABLE_HOST_AUTH);
}
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
async function showsGame({ searchParams }: Props) { return (await returning()) || !!(await searchParams).join; }
export async function generateMetadata(props: Props): Promise<Metadata> {
  return (await showsGame(props)) ? { title: 'Laro FC — Hyung’s career' } : welcomeMetadata;
}
export default async function Home(props: Props) {
  return (await showsGame(props)) ? <Game /> : <Welcome />;
}
