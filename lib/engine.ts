import * as careerV1 from './player-career-v1.js';
import * as careerV2 from './player-career-v2.js';
import * as careerV3 from './player-career.js';
import type { SimProfile } from './player-career.js';
import { PHRASE_GUIDE } from './phrase-guide.ts';
import type { Career, CareerEvent, Challenge, EventKind, Phrase, Review, SpinQuestion } from './types';

// Careers replay against the rules they started under: v1 (original), v2 (realistic), v3 (fun),
// v4 (fun, with no more league titles than seasons at a club).
export const CAREER_RULES=4;
type Builder=NonNullable<Career['builder']>;
const rulesFor=(builder:Pick<Builder,'rules'>)=>(builder.rules||0)>=3?careerV3:builder.rules===2?careerV2:careerV1;
const funRules=(builder:Pick<Builder,'rules'>)=>(builder.rules||0)>=3;
// A correct Tagalog answer charges the next few spins with luck, which leans every wheel toward good outcomes.
export const BOOST_SPINS=3,BOOST_LUCK=1.5;
export const luckOf=(s:Pick<Career,'boost'>)=>(s.boost||0)>0?BOOST_LUCK:0;
const frameOf=(builder:Builder,points?:Career['trainingPoints'],luck=0)=>rulesFor(builder).inspectCareer(builder.seed,builder.choices,points,luck,builder.rules);

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
 // A training answer moves the attribute by one whole point when right, and never lowers it.
 return {difficulty:['Easy','Medium','Hard'][level-1],gain:10,penalty:0,level};
}
// Standard Tagalog scoring: every correct answer is worth the same, whatever the exercise or try.
// A wrong answer leads to a penalty shot at the moving keeper, which decides what it costs.
export const QUIZ_XP=100;
export const SHOT_COST={bullseye:0,hit:100,miss:200} as const;
export type ShotResult=keyof typeof SHOT_COST;
// A rebound (right after a miss) earns nothing: no XP and no lucky spins.
export function quizRewards(_phrase?:Phrase,_mode?:Challenge['mode']){return {win:QUIZ_XP,retry:0,...SHOT_COST};}
export function nationalityLabels(){const first=careerV3.advanceCareer(1,[],()=>0).record;return careerV3.inspectCareer(1,[first]).question!.options.map(o=>o.label);}

export function initialCareer(seed=Math.floor(Math.random()*4294967296)):Career{
 return {season:1,day:1,spins:0,xp:0,goals:0,assists:0,matches:0,wins:0,draws:0,rating:0,club:'Not signed',division:3,pace:0,shooting:0,passing:0,dribbling:0,stamina:0,defending:0,strength:0,trophies:{},kit:'lime',history:[],reviews:{},pending:null,lastKind:null,builder:{seed,choices:[],complete:false,rules:CAREER_RULES},profile:careerV3.inspectCareer(seed,[],{},0,CAREER_RULES).profile};
}
export function upgradeCareer(input:Career):Career{
 const builder:Builder=input.builder||{seed:Math.imul(input.season||1,2654435761)>>>0,choices:[],complete:false};
 const frame=frameOf(builder,input.trainingPoints,luckOf(input)),stats=Object.fromEntries(frame.profile.stats.filter(stat=>stat.value!==null).map(stat=>[stat.key,stat.value]));
 return {...input,...stats,dribbling:(stats.dribbling??input.dribbling??61) as number,stamina:input.stamina??64,defending:(stats.defending??input.defending??35) as number,strength:(stats.strength??input.strength??input.stamina??64) as number,rating:frame.profile.stats.every(stat=>stat.value!==null)?frame.profile.overall:0,trophies:input.trophies??{},builder:{...builder,complete:frame.complete},profile:frame.profile};
}
export function isCareerComplete(s:Career){return !!s.builder?.complete;}
export function randomIndex(n:number,rng=Math.random){return Math.min(n-1,Math.floor(rng()*n));}
export function shuffle<T>(items:T[],rng=Math.random):T[]{const a=[...items];for(let i=a.length-1;i>0;i--){const j=randomIndex(i+1,rng);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function phraseWeight(review:Review|undefined,now:number){if(!review)return 4;return review.due<=now?6+Math.max(0,3-review.streak)*2:.25;}
const phraseLevel=(p:Phrase)=>p.difficulty??(p.phrase.trim().split(/\s+/).length>=5?3:p.phrase.trim().split(/\s+/).length>=3?2:1);
// New learners get short phrases; once plenty are reviewed, the easiest ones drop out.
// How far along the player is, 0 to 4: a quarter of the career per step, plus one per finished career.
// Quizzes get harder as this rises, so the Tagalog keeps pace with the football.
export const QUIZ_LEVELS=['Warm-up','Getting there','Match fit'];
// Kept gentle: three steps over a career, and a later career starts only one step up.
export function quizTier(state:Career,remaining=0){
 const done=state.builder?.choices.length||0,frac=done/Math.max(1,done+remaining);
 return Math.min(2,Math.floor(Math.min(.999,frac)*3)+Math.min(1,Math.max(0,(state.season||1)-1)));
}
/** Checkpoints only ever ask to recognize the meaning or pick the right Tagalog. */
export const CHECKPOINT_MAX_STEP=1;
export function phrasePool(phrases:Phrase[],state?:Career,tier=0){
 const seen=state?Object.keys(state.reviews).length:99;
 // Short phrases first; longer ones arrive with practice or later in the career, and the last stretch favors them.
 const cap=tier>=2||seen>=30?3:tier>=1||seen>=8?2:1;
 let pool=phrases.filter(p=>(p.difficulty??1)<=cap);
 if(tier>=3){const long=pool.filter(p=>phraseLevel(p)>=2);if(long.length>=6)pool=long;}
 return pool.length?pool:phrases;
}
export function choosePhrase(phrases:Phrase[],state:Career,now:number,rng=Math.random):Phrase{
 if(!Object.keys(state.reviews).length)return phrases.find(p=>p.id==='galing')||phrases[0];
 const weights=phrases.map(p=>phraseWeight(state.reviews[p.id],now));let r=rng()*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<phrases.length;i++){r-=weights[i];if(r<0)return phrases[i];}return phrases[phrases.length-1];
}
const atSectionEnd=(s:Career,questionId:string)=>s.builder!.choices.at(-1)?.id==='skillm'||/^impd\d+$/.test(questionId);
export function getSpinQuestion(state:Career,phrases:Phrase[],now=Date.now()):SpinQuestion{
 const s=state.builder?state:upgradeCareer(state),b=s.builder!,frame=frameOf(b,s.trainingPoints,luckOf(s));
 if(frame.complete)return {id:'complete',prompt:'Career complete',options:[],presentation:'complete',step:b.choices.length,remaining:0};
 const sectionEnd=atSectionEnd(s,frame.question?.id||''),length=b.choices.length;
 // A quiz every third round, except right after an attribute's own training quiz.
 const everyThird=length>0&&length%3===0&&!/^stat[0-5]$/.test(b.choices.at(-1)?.id||'');
 if((sectionEnd||everyThird)&&s.checkpointAt!==length){
  const pool=[...phrasePool(phrases,s,Math.min(1,quizTier(s,frame.question?.remaining)))].sort((a,z)=>{
   if(!Object.keys(s.reviews).length){if(a.id==='galing')return -1;if(z.id==='galing')return 1;}
   return phraseWeight(s.reviews[z.id],now)-phraseWeight(s.reviews[a.id],now);
  }).slice(0,6);
  const first=!Object.keys(s.reviews).length&&pool.some(p=>p.id==='galing');
  return {id:'phrase',prompt:'Tagalog checkpoint',options:pool.map((p,i)=>({id:p.id,label:p.category,color:COLORS[i],weight:first?Number(p.id==='galing'):phraseWeight(s.reviews[p.id],now),blocked:first&&p.id!=='galing'})),presentation:'wheel',step:frame.question?.step,remaining:frame.question?.remaining};
 }
 // Rules 3 replace the XP wildcard with plot-twist transfers inside the career itself.
 if(!funRules(b)&&sectionEnd&&s.checkpointAt===b.choices.length&&s.wildcardAt!==b.choices.length)return {id:'wildcard',prompt:'Wildcard · what happens next?',presentation:'wheel',remaining:frame.question?.remaining,options:WILDCARDS.map((w,i)=>({id:String(i),label:`${w.label} (${w.xp>0?'+':''}${w.xp} XP)`,weight:w.weight,color:COLORS[i]}))};
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
// Small function words: a blank on one of these is answered with another of the same kind,
// so the choice tests grammar, not a guess between unrelated words.
const FUNCTION_WORDS=new Set(['ba','na','pa','po','ho','ka','ko','mo','ako','ikaw','kita','tayo','kami','kayo','sila','siya','niya','namin','natin','nila','raw','daw','din','rin','lang','lamang','naman','nga','ang','ng','sa','si','ni','mga','ay','yung','kasi','dito','diyan','doon','ito','iyan','iyon','hindi','oo','huwag']);
const SAME_MEANING=[['raw','daw'],['rin','din'],['po','ho'],['lang','lamang']];
const plainWord=(w:string)=>w.replace(/[.,!?]/g,'').toLocaleLowerCase();
const partsOf=(p:Phrase)=>PHRASE_GUIDE[p.id]?.parts||[];
/** A one-line situation from the phrase's usage note, only when it gives nothing of the answer away. */
export function sceneFor(p:Phrase){
 const first=(p.context.split(/(?<=[.!?])\s+/)[0]||'').replace(/^Shelomi\b/,'Your partner').replace(/\bShelomi\b/g,'your partner').trim();
 const words=p.phrase.replace(/[.,!?]/g,'').split(/\s+/).map(w=>w.toLocaleLowerCase().replace(/[^\p{L}]/gu,'')).filter(w=>w.length>=3);
 const leaks=words.some(w=>new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`,'iu').test(first));
 const filler=/^(an?|the)\s+(everyday|common|casual|simple|useful|short)?\s*(taglish|tagalog|filipino)?\s*(expression|phrase|word|saying)\b/i.test(first);
 return !leaks&&!filler&&first.length>=18&&first.length<=140&&!/[→"“]/.test(first)?first:undefined;
}
// Softening particles that can stand in for one another, so swapping between them would not be clearly wrong.
const SOFTENERS=new Set(['na','lang','lamang','naman','nga','pa']);
// Word classes for look-alikes: a swap stays inside its class, so the wrong answer still sounds like Tagalog.
const WORD_CLASSES=[
 ['ako','ikaw','ka','kita','tayo','kami','kayo','sila','siya'],['mo','ko','niya','natin','namin','nila','ninyo'],
 ['ba','raw','din','na','pa','lang','naman','nga'],['ang','ng','sa','si','ni','mga'],['ito','iyan','iyon','dito','diyan','doon'],['hindi','huwag'],
];
// "po" only adds respect, so a phrase with it swapped in or out would still be right: it is never swapped.
const classOf=(w:string)=>w==='po'?undefined:WORD_CLASSES.find(c=>c.includes(w));
const tokens=(phrase:string)=>phrase.split(/\s+/).map(t=>{const m=/^(.*?)([.,!?]*)$/.exec(t)!;return {word:m[1],tail:m[2]};});
const join=(ts:{word:string;tail:string}[])=>ts.map(t=>t.word+t.tail).join(' ');
const cased=(w:string,like:string)=>/^\p{Lu}/u.test(like)?w[0].toLocaleUpperCase()+w.slice(1):w.toLocaleLowerCase();
/**
 * Look-alike wrong answers: the right phrase with one word swapped for the same kind of word, or two words
 * in the wrong order. Telling them apart takes knowing what each word does, so they can't be learned by
 * recognizing the set of options.
 */
export function lookAlikes(p:Phrase,phrases:Phrase[],rng:()=>number,keep:Set<string>=new Set()){
 const ts=tokens(p.phrase),key=normalize(p.phrase),real=new Set(phrases.map(q=>normalize(q.phrase))),out:string[]=[];
 const pool=[...new Set(phrases.filter(q=>q.id!==p.id).flatMap(q=>tokens(q.phrase).map(t=>t.word)).filter(w=>/^\p{L}+$/u.test(w)))];
 ts.forEach((t,i)=>{
  const k=t.word.toLocaleLowerCase();if(!k||keep.has(k))return;
  const cls=classOf(k),twins=new Set(SAME_MEANING.find(g=>g.includes(k))||[k]);
  if(FUNCTION_WORDS.has(k)&&!cls)return;
  // Function words swap within their class; content words swap with content words from the same kind of conversation.
  const sameTopic=new Set(phrases.filter(q=>q.id!==p.id&&q.category===p.category).flatMap(q=>tokens(q.phrase).map(t=>t.word.toLocaleLowerCase())));
  const candidates=cls?cls.map(w=>w):pool.filter(w=>{const x=w.toLocaleLowerCase();return x.length>=3&&!FUNCTION_WORDS.has(x)&&sameTopic.has(x);});
  const choices=shuffle(candidates.filter(w=>{const x=w.toLocaleLowerCase();return x!==k&&!twins.has(x)&&!(SOFTENERS.has(k)&&SOFTENERS.has(x))&&!ts.some(o=>o.word.toLocaleLowerCase()===x);}),rng).slice(0,2);
  for(const w of choices)out.push(join(ts.map((o,j)=>j===i?{...o,word:cased(w,o.word)}:o)));
 });
 if(ts.length>=3)for(let i=1;i<ts.length-1;i++){const sw=ts.map(o=>({...o}));[sw[i].word,sw[i+1].word]=[sw[i+1].word,sw[i].word];out.push(join(sw));}
 return shuffle([...new Set(out)].filter(o=>{const n=normalize(o);return n!==key&&!real.has(n);}),rng);
}
// The blank goes on a word worth learning: not a loanword (Sure, Miss) and, when possible, not a tiny function word.
function blankIndex(p:Phrase,words:string[],rng:()=>number){
 const parts=partsOf(p),gloss=(i:number)=>parts[i]?.meaning?.toLocaleLowerCase()||'';
 const loan=(i:number)=>!!gloss(i)&&gloss(i)===plainWord(words[i]);
 const content=words.map((_,i)=>i).filter(i=>!loan(i)&&!FUNCTION_WORDS.has(plainWord(words[i])));
 const any=words.map((_,i)=>i).filter(i=>!loan(i));
 const pool=content.length?content:any.length?any:words.map((_,i)=>i);
 return pool[randomIndex(pool.length,rng)];
}
// Typing from memory was too hard, so new quizzes never ask for it; old saved typing quizzes still grade.
const LADDER:Challenge['mode'][]=['meaning','translate','recall','build'];
export function makeChallenge(p:Phrase,review:Review|undefined,id:string,phrases:Phrase[],rng=Math.random,tier=0,maxStep=3):Challenge{
 const words=p.phrase.replace(/[.!?]/g,'').split(/\s+/),streak=review?.streak??0;
 // Recognize it, pick the Tagalog, fill one word, then order the words (with decoys at the top levels).
 // A phrase you know well climbs on its own; the career's progress sets the floor.
 const byStreak=!review||streak<2?0:streak===2?1:streak===3?2:3;
 let step=Math.min(maxStep,3,Math.max(byStreak,tier));if(step===3&&words.length<2)step=2;
 const mode=LADDER[step];
 const base={id,phraseId:p.id,mode,revision:2,first:false,tries:0,solved:false,level:Math.min(QUIZ_LEVELS.length-1,tier)+1};
 const otherWords=(exclude:string)=>distinctFrom(exclude,phrases.filter(q=>q.id!==p.id).flatMap(q=>q.phrase.replace(/[.,!?]/g,'').split(/\s+/)));
 const parts=partsOf(p);
 if(mode==='recall'){
  // Fill the gap, with the English meaning shown, and wrong options of the same kind of word.
  const missingIndex=blankIndex(p,words,rng),target=words[missingIndex].replace(/,/g,''),key=plainWord(target),isFunction=FUNCTION_WORDS.has(key);
  const twins=new Set(SAME_MEANING.find(g=>g.includes(key))||[key]);
  const inSentence=new Set(words.map(plainWord));
  const others=otherWords(target).filter(w=>!twins.has(plainWord(w))&&!inSentence.has(plainWord(w)));
  const sameKind=others.filter(w=>FUNCTION_WORDS.has(plainWord(w))===isFunction);
  const pool=sameKind.length>=WRONG_OPTIONS?sameKind:[...sameKind,...others.filter(w=>!sameKind.includes(w))];
  // Every option is capitalized the same way as the missing word, so case never gives the answer away.
  const capital=/^\p{Lu}/u.test(target),asInSlot=(w:string)=>{const b=w.replace(/[.,!?]/g,'');return capital?b[0].toLocaleUpperCase()+b.slice(1):b.toLocaleLowerCase();};
  const close=distinctFrom(target,shuffle(pool,rng).sort((a,b)=>Math.abs(a.length-target.length)-Math.abs(b.length-target.length)).map(asInSlot)).slice(0,WRONG_OPTIONS);
  const gloss=parts[missingIndex]?.meaning;
  return {...base,cue:words.map((w,i)=>i===missingIndex?'_____':w).join(' '),missingIndex,options:shuffle([target,...close],rng),support:p.meaning,
   hints:[gloss?`The missing word means “${gloss}”.`:`The missing word has ${target.length} letters.`,`It starts with “${target[0]}”.`],prompt:'Ano ang kulang? Fill in the missing word.'};
 }
 if(mode==='translate'){
  // A situation first, then the English, then near-miss Tagalog choices.
  // Familiar phrases (or an answer that shares a word with the English) get look-alike wrong answers;
  // the rest are sampled from a wide pool of near misses so the set of options keeps changing.
  // Words the English and the Tagalog share (loanwords like "okay") stay in every look-alike, so they can't give it away.
  const shared=new Set((p.meaning.toLocaleLowerCase().match(/\p{L}{3,}/gu)||[]).filter(w=>new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`,'iu').test(p.phrase)));
  const englishOverlap=shared.size>0;
  const alike=streak>=1||tier>=1||englishOverlap?lookAlikes(p,phrases,rng,shared).slice(0,englishOverlap?3:2):[];
  const near=shuffle(distinctFrom(p.phrase,nearMisses(p,phrases,rng).slice(0,10).map(q=>q.phrase)),rng);
  const wrong=distinctFrom(p.phrase,[...alike,...near]).slice(0,WRONG_OPTIONS);
  return {...base,cue:p.meaning,scene:sceneFor(p),options:shuffle([p.phrase,...wrong],rng),
   hints:[`It starts with “${words[0]}…”.`,parts[1]?`“${parts[1].word}” means ${parts[1].meaning}.`:`It has ${words.length} ${words.length===1?'word':'words'}.`],prompt:'Ano ang sasabihin mo? Pick what you’d say.'};
 }
 if(mode==='build'){
  return {...base,cue:words[0]+' '+words.slice(1).map(()=>'_____').join(' '),options:shuffle([...words],rng),support:p.meaning,
   hints:[words[1]?`The next word is “${words[1]}”.`:'',parts.length?`Word by word: ${parts.map(x=>x.meaning).join(' · ')}.`:''].filter(Boolean),prompt:'I-arrange mo ang words. Put them in order.'};
 }
 // Recognize: the hint explains one key word, never the whole meaning.
 const key=[...parts].filter(x=>x.meaning&&plainWord(x.word)!==x.meaning.toLocaleLowerCase()).sort((a,b)=>b.word.length-a.word.length)[0];
 return {...base,first:true,cue:p.phrase,options:shuffle([p.meaning,...shuffle(distinctFrom(p.meaning,nearMisses(p,phrases,rng).slice(0,8).map(q=>q.meaning)),rng).slice(0,WRONG_OPTIONS)],rng),
  hints:key?[`“${key.word}” means ${key.meaning}.`]:[],prompt:'Ano ang meaning nito? What does it mean?'};
}
export function upgradePending(s:Career,phrases:Phrase[]):Career{
 // Old quizzes are rebuilt in the current format, and an open typing quiz becomes word ordering.
 if(!s.pending||s.pending.solved||(s.pending.revision===2&&s.pending.mode!=='type'))return s;
 const p=phrases.find(p=>p.id===s.pending!.phraseId);if(!p)return s;
 const streak=({translate:2,recall:3,build:4,type:4} as Record<string,number>)[s.pending.mode],review=streak?{seen:1,correct:1,streak,due:0,last:0}:undefined;
 const pending=makeChallenge(p,review,s.pending.id,phrases,()=>.5);pending.tries=s.pending.tries;pending.feedback=s.pending.feedback;pending.training=s.pending.training;
 return {...s,pending};
}
export function careerTrophies(p:SimProfile|undefined):Record<string,number>{if(!p)return {};return trophies(p);}
function trophies(p:SimProfile):Record<string,number>{return {ucl:p.euro?.UCL||0,uel:p.euro?.UEL||0,uecl:p.euro?.UECL||0,league:p.leaguesN||0,cup:p.cupsN||0,world:p.wcWins||0,continental:p.contWins||0,ballon:p.ballonN||0,boot:p.boots||0,toty:p.toty||0,pots:p.pots||0};}
function eventKind(id:string):EventKind{
 if(/^(stat|imp|fam)/.test(id))return 'training';if(/^(tm|lg|yr)/.test(id))return 'transfer';
 if(/^(lt|dc|eu|intl|boot|ballon|toty|pots)/.test(id))return 'award';if(/^(goals|assists)/.test(id))return 'match';return 'rest';
}
// Career rounds pay modestly so trophies feel good without flooding XP; the Tagalog quizzes are the main earner.
export function careerRoundXp(id:string,index:number,title:string,value?:number){
 if(/^stat[0-5]$/.test(id)||id==='weakf'||id==='skillm')return index+1;
 if(/^(lg|tm|yr)\d/.test(id))return 5;
 if(/^lt\d/.test(id))return Math.min(index,10)*3;
 if(/^dc\d/.test(id))return index*3;
 if(/^eu[dn]\d/.test(id))return 0;
 if(/^euw/.test(id))return ({UCL:20,UEL:12,UECL:8} as Record<string,number>)[title]??8;
 if(/^intl/.test(id))return title==='Winner'?(id.startsWith('intlwc')?40:20):2;
 if(id==='goals'||id==='assists')return value===undefined?2:5;
 if(id==='boots')return (index+1)*10;
 if(id==='ballonN')return (index+1)*25;
 if(id==='toty')return index*3;
 if(id==='pots')return index*5;
 if(id==='bootsD'||id==='ballon')return 0;
 return 2;
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
  s.pending=makeChallenge(p,s.reviews[p.id],id,phrases,rng,Math.min(CHECKPOINT_MAX_STEP,quizTier(s,q.remaining)),CHECKPOINT_MAX_STEP);s.checkpointAt=builder.choices.length;
  // The event describes the checkpoint, never its English answer.
  e={id,kind:'message',title:'Tagalog checkpoint',detail:p.category,reward:`+${QUIZ_XP} XP and a lucky boost`,day:s.day,season:s.season,question:q.prompt,optionIndex:index,outcome:p.category,wheel:q};
 }else if(q.id==='wildcard'){
  const index=weightedIndex(WILDCARDS.map(w=>w.weight),rng),card=WILDCARDS[index];
  s.xp=Math.max(0,s.xp+card.xp);s.wildcardAt=builder.choices.length;
  e={id,kind:'rest',title:card.label,detail:q.prompt,reward:`${card.xp>0?'+':''}${card.xp} XP`,day:s.day,season:s.season,question:q.prompt,optionIndex:index,outcome:card.label,wheel:q};
 }else{
  const previous=trophies(s.profile!),forced=q.id==='nationality'&&s.preferredNationality?q.options.findIndex(o=>o.label===s.preferredNationality):undefined;
  const r=rulesFor(builder).advanceCareer(builder.seed,builder.choices,rng,s.trainingPoints,forced!==undefined&&forced>=0?forced:undefined,luckOf(s),builder.rules);
  if(s.boost)s.boost--;
  builder.choices.push(r.record);builder.complete=r.complete;s.profile=r.profile;
  const values=trophies(r.profile);let awardId:string|undefined;
  for(const [key,count]of Object.entries(values)){const gain=count-(previous[key]||0);if(gain>0){s.trophies[key]=(s.trophies[key]||0)+gain;awardId=key;}}
  if(r.profile.club)s.club=r.profile.club;if(r.profile.goals!==undefined)s.goals=r.profile.goals;if(r.profile.assists!==undefined)s.assists=r.profile.assists;
  const xp=careerRoundXp(q.id,r.index,r.title,r.value);s.xp+=xp;
  const statLabel=/^stat[0-5]$/.test(q.id)?r.profile.stats[Number(q.id.slice(4))].label:'';
  e={id,kind:eventKind(q.id),title:r.title,detail:q.prompt,reward:`+${xp} XP${statLabel?` · ${statLabel} checkpoint`:''}`,day:s.day,season:s.season,question:q.prompt,optionIndex:r.index,outcome:r.title,awardId,wheel:q};
  // Every attribute is followed by a Tagalog training question that can move it.
  if(/^stat[0-5]$/.test(q.id)&&!r.complete){
   const tier=quizTier(s,r.next?.remaining),stat=r.profile.stats[Number(q.id.slice(4))],pool=phrasePool(phrases,s,tier),p=choosePhrase(pool,s,now,rng);
   const challenge=makeChallenge(p,s.reviews[p.id],id,phrases,rng,tier),{difficulty,gain,penalty}=exerciseDifficulty(p,challenge.mode);
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
 if(q.shot==='pending')throw new Error('Take your penalty shot first.');
 q.tries++;const correct=normalize(answer)===normalize(expected),firstTry=q.tries===1;
 if(q.training&&q.training.delta===undefined){
  const t=q.training,points={...(s.trainingPoints||{})},delta=Math.min(100,Math.max(10,t.base+(correct?t.gain:0)))-t.base;
  t.delta=delta;points[t.key]=(points[t.key]||0)+delta;s.trainingPoints=points;
 }
 if(correct){
  // First-try answers build a combo worth extra XP; any correct answer charges lucky spins.
  q.solved=true;q.earned=firstTry?QUIZ_XP:0;s.xp+=q.earned;
  if(firstTry&&s.builder&&funRules(s.builder)){q.boost=BOOST_SPINS;s.boost=Math.min(6,(s.boost||0)+q.boost);}
  const old=s.reviews[p.id]||{seen:0,correct:0,streak:0,due:0,last:0},streak=firstTry?old.streak+1:0;
  s.reviews[p.id]={seen:old.seen+1,correct:old.correct+(firstTry?1:0),streak,last:now,due:now+(streak===0?300000:[0,14400000,86400000,259200000,604800000][Math.min(streak,4)])};q.feedback='Tama!';
 }else{
  // No XP moves yet: the player takes a penalty shot first (takeShot), and the shot sets the cost.
  q.shot='pending';
  // The wrong choice drops out, and the next hint (shown by the quiz view) appears.
  if(q.options.length&&q.mode!=='build'){const miss=q.options.find(o=>normalize(o)===normalize(answer));if(miss&&!(q.removed||[]).includes(miss))q.removed=[...(q.removed||[]),miss];}
  // Typing has no options to narrow down, so repeated misses earn a first-letter hint.
  q.feedback=q.mode==='type'&&q.tries>=2?`Try ulit. Hint: ${p.phrase.split(/\s+/).map(w=>w[0]+'…').join(' ')}`:'Try ulit.';
 }
 return {state:upgradeCareer(s),correct};
}
/** The penalty shot after a wrong answer: a bullseye saves the score, a hit costs 100 XP, a miss 200. XP never goes below 0. */
export function takeShot(input:Career,result:string):Career{
 const s=structuredClone(input),q=s.pending;
 if(!q||q.shot!=='pending')throw new Error('There is no penalty shot to take.');
 if(!Object.hasOwn(SHOT_COST,result))throw new Error('Unknown shot result.');
 const cost=SHOT_COST[result as ShotResult];s.xp=Math.max(0,s.xp-cost);
 q.shot=undefined;q.lastShot={result:result as ShotResult,cost};q.shots=[...(q.shots||[]),result as ShotResult];
 return s;
}
function freshRun(input:Career,preferredNationality?:string):Career{
 const next=initialCareer();return {...next,season:input.season+1,xp:input.xp,kit:input.kit,reviews:input.reviews,trophies:input.trophies,history:input.history,...(preferredNationality?{preferredNationality}:{})};
}
export function nextSeason(input:Career):Career{
 if(!isCareerComplete(input)||input.pending)throw new Error('Finish this career and any open quiz first.');
 return freshRun(input);
}
export function restartCareer(input:Career,nationality?:string):Career{return freshRun(input,nationality);}
