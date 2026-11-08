import test from 'node:test';
import assert from 'node:assert/strict';
import {initialCareer,spinCareer,answerChallenge,makeChallenge,upgradePending,upgradeCareer,phraseWeight,nextSeason,isCareerComplete,getSpinQuestion} from '../lib/engine.ts';
import {inspectCareer,advanceCareer} from '../lib/player-career.js';
import {wheelSegments,landingRotation} from '../lib/wheel.ts';
import {quizView} from '../lib/quiz.ts';
import {CATALOG} from '../lib/catalog.ts';
const now=1800000000000;
const p=CATALOG[0];
function conversation(){let s=initialCareer(42);for(let i=0;i<4;i++)s=spinCareer(s,CATALOG,`spin-${i}`,now,()=>.6).state;return s;}
function answerFor(q){const p=CATALOG.find(p=>p.id===q.phraseId);return q.mode==='meaning'?p.meaning:q.mode==='build'?p.phrase:p.phrase.replace(/[.!?]/g,'').split(/\s+/)[q.missingIndex];}

test('attachment questions begin with position, nationality, debut age, and height',()=>{
 const choices=[],prompts=[];for(let i=0;i<4;i++){const frame=inspectCareer(42,choices);prompts.push(frame.question.prompt);choices.push(advanceCareer(42,choices,()=>.6).record);}
 assert.deepEqual(prompts,['What position?','Nationality','What age do you make your pro debut?','Height?']);
});
test('first three career questions resolve; fourth pauses for Tagalog',()=>{
 const s=conversation();assert.equal(s.builder.choices.length,3);assert.equal(s.pending.phraseId,'galing');assert.equal(s.pending.revision,2);assert.equal(s.history.length,4);
 assert.throws(()=>spinCareer(s,CATALOG,'blocked'),/Finish your Tagalog/);
});
test('quiz cue does not reveal its English gloss or context, including after mistakes',()=>{
 const s=conversation();let view=quizView(s.pending,p);assert.equal(view.title,p.phrase);assert.equal(view.meaning,null);assert.equal(view.context,null);
 for(let i=0;i<3;i++){s.pending=answerChallenge(s,CATALOG,'wrong',now).state.pending;view=quizView(s.pending,p);assert.equal(view.meaning,null);assert.equal(view.context,null);assert.equal(s.pending.feedback,'Try again.');}
});
test('Tagalog checkpoint wheels and spin results never display the full phrase before an exercise',()=>{
 for(const streak of [undefined,1,2]){
  const s=initialCareer(42);s.spins=3;if(streak)s.reviews[p.id]={seen:streak,correct:streak,streak,due:0,last:0};
  const q=getSpinQuestion(s,CATALOG,now),result=spinCareer(s,CATALOG,`privacy-${streak}`,now,()=>0);
  const visible=[...q.options.map(o=>o.label),...result.event.wheel.options.map(o=>o.label),result.event.title,result.event.detail,result.event.outcome].join(' ');
  for(const phrase of CATALOG)assert.ok(!visible.toLowerCase().includes(phrase.phrase.replace(/[.!?]/g,'').toLowerCase()),`hidden phrase: ${phrase.id}`);
  assert.equal(result.state.pending.mode,streak===2?'build':streak===1?'recall':'meaning');
 }
});
test('translation is revealed after a correct answer',()=>{
 const s=answerChallenge(conversation(),CATALOG,p.meaning,now).state;const view=quizView(s.pending,p);assert.equal(view.meaning,p.meaning);assert.equal(view.context,p.context);
});
test('wrong answers give no XP, a retry earns less, and repeated submission cannot duplicate XP',()=>{
 const s=conversation(),xp=s.xp;const wrong=answerChallenge(s,CATALOG,'wrong',now);assert.equal(wrong.correct,false);assert.equal(wrong.state.xp,xp);
 const right=answerChallenge(wrong.state,CATALOG,p.meaning,now);assert.equal(right.correct,true);assert.equal(right.state.xp,xp+15);assert.equal(right.state.reviews.galing.due,now+300000);
 assert.equal(answerChallenge(right.state,CATALOG,p.meaning,now).state.xp,xp+15);
});
test('first-try success schedules later review without mutating the original career',()=>{
 const s=conversation();const right=answerChallenge(s,CATALOG,p.meaning,now).state;assert.equal(s.pending.solved,false);assert.equal(right.xp,s.xp+30);assert.equal(right.reviews.galing.streak,1);assert.equal(right.reviews.galing.due,now+14400000);
});
test('recall uses a missing Tagalog word, never the English meaning as the cue',()=>{
 const review={seen:1,correct:1,streak:1,due:0,last:0};const q=makeChallenge(p,review,'cloze',CATALOG,()=>.5);
 assert.equal(q.mode,'recall');assert.match(q.cue,/_____/);assert.ok(!q.cue.includes(p.meaning));
 const s=initialCareer(42);s.pending=q;assert.equal(answerChallenge(s,CATALOG,p.meaning,now).correct,false);assert.equal(answerChallenge(s,CATALOG,'mo',now).correct,true);
});
test('word ordering hides the full phrase and grades the complete ordered answer',()=>{
 const q=makeChallenge(p,{seen:2,correct:2,streak:2,due:0,last:0},'build',CATALOG,()=>.5);assert.equal(q.mode,'build');assert.notEqual(q.cue,p.phrase);assert.ok(!q.cue.includes(p.meaning));
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
 const q=makeChallenge(word,{seen:3,correct:3,streak:3,due:0,last:0},'solo',[word,...CATALOG],()=>.5);
 assert.equal(q.mode,'recall');assert.equal(q.cue,'_____');assert.ok(q.options.includes('Salamat'));
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
