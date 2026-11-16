import { env } from 'cloudflare:workers';
import { ApiError, db, getContext, json, snapshot, owner, save, prior, checkVersion, requestId, sameOrigin } from '@/lib/server';
import { answerChallenge, nationalityLabels, nextSeason, restartCareer, spinCareer, isCareerComplete } from '@/lib/engine';
import { CATALOG } from '@/lib/catalog';
import { unitedHeadlines } from '@/lib/united';
import { WAITLIST_SQL, parseSignup, sha256 } from '@/lib/waitlist';
import { DAILY_CAP, EVENTS_INDEX_SQL, EVENTS_SQL, EVENTS_VID_INDEX_SQL, STATS_QUERIES, cleanEvents } from '@/lib/analytics';

export const dynamic='force-dynamic';
export async function GET(req:Request){
  try{
    const path=new URL(req.url).pathname;
    if(path==='/api/stats')return await stats(req);
    if(path==='/api/united')return Response.json({source:'BBC Sport',items:await unitedHeadlines()},{headers:{'Cache-Control':'public, max-age=600'}});
    const c=await getContext(req,path==='/api/state');
    if(path==='/api/state')return json(snapshot(c),200,c);
    if(path.startsWith('/api/audio/')){
      const id=decodeURIComponent(path.split('/').pop()||'');
      const p=await db().prepare('SELECT audio FROM phrases WHERE id=? AND club=?').bind(id,c.club).first<{audio:string|null}>();
      if(!p?.audio)throw new ApiError(404,'Recording not found.');
      const file=await env.BUCKET?.get(p.audio);if(!file)throw new ApiError(404,'Recording not found.');
      return new Response(file.body,{headers:{'Content-Type':file.httpMetadata?.contentType||'audio/webm','Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff'}});
    }
    return json({error:'Not found.'},404);
  }catch(e){return failure(e);}
}
export async function POST(req:Request){
  try{
    sameOrigin(req);
    const path=new URL(req.url).pathname;
    // The landing page's waitlist works for visitors who have never opened the game.
    if(path==='/api/waitlist'||path==='/api/waitlist/remove')return await waitlist(req,path);
    if(path==='/api/events')return await events(req);
    const c=await getContext(req);
    if(path==='/api/phrases'){
      owner(c);const form=await req.formData().catch(()=>{throw new ApiError(400,'Please check your request.');});
      const text=(key:string,max:number,required=true)=>{const v=form.get(key);if(typeof v!=='string'||v.trim().length>max||(required&&!v.trim()))throw new ApiError(400,`Please check ${key}.`);return v.trim();};
      const source=String(form.get('source')||'')||null;
      const editId=String(form.get('id')||'')||null;
      if(source&&!CATALOG.some(p=>p.id===source))throw new ApiError(400,'Unknown phrase.');
      const phrase=text('phrase',180),meaning=text('meaning',240),context=text('context',1400);
      if(!/\p{L}/u.test(phrase))throw new ApiError(400,'Please check phrase.');
      const category=text('category',30);if(!['Lambing','Barkada','Family','Pop culture','Matchday'].includes(category))throw new ApiError(400,'Choose a category.');
      const existing=source?await db().prepare('SELECT id,audio FROM phrases WHERE club=? AND source=?').bind(c.club,source).first<{id:string;audio:string|null}>():editId?await db().prepare('SELECT id,audio FROM phrases WHERE club=? AND id=? AND source IS NULL').bind(c.club,editId).first<{id:string;audio:string|null}>():null;
      if(editId&&!existing)throw new ApiError(404,'Phrase not found.');
      const id=existing?.id||crypto.randomUUID();let audio=existing?.audio||null;
      const file=form.get('audio');
      if(file instanceof File&&file.size){
        if(file.size>8*1024*1024||!/^audio\/(webm|ogg|mpeg|mp4|wav|x-wav|aac)/.test(file.type))throw new ApiError(400,'Use an audio file under 8 MB (WebM, MP3, M4A, OGG, or WAV).');
        if(!env.BUCKET)throw new ApiError(503,'Audio storage is unavailable.');
        audio=`recordings/${crypto.randomUUID()}`;await env.BUCKET.put(audio,await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});
      }
      if(existing)await db().prepare('UPDATE phrases SET phrase=?,meaning=?,context=?,category=?,audio=? WHERE id=? AND club=?').bind(phrase,meaning,context,category,audio,id,c.club).run();
      else await db().prepare('INSERT INTO phrases (id,club,phrase,meaning,context,category,audio,source,created) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,c.club,phrase,meaning,context,category,audio,source,Date.now()).run();
      return json({ok:true},201);
    }
    const body=await req.json() as Record<string,unknown>|null;
    if(typeof body!=='object'||body===null||Array.isArray(body))throw new ApiError(400,'Please check your request.');
    if(path==='/api/join'){
      if(typeof body.invite!=='string'||!/^\w{32}$/.test(body.invite))throw new ApiError(400,'This invite is not valid.');
      const target=await db().prepare('SELECT id FROM clubs WHERE invite=?').bind(body.invite).first<{id:string}>();
      if(!target)throw new ApiError(404,'This invite could not be found.');
      if(target.id!==c.club)await db().prepare("UPDATE members SET club=?,role='learner' WHERE actor=?").bind(target.id,c.actor).run();
      return json({ok:true});
    }
    const id=requestId(body.requestId);
    const previous=await prior(c,id);if(previous)return json({...snapshot(c),...JSON.parse(previous.payload),replayed:true});
    checkVersion(c,body.version);
    if(path==='/api/spin'){
      if(c.state.pending)throw new ApiError(400,'Finish your conversation before the next spin.');
      if(isCareerComplete(c.state))throw new ApiError(400,'Career complete. Start a new career.');
      const {state,event}=spinCareer(c.state,c.phrases,id);
      await save(c,state,id,{event});return json({...snapshot(c),event});
    }
    if(path==='/api/answer'){
      if(body.challengeId!==c.state.pending?.id)throw new ApiError(409,'This conversation has already moved on.');
      if(typeof body.answer!=='string'||body.answer.length>400)throw new ApiError(400,'Choose an answer.');
      const {state,correct}=answerChallenge(c.state,c.phrases,body.answer);
      await save(c,state,id,{correct});return json({...snapshot(c),correct});
    }
    if(path==='/api/continue'){
      if(!c.state.pending?.solved)throw new ApiError(400,'Finish your conversation first.');
      const state={...c.state,pending:null};await save(c,state,id,{});return json(snapshot(c));
    }
    if(path==='/api/kit'){
      const prices:Record<string,number>={lime:0,blue:150,rose:300,gold:600};const kit=String(body.kit);
      if(!Object.hasOwn(prices,kit)||c.state.xp<prices[kit])throw new ApiError(400,'Keep playing to unlock this kit.');
      await save(c,{...c.state,kit},id,{});return json(snapshot(c));
    }
    if(path==='/api/restart'){
      if(body.nationality!==undefined&&(typeof body.nationality!=='string'||!nationalityLabels().includes(body.nationality)))throw new ApiError(400,'Choose a listed nationality.');
      await save(c,restartCareer(c.state,body.nationality as string|undefined),id,{});return json(snapshot(c));
    }
    if(path==='/api/season'){
      if(!isCareerComplete(c.state)||c.state.pending)throw new ApiError(400,'Finish this career and any open quiz first.');
      await save(c,nextSeason(c.state),id,{});return json(snapshot(c));
    }
    return json({error:'Not found.'},404);
  }catch(e){
    // Drain a body rejected before it was read; Wrangler's dev proxy fails the next request on that connection otherwise.
    await req.text().catch(()=>{});
    return failure(e);
  }
}
let eventsReady=false;
async function ensureEvents(){if(!eventsReady){await db().batch([db().prepare(EVENTS_SQL),db().prepare(EVENTS_INDEX_SQL),db().prepare(EVENTS_VID_INDEX_SQL)]);eventsReady=true;}}
async function events(req:Request){
  const data=cleanEvents(await req.json().catch(()=>null));
  if(!data)throw new ApiError(400,'Please check your request.');
  if(!data.events.length)return json({ok:true,stored:0});
  await ensureEvents();
  const now=Date.now(),recent=await db().prepare('SELECT COUNT(*) AS n FROM analytics WHERE vid=? AND received>=?').bind(data.vid,now-864e5).first<{n:number}>();
  // Over the daily cap: accept quietly so the device stops resending, but store nothing.
  if((recent?.n||0)>=DAILY_CAP)return json({ok:true,stored:0});
  const insert=db().prepare('INSERT OR IGNORE INTO analytics (vid,eid,name,at,props,received) VALUES (?,?,?,?,?,?)');
  await db().batch(data.events.map(e=>insert.bind(data.vid,e.i||crypto.randomUUID().replaceAll('-',''),e.n,e.t,JSON.stringify(e.p||{}),now)));
  return json({ok:true,stored:data.events.length});
}
// Aggregate numbers only, and only for someone holding the STATS_KEY secret. Without the secret set, it does not exist.
async function stats(req:Request){
  const key=(env as {STATS_KEY?:string}).STATS_KEY,given=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';
  if(!key||key.length<24||!(await sameSecret(given,key)))return json({error:'Not found.'},404);
  await ensureEvents();if(!waitlistReady){await db().prepare(WAITLIST_SQL).run();waitlistReady=true;}
  const days=Math.min(90,Math.max(1,Number(new URL(req.url).searchParams.get('days'))||30)),since=Date.now()-days*864e5;
  const [totals,daily,retention,wait,sources]=await Promise.all([
    db().prepare(STATS_QUERIES.totals).bind(since).first(),db().prepare(STATS_QUERIES.daily).bind(since).all(),
    db().prepare(STATS_QUERIES.retention).bind(Date.now()).first(),db().prepare(STATS_QUERIES.waitlist).first(),db().prepare(STATS_QUERIES.sources).all(),
  ]);
  return json({days,totals,daily:daily.results,retention,waitlist:wait,sources:sources.results,generated:new Date().toISOString()});
}
async function sameSecret(a:string,b:string){const [x,y]=await Promise.all([sha256(a),sha256(b)]);let d=0;for(let i=0;i<x.length;i++)d|=x.charCodeAt(i)^y.charCodeAt(i);return d===0;}
let waitlistReady=false;
async function waitlist(req:Request,path:string){
  if(!waitlistReady){await db().prepare(WAITLIST_SQL).run();waitlistReady=true;}
  const body=await req.json().catch(()=>null) as Record<string,unknown>|null;
  if(path==='/api/waitlist/remove'){
    const token=typeof body?.token==='string'&&/^[a-f0-9]{48}$/.test(body.token)?body.token:'';
    if(!token)throw new ApiError(400,'This removal link is not valid.');
    await db().prepare('DELETE FROM waitlist WHERE remove_hash=?').bind(await sha256(token)).run();
    return json({ok:true});
  }
  const entry=parseSignup(body);
  if('error' in entry){if(entry.error)throw new ApiError(400,entry.error);return json({ok:true});}
  const token=[...crypto.getRandomValues(new Uint8Array(24))].map(b=>b.toString(16).padStart(2,'0')).join('');
  const added=await db().prepare('INSERT OR IGNORE INTO waitlist (id,email,learning_for,role,source,remove_hash,created) VALUES (?,?,?,?,?,?,?)')
    .bind(crypto.randomUUID(),entry.email,entry.learningFor,entry.role,entry.source,await sha256(token),Date.now()).run();
  // The same answer whether or not the email was already there, so the form never reveals who signed up.
  return json({ok:true,removeToken:added.meta.changes?token:null});
}
function failure(e:unknown){
  if(e instanceof ApiError)return json({error:e.message},e.status);
  if(e instanceof SyntaxError)return json({error:'Please check your request.'},400);
  console.error('Laro API:',e instanceof Error?e.message:'Unknown error');
  return json({error:'Something went wrong. Try again.'},500);
}
