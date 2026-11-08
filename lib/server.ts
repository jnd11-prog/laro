import { env } from 'cloudflare:workers';
import { CATALOG } from './catalog';
import { initialCareer, upgradeCareer, upgradePending } from './engine';
import { hostAuthenticatedUser, isSameOrigin } from './identity';
import type { Career, Phrase, Snapshot } from './types';

export class ApiError extends Error { constructor(public status:number,message:string){super(message);} }
export function db(){if(!env.DB)throw new Error('Database unavailable.');return env.DB;}
export type Context={actor:string;club:string;role:string;signedIn:boolean;cookie?:string;state:Career;version:number;phrases:Phrase[];invite?:string};
export async function getContext(req:Request, initialize=false):Promise<Context>{
  const user=hostAuthenticatedUser(req.headers,(env as {LARO_DISABLE_HOST_AUTH?:string}).LARO_DISABLE_HOST_AUTH);
  const guest=req.headers.get('cookie')?.match(/(?:^|;\s*)laro_guest=([a-f0-9-]{36})(?:;|$)/)?.[1];
  if(!user&&!guest&&!initialize)throw new ApiError(401,'Open your career before continuing.');
  const token=guest||crypto.randomUUID();const actor=user?`user:${user}`:`guest:${token}`;
  let member=await db().prepare('SELECT club, role FROM members WHERE actor = ?').bind(actor).first<{club:string;role:string}>();
  if(!member){
    const invite=crypto.randomUUID().replaceAll('-','');
    await db().batch([
      db().prepare('INSERT OR IGNORE INTO clubs (id,owner,invite,created) VALUES (?,?,?,?)').bind(actor,actor,invite,Date.now()),
      db().prepare("INSERT OR IGNORE INTO members (actor,club,role) VALUES (?,?,'owner')").bind(actor,actor),
      db().prepare('INSERT OR IGNORE INTO careers (club,state,version) VALUES (?,?,0)').bind(actor,JSON.stringify(initialCareer())),
    ]);
    member=await db().prepare('SELECT club,role FROM members WHERE actor=?').bind(actor).first<{club:string;role:string}>();
  }
  if(!member)throw new Error('Career could not be opened.');
  const row=await db().prepare('SELECT state,version FROM careers WHERE club=?').bind(member.club).first<{state:string;version:number}>();
  if(!row)throw new Error('Career not found.');
  const custom=(await db().prepare('SELECT * FROM phrases WHERE club=? ORDER BY created DESC').bind(member.club).all<Phrase & {source:string|null}>()).results;
  const phrases:Phrase[]=[...CATALOG.map(p=>{
    const override=custom.find(q=>q.source===p.id);return override?{...p,context:override.context,audio:override.audio?`/api/audio/${override.id}`:null}:p;
  }),...custom.filter(p=>!p.source).map(p=>({...p,audio:p.audio?`/api/audio/${p.id}`:null}))];
  const club=member.role==='owner'?await db().prepare('SELECT invite FROM clubs WHERE id=?').bind(member.club).first<{invite:string}>():null;
  return {actor,...member,signedIn:!!user,cookie:!user&&!guest?`laro_guest=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(req.url).protocol==='https:'?'; Secure':''}`:undefined,state:upgradePending(upgradeCareer(JSON.parse(row.state)),phrases),version:row.version,phrases,invite:club?.invite};
}
export function snapshot(c:Context):Snapshot{return {state:c.state,version:c.version,phrases:c.phrases,role:c.role,signedIn:c.signedIn,invite:c.invite};}
export function json(data:unknown,status=200,c?:Context){return Response.json(data,{status,headers:{'Cache-Control':'no-store',...(c?.cookie?{'Set-Cookie':c.cookie}:{})}});}
export function owner(c:Context){if(c.role!=='owner')throw new ApiError(403,'Only the creator can change these lessons.');}
export async function save(c:Context,state:Career,id:string,payload:unknown){
  const results=await db().batch([
    db().prepare('UPDATE careers SET state=?,version=version+1 WHERE club=? AND version=?').bind(JSON.stringify(state),c.club,c.version),
    db().prepare('INSERT INTO events (id,club,payload,created) SELECT ?,?,?,? WHERE changes()=1').bind(`${c.club}:${id}`,c.club,JSON.stringify(payload),Date.now()),
  ]);
  if(!results[0].meta.changes)throw new ApiError(409,'Your career changed in another tab. Reloading the latest progress.');
  c.state=state;c.version++;return c;
}
export async function prior(c:Context,id:string){return db().prepare('SELECT payload FROM events WHERE id=? AND club=?').bind(`${c.club}:${id}`,c.club).first<{payload:string}>();}
export function checkVersion(c:Context,value:unknown){if(value!==c.version)throw new ApiError(409,'Your career changed in another tab. Reloading the latest progress.');}
export function requestId(value:unknown):string{if(typeof value!=='string'||!/^[-\w]{8,80}$/.test(value))throw new ApiError(400,'Invalid action ID.');return value;}
export function sameOrigin(req:Request){if(!isSameOrigin(req.headers.get('origin'),req.url))throw new ApiError(403,'Please use the game page to make changes.');}
