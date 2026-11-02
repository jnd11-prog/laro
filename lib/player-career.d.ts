import type { SpinQuestion } from './types';
export type CareerChoice = { id:string; index:number; type:'spin'|'roll'; value?:number };
export type ClubStint = { name:string; league:string; years:number; lt:number; dc:number; euroWon?:string[]; ret?:boolean };
export type SimProfile = {
  position?:string; nationality?:string; flag?:string; debut?:number; height?:string; seasons?:number; nclubs?:number;
  pace?:number; shooting?:number; dribbling?:number; passing?:number; strength?:number; defending?:number;
  foot?:string; weak?:number; skill?:number; club?:string; bestTier?:number; clubs?:ClubStint[];
  leaguesN?:number; cupsN?:number; euro?:Record<string,number>; uclN?:number;
  goals?:number; assists?:number; boots?:number; ballon?:boolean; ballonN?:number; toty?:number; pots?:number;
  wcWins?:number; contWins?:number; contName?:string; wcBestL?:string; contBestL?:string;
  intl?:{name:string;year:number;v:number;label:string}[];
  overall:number; retirementAge:number|null; stats:{key:string;label:string;value:number|null}[];
};
export type CareerFrame = { question:SpinQuestion|null; profile:SimProfile; complete:boolean; automatic:number; choices:number };
export function inspectCareer(seed:number,records?:CareerChoice[]):CareerFrame;
export function advanceCareer(seed:number,records?:CareerChoice[],pick?:()=>number): {
  question:SpinQuestion; index:number; title:string; value?:number; caption:string; record:CareerChoice;
  profile:SimProfile; complete:boolean; next:SpinQuestion|null; automatic:number;
};
