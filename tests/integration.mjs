import assert from 'node:assert/strict';
const base=process.env.LARO_TEST_URL||'http://localhost:5173';
function client(){let cookie='';return async(path,body,form=false)=>{
  const r=await fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{...(cookie?{Cookie:cookie}:{}),...(body&&!form?{'Content-Type':'application/json'}:{})},body:body?(form?body:JSON.stringify(body)):undefined});
  if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
  const type=r.headers.get('content-type')||'';return {status:r.status,data:type.includes('application/json')?await r.json():await r.arrayBuffer()};
};}
const creator=client(),learner=client(),other=client();
let a=await creator('state');assert.equal(a.status,200);assert.equal(a.data.state.spins,0);
const b=await learner('state');await other('state');assert.notEqual(a.data.invite,b.data.invite);
let r=await creator('spin',{requestId:'integration-spin-1',version:0});assert.equal(r.status,200);assert.equal(r.data.version,1);
const replay=await creator('spin',{requestId:'integration-spin-1',version:0});assert.equal(replay.status,200);assert.equal(replay.data.version,1);assert.equal(replay.data.state.xp,r.data.state.xp);
const race=await Promise.all(['a','b'].map(s=>creator('spin',{requestId:'integration-race-'+s,version:1})));assert.deepEqual(race.map(x=>x.status).sort(),[200,409]);
let current=(await creator('state')).data;while(current.state.spins<4){const next=await creator('spin',{requestId:crypto.randomUUID(),version:current.version});assert.equal(next.status,200);current=next.data;}
const q=current.state.pending;assert.ok(q);const blocked=await creator('spin',{requestId:crypto.randomUUID(),version:current.version});assert.equal(blocked.status,400);
const early=await creator('continue',{requestId:crypto.randomUUID(),version:current.version});assert.equal(early.status,400);
const wrong=await creator('answer',{requestId:crypto.randomUUID(),version:current.version,challengeId:q.id,answer:'wrong'});assert.equal(wrong.data.correct,false);assert.equal(wrong.data.state.xp,current.state.xp);current=wrong.data;
const answerId=crypto.randomUUID();const right=await creator('answer',{requestId:answerId,version:current.version,challengeId:q.id,answer:"You're so good!"});assert.equal(right.data.correct,true);assert.equal(right.data.state.xp,current.state.xp+15);
const answerReplay=await creator('answer',{requestId:answerId,version:current.version,challengeId:q.id,answer:"You're so good!"});assert.equal(answerReplay.data.state.xp,right.data.state.xp);
const finish=await creator('continue',{requestId:crypto.randomUUID(),version:right.data.version});assert.equal(finish.data.state.pending,null);
const upload=new FormData();for(const [k,v]of Object.entries({phrase:'Test phrase.',meaning:'Test meaning.',context:'Integration test only.',category:'Barkada'}))upload.set(k,v);
const wave=new Uint8Array(76);const dv=new DataView(wave.buffer);for(const [at,s]of [[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']])for(let i=0;i<s.length;i++)wave[at+i]=s.charCodeAt(i);dv.setUint32(4,68,true);dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,8000,true);dv.setUint32(28,16000,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);dv.setUint32(40,32,true);
upload.set('audio',new File([wave],'test.wav',{type:'audio/wav'}));const created=await creator('phrases',upload,true);assert.equal(created.status,201);
const saved=(await creator('state')).data;const custom=saved.phrases.find(p=>p.phrase==='Test phrase.');assert.ok(custom.audio);
const audio=await creator(custom.audio.replace('/api/',''));assert.equal(audio.status,200);assert.equal(audio.data.byteLength,76);
assert.equal((await other(custom.audio.replace('/api/',''))).status,404);
assert.equal((await learner('join',{invite:a.data.invite})).status,200);assert.equal((await learner('state')).data.role,'learner');
assert.equal((await learner(custom.audio.replace('/api/',''))).status,200);
assert.equal((await learner('phrases',upload,true)).status,403);
assert.equal((await creator('kit',{requestId:crypto.randomUUID(),version:saved.version,kit:'gold'})).status,400);
const refreshed=(await learner('state')).data;assert.equal(refreshed.state.spins,4);assert.equal(refreshed.state.pending,null);
console.log('Integration passed: persistence, duplicate requests, concurrent spins, grading, recovery, uploads, invite roles, audio isolation, and locked rewards.');
