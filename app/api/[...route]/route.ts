import { env } from 'cloudflare:workers';
import { ApiError, db, getContext, json, snapshot, owner, save, prior, checkVersion, requestId, sameOrigin } from '@/lib/server';
import { answerChallenge, nextSeason, spinCareer, isCareerComplete } from '@/lib/engine';
import { CATALOG } from '@/lib/catalog';

export const dynamic='force-dynamic';
export async function GET(req:Request){
  try{
    const path=new URL(req.url).pathname;
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
function failure(e:unknown){
  if(e instanceof ApiError)return json({error:e.message},e.status);
  if(e instanceof SyntaxError)return json({error:'Please check your request.'},400);
  console.error('Laro API:',e instanceof Error?e.message:'Unknown error');
  return json({error:'Something went wrong. Try again.'},500);
}
