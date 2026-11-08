import {inspectCareer,advanceCareer,type SimProfile} from './player-career.js';
import type { Career, CareerEvent, EventKind, Phrase, Review, SpinQuestion,Challenge } from './types';
// Bump when career questions change: saved careers replay by question and option position.
export const CAREER_RULES=2;
export const EVENT_KINDS: EventKind[] = ['goal','training','match','transfer','message','rest','award'];
export const COLORS=['#c7f56b','#76c7ff','#c3a6f6','#ffda83','#ff9dbb','#83dfc6','#ffad74','#a2b5ff'];
export const AWARDS=[
 {id:'ucl',label:'UCL',name:'Champions League'},{id:'uel',label:'UEL',name:'Europa League'},{id:'uecl',label:'UECL',name:'Conference League'},
 {id:'league',label:'LEAGUE',name:'League titles'},{id:'cup',label:'CUPS',name:'Domestic cups'},{id:'world',label:'WORLD CUP',name:'World Cup'},
 {id:'continental',label:'CONTINENTAL',name:'Continental competition'},{id:'ballon',label:"BALLON D’OR",name:"Ballon d’Or"},
 {id:'boot',label:'GOLDEN BOOT',name:'Golden Boots'},{id:'toty',label:'TOTY',name:'Team of the Year'},{id:'pots',label:'POTS',name:'Player of the Season'},
];
export function initialCareer(seed=Math.floor(Math.random()*4294967296)):Career{
 return {season:1,day:1,spins:0,xp:0,goals:0,assists:0,matches:0,wins:0,draws:0,rating:0,club:'Not signed',division:3,pace:0,shooting:0,passing:0,dribbling:0,stamina:0,defending:0,strength:0,trophies:{},kit:'lime',history:[],reviews:{},pending:null,lastKind:null,builder:{seed,choices:[],complete:false,rules:CAREER_RULES},profile:inspectCareer(seed,[]).profile};
}
export function upgradeCareer(input:Career):Career{
 const stale=!!input.builder&&input.builder.rules!==CAREER_RULES;
 const builder=input.builder&&!stale?input.builder:{seed:input.builder?.seed??Math.imul(input.season||1,2654435761)>>>0,choices:[],complete:false,rules:CAREER_RULES};
 const frame=inspectCareer(builder.seed,builder.choices);
 // A career built under older questions cannot replay, so it restarts; XP, kits, lessons, trophies and history stay.
 if(stale)input={...input,club:'Not signed',goals:0,assists:0,pace:0,shooting:0,passing:0,dribbling:0,defending:0,strength:0};
 return {...input,dribbling:input.dribbling??61,stamina:input.stamina??64,defending:input.defending??35,strength:input.strength??input.stamina??64,rating:frame.profile.stats.every(stat=>stat.value!==null)?frame.profile.overall:0,trophies:input.trophies??{},builder:{...builder,complete:frame.complete},profile:frame.profile};
}
export function isCareerComplete(s:Career){return !!s.builder?.complete;}
export function randomIndex(n:number,rng=Math.random){return Math.min(n-1,Math.floor(rng()*n));}
export function shuffle<T>(items:T[],rng=Math.random):T[]{const a=[...items];for(let i=a.length-1;i>0;i--){const j=randomIndex(i+1,rng);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function phraseWeight(review:Review|undefined,now:number){if(!review)return 4;return review.due<=now?6+Math.max(0,3-review.streak)*2:.25;}
export function choosePhrase(phrases:Phrase[],state:Career,now:number,rng=Math.random):Phrase{
 if(!Object.keys(state.reviews).length)return phrases.find(p=>p.id==='galing')||phrases[0];
 const weights=phrases.map(p=>phraseWeight(state.reviews[p.id],now));let r=rng()*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<phrases.length;i++){r-=weights[i];if(r<0)return phrases[i];}return phrases[phrases.length-1];
}
export function getSpinQuestion(state:Career,phrases:Phrase[],now=Date.now()):SpinQuestion{
 const s=state.builder?.rules===CAREER_RULES?state:upgradeCareer(state),b=s.builder!;
 const frame=inspectCareer(b.seed,b.choices);
 if(frame.complete)return {id:'complete',prompt:'Career complete',options:[],presentation:'complete',step:b.choices.length,remaining:0};
 if((s.spins+1)%4===0){
  const pool=[...phrases].sort((a,b)=>{
   if(!Object.keys(s.reviews).length){if(a.id==='galing')return -1;if(b.id==='galing')return 1;}
   return phraseWeight(s.reviews[b.id],now)-phraseWeight(s.reviews[a.id],now);
  }).slice(0,6);
  const first=!Object.keys(s.reviews).length&&pool.some(p=>p.id==='galing');
  return {id:'phrase',prompt:'Tagalog checkpoint',options:pool.map((p,i)=>({id:p.id,label:p.category,color:COLORS[i],weight:first?(p.id==='galing'?1:0):phraseWeight(s.reviews[p.id],now),blocked:first&&p.id!=='galing'})),presentation:'wheel',step:frame.question?.step,remaining:frame.question?.remaining};
 }
 return frame.question!;
}
// Wrong options, with no repeats and nothing a grader would accept as the answer.
function distinctFrom(answer:string,items:string[]){const seen=new Set([normalize(answer)]);return items.filter(v=>{const k=normalize(v);if(seen.has(k))return false;seen.add(k);return true;});}
export function makeChallenge(p:Phrase,review:Review|undefined,id:string,phrases:Phrase[],rng=Math.random):Challenge{
 const words=p.phrase.replace(/[.!?]/g,'').split(/\s+/);
 // A one-word phrase has nothing to put in order, and its cue would show the answer.
 const mode=!review?'meaning':review.streak>=2&&words.length>1?'build':'recall';
 if(mode==='recall'){
  const missingIndex=words.length>1?words.length-1:0,target=words[missingIndex];
  const others=distinctFrom(target,phrases.filter(q=>q.id!==p.id).flatMap(q=>q.phrase.replace(/[.,!?]/g,'').split(/\s+/)));
  const options=shuffle([target,...shuffle(others,rng).slice(0,2)],rng);
  return {id,phraseId:p.id,mode,revision:2,cue:words.map((w,i)=>i===missingIndex?'_____':w).join(' '),missingIndex,options,prompt:'Complete the phrase.',first:false,tries:0,solved:false};
 }
 if(mode==='build')return {id,phraseId:p.id,mode,revision:2,cue:words[0]+' '+words.slice(1).map(()=>'_____').join(' '),options:shuffle(words,rng),prompt:'Put the words in order.',first:false,tries:0,solved:false};
 return {id,phraseId:p.id,mode,revision:2,cue:p.phrase,options:shuffle([p.meaning,...shuffle(distinctFrom(p.meaning,phrases.filter(q=>q.id!==p.id).map(q=>q.meaning)),rng).slice(0,2)],rng),prompt:'Choose the meaning.',first:true,tries:0,solved:false};
}
export function upgradePending(s:Career,phrases:Phrase[]):Career{
 if(!s.pending||s.pending.solved||s.pending.revision===2)return s;
 const p=phrases.find(p=>p.id===s.pending!.phraseId);if(!p)return s;
 const review=s.pending.mode==='meaning'?undefined:{seen:1,correct:1,streak:s.pending.mode==='build'?2:1,due:0,last:0};
 const pending=makeChallenge(p,review,s.pending.id,phrases,()=>.5);pending.tries=s.pending.tries;pending.feedback=s.pending.feedback;
 return {...s,pending};
}
function trophies(p:SimProfile):Record<string,number>{return {ucl:p.euro?.UCL||0,uel:p.euro?.UEL||0,uecl:p.euro?.UECL||0,league:p.leaguesN||0,cup:p.cupsN||0,world:p.wcWins||0,continental:p.contWins||0,ballon:p.ballonN||0,boot:p.boots||0,toty:p.toty||0,pots:p.pots||0};}
function eventKind(id:string):EventKind{
 if(/^(stat|imp|fam)/.test(id))return 'training';if(/^(tm|lg|yr)/.test(id))return 'transfer';
 if(/^(lt|dc|eu|intl|boot|ballon|toty|pots)/.test(id))return 'award';if(/^(goals|assists)/.test(id))return 'match';return 'rest';
}
export function spinCareer(input:Career,phrases:Phrase[],id:string,now=Date.now(),rng=Math.random):{state:Career;event:CareerEvent}{
 if(input.pending)throw new Error('Finish your Tagalog round first.');
 const s=upgradeCareer(structuredClone(input)),q=getSpinQuestion(s,phrases,now);
 if(q.presentation==='complete')throw new Error('Career complete. Start a new career.');
 s.spins++;s.day=s.builder!.choices.length+1;
 let e:CareerEvent;
 if(q.id==='phrase'){
  const p=choosePhrase(q.options.map(o=>phrases.find(p=>p.id===o.id)!),s,now,rng),index=q.options.findIndex(o=>o.id===p.id);
  s.pending=makeChallenge(p,s.reviews[p.id],id,phrases,rng);
  // The event describes the checkpoint, never its English answer.
  e={id,kind:'message',title:'Tagalog checkpoint',detail:p.category,reward:'Up to +30 XP',day:s.day,season:s.season,question:q.prompt,optionIndex:index,outcome:p.category,wheel:q};
 }else{
  const previous=trophies(s.profile!);const r=advanceCareer(s.builder!.seed,s.builder!.choices,rng);
  s.builder!.choices.push(r.record);s.builder!.complete=r.complete;s.profile=r.profile;
  const values=trophies(r.profile);let awardId:string|undefined;
  for(const [key,count]of Object.entries(values)){const gain=count-(previous[key]||0);if(gain>0){s.trophies[key]=(s.trophies[key]||0)+gain;awardId=key;}}
  for(const stat of ['pace','shooting','dribbling','passing','strength','defending'] as const){const value=r.profile[stat];if(value!==undefined)s[stat]=value*10;}
  s.rating=r.profile.stats.every(a=>a.value!==null)?r.profile.overall:0;
  if(r.profile.club)s.club=r.profile.club;if(r.profile.goals!==undefined)s.goals=r.profile.goals;if(r.profile.assists!==undefined)s.assists=r.profile.assists;
  const xp=awardId?30:10;s.xp+=xp;const kind=eventKind(q.id);
  e={id,kind,title:r.title,detail:q.prompt,reward:`+${xp} XP`,day:s.day,season:s.season,question:q.prompt,optionIndex:r.index,outcome:r.title,awardId,wheel:q};
 }
 s.lastKind=e.kind;s.history=[e,...s.history].slice(0,100);return {state:s,event:e};
}
export function normalize(s:string){return s.toLocaleLowerCase().replace(/[.,!?]/g,'').replace(/\s+/g,' ').trim();}
export function answerChallenge(input:Career,phrases:Phrase[],answer:string,now=Date.now()):{state:Career;correct:boolean}{
 const s=upgradePending(upgradeCareer(structuredClone(input)),phrases),q=s.pending;
 if(!q)throw new Error('No quiz is waiting.');if(q.solved)return {state:s,correct:true};
 const p=phrases.find(p=>p.id===q.phraseId);if(!p)throw new Error('Phrase not found.');
 const words=p.phrase.replace(/[.!?]/g,'').split(/\s+/);
 const expected=q.mode==='meaning'?p.meaning:q.mode==='recall'?words[q.missingIndex??words.length-1]:p.phrase;
 q.tries++;const correct=normalize(answer)===normalize(expected);
 if(correct){
  q.solved=true;q.earned=q.tries===1?30:15;s.xp+=q.earned;
  const old=s.reviews[p.id]||{seen:0,correct:0,streak:0,due:0,last:0};const streak=q.tries===1?old.streak+1:0;
  s.reviews[p.id]={seen:old.seen+1,correct:old.correct+(q.tries===1?1:0),streak,last:now,due:now+(streak===0?300000:[0,14400000,86400000,259200000,604800000][Math.min(streak,4)])};q.feedback='Tama!';
 }else q.feedback='Try again.';
 return {state:s,correct};
}
export function nextSeason(input:Career):Career{
 if(!isCareerComplete(input)||input.pending)throw new Error('Finish this career and any open quiz first.');
 const next=initialCareer();return {...next,season:input.season+1,xp:input.xp,kit:input.kit,reviews:input.reviews,trophies:input.trophies,history:input.history};
}
