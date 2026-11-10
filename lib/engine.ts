import * as careerV1 from './player-career-v1.js';
import * as careerV2 from './player-career.js';
import type { SimProfile } from './player-career.js';
import { PHRASE_GUIDE } from './phrase-guide.ts';
import type { Career, CareerEvent, Challenge, EventKind, Phrase, Review, SpinQuestion } from './types';

// Careers started under the original questions replay against the frozen v1 rules.
export const CAREER_RULES=2;
type Builder=NonNullable<Career['builder']>;
const rulesFor=(builder:Pick<Builder,'rules'>)=>builder.rules===CAREER_RULES?careerV2:careerV1;
const frameOf=(builder:Builder,points?:Career['trainingPoints'])=>rulesFor(builder).inspectCareer(builder.seed,builder.choices,points);

export const EVENT_KINDS: EventKind[] = ['goal','training','match','transfer','message','rest','award'];
export const COLORS=['#c7f56b','#76c7ff','#c3a6f6','#ffda83','#ff9dbb','#83dfc6','#ffad74','#a2b5ff'];
export const WILDCARDS=[{label:'Breakout performance',xp:100,weight:10},{label:'Sponsor bonus',xp:60,weight:20},{label:'Extra training',xp:25,weight:25},{label:'Quiet week',xp:0,weight:10},{label:'Benched',xp:-25,weight:20},{label:'Missed training',xp:-60,weight:15}];
export const AWARDS=[
 {id:'ucl',label:'UCL',name:'Champions League'},{id:'uel',label:'UEL',name:'Europa League'},{id:'uecl',label:'UECL',name:'Conference League'},
 {id:'league',label:'LEAGUE',name:'League titles'},{id:'cup',label:'CUPS',name:'Domestic cups'},{id:'world',label:'WORLD CUP',name:'World Cup'},
 {id:'continental',label:'CONTINENTAL',name:'Continental competition'},{id:'ballon',label:"BALLON D’OR",name:"Ballon d’Or"},
 {id:'boot',label:'GOLDEN BOOT',name:'Golden Boots'},{id:'toty',label:'TOTY',name:'Team of the Year'},{id:'pots',label:'POTS',name:'Player of the Season'},
];
export function exerciseDifficulty(phrase:Phrase,mode?:Challenge['mode']){
 const words=phrase.phrase.trim().split(/\s+/).length,bonus=({translate:1,build:1,type:2} as Record<string,number>)[mode||'']||0,level=Math.min(3,(phrase.difficulty??(words>=5?3:words>=3?2:1))+bonus);
 return {difficulty:['Easy','Medium','Hard'][level-1],gain:level*2,penalty:level};
}
export function quizRewards(phrase:Phrase,mode?:Challenge['mode']){const level=exerciseDifficulty(phrase,mode).penalty;return {win:level*20,loss:level*5,retry:level*5};}
export function nationalityLabels(){const first=careerV2.advanceCareer(1,[],()=>0).record;return careerV2.inspectCareer(1,[first]).question!.options.map(o=>o.label);}

export function initialCareer(seed=Math.floor(Math.random()*4294967296)):Career{
 return {season:1,day:1,spins:0,xp:0,goals:0,assists:0,matches:0,wins:0,draws:0,rating:0,club:'Not signed',division:3,pace:0,shooting:0,passing:0,dribbling:0,stamina:0,defending:0,strength:0,trophies:{},kit:'lime',history:[],reviews:{},pending:null,lastKind:null,builder:{seed,choices:[],complete:false,rules:CAREER_RULES},profile:careerV2.inspectCareer(seed,[]).profile};
}
export function upgradeCareer(input:Career):Career{
 const builder:Builder=input.builder||{seed:Math.imul(input.season||1,2654435761)>>>0,choices:[],complete:false};
 const frame=frameOf(builder,input.trainingPoints),stats=Object.fromEntries(frame.profile.stats.filter(stat=>stat.value!==null).map(stat=>[stat.key,stat.value]));
 return {...input,...stats,dribbling:(stats.dribbling??input.dribbling??61) as number,stamina:input.stamina??64,defending:(stats.defending??input.defending??35) as number,strength:(stats.strength??input.strength??input.stamina??64) as number,rating:frame.profile.stats.every(stat=>stat.value!==null)?frame.profile.overall:0,trophies:input.trophies??{},builder:{...builder,complete:frame.complete},profile:frame.profile};
}
export function isCareerComplete(s:Career){return !!s.builder?.complete;}
export function randomIndex(n:number,rng=Math.random){return Math.min(n-1,Math.floor(rng()*n));}
export function shuffle<T>(items:T[],rng=Math.random):T[]{const a=[...items];for(let i=a.length-1;i>0;i--){const j=randomIndex(i+1,rng);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function phraseWeight(review:Review|undefined,now:number){if(!review)return 4;return review.due<=now?6+Math.max(0,3-review.streak)*2:.25;}
const phraseLevel=(p:Phrase)=>p.difficulty??(p.phrase.trim().split(/\s+/).length>=5?3:p.phrase.trim().split(/\s+/).length>=3?2:1);
// New learners get short phrases; once plenty are reviewed, the easiest ones drop out.
export function phrasePool(phrases:Phrase[],state?:Career){
 const seen=state?Object.keys(state.reviews).length:99;
 const pool=seen<5?phrases.filter(p=>(p.difficulty??1)<=1):seen<12?phrases.filter(p=>(p.difficulty??1)<=2):seen<24?phrases:phrases.filter(p=>phraseLevel(p)>=2);
 return pool.length?pool:phrases;
}
export function choosePhrase(phrases:Phrase[],state:Career,now:number,rng=Math.random):Phrase{
 if(!Object.keys(state.reviews).length)return phrases.find(p=>p.id==='galing')||phrases[0];
 const weights=phrases.map(p=>phraseWeight(state.reviews[p.id],now));let r=rng()*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<phrases.length;i++){r-=weights[i];if(r<0)return phrases[i];}return phrases[phrases.length-1];
}
const atSectionEnd=(s:Career,questionId:string)=>s.builder!.choices.at(-1)?.id==='skillm'||/^impd\d+$/.test(questionId);
export function getSpinQuestion(state:Career,phrases:Phrase[],now=Date.now()):SpinQuestion{
 const s=state.builder?state:upgradeCareer(state),b=s.builder!,frame=frameOf(b,s.trainingPoints);
 if(frame.complete)return {id:'complete',prompt:'Career complete',options:[],presentation:'complete',step:b.choices.length,remaining:0};
 const sectionEnd=atSectionEnd(s,frame.question?.id||''),length=b.choices.length;
 // A quiz every third round, except right after an attribute's own training quiz.
 const everyThird=length>0&&length%3===0&&!/^stat[0-5]$/.test(b.choices.at(-1)?.id||'');
 if((sectionEnd||everyThird)&&s.checkpointAt!==length){
  const pool=[...phrasePool(phrases,s)].sort((a,z)=>{
   if(!Object.keys(s.reviews).length){if(a.id==='galing')return -1;if(z.id==='galing')return 1;}
   return phraseWeight(s.reviews[z.id],now)-phraseWeight(s.reviews[a.id],now);
  }).slice(0,6);
  const first=!Object.keys(s.reviews).length&&pool.some(p=>p.id==='galing');
  return {id:'phrase',prompt:'Tagalog checkpoint',options:pool.map((p,i)=>({id:p.id,label:p.category,color:COLORS[i],weight:first?Number(p.id==='galing'):phraseWeight(s.reviews[p.id],now),blocked:first&&p.id!=='galing'})),presentation:'wheel',step:frame.question?.step,remaining:frame.question?.remaining};
 }
 if(sectionEnd&&s.checkpointAt===b.choices.length&&s.wildcardAt!==b.choices.length)return {id:'wildcard',prompt:'Wildcard · what happens next?',presentation:'wheel',options:WILDCARDS.map((w,i)=>({id:String(i),label:`${w.label} (${w.xp>0?'+':''}${w.xp} XP)`,weight:w.weight,color:COLORS[i]}))};
 const question=frame.question!;
 if(question.id==='nationality'&&s.preferredNationality)return {...question,options:question.options.map(o=>({...o,weight:Number(o.label===s.preferredNationality),blocked:o.label!==s.preferredNationality}))};
 return question;
}
// A wrong option never repeats another or duplicates something the grader would accept.
function distinctFrom(answer:string,items:string[]){const seen=new Set([normalize(answer)]);return items.filter(v=>{const k=normalize(v);if(seen.has(k))return false;seen.add(k);return true;});}
// Near misses first: same category, then the closest length, so the wrong options look plausible.
function nearMisses(p:Phrase,phrases:Phrase[],rng:()=>number){
 const size=p.phrase.split(/\s+/).length;
 const others=phrases.filter(q=>q.id!==p.id).map(q=>({q,score:(q.category===p.category?0:4)+Math.abs(q.phrase.split(/\s+/).length-size)+rng()}));
 return others.sort((a,b)=>a.score-b.score).map(x=>x.q);
}
const WRONG_OPTIONS=3;
export function makeChallenge(p:Phrase,review:Review|undefined,id:string,phrases:Phrase[],rng=Math.random):Challenge{
 const words=p.phrase.replace(/[.!?]/g,'').split(/\s+/),streak=review?.streak??0;
 // Each step up asks for more production: recognize, fill in, choose the Tagalog, order it, then write it.
 const mode:Challenge['mode']=!review?'meaning':streak>=4?'type':streak===3&&words.length>1?'build':streak>=2?'translate':'recall';
 const base={id,phraseId:p.id,mode,revision:2,first:false,tries:0,solved:false};
 const otherWords=(exclude:string)=>distinctFrom(exclude,phrases.filter(q=>q.id!==p.id).flatMap(q=>q.phrase.replace(/[.,!?]/g,'').split(/\s+/)));
 if(mode==='recall'){
  const missingIndex=randomIndex(words.length,rng),target=words[missingIndex].replace(/,/g,'');
  const options=shuffle([target,...shuffle(otherWords(target),rng).slice(0,WRONG_OPTIONS)],rng);
  return {...base,cue:words.map((w,i)=>i===missingIndex?'_____':w).join(' '),missingIndex,options,prompt:'Kumpletuhin ang pangungusap.'};
 }
 if(mode==='translate')return {...base,cue:p.meaning,options:shuffle([p.phrase,...distinctFrom(p.phrase,nearMisses(p,phrases,rng).map(q=>q.phrase)).slice(0,WRONG_OPTIONS)],rng),prompt:'Alin ang tamang Tagalog?'};
 if(mode==='build'){
  const distractors=shuffle(otherWords(words.join(' ')).filter(w=>!words.some(x=>normalize(x)===normalize(w))),rng).slice(0,2);
  return {...base,cue:words[0]+' '+words.slice(1).map(()=>'_____').join(' '),options:shuffle([...words,...distractors],rng),prompt:'Ayusin ang mga salita. May sobrang salita.'};
 }
 if(mode==='type')return {...base,cue:p.meaning,options:[],prompt:'Isulat sa Tagalog.'};
 return {...base,first:true,cue:p.phrase,options:shuffle([p.meaning,...shuffle(distinctFrom(p.meaning,nearMisses(p,phrases,rng).slice(0,8).map(q=>q.meaning)),rng).slice(0,WRONG_OPTIONS)],rng),prompt:'Ano ang ibig sabihin nito?'};
}
export function upgradePending(s:Career,phrases:Phrase[]):Career{
 if(!s.pending||s.pending.solved||s.pending.revision===2)return s;
 const p=phrases.find(p=>p.id===s.pending!.phraseId);if(!p)return s;
 const review=s.pending.mode==='meaning'?undefined:{seen:1,correct:1,streak:s.pending.mode==='build'?3:1,due:0,last:0};
 const pending=makeChallenge(p,review,s.pending.id,phrases,()=>.5);pending.tries=s.pending.tries;pending.feedback=s.pending.feedback;pending.training=s.pending.training;
 return {...s,pending};
}
function trophies(p:SimProfile):Record<string,number>{return {ucl:p.euro?.UCL||0,uel:p.euro?.UEL||0,uecl:p.euro?.UECL||0,league:p.leaguesN||0,cup:p.cupsN||0,world:p.wcWins||0,continental:p.contWins||0,ballon:p.ballonN||0,boot:p.boots||0,toty:p.toty||0,pots:p.pots||0};}
function eventKind(id:string):EventKind{
 if(/^(stat|imp|fam)/.test(id))return 'training';if(/^(tm|lg|yr)/.test(id))return 'transfer';
 if(/^(lt|dc|eu|intl|boot|ballon|toty|pots)/.test(id))return 'award';if(/^(goals|assists)/.test(id))return 'match';return 'rest';
}
// Amounts through European trophies match the original game's recorded rewards;
// tournament and individual-award amounts are set on the same scale.
export function careerRoundXp(id:string,index:number,title:string,value?:number){
 if(/^stat[0-5]$/.test(id)||id==='weakf'||id==='skillm')return (index+1)*5;
 if(/^(lg|tm|yr)\d/.test(id))return 15;
 if(/^lt\d/.test(id))return index*50;
 if(/^dc\d/.test(id))return index*25;
 if(/^eu[dn]\d/.test(id))return 0;
 if(/^euw/.test(id))return ({UCL:100,UEL:50,UECL:25} as Record<string,number>)[title]??25;
 if(/^intl/.test(id))return title==='Winner'?(id.startsWith('intlwc')?200:100):5;
 if(id==='goals'||id==='assists')return value===undefined?5:15;
 if(id==='boots')return (index+1)*75;
 if(id==='ballonN')return (index+1)*200;
 if(id==='toty')return index*25;
 if(id==='pots')return index*50;
 if(id==='bootsD'||id==='ballon')return 0;
 return 5;
}
function weightedIndex(weights:number[],rng:()=>number){let r=rng()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<weights.length;i++){r-=weights[i];if(r<0)return i;}return weights.length-1;}
export function spinCareer(input:Career,phrases:Phrase[],id:string,now=Date.now(),rng=Math.random):{state:Career;event:CareerEvent}{
 if(input.pending)throw new Error('Finish your Tagalog round first.');
 let s=upgradeCareer(structuredClone(input));const q=getSpinQuestion(s,phrases,now),builder=s.builder!;
 if(q.presentation==='complete')throw new Error('Career complete. Start a new career.');
 s.spins++;s.day=builder.choices.length+1;
 let e:CareerEvent;
 if(q.id==='phrase'){
  const p=choosePhrase(q.options.map(o=>phrases.find(p=>p.id===o.id)!),s,now,rng),index=q.options.findIndex(o=>o.id===p.id);
  s.pending=makeChallenge(p,s.reviews[p.id],id,phrases,rng);s.checkpointAt=builder.choices.length;
  // The event describes the checkpoint, never its English answer.
  e={id,kind:'message',title:'Tagalog checkpoint',detail:p.category,reward:'Up to +60 XP',day:s.day,season:s.season,question:q.prompt,optionIndex:index,outcome:p.category,wheel:q};
 }else if(q.id==='wildcard'){
  const index=weightedIndex(WILDCARDS.map(w=>w.weight),rng),card=WILDCARDS[index];
  s.xp=Math.max(0,s.xp+card.xp);s.wildcardAt=builder.choices.length;
  e={id,kind:'rest',title:card.label,detail:q.prompt,reward:`${card.xp>0?'+':''}${card.xp} XP`,day:s.day,season:s.season,question:q.prompt,optionIndex:index,outcome:card.label,wheel:q};
 }else{
  const previous=trophies(s.profile!),forced=q.id==='nationality'&&s.preferredNationality?q.options.findIndex(o=>o.label===s.preferredNationality):undefined;
  const r=rulesFor(builder).advanceCareer(builder.seed,builder.choices,rng,s.trainingPoints,forced!==undefined&&forced>=0?forced:undefined);
  builder.choices.push(r.record);builder.complete=r.complete;s.profile=r.profile;
  const values=trophies(r.profile);let awardId:string|undefined;
  for(const [key,count]of Object.entries(values)){const gain=count-(previous[key]||0);if(gain>0){s.trophies[key]=(s.trophies[key]||0)+gain;awardId=key;}}
  if(r.profile.club)s.club=r.profile.club;if(r.profile.goals!==undefined)s.goals=r.profile.goals;if(r.profile.assists!==undefined)s.assists=r.profile.assists;
  const xp=careerRoundXp(q.id,r.index,r.title,r.value);s.xp+=xp;
  const statLabel=/^stat[0-5]$/.test(q.id)?r.profile.stats[Number(q.id.slice(4))].label:'';
  e={id,kind:eventKind(q.id),title:r.title,detail:q.prompt,reward:`+${xp} XP${statLabel?` · ${statLabel} checkpoint`:''}`,day:s.day,season:s.season,question:q.prompt,optionIndex:r.index,outcome:r.title,awardId,wheel:q};
  // Every attribute is followed by a Tagalog training question that can move it.
  if(/^stat[0-5]$/.test(q.id)&&!r.complete){
   const stat=r.profile.stats[Number(q.id.slice(4))],pool=phrasePool(phrases,s),p=choosePhrase(pool,s,now,rng);
   const challenge=makeChallenge(p,s.reviews[p.id],id,phrases,rng),{difficulty,gain,penalty}=exerciseDifficulty(p,challenge.mode);
   challenge.training={key:stat.key,label:stat.label,base:stat.value??50,difficulty,gain,penalty};s.pending=challenge;
  }
 }
 s=upgradeCareer(s);s.lastKind=e.kind;s.history=[e,...s.history].slice(0,100);return {state:s,event:e};
}
export function normalize(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").toLocaleLowerCase().replace(/[.,!?]/g,'').replace(/\s+/g,' ').trim();}
export function answerChallenge(input:Career,phrases:Phrase[],answer:string,now=Date.now()):{state:Career;correct:boolean}{
 const s=upgradePending(upgradeCareer(structuredClone(input)),phrases),q=s.pending;
 if(!q)throw new Error('No quiz is waiting.');if(q.solved)return {state:s,correct:true};
 const p=phrases.find(p=>p.id===q.phraseId);if(!p)throw new Error('Phrase not found.');
 const words=p.phrase.replace(/[.!?]/g,'').split(/\s+/);
 const expected=q.mode==='meaning'?p.meaning:q.mode==='recall'?words[q.missingIndex??words.length-1]:p.phrase;
 q.tries++;const correct=normalize(answer)===normalize(expected),firstTry=q.tries===1,{win,loss,retry}=quizRewards(p,q.mode);
 if(q.training&&q.training.delta===undefined){
  const t=q.training,points={...(s.trainingPoints||{})},delta=Math.min(100,Math.max(10,t.base+(correct?t.gain:-t.penalty)))-t.base;
  t.delta=delta;points[t.key]=(points[t.key]||0)+delta;s.trainingPoints=points;
 }
 if(correct){
  q.solved=true;q.earned=firstTry?win:retry;s.xp+=q.earned;
  const old=s.reviews[p.id]||{seen:0,correct:0,streak:0,due:0,last:0},streak=firstTry?old.streak+1:0;
  s.reviews[p.id]={seen:old.seen+1,correct:old.correct+(firstTry?1:0),streak,last:now,due:now+(streak===0?300000:[0,14400000,86400000,259200000,604800000][Math.min(streak,4)])};q.feedback='Tama!';
 }else{
  if(firstTry)s.xp=Math.max(0,s.xp-loss);
  // Typing has no options to narrow down, so repeated misses earn a first-letter hint.
  q.feedback=q.mode==='type'&&q.tries>=2?`Subukan ulit. Pahiwatig: ${p.phrase.split(/\s+/).map(w=>w[0]+'…').join(' ')}`:'Subukan ulit.';
 }
 return {state:upgradeCareer(s),correct};
}
function freshRun(input:Career,preferredNationality?:string):Career{
 const next=initialCareer();return {...next,season:input.season+1,xp:input.xp,kit:input.kit,reviews:input.reviews,trophies:input.trophies,history:input.history,...(preferredNationality?{preferredNationality}:{})};
}
export function nextSeason(input:Career):Career{
 if(!isCareerComplete(input)||input.pending)throw new Error('Finish this career and any open quiz first.');
 return freshRun(input);
}
export function restartCareer(input:Career,nationality?:string):Career{return freshRun(input,nationality);}
