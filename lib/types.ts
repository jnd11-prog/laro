import type {CareerChoice,SimProfile} from './player-career';
export type Category = 'Lambing' | 'Barkada' | 'Family' | 'Pop culture' | 'Matchday';
export type Phrase = { id: string; phrase: string; meaning: string; context: string; category: Category; audio?: string | null };
export type Review = { seen: number; correct: number; streak: number; due: number; last: number };
export type EventKind = 'goal' | 'training' | 'match' | 'transfer' | 'message' | 'rest' | 'award';
export type CareerEvent = { id: string; kind: EventKind; title: string; detail: string; reward: string; day: number; season: number; home?: number; away?: number; question?: string; optionIndex?: number; outcome?: string; awardId?: string; wheel?: SpinQuestion };
export type Challenge = { id: string; phraseId: string; mode: 'meaning' | 'recall' | 'build'; options: string[]; prompt: string; first: boolean; tries: number; solved: boolean; feedback?: string; earned?: number; revision?:number; cue?:string; missingIndex?:number };
export type Career = {
  season: number; day: number; spins: number; xp: number; goals: number; assists: number; matches: number; wins: number; draws: number;
  rating: number; club: string; division: number; pace: number; shooting: number; passing: number; dribbling: number; stamina: number; defending: number; trophies: Record<string, number>; strength:number; kit: string;
  builder?:{seed:number;choices:CareerChoice[];complete:boolean;rules?:number}; profile?:SimProfile;
  history: CareerEvent[]; reviews: Record<string, Review>; pending: Challenge | null; lastKind: EventKind | null;
};
export type Snapshot = { state: Career; version: number; phrases: Phrase[]; role: string; signedIn: boolean; invite?: string };

export type SpinOption = { id: string; label: string; color: string; value?: number; weight?:number; blocked?:boolean };
export type SpinQuestion = { id:string; prompt:string; options:SpinOption[]; presentation?:'wheel'|'counter'|'complete'; step?:number; remaining?:number };
