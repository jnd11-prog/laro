import test from 'node:test';
import assert from 'node:assert/strict';
import {initialCareer,spinCareer,answerChallenge,makeChallenge,upgradePending,upgradeCareer,phraseWeight,nextSeason,restartCareer,phrasePool,isCareerComplete,getSpinQuestion,quizRewards,CAREER_RULES,careerRoundXp,COMBO_XP,BOOST_SPINS,BOOST_LUCK,quizTier,CHECKPOINT_MAX_STEP} from '../lib/engine.ts';
import * as careerV2 from '../lib/player-career-v2.js';
import {PHRASE_GUIDE} from '../lib/phrase-guide.ts';
import * as careerV1 from '../lib/player-career-v1.js';
import {inspectCareer,advanceCareer} from '../lib/player-career.js';
import {wheelSegments,landingRotation} from '../lib/wheel.ts';
import {quizView} from '../lib/quiz.ts';
import {CATALOG} from '../lib/catalog.ts';
const now=1800000000000;
const p=CATALOG[0];
function conversation(){let s=initialCareer(42),i=0;while(!s.pending)s=spinCareer(s,CATALOG,`spin-${i++}`,now,()=>.6).state;return s;}
function reach(done){let s=initialCareer(42),i=0;while(!done(s)){s=spinCareer(s,CATALOG,`step-${i++}`,now,()=>.6).state;if(s.pending&&!done(s)){s=answerChallenge(s,CATALOG,answerFor(s.pending),now).state;s.pending=null;}}return s;}
const atCheckpoint=()=>reach(s=>getSpinQuestion(s,CATALOG,now).id==='phrase');
const atSectionCheckpoint=()=>reach(s=>getSpinQuestion(s,CATALOG,now).id==='phrase'&&s.builder.choices.at(-1)?.id==='skillm');
const trainingRound=()=>reach(s=>!!s.pending?.training);
const rewards=q=>quizRewards(CATALOG.find(p=>p.id===q.phraseId),q.mode);
function answerFor(q){const p=CATALOG.find(p=>p.id===q.phraseId);return q.mode==='meaning'?p.meaning:q.mode==='recall'?p.phrase.replace(/[.!?]/g,'').split(/\s+/)[q.missingIndex]:p.phrase;}

test('attachment questions begin with position, nationality, debut age, and height',()=>{
 const choices=[],prompts=[];for(let i=0;i<4;i++){const frame=inspectCareer(42,choices);prompts.push(frame.question.prompt);choices.push(advanceCareer(42,choices,()=>.6).record);}
 assert.deepEqual(prompts,["What position?","What's your nationality?",'What age do you make your pro debut?','How tall are you?']);
});
test('attribute rounds pause for a Tagalog training question',()=>{
 const s=trainingRound();assert.equal(s.pending.training.key,'pace');assert.equal(s.pending.revision,2);
 assert.throws(()=>spinCareer(s,CATALOG,'blocked'),/Finish your Tagalog/);
});
test('quiz cue does not reveal its English gloss or context, including after mistakes',()=>{
 const s=conversation();let view=quizView(s.pending,p);assert.equal(view.title,p.phrase);assert.equal(view.meaning,null);assert.equal(view.context,null);
 for(let i=0;i<3;i++){s.pending=answerChallenge(s,CATALOG,'wrong',now).state.pending;view=quizView(s.pending,p);assert.equal(view.meaning,null);assert.equal(view.context,null);assert.equal(s.pending.feedback,'Try ulit.');}
});
test('Tagalog checkpoint wheels and spin results never display the full phrase before an exercise',()=>{
 for(const streak of [undefined,1,2]){
  const s=atCheckpoint();s.reviews=streak?{[p.id]:{seen:streak,correct:streak,streak,due:0,last:0}}:{};
  const q=getSpinQuestion(s,CATALOG,now),result=spinCareer(s,CATALOG,`privacy-${streak}`,now,()=>0);
  const visible=[...q.options.map(o=>o.label),...result.event.wheel.options.map(o=>o.label),result.event.title,result.event.detail,result.event.outcome].join(' ');
  for(const phrase of CATALOG)assert.ok(!visible.toLowerCase().includes(phrase.phrase.replace(/[.!?]/g,'').toLowerCase()),`hidden phrase: ${phrase.id}`);
  assert.equal(result.state.pending.mode,streak===2?'translate':'meaning');
 }
});
test('translation is revealed after a correct answer',()=>{
 const s=answerChallenge(conversation(),CATALOG,p.meaning,now).state;const view=quizView(s.pending,p);assert.equal(view.meaning,p.meaning);assert.equal(view.context,p.context);
});
test('mistakes cost nothing, a retry still earns XP, and first tries build a combo',()=>{
 const s=conversation(),{win,loss,retry}=rewards(s.pending),xp=s.xp;assert.equal(loss,0);const wrong=answerChallenge(s,CATALOG,'wrong',now);assert.equal(wrong.correct,false);assert.equal(wrong.state.xp,xp);
 const right=answerChallenge(wrong.state,CATALOG,p.meaning,now);assert.equal(right.correct,true);assert.equal(right.state.xp,xp+retry);assert.equal(right.state.reviews.galing.due,now+300000);assert.equal(right.state.combo,0);
 assert.equal(answerChallenge(right.state,CATALOG,p.meaning,now).state.xp,xp+retry);assert.ok(win>retry);
 const streaky={...s,combo:2},first=answerChallenge(streaky,CATALOG,p.meaning,now).state;assert.equal(first.combo,3);assert.equal(first.xp,xp+win+2*COMBO_XP);
});
test('a correct Tagalog answer charges lucky spins that lean the wheel toward good outcomes',()=>{
 const s=trainingRound(),solved=answerChallenge(s,CATALOG,answerFor(s.pending),now).state;assert.equal(solved.boost,Math.min(6,(s.boost||0)+BOOST_SPINS));assert.equal(solved.pending.boost,BOOST_SPINS);
 const next={...solved,pending:null},spun=spinCareer(next,CATALOG,'lucky',now,()=>.6).state;assert.equal(spun.boost,solved.boost-1);
 const plain=inspectCareer(s.builder.seed,next.builder.choices,next.trainingPoints,0).question,lucky=inspectCareer(s.builder.seed,next.builder.choices,next.trainingPoints,BOOST_LUCK).question;
 const top=q=>q.options.at(-1).weight/q.options.reduce((a,o)=>a+o.weight,0);assert.ok(top(lucky)>top(plain),`${top(lucky)} > ${top(plain)}`);
});
test('first-try success schedules later review without mutating the original career',()=>{
 const s=conversation(),{win}=rewards(s.pending);const right=answerChallenge(s,CATALOG,p.meaning,now).state;assert.equal(s.pending.solved,false);assert.equal(right.xp,s.xp+win);assert.equal(right.reviews.galing.streak,1);
});
test('recall uses a missing Tagalog word, never the English meaning as the cue',()=>{
 const review={seen:3,correct:3,streak:3,due:0,last:0};const q=makeChallenge(p,review,'cloze',CATALOG,()=>.5);
 assert.equal(q.mode,'recall');assert.match(q.cue,/_____/);assert.ok(!q.cue.includes(p.meaning));
 const s=initialCareer(42);s.pending=q;assert.equal(answerChallenge(s,CATALOG,p.meaning,now).correct,false);assert.equal(answerChallenge(s,CATALOG,['Ang','galing','mo'][q.missingIndex],now).correct,true);
});
test('word ordering hides the full phrase and grades the complete ordered answer',()=>{
 const q=makeChallenge(p,{seen:4,correct:4,streak:4,due:0,last:0},'build',CATALOG,()=>.5);assert.equal(q.mode,'build');assert.equal(q.options.length,3);assert.notEqual(q.cue,p.phrase);assert.ok(!q.cue.includes(p.meaning));
 const s=initialCareer(42);s.pending=q;assert.equal(answerChallenge(s,CATALOG,'ang galing mo',now).correct,true);assert.equal(answerChallenge(s,CATALOG,'mo ang galing',now).correct,false);
});
test('legacy quizzes upgrade deterministically and preserve their attempt count',()=>{
 const s=conversation();delete s.pending.revision;s.pending.mode='recall';s.pending.tries=2;
 const a=upgradePending(s,CATALOG),b=upgradePending(s,CATALOG);assert.deepEqual(a.pending,b.pending);assert.equal(a.pending.tries,2);assert.match(a.pending.cue,/_____/);
});
test('overdue and weak phrases receive higher review priority',()=>{
 assert.ok(phraseWeight({seen:1,correct:0,streak:0,due:now-1,last:0},now)>phraseWeight(undefined,now));
 assert.ok(phraseWeight(undefined,now)>phraseWeight({seen:1,correct:1,streak:1,due:now+1,last:0},now));
});
test('weighted wheel geometry agrees with the backend probability and landing result',()=>{
 const options=[{id:'no',label:'No',color:'#ffffff',weight:9},{id:'yes',label:'Yes',color:'#000000',weight:1},{id:'blocked',label:'Blocked',color:'#222222',weight:0}];
 const seg=wheelSegments(options);assert.equal(seg[0].span,324);assert.equal(seg[1].span,36);assert.equal(seg[2].span,0);assert.equal(seg[1].probability,.1);
 const target=landingRotation(options,1);assert.ok(Math.abs(((target+seg[1].mid)%360+360)%360)<1e-6);assert.throws(()=>landingRotation(options,2),/unavailable/);
});
test('replay is deterministic, and independent careers never share mutable state',()=>{
 const choices=[];for(let i=0;i<25;i++)choices.push(advanceCareer(42,choices,()=>.6).record);
 const a=inspectCareer(42,choices),b=inspectCareer(42,choices);assert.deepEqual(a,b);
 const empty=inspectCareer(99,[]);assert.equal(empty.profile.position,undefined);assert.equal(empty.choices,0);assert.equal(choices.length,25);
 assert.throws(()=>inspectCareer(42,[{id:'wrong',index:0,type:'spin'}]),/does not match/);
});
test('complete career flow respects years, stat bounds, trophy limits, and numeric counters across seeds',()=>{
 for(let seed=1;seed<=30;seed++){
  const choices=[];let f=inspectCareer(seed,choices),guard=0;while(!f.complete&&guard++<500){const r=advanceCareer(seed,choices,()=>((seed*31+guard*17)%100)/100);choices.push(r.record);f=inspectCareer(seed,choices);}
  assert.equal(f.complete,true,`seed ${seed} completes`);assert.ok(guard<500);assert.equal(f.profile.clubs.length,f.profile.nclubs);
  assert.equal(f.profile.clubs.reduce((n,c)=>n+c.years,0),f.profile.seasons);assert.ok(f.profile.stats.every(s=>s.value>=10&&s.value<=100));assert.ok(f.profile.overall>=46&&f.profile.overall<=99);
  assert.ok(f.profile.goals>=0&&f.profile.goals<=1150);assert.ok(f.profile.assists>=0&&f.profile.assists<=430);
  for(const c of f.profile.clubs){assert.ok(c.years>=1);assert.ok(c.lt<=c.years);assert.ok(c.dc<=Math.min(c.years,7));assert.ok((c.euroWon?.length||0)<=c.years);}
  assert.ok(choices.some(c=>c.id==='goals'&&c.type==='roll'));assert.ok(choices.some(c=>c.id==='assists'&&c.type==='roll'));assert.ok(choices.some(c=>c.id==='ballon'));assert.ok(choices.some(c=>c.id==='toty'));assert.ok(choices.some(c=>c.id==='pots'));
 }
});
test('full game reaches a career card and a new run preserves learning and earned unlocks',()=>{
 let s=initialCareer(42),round=0;while(!isCareerComplete(s)&&round<600){s=spinCareer(s,CATALOG,`run-${round++}`,now,()=>.6).state;if(s.pending){s=answerChallenge(s,CATALOG,answerFor(s.pending),now).state;s.pending=null;}}
 assert.equal(isCareerComplete(s),true);assert.equal(s.profile.clubs.length,4);assert.equal(s.profile.goals,s.goals);assert.ok(Object.keys(s.trophies).length>0);assert.throws(()=>spinCareer(s,CATALOG,'overflow'),/Career complete/);
 const next=nextSeason(s);assert.equal(next.season,2);assert.equal(next.spins,0);assert.equal(next.xp,s.xp);assert.equal(next.kit,s.kit);assert.deepEqual(next.reviews,s.reviews);assert.deepEqual(next.trophies,s.trophies);assert.equal(next.builder.choices.length,0);
});
test('legacy career metadata and trophies survive the builder upgrade',()=>{
 const old=initialCareer(42);old.xp=177;old.kit='blue';old.rating=62;old.trophies={ucl:2};delete old.builder;delete old.profile;
 const next=upgradeCareer(old);assert.equal(next.xp,177);assert.equal(next.kit,'blue');assert.equal(next.trophies.ucl,2);assert.equal(next.builder.choices.length,0);assert.equal(next.rating,0);assert.equal(old.builder,undefined);
});
test('a one-word phrase is never a word-order exercise that shows its own answer',()=>{
 const word={id:'salamat-solo',phrase:'Salamat.',meaning:'Thanks.',context:'Test.',category:'Family'};
 const recall=makeChallenge(word,{seen:3,correct:3,streak:3,due:0,last:0},'solo',[word,...CATALOG],()=>.5);assert.equal(recall.mode,'recall');assert.equal(recall.cue,'_____');assert.ok(recall.options.includes('Salamat'));
 assert.equal(makeChallenge(word,{seen:5,correct:5,streak:5,due:0,last:0},'solo2',[word,...CATALOG],()=>.5).mode,'recall');
});
test('wrong options never repeat each other or duplicate the correct answer',()=>{
 const twin={id:'twin',phrase:'Magaling ka!',meaning:p.meaning,context:'Test.',category:'Matchday'};
 const repeat={id:'repeat',phrase:'Ang husay mo!',meaning:'Great job.',context:'Test.',category:'Matchday'};
 const again={id:'again',phrase:'Husay!',meaning:'great job',context:'Test.',category:'Matchday'};
 const pool=[p,twin,repeat,again];
 for(let i=0;i<40;i++){
  const rng=(()=>{let n=i;return()=>(n=(n*73+11)%101)/101;})();
  const q=makeChallenge(p,undefined,`meaning-${i}`,pool,rng);
  const seen=q.options.map(o=>o.toLowerCase().replace(/[.,!?]/g,'').trim());
  assert.equal(new Set(seen).size,seen.length,q.options.join(' | '));
  assert.equal(q.options.filter(o=>o===p.meaning).length,1);
 }
});
test('a new career cannot start until the current one and its quiz are finished',()=>{
 assert.throws(()=>nextSeason(initialCareer(42)),/Finish this career/);
});
function simulate(seed){let n=seed*2654435761>>>0;const rng=()=>(n=(n*1664525+1013904223)>>>0)/4294967296;const choices=[],prompts=[];let f=inspectCareer(seed,choices);while(!f.complete){prompts.push(f.question);choices.push(advanceCareer(seed,choices,rng).record);f=inspectCareer(seed,choices);}return {profile:f.profile,prompts};}
const careers=Array.from({length:400},(_,i)=>simulate(i+1));
test('careers end at believable ages and heights',()=>{
 for(const {profile:p} of careers){assert.ok(p.retirementAge<=(p.position==='GK'?44:41),`${p.position} retires at ${p.retirementAge}`);assert.ok(p.seasons>=10);}
});
test('career totals stay in range for each position',()=>{
 const maxGoals={GK:13,CB:188,RB:157,LB:157,CDM:188,CM:375,CAM:625,RM:625,LM:625,RW:1000,LW:1000,ST:1125};
 for(const {profile:p} of careers){assert.ok(p.goals<=maxGoals[p.position],`${p.position} scored ${p.goals}`);if(p.overall<65)assert.ok(p.toty<=1,`overall ${p.overall} with ${p.toty} TOTY`);}
});
test('club rules match the real game',()=>{
 for(const {profile:p} of careers)for(const c of p.clubs){
  if(c.name==='Athletic Club')assert.ok(['Spain','France'].includes(p.nationality),p.nationality);
  if(c.cont)assert.ok(!(c.euroWon||[]).some(t=>['UCL','UEL','UECL'].includes(t)),`${c.name} won ${c.euroWon}`);
  assert.ok(c.lt<=Math.min(18,c.years),`${c.lt} titles in ${c.years} seasons`);
 }
});
test('tournaments follow the real calendar and skip rounds that do not exist',()=>{
 for(const {profile:p,prompts} of careers){
  for(const t of p.intl||[]){
   assert.ok(t.year>=2027);
   if(t.name==='World Cup')assert.equal((t.year-2030)%4,0);
   if(t.name==='Euro'||t.name==='Copa América')assert.equal((t.year-2028)%4,0);
   if(t.name==='Asian Cup')assert.equal((t.year-2027)%4,0);
   if(t.name==='Gold Cup')assert.equal(t.year%2,1);
  }
  for(const q of prompts.filter(q=>/^(Copa América|Gold Cup) /.test(q.prompt)))assert.ok(!q.options.some(o=>o.label==='Round of 16'),q.prompt);
  for(const q of prompts.filter(q=>/^Copa América /.test(q.prompt)))assert.ok(q.options.find(o=>o.label==='Did not qualify').blocked,q.prompt);
 }
});
test('a career started under the original questions keeps replaying them',()=>{
 const choices=[];for(let i=0;i<20;i++)choices.push(careerV1.advanceCareer(42,choices,()=>.6).record);
 const old=initialCareer(42);delete old.builder.rules;old.builder.choices=choices;old.xp=9868;old.kit='gold';old.trophies={league:20};old.reviews={galing:{seen:1,correct:1,streak:1,due:0,last:0}};
 const next=upgradeCareer(old);assert.equal(next.builder.choices.length,20);assert.equal(next.builder.rules,undefined);assert.equal(next.xp,9868);assert.equal(next.kit,'gold');assert.deepEqual(next.trophies,{league:20});assert.deepEqual(next.reviews,old.reviews);
 assert.ok(spinCareer({...next,pending:null},CATALOG,'keeps-going',now,()=>.6).state.builder.choices.length>=20);
});
test('training changes the attribute once and keeps it between 10 and 100',()=>{
 const s=trainingRound(),t=s.pending.training,rightAnswer=answerFor(s.pending);
 assert.equal(t.gain,10);const right=answerChallenge(s,CATALOG,rightAnswer,now).state;assert.equal(right.pending.training.delta,10);assert.equal(right.trainingPoints[t.key],10);
 const wrong=answerChallenge(s,CATALOG,'wrong',now).state;assert.ok(wrong.pending.training.delta===0);
 const fixed=answerChallenge(wrong,CATALOG,rightAnswer,now).state;assert.ok(fixed.trainingPoints[t.key]===0);
 const top={...s,pending:{...s.pending,training:{...t,base:100}}};assert.equal(answerChallenge(top,CATALOG,rightAnswer,now).state.pending.training.delta,0);
});
test('a section ends with a Tagalog checkpoint, then a plot twist that can switch you to a giant',()=>{
 let s=atSectionCheckpoint();const c=spinCareer(s,CATALOG,'check',now,()=>.6);assert.equal(c.event.title,'Tagalog checkpoint');s=answerChallenge(c.state,CATALOG,answerFor(c.state.pending),now).state;s.pending=null;
 const q=getSpinQuestion(s,CATALOG,now);assert.equal(q.id,'twist0');assert.equal(q.options[0].label,'No drama');
 const twist=spinCareer(s,CATALOG,'twist',now,()=>.999);assert.match(twist.event.title,/^Switch to /);
 const club=twist.event.title.replace(/^Switch to |!$/g,'');let after=twist.state,guard=0;
 while(!after.profile.clubs?.[0]&&guard++<5)after=spinCareer(after,CATALOG,`after-${guard}`,now,()=>.6).state;
 assert.equal(after.profile.clubs[0].name,club,'the league and club resolve by themselves');
});
test('careers on the realistic rules still get the XP wildcard',()=>{
 const choices=[];let f;for(;;){f=careerV2.inspectCareer(7,choices);if(f.question.id==='skillm'||choices.at(-1)?.id==='skillm')break;choices.push(careerV2.advanceCareer(7,choices,()=>.6).record);}
 const s=initialCareer(7);s.builder={seed:7,choices,complete:false,rules:2};const up=upgradeCareer(s);
 const at=reach2(up);assert.equal(getSpinQuestion(at,CATALOG,now).id,'wildcard');
});
function reach2(s){let i=0;while(getSpinQuestion(s,CATALOG,now).id!=='wildcard'&&i<40){s=spinCareer(s,CATALOG,`v2-${i++}`,now,()=>.6).state;if(s.pending){s=answerChallenge(s,CATALOG,answerFor(s.pending),now).state;s.pending=null;}}return s;}
test('the Philippines and South Korea are football superpowers',()=>{
 const first=advanceCareer(1,[],()=>0).record,q=inspectCareer(1,[first]).question,w=Object.fromEntries(q.options.map(o=>[o.label,o.weight]));
 assert.ok(w.Philippines>w.Brazil&&w['South Korea']>w.Brazil);
});
test('league title wheels never offer more titles than seasons at the club, up to 18',()=>{
 for(const {prompts} of careers)for(const q of prompts.filter(q=>/^lt\d/.test(q.id))){const yrs=Number(/in (\d+) season/.exec(q.prompt)[1]);assert.equal(q.options.at(-1).label,String(Math.min(18,yrs)),q.prompt);}
});
test('careers started on the first fun rules replay old title answers but get capped wheels from now on',()=>{
 let choices=[],f=inspectCareer(5,choices,{},0,3);while(!f.complete&&!/^lt\d/.test(f.question.id)){choices.push(advanceCareer(5,choices,()=>.6,{},undefined,0,3).record);f=inspectCareer(5,choices,{},0,3);}
 const yrs=Number(/in (\d+) season/.exec(f.question.prompt)[1]);assert.equal(f.question.options.at(-1).label,String(Math.min(18,yrs)),'new title wheels are capped');
 choices.push({id:f.question.id,index:18,type:'spin'});assert.doesNotThrow(()=>inspectCareer(5,choices,{},0,3),'an old 18-title answer still replays');
});
test('restarting keeps learning progress and guarantees a chosen nationality',()=>{
 const s=conversation();s.xp=777;s.reviews={galing:{seen:1,correct:1,streak:1,due:0,last:0}};s.kit='blue';
 let next=restartCareer(s,'Philippines');assert.equal(next.season,s.season+1);assert.equal(next.xp,777);assert.equal(next.kit,'blue');assert.equal(next.pending,null);assert.equal(next.builder.rules,CAREER_RULES);
 next=spinCareer(next,CATALOG,'pos',now,()=>.6).state;const q=getSpinQuestion(next,CATALOG,now);assert.equal(q.id,'nationality');assert.equal(q.options.filter(o=>!o.blocked).length,1);
 assert.equal(spinCareer(next,CATALOG,'nat',now,()=>0).state.profile.nationality,'Philippines');
});
test('every built-in phrase has a word breakdown with one part per word',()=>{
 for(const phrase of CATALOG){const g=PHRASE_GUIDE[phrase.id];assert.ok(g,`missing breakdown: ${phrase.id}`);assert.equal(g.parts.length,phrase.phrase.trim().split(/\s+/).length,`word count: ${phrase.id}`);assert.ok(g.parts.every(x=>x.meaning),phrase.id);}
});
test('career rounds pay modest XP, so a big trophy haul never floods XP',()=>{
 assert.equal(careerRoundXp('stat5',7,'Very good (8)'),8);assert.equal(careerRoundXp('lt0',3,'3'),9);assert.equal(careerRoundXp('lt0',18,'18'),30);
 assert.equal(careerRoundXp('dc1',4,'4'),12);assert.equal(careerRoundXp('euw4_1',0,'UCL'),20);assert.equal(careerRoundXp('eud0',1,'Yes'),0);
 assert.ok(careerRoundXp('lt0',18,'18')<quizRewards({...p,difficulty:1},'meaning').win);
});
const review=streak=>({seen:streak+1,correct:streak+1,streak,due:0,last:0});
test('exercises climb gently from recognizing to ordering, never writing from memory',()=>{
 assert.deepEqual([undefined,review(0),review(1),review(2),review(3),review(4),review(9)].map(r=>makeChallenge(p,r,'x',CATALOG,()=>.5).mode),['meaning','meaning','meaning','translate','recall','build','build']);
 for(const r of [undefined,review(1),review(2)])assert.equal(makeChallenge(p,r,'x',CATALOG,()=>.5).options.length,4);
});
test('picking the right Tagalog shows English and grades the whole phrase',()=>{
 const q=makeChallenge(p,review(2),'t',CATALOG,()=>.5);assert.equal(q.cue,p.meaning);assert.ok(q.options.includes(p.phrase));
 const s=initialCareer(42);s.pending=q;assert.equal(answerChallenge(s,CATALOG,p.phrase,now).correct,true);assert.equal(answerChallenge(s,CATALOG,q.options.find(o=>o!==p.phrase),now).correct,false);
});
test('word ordering uses only the words of the phrase itself',()=>{
 const q=makeChallenge(p,review(4),'b',CATALOG,()=>.3);assert.equal(q.options.length,3);assert.deepEqual(q.options.map(o=>o.toLowerCase().replace(/[.!?]/g,'')).sort(),['ang','galing','mo']);
});
test('harder exercises pay more XP',()=>{
 const easy={...p,difficulty:1};assert.deepEqual(['meaning','translate','build','type'].map(m=>quizRewards(easy,m).win),[40,80,80,120]);
});
test('a Tagalog quiz comes every third round, but not stacked on attribute training',()=>{
 const s=reach(s=>s.builder.choices.length===3&&getSpinQuestion(s,CATALOG,now).id==='phrase');assert.equal(getSpinQuestion(s,CATALOG,now).id,'phrase');
 const later=reach(s=>s.builder.choices.length===9);assert.notEqual(getSpinQuestion(later,CATALOG,now).id,'phrase');
});
test('new learners get the easiest phrases, and everything opens up with practice',()=>{
 const s=initialCareer(42);assert.ok(phrasePool(CATALOG,s).every(q=>(q.difficulty??1)<=1));
 for(const q of CATALOG.slice(0,30))s.reviews[q.id]=review(1);assert.equal(phrasePool(CATALOG,s).length,CATALOG.length);
});

test('Tagalog gets gently harder over a career, and checkpoints stay easy',()=>{
 const s=initialCareer(42);assert.equal(quizTier(s,40),0);s.builder.choices=Array(30).fill({});assert.equal(quizTier(s,10),2);s.season=3;assert.equal(quizTier(s,10),2,'never past the third step');
 s.builder.choices=[];assert.equal(quizTier(s,40),1,'a later career starts one step up');
 assert.deepEqual([0,1,2].map(t=>makeChallenge(p,undefined,'x',CATALOG,()=>.5,t).mode),['meaning','translate','recall']);
 assert.deepEqual([0,1,2].map(t=>makeChallenge(p,review(9),'x',CATALOG,()=>.5,t,CHECKPOINT_MAX_STEP).mode),['translate','translate','translate'],'checkpoints never go past picking the Tagalog');
 assert.equal(makeChallenge(p,review(4),'x',CATALOG,()=>.5,0).options.length,3,'word ordering has no decoys');
 const fresh=initialCareer(42);assert.ok(phrasePool(CATALOG,fresh,0).every(q=>(q.difficulty??1)<=1));
});

test('an open typing quiz from an older version turns into word ordering',()=>{
 const s=conversation();s.pending={...s.pending,mode:'type',options:[],revision:2,tries:1};
 const up=upgradePending(s,CATALOG);assert.equal(up.pending.mode,'build');assert.equal(up.pending.tries,1);assert.ok(up.pending.options.length>0);
});
test('every exercise carries context: a scene or the meaning, never a lone blank',()=>{
 const sure=CATALOG.find(x=>x.id==='taglish-sure'),rec=makeChallenge(sure,review(3),'r',CATALOG,()=>.4);
 assert.equal(rec.mode,'recall');assert.equal(rec.support,sure.meaning,'fill-in shows what the sentence means');
 const blank=['Sure','ka','ba'][rec.missingIndex];assert.notEqual(blank,'Sure','never blanks a loanword');
 const sentence=new Set(['sure','ka','ba']);assert.ok(rec.options.every(o=>o===blank||!sentence.has(o.toLowerCase())),'wrong options never repeat a word in the sentence');
 assert.ok(rec.options.every(o=>/^\p{Ll}/u.test(o)),'options are cased like the missing word');
 const build=makeChallenge(p,review(4),'b',CATALOG,()=>.4);assert.equal(build.support,p.meaning);
 const tr=makeChallenge(p,review(2),'t',CATALOG,()=>.4);assert.equal(tr.scene,'Your partner is cheering you on after your first goal.');
});
test('a miss removes the wrong choice and reveals the next hint',()=>{
 const s=initialCareer(42);s.pending=makeChallenge(p,undefined,'m',CATALOG,()=>.5);
 const wrong=s.pending.options.find(o=>o!==p.meaning);
 const after=answerChallenge(s,CATALOG,wrong,now).state,view=quizView(after.pending,p);
 assert.ok(!view.options.includes(wrong));assert.equal(view.options.length,3);
 assert.match(view.hint,/means/);assert.equal(view.meaning,null,'the answer stays hidden');
 const solved=answerChallenge(after,CATALOG,p.meaning,now).state;assert.equal(quizView(solved.pending,p).hint,null);
});
