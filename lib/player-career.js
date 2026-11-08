// Career questions and rules adapted from the single-file game "The Wheel — Build a Footballer".
// Each replay owns its state and seeded calculations. No browser globals are used.
function createEngine(seed, records, trainingPoints = {}) {
  let randomState = seed >>> 0;
  const random = () => { randomState += 0x6D2B79F5; let t=randomState; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
const PALETTE=["#e23b3b","#f0892b","#7cc442","#2aa3d6","#2f55c4","#7b3fd6","#c43fb0","#ff4d8d","#16a36b","#d6b22a"];
const rnd=(a,b)=>a+random()*(b-a);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const gauss=(v,t,s)=>Math.exp(-((v-t)*(v-t))/(2*s*s));
const CAP=s=>s[0].toUpperCase()+s.slice(1);

const YN=()=>[{label:"No",value:"No"},{label:"Yes",value:"Yes"}];

const PACE=["Extremely slow","Very slow","Slow","Below average","Average","Above average","Fast","Very fast","Extremely fast","Speed of light"];
const SHOOT=["Dreadful","Extremely bad","Bad","Below average","Average","Above average","Good","World class","Automatic","GOAT"];
const DRIB=["Dreadful","Extremely bad","Bad","Below average","Average","Above average","Quite good","Good","Amazing","Messi"];
const PASS=["Dreadful","Extremely bad","Bad","Below average","Average","Above average","Quite good","Good","Amazing","KDB"];
const STR=["Stick","Very weak","Weak","Below average","Average","Above average","Strong","Extremely strong","Akinfenwa","Strongest"];
const DEF=["Dreadful","Extremely bad","Bad","Below average","Average","Above average","Good","Very good","Brick wall","Maldini"];
const ratingOpts=arr=>arr.map((l,i)=>({label:`${l} (${i+1})`,value:i+1}));
const DIVING=["Statue","Rooted","Poor dive","Below average","Average","Above average","Good","Very good","Cat-like","Superman"];
const HANDLING=["Butterfingers","Terrible","Poor","Below average","Average","Above average","Good","Very good","Safe hands","Glue gloves"];
const REFLEXES=["Asleep","Dreadful","Slow","Below average","Average","Above average","Sharp","Very sharp","Lightning","Inhuman"];
const KICKING=["Shanks it","Terrible","Poor","Below average","Average","Above average","Good","Very good","Sweeper keeper","Ederson"];
const GKPOS=["Lost","Dreadful","Poor","Below average","Average","Above average","Good","Commanding","Elite","Neuer"];
const SHOTSTOP=["Sieve","Dreadful","Leaky","Below average","Average","Above average","Good","Very good","Brick wall","Yashin"];
/* six internal slots, displayed differently for keepers */
const OUTFIELD_STATS=[["pace","Pace",PACE,"🏃"],["shooting","Shooting",SHOOT,"🦵"],["dribbling","Dribbling",DRIB,"🦶"],["passing","Passing",PASS,"⚽"],["strength","Strength",STR,"💪"],["defending","Defending",DEF,"🛡️"]];
const GK_STATS=[["pace","Diving",DIVING,"🧤"],["shooting","Handling",HANDLING,"🧤"],["dribbling","Reflexes",REFLEXES,"⚡"],["passing","Kicking",KICKING,"🥾"],["strength","Positioning",GKPOS,"📍"],["defending","Shot stopping",SHOTSTOP,"🧱"]];
const isGK=()=>S.position==="GK";
const STATS=()=>isGK()?GK_STATS:OUTFIELD_STATS;
const PROFKEY=["pac","sho","dri","pas","str","def"];

const POSITIONS=["GK","RB","CB","LB","CDM","CM","CAM","RM","LM","RW","LW","ST"];
/* nation: name, flag, strength 1-10 */
const NATIONS=[["Brazil","🇧🇷",10,"CONMEBOL",10],["Argentina","🇦🇷",10,"CONMEBOL",10],["France","🇫🇷",10,"UEFA",9],["Spain","🇪🇸",9,"UEFA",9],["England","🏴",9,"UEFA",8],["Germany","🇩🇪",9,"UEFA",9],["Portugal","🇵🇹",9,"UEFA",8],["Netherlands","🇳🇱",8,"UEFA",8],["Italy","🇮🇹",8,"UEFA",9],["Belgium","🇧🇪",8,"UEFA",7],["Croatia","🇭🇷",7,"UEFA",6],["Uruguay","🇺🇾",7,"CONMEBOL",8],["Senegal","🇸🇳",6,"CAF",9],["Nigeria","🇳🇬",6,"CAF",8],["Japan","🇯🇵",6,"AFC",9],["USA","🇺🇸",5,"CONCACAF",9],["Mexico","🇲🇽",6,"CONCACAF",9],["Poland","🇵🇱",5,"UEFA",4],["Serbia","🇷🇸",6,"UEFA",5],["Norway","🇳🇴",5,"UEFA",4],["Sweden","🇸🇪",5,"UEFA",5],["Wales","🏴",5,"UEFA",4],["Scotland","🏴",4,"UEFA",3],["Ireland","🇮🇪",4,"UEFA",3],["Chile","🇨🇱",5,"CONMEBOL",7],["Canada","🇨🇦",4,"CONCACAF",6],["Greece","🇬🇷",4,"UEFA",4],["Slovakia","🇸🇰",4,"UEFA",3],["Iceland","🇮🇸",3,"UEFA",2],["Finland","🇫🇮",3,"UEFA",2],["Morocco","🇲🇦",8,"CAF",9],["Colombia","🇨🇴",7,"CONMEBOL",7],["Denmark","🇩🇰",6,"UEFA",6],["Switzerland","🇨🇭",6,"UEFA",5],["Austria","🇦🇹",6,"UEFA",5],["Turkey","🇹🇷",6,"UEFA",5],["South Korea","🇰🇷",6,"AFC",8],["Ecuador","🇪🇨",5,"CONMEBOL",5],["Egypt","🇪🇬",5,"CAF",8],["Ivory Coast","🇨🇮",5,"CAF",8],["Algeria","🇩🇿",5,"CAF",7],["Cameroon","🇨🇲",5,"CAF",7],["Ghana","🇬🇭",4,"CAF",6],["Australia","🇦🇺",4,"AFC",7],["Philippines","🇵🇭",1,"AFC",2],["China","🇨🇳",3,"AFC",3],["India","🇮🇳",2,"AFC",2],["Indonesia","🇮🇩",3,"AFC",3],["Thailand","🇹🇭",3,"AFC",3],["Vietnam","🇻🇳",3,"AFC",3],["Malaysia","🇲🇾",2,"AFC",2],["Singapore","🇸🇬",2,"AFC",2],["Iran","🇮🇷",6,"AFC",6],["Saudi Arabia","🇸🇦",5,"AFC",5],["Qatar","🇶🇦",4,"AFC",4],["South Africa","🇿🇦",4,"CAF",4],["Peru","🇵🇪",5,"CONMEBOL",5],["Jamaica","🇯🇲",4,"CONCACAF",4],["Costa Rica","🇨🇷",4,"CONCACAF",4],["Ukraine","🇺🇦",5,"UEFA",5],["Romania","🇷🇴",4,"UEFA",4]];
const CONTINENTAL={UEFA:["Euro","🇪🇺"],CONMEBOL:["Copa América","🌎"],CONCACAF:["Gold Cup","🌎"],AFC:["Asian Cup","🌏"],CAF:["AFCON","🌍"]};
const TIERQ={1:1,2:.5,3:.18,4:.05},CUPQ={1:1,2:.72,3:.45,4:.22};
/* league: name, tier, clubs [name, tier, league-title strength when it differs from the tier], details */
const LEAGUES=[
 ["Premier League",1,[["Man City",1],["Arsenal",1],["Liverpool",1],["Chelsea",2],["Man United",2],["Tottenham",2],["Newcastle",2],["Aston Villa",3],["Brighton",3],["West Ham",3],["Wolves",4],["Everton",4],["Brentford",4],["Fulham",4],["Crystal Palace",4]],{home:["England","Wales","Scotland","Ireland"],pull:1.4}],
 ["La Liga",1,[["Real Madrid",1],["Barcelona",1],["Atlético Madrid",2],["Sevilla",3],["Villarreal",3],["Real Sociedad",3],["Real Betis",3],["Athletic Club",3],["Valencia",4],["Girona",4]],{home:["Spain"],pull:1.2}],
 ["Serie A",1,[["Inter",1],["AC Milan",2],["Juventus",2],["Napoli",2],["Roma",3],["Lazio",3],["Atalanta",3],["Fiorentina",3],["Bologna",4]],{home:["Italy"]}],
 ["Bundesliga",1,[["Bayern Munich",1,1.9],["Dortmund",2],["Leverkusen",2],["RB Leipzig",3],["Eintracht Frankfurt",3],["Stuttgart",3],["Wolfsburg",4],["Freiburg",4]],{home:["Germany","Austria"]}],
 ["Ligue 1",2,[["PSG",1,1.9],["Monaco",3],["Marseille",3],["Lyon",3],["Lille",3],["Nice",4],["Lens",4],["Rennes",4]],{home:["France"],pull:.55}],
 ["Eredivisie",3,[["Ajax",2,1],["PSV",2,1.1],["Feyenoord",3,.5],["AZ Alkmaar",4]],{home:["Netherlands","Belgium"],pull:.65}],
 ["Primeira Liga",3,[["Benfica",2,1],["Porto",2,1],["Sporting CP",2,1],["Braga",4]],{home:["Portugal"],pull:.65}],
 ["Scottish Premiership",4,[["Celtic",3,2],["Rangers",3,.9],["Aberdeen",4],["Hearts",4]],{home:["Scotland"]}],
 ["MLS",4,[["Inter Miami",4,.45],["LAFC",4,.45],["LA Galaxy",4,.4],["NYCFC",4,.3],["NY Red Bulls",4,.25],["Seattle Sounders",4,.35],["Atlanta United",4,.25],["Columbus Crew",4,.4]],{home:["USA","Canada"],late:true,cont:"Concacaf Champions Cup"}],
 ["Saudi Pro League",3,[["Al-Hilal",3,1.2],["Al-Nassr",3,.6],["Al-Ittihad",3,.5],["Al-Ahli",3,.4]],{late:true,cont:"AFC Champions League Elite"}],
 ["Liga MX",4,[["Club América",4,1],["Chivas",4,.5],["Cruz Azul",4,.4],["Tigres",4,.7],["Monterrey",4,.5]],{home:["Mexico"],local:true,cont:"Concacaf Champions Cup"}],
 ["Brasileirão",3,[["Flamengo",3,.8],["Palmeiras",3,.9],["Corinthians",3,.4],["São Paulo",3,.4],["Santos",4,.3]],{home:["Brazil"],local:true,cont:"Copa Libertadores"}],
 ["Argentine Primera",4,[["River Plate",3,.9],["Boca Juniors",3,.8],["Racing",4,.4],["Independiente",4,.3]],{home:["Argentina"],local:true,cont:"Copa Libertadores"}],
 ["K League 1",4,[["Ulsan HD",4,1.3],["Jeonbuk Motors",4,1.3],["FC Seoul",4,.4],["Pohang Steelers",4,.4]],{home:["South Korea"],local:true,cont:"AFC Champions League Elite"}]
];
const BASQUE_ELIGIBLE=["Spain","France"]; // Athletic Club only signs players with Basque roots
const PROF={GK:{pac:7,sho:7,pas:6,dri:7,str:7,def:8,h:75},RB:{pac:7,sho:4,pas:6,dri:6,str:5,def:6,h:70},CB:{pac:5,sho:3,pas:5,dri:4,str:8,def:8,h:74},LB:{pac:7,sho:4,pas:6,dri:6,str:5,def:6,h:70},CDM:{pac:5,sho:4,pas:7,dri:5,str:7,def:7,h:72},CM:{pac:6,sho:5,pas:7,dri:6,str:6,def:5,h:70},CAM:{pac:6,sho:7,pas:7,dri:8,str:4,def:3,h:69},RM:{pac:8,sho:6,pas:6,dri:7,str:4,def:4,h:69},LM:{pac:8,sho:6,pas:6,dri:7,str:4,def:4,h:69},RW:{pac:8,sho:7,pas:6,dri:8,str:4,def:3,h:68},LW:{pac:8,sho:7,pas:6,dri:8,str:4,def:3,h:68},ST:{pac:7,sho:8,pas:5,dri:7,str:7,def:2,h:72}};
const ABILITY_W={GK:{def:.28,dri:.2,pac:.16,sho:.16,str:.15,pas:.05},RB:{def:.3,pac:.25,str:.15,pas:.15,dri:.1,sho:.05},CB:{def:.4,str:.3,pas:.1,pac:.1,dri:.05,sho:.05},LB:{def:.3,pac:.25,str:.15,pas:.15,dri:.1,sho:.05},CDM:{def:.3,pas:.25,str:.2,dri:.1,pac:.1,sho:.05},CM:{pas:.3,dri:.2,def:.2,sho:.1,pac:.1,str:.1},CAM:{pas:.3,dri:.3,sho:.2,pac:.1,str:.05,def:.05},RM:{pac:.25,dri:.25,pas:.2,sho:.15,def:.1,str:.05},LM:{pac:.25,dri:.25,pas:.2,sho:.15,def:.1,str:.05},RW:{pac:.3,dri:.3,sho:.2,pas:.1,str:.05,def:.05},LW:{pac:.3,dri:.3,sho:.2,pas:.1,str:.05,def:.05},ST:{sho:.35,pac:.2,dri:.15,str:.15,pas:.1,def:.05}};
const GPS={GK:0.1,CB:1.3,RB:2,LB:2,CDM:2.6,CM:5,CAM:9,RM:7.5,LM:7.5,RW:12,LW:12,ST:16};
const APS={GK:0.05,CB:1.0,RB:3.2,LB:3.2,CDM:3.5,CM:6.2,CAM:9.5,RM:8.2,LM:8.2,RW:7.8,LW:7.8,ST:5.2};
/* improvable: key, labels(or null for star stats), max, display name */
const improvables=()=>STATS().map(s=>[s[0],s[2],10,s[1]]).concat([["weak",null,5,"Weak foot"]],isGK()?[]:[["skill",null,5,"Skill moves"]]);

let S={};
const abilityOf=()=>{if(!S.pace)return .5;const w=ABILITY_W[S.position]||ABILITY_W.CM;return clamp((w.pac*S.pace+w.sho*S.shooting+w.dri*S.dribbling+w.pas*S.passing+w.str*S.strength+w.def*S.defending)/10,0,1);};
const bestTier=()=>S.bestTier||3;
const clubFactor=()=>(5-bestTier())/4;
const HEIGHTS=[];for(let inches=64;inches<=80;inches++)HEIGHTS.push({label:`${Math.floor(inches/12)}'${inches%12}"`,value:inches});
const FOOT_ODDS={GK:[5,1],RB:[12,1],CB:[3,1],LB:[1,3],CDM:[4,1],CM:[4,1],CAM:[4,1],RM:[4,1],LM:[1,1.5],RW:[1.5,1],LW:[2,1],ST:[4,1]};
const ageAt=i=>S.debut+S.clubs.slice(0,i).reduce((n,c)=>n+c.years,0);
const profBias=(attr,opts)=>{const t=clamp((PROF[S.position]||PROF.CM)[attr]+0.3,1,9);return opts.map(o=>gauss(o.value,t,2.95)+.05);};
const POSW={GK:.45,RB:.8,CB:.85,LB:.8,CDM:1,CM:1.25,CAM:1.8,RM:1.45,LM:1.45,RW:1.95,LW:1.95,ST:2.1};
const ATTMID=p=>!["GK","CB","RB","LB"].includes(p);

const STAGES=[
 {id:"position",q:"What position?",e:"⚽",build:()=>{const o=POSITIONS.map(p=>({label:p,value:p}));return{options:o,weights:o.map(p=>POSW[p.value]),dWeights:o.map(()=>1),set:r=>S.position=r.value};}},
 {id:"nationality",q:"What's your nationality?",e:"🌍",build:()=>{const o=NATIONS.map(n=>({label:n[0],value:n[0],flag:n[1],str:n[2],conf:n[3],cstr:n[4]}));return{options:o,weights:o.map(n=>Math.pow(n.str/10,1.8)+.05),reveal:r=>r.value,set:r=>{S.nationality=r.value;S.flag=r.flag;S.natStrength=r.str;S.contStrength=r.cstr;S.conf=r.conf;S.contName=CONTINENTAL[r.conf][0];S.contEmoji=CONTINENTAL[r.conf][1];}};}},
 {id:"debut",q:"What age do you make your pro debut?",e:"🔢",build:()=>{const o=[15,16,17,18,19,20,21].map(v=>({label:""+v,value:v}));return{options:o,weights:o.map(x=>gauss(x.value,18,2)+.3),dWeights:o.map(()=>1),set:r=>S.debut=r.value};}},
 {id:"height",q:"How tall are you?",e:"📏",build:()=>({options:HEIGHTS,weights:HEIGHTS.map(o=>gauss(o.value,(PROF[S.position]||PROF.CM).h,2.6)+.004),dWeights:HEIGHTS.map(()=>1),reveal:r=>r.label,set:r=>S.height=r.label})},
 {id:"seasons",q:"How many seasons do you play?",e:"⚽",build:()=>{const gk=isGK(),last=(gk?44:41)-S.debut,peak=gk?38:35.5,o=[];for(let s=10;s<=last;s++)o.push({label:""+s,value:s});return{options:o,weights:o.map(x=>gauss(S.debut+x.value,peak,2.8)+.01),reveal:r=>`${r.value} seasons (retire at ${S.debut+r.value})`,set:r=>S.seasons=r.value};}},
 {id:"nclubs",q:"How many clubs do you play for?",e:"🏟️",build:()=>{const o=[1,2,3,4,5,6,7,8].map(v=>({label:""+v,value:v}));return{options:o,weights:o.map(x=>gauss(x.value,3.4,1.6)+.06),set:r=>S.nclubs=r.value};}},
 {id:"stat0",q:"",e:"⚽",build:()=>{const st=STATS()[0];const o=ratingOpts(st[2]);return{qText:`How's your ${st[1].toLowerCase()}?`,emoji:st[3],options:o,weights:profBias(PROFKEY[0],o),reveal:r=>r.label,set:r=>S[st[0]]=r.value};}},
 {id:"stat1",q:"",e:"⚽",build:()=>{const st=STATS()[1];const o=ratingOpts(st[2]);return{qText:`How's your ${st[1].toLowerCase()}?`,emoji:st[3],options:o,weights:profBias(PROFKEY[1],o),reveal:r=>r.label,set:r=>S[st[0]]=r.value};}},
 {id:"stat2",q:"",e:"⚽",build:()=>{const st=STATS()[2];const o=ratingOpts(st[2]);return{qText:`How's your ${st[1].toLowerCase()}?`,emoji:st[3],options:o,weights:profBias(PROFKEY[2],o),reveal:r=>r.label,set:r=>S[st[0]]=r.value};}},
 {id:"stat3",q:"",e:"⚽",build:()=>{const st=STATS()[3];const o=ratingOpts(st[2]);return{qText:`How's your ${st[1].toLowerCase()}?`,emoji:st[3],options:o,weights:profBias(PROFKEY[3],o),reveal:r=>r.label,set:r=>S[st[0]]=r.value};}},
 {id:"stat4",q:"",e:"⚽",build:()=>{const st=STATS()[4];const o=ratingOpts(st[2]);return{qText:`How's your ${st[1].toLowerCase()}?`,emoji:st[3],options:o,weights:profBias(PROFKEY[4],o),reveal:r=>r.label,set:r=>S[st[0]]=r.value};}},
 {id:"stat5",q:"",e:"⚽",build:()=>{const st=STATS()[5];const o=ratingOpts(st[2]);return{qText:`How's your ${st[1].toLowerCase()}?`,emoji:st[3],options:o,weights:profBias(PROFKEY[5],o),reveal:r=>r.label,set:r=>S[st[0]]=r.value};}},
 {id:"foot",q:"Left foot or right foot?",e:"🦶",build:()=>({options:[{label:"Right",value:"Right"},{label:"Left",value:"Left"}],weights:FOOT_ODDS[S.position],set:r=>S.foot=r.value})},
 {id:"weakf",q:"Weak foot rating?",e:"⭐",build:()=>{const am=ATTMID(S.position);const o=[1,2,3,4,5].map(v=>({label:`${v} star`,value:v}));return{options:o,weights:[22,28,25,17,8],reveal:r=>"★".repeat(r.value)+"☆".repeat(5-r.value),set:r=>S.weak=r.value};}},
 {id:"skillm",q:"Skill moves rating?",e:"⭐",build:()=>{const am=ATTMID(S.position);const fl=clamp((S.dribbling||5)/10,0,1);const o=[1,2,3,4,5].map(v=>({label:`${v} star`,value:v}));const w=isGK()?[1,0,0,0,0]:[22,28,25,17,8];return{options:o,weights:w,reveal:r=>"★".repeat(r.value)+"☆".repeat(5-r.value),set:r=>S.skill=r.value,followUp:()=>buildCareer(S.nclubs)};}}
];

/* ---------- career builder ---------- */
function buildCareer(n){
  S.clubs=[];S.leaguesN=0;S.cupsN=0;S.euro={UCL:0,UEL:0,UECL:0};S.uclN=0;
  S._yearsLeft=S.seasons;S._clubsLeft=n;
  let flow=[];
  for(let i=0;i<n;i++) flow.push(leagueStage(i),teamStage(i),yearsStage(i),titlesStage(i),cupsStage(i),improveDid(i));
  flow=flow.concat(buildInternational());
  flow.push(goalsStage(),assistsStage(),bootsStage(),ballonStage(),totyStage(),potsStage());
  return flow;
}
function leagueStage(i){return{id:"lg"+i,e:"🌍",build:()=>{
  const ab=abilityOf(),pref=1+(1-ab)*3,age=ageAt(i),o=LEAGUES.map(L=>({label:L[0],value:L[0],tier:L[1],teams:L[2],...L[3]})),w=o.map(L=>{
    const home=L.home?.includes(S.nationality);let v=(gauss(L.tier,pref,0.95)+.04)*(L.pull||1);
    if(home)v*=1.8;
    if(L.late)v*=age>=31?3.5:age>=28?1:.15;           // MLS and Saudi moves come late in a career
    if(L.local)v*=home?(age<24?4:1.5):.08;            // these leagues mostly feature homegrown players
    return v;});
  return{qText:`Which league? (club ${i+1} of ${S.nclubs})`,options:o,weights:w,reveal:r=>r.value,set:r=>{S._league=r;S.bestLeagueTier=Math.min(S.bestLeagueTier||9,r.tier);},oddsNote:()=>`More ability → bigger leagues — slice size = your odds`};
}};}
function teamStage(i){return{id:"tm"+i,e:"🏟️",build:()=>{
  const ab=abilityOf(),pref=1+(1-ab)*3;
  const justLeft=i>0?S.clubs[i-1].name:null;                       // can't "transfer" to the club you're at
  const former=new Set(S.clubs.slice(0,Math.max(0,i-1)).map(c=>c.name)); // earlier clubs: returns welcome
  const teams=S._league.teams.filter(t=>t[0]!==justLeft);
  const o=teams.map(t=>({label:t[0],value:t[0],tier:t[1],q:t[2]}));
  const w=o.map(t=>t.label==="Athletic Club"&&!BASQUE_ELIGIBLE.includes(S.nationality)?0:(gauss(t.tier,pref,0.78)+.04)*(former.has(t.label)?1.7:1)); // returns boosted
  return{qText:`Which ${S._league.label} club?`,options:o,weights:w,reveal:r=>former.has(r.value)?`${r.value} <em>a return!</em>`:r.value,
   set:r=>{S.clubs[i]={name:r.value,tier:r.tier,titleOdds:r.q??TIERQ[r.tier],cont:S._league.cont,league:S._league.label,years:0,lt:0,dc:0,ret:former.has(r.value)};S.club=r.value;S.bestTier=Math.min(S.bestTier||9,r.tier);},
   followUp:r=>former.has(r.value)?[familiarityStage(i)]:null};
}};}
function familiarityStage(i){return{id:"fam"+i,e:"🤝",build:()=>{
  const c=S.clubs[i],o=improvables().map(a=>({label:`${a[3]} ${S[a[0]]>=a[2]?"MAX":S[a[0]]}`,value:a[0],max:a[2]}));
  const w=o.map(a=>S[a.value]>=a.max?0:1),shaded=new Set();
  o.forEach((a,idx)=>{if(S[a.value]>=a.max)shaded.add(idx);});
  if(w.every(x=>x===0))return{qText:"Everything already maxed!",options:[{label:"Maxed",value:null}],weights:[1],reveal:()=>"All maxed",set:()=>{}};
  return{qText:`Back at ${c.name}: which attribute gets a +2 homecoming boost?`,options:o,weights:w,dWeights:o.map(()=>1),shaded,
   reveal:r=>{const a=improvables().find(x=>x[0]===r.value);return `${a[3]} +2`;},
   set:r=>{const a=improvables().find(x=>x[0]===r.value);S[r.value]=Math.min(a[2],S[r.value]+2);},
   oddsNote:()=>`Returning to a familiar club sharpens you up`};
}};}
function yearsStage(i){return{id:"yr"+i,e:"📅",build:()=>{
  const left=S._yearsLeft,cl=S._clubsLeft,isLast=cl===1;
  const maxA=isLast?left:Math.max(1,left-(cl-1)),evenish=left/cl;
  let o=[];for(let y=1;y<=maxA;y++)o.push({label:y+(y>1?" yrs":" yr"),value:y});
  if(isLast)o=[{label:left+(left>1?" yrs":" yr"),value:left}];
  const w=o.map(x=>gauss(x.value,evenish,Math.max(1.2,evenish*.5))+.05);
  return{qText:`How many seasons at ${S.clubs[i].name}?`,options:o,weights:w,reveal:r=>r.value+(r.value>1?" seasons":" season"),
   set:r=>{S.clubs[i].years=r.value;S._yearsLeft-=r.value;S._clubsLeft-=1;}};
}};}
function titlesStage(i){return{id:"lt"+i,e:"🏆",build:()=>{
  const c=S.clubs[i],yrs=c.years,q=c.titleOdds,ab=abilityOf(),exp=clamp(yrs*q*(0.22+0.34*ab),0,yrs),cap=Math.max(1,Math.min(13,Math.ceil(yrs*Math.min(.85,q*.8))));   // 13 at one club is the real-world ceiling (Giggs, Müller)
  const o=[];for(let v=0;v<=cap;v++)o.push({label:""+v,value:v});const w=o.map(x=>gauss(x.value,exp,Math.max(.6,exp*.5))+.01);
  return{qText:`League titles at ${c.name} in ${yrs} ${yrs>1?"seasons":"season"}?`,options:o,weights:w,set:r=>{c.lt=r.value;S.leaguesN+=r.value;},oddsNote:()=>`Slice size shows the odds — set by ${c.name}'s quality`};
}};}
function cupsStage(i){return{id:"dc"+i,e:"🥇",build:()=>{
  const c=S.clubs[i],yrs=c.years,q=Math.max(CUPQ[c.tier],Math.min(1,c.titleOdds*.7)),ab=abilityOf();
  const cap=Math.max(1,Math.min(yrs,7,Math.ceil(yrs*q*.6)));  // Ashley Cole's 7 FA Cups is the real ceiling
  const exp=clamp(yrs*q*(0.11+0.19*ab),0,cap);
  const o=[];for(let v=0;v<=cap;v++)o.push({label:""+v,value:v});const w=o.map(x=>gauss(x.value,exp,Math.max(.6,exp*.45))+.01);
  return{qText:`Domestic cups at ${c.name}?`,options:o,weights:w,set:r=>{c.dc=r.value;S.cupsN+=r.value;},
   followUp:()=>euroStages(i)};
}};}
/* Europe: did you win -> how many -> which competition, one spin per trophy */
const EUROW={1:[.78,.20,.02],2:[.32,.52,.16],3:[.07,.45,.48],4:[.02,.24,.74]};
function euroStages(i){return [euroDid(i)];}
const EUROQ={1:1,2:.6,3:.3,4:.1};
/* chance per season, so one year at a big club is not a near-certain trophy */
function continentalRate(c){const ab=abilityOf();return c.cont?(.06+.12*ab)*Math.min(1,c.titleOdds):(.04+.18*ab)*EUROQ[c.tier];}
function euroDid(i){return{id:"eud"+i,e:"🌟",build:()=>{
  const c=S.clubs[i],p=clamp(1-Math.pow(1-continentalRate(c),c.years),.01,.9);
  return{qText:c.cont?`Win the ${c.cont} at ${c.name}?`:`Win a European trophy at ${c.name}?`,options:YN(),weights:[1-p,p],set:()=>{},
   followUp:r=>r.value==="Yes"?[euroHowMany(i)]:null,oddsNote:()=>`Slice = your odds, set by ${c.name}'s level and your seasons there`};
}};}
function euroHowMany(i){return{id:"eun"+i,e:"🌟",build:()=>{
  const c=S.clubs[i],rate=continentalRate(c),cap=Math.max(1,Math.min(c.years,6,Math.ceil(c.years*rate*2.5))),exp=clamp(c.years*rate,1,cap);
  const o=[];for(let v=1;v<=cap;v++)o.push({label:v+"×",value:v});const w=o.map(x=>gauss(x.value,exp,Math.max(.7,exp*.5))+.01);
  return{qText:c.cont?`How many times do you win the ${c.cont}?`:`How many European trophies at ${c.name}?`,options:o,weights:w,reveal:r=>`${r.value}×`,
   set:r=>{if(c.cont){c.euroWon=[`${r.value}× ${c.cont}`];return;}c.euroWon=[];c.euroSeasons=pickSeasons(c.years,r.value);},
   followUp:r=>{if(c.cont)return null;const a=[];for(let k=1;k<=r.value;k++)a.push(euroWhich(i,k,r.value));return a;}};
}};}
/* which seasons of the stay the trophies happened in (distinct, ascending) */
function pickSeasons(years,m){
  const pool=[];for(let y=1;y<=years;y++)pool.push(y);
  for(let j=pool.length-1;j>0;j--){const t=Math.floor(random()*(j+1));[pool[j],pool[t]]=[pool[t],pool[j]];}
  return pool.slice(0,Math.min(m,years)).sort((a,b)=>a-b);
}
const ERANK={UECL:0,UEL:1,UCL:2};
function euroWhich(i,k,total){return{id:"euw"+i+"_"+k,e:"🌟",build:()=>{
  const c=S.clubs[i];c.euroWon=c.euroWon||[];
  const seasons=c.euroSeasons||[],thisS=seasons[k-1],prevS=k>=2?seasons[k-2]:null;
  const prevComp=c.euroWon.length?c.euroWon[c.euroWon.length-1]:null;
  // qualification only carries to the NEXT season — a gap year resets you to your normal level
  const consecutive = prevS!=null && thisS===prevS+1;
  const minRank = (consecutive&&prevComp)?Math.min(2,ERANK[prevComp]+1):0;
  const all=[{label:"UCL",value:"UCL"},{label:"UEL",value:"UEL"},{label:"UECL",value:"UECL"}];
  const base={UCL:EUROW[c.tier][0],UEL:EUROW[c.tier][1],UECL:EUROW[c.tier][2]};
  const o=all.filter(x=>ERANK[x.value]>=minRank),w=o.map(x=>base[x.value]+.02);
  const note=consecutive&&minRank>0
    ? `Back-to-back season — last year's ${prevComp} win qualified you up`
    : `${c.name}'s level sets which is likely`;
  return{qText:`European trophy ${k} of ${total} at ${c.name}: which one?`,options:o,weights:w,reveal:r=>r.label,
   set:r=>{c.euroWon.push(r.value);S.euro[r.value]+=1;if(r.value==="UCL"){S.ucl=true;S.uclN+=1;}},
   oddsNote:()=>note};
}};}
function improveDid(i){return{id:"impd"+i,e:"📈",build:()=>{
  const avail=improvables().filter(a=>S[a[0]]<a[2]).length;
  if(!avail)return{qText:`Everything maxed at ${S.clubs[i].name}!`,options:[{label:"Maxed",value:0}],weights:[1],reveal:()=>"All maxed",set:()=>{}};
  const c=S.clubs[i],qual={1:.92,2:.8,3:.66,4:.52}[c.tier];
  const age=ageAt(i),p=clamp((qual-i*0.035)*(age>=33?.35:age>=30?.7:1),.1,.93);
  return{qText:`Did you improve at ${S.clubs[i].name}?`,options:YN(),weights:[1-p,p],set:()=>{},
   followUp:r=>r.value==="Yes"?[improveCount(i)]:null,oddsNote:()=>`${c.name}'s coaching and your age set your growth odds`};
}};}
function improveCount(i){return{id:"impc"+i,e:"📈",build:()=>{
  const avail=improvables().filter(a=>S[a[0]]<a[2]).length,mx=Math.max(1,Math.min(5,avail));
  const o=[];for(let v=1;v<=mx;v++)o.push({label:""+v,value:v});const w=o.map((x,idx)=>[.42,.3,.16,.08,.04][idx]||.02);
  return{qText:`How many upgrades at ${S.clubs[i].name}?`,options:o,weights:w,set:()=>{},
   followUp:r=>{const a=[];for(let j=0;j<r.value;j++)a.push(improvePick(i));return a;}};
}};}
function improvePick(i){return{id:"impp",e:"📈",build:()=>{
  const o=improvables().map(a=>({label:`${a[3]} ${S[a[0]]>=a[2]?"MAX":S[a[0]]}`,value:a[0],max:a[2]}));
  const slowing=!isGK()&&ageAt(i)>=30;                     // nobody gets quicker in their thirties
  const w=o.map(a=>S[a.value]>=a.max||(slowing&&a.value==="pace")?0:1),dW=o.map(()=>1),shaded=new Set();
  o.forEach((a,idx)=>{if(S[a.value]>=a.max)shaded.add(idx);});
  if(w.every(x=>x===0))return{qText:"Nothing left to improve!",options:[{label:"Maxed",value:null}],weights:[1],reveal:()=>"All maxed",set:()=>{}};
  return{qText:`Which attribute improves?`,options:o,weights:w,dWeights:dW,shaded,
   reveal:r=>improvables().find(a=>a[0]===r.value)[3],set:()=>{},followUp:r=>[improveValue(r.value)]};
}};}
function improveValue(key){return{id:"impv",e:"📈",build:()=>{
  const a=improvables().find(x=>x[0]===key),max=a[2],v=S[key];
  let o=[];for(let val=1;val<=max;val++)o.push({label:max===5?`${val}★`:`${a[1][val-1]} (${val})`,value:val});
  const dW=o.map(()=>1),w=o.map((x,idx)=>idx<v?0:gauss(x.value,Math.min(max,v+1.3),1.3)+.02),shaded=new Set();
  for(let s=0;s<v;s++)shaded.add(s);
  return{qText:`How much does your ${a[3].toLowerCase()} improve? (now ${v})`,options:o,weights:w,dWeights:dW,shaded,
   reveal:r=>max===5?`${r.value}★`:`${a[1][r.value-1]} (${r.value})`,set:r=>{S[key]=r.value;}};
}};}

/* ---------- international ---------- */
const FIRST_SEASON_YEAR=2027;   // the 2026 World Cup has already been played
const FIRST_TOURNAMENT_AGE=17,LAST_TOURNAMENT_AGE=39;
const CONT_YEAR={UEFA:y=>y>=2028&&(y-2028)%4===0,CONMEBOL:y=>y>=2028&&(y-2028)%4===0,AFC:y=>y>=2027&&(y-2027)%4===0,CAF:y=>y===2027||(y>=2028&&(y-2028)%4===0),CONCACAF:y=>y>=2027&&(y-2027)%2===0};
function buildInternational(){
  const flow=[],until=FIRST_SEASON_YEAR+S.seasons;
  for(let y=FIRST_SEASON_YEAR;y<until;y++){
    const age=S.debut+(y-FIRST_SEASON_YEAR);if(age<FIRST_TOURNAMENT_AGE||age>LAST_TOURNAMENT_AGE)continue;
    if(y>=2030&&(y-2030)%4===0)flow.push(intlStage("wc","World Cup",y,"🌍",age));
    if(CONT_YEAR[S.conf](y))flow.push(intlStage("cont",S.contName,y,S.contEmoji,age));
  }
  return flow;
}
function intlStage(kind,name,year,emoji,age){return{id:"intl"+kind+year,e:emoji,build:()=>{
  const ab=abilityOf(),wc=kind==="wc",nat=(wc?S.natStrength:S.contStrength)/10,center=clamp(nat*4.0+ab*1.6,0,5.4);
  const noRoundOf16=name==="Copa América"||name==="Gold Cup";   // both go straight from groups to quarter-finals
  const o=[{label:"Not called up",value:.5},{label:"Did not qualify",value:0},{label:"Group stage",value:1},...(wc?[{label:"Round of 32",value:1.5}]:[]),...(noRoundOf16?[]:[{label:"Round of 16",value:2}]),{label:"Quarter-final",value:3},{label:"Semi-final",value:4},{label:"Runner-up",value:5},{label:"Winner",value:6}];
  // deep runs get exponentially harder for weaker nations: only true giants win it
  const w=o.map(x=>{
    if(x.value===.5)return Math.max(.02,(nat*.9+.05-ab)*4)+(age<=19?1.2:age>=36?1.5:0);   // squads are hard to make at strong nations
    if(x.value===0){if(name==="Copa América")return 0;return .02+Math.pow(1-nat,1.5)*1.4;}  // all ten CONMEBOL sides enter the Copa
    let v=gauss(x.value,center,1.35)+.02;
    if(x.value>=4)v*=Math.pow(nat,(x.value-3)*2.6);
    return v;});
  return{qText:`${name} ${year} (age ${age}): how far do you go?`,options:o,weights:w,reveal:r=>r.label,
   set:r=>{(S.intl=S.intl||[]).push({name,year,v:r.value,label:r.label});
    const bestK=wc?"wcBest":"contBest",bestL=wc?"wcBestL":"contBestL",winK=wc?"wcWins":"contWins";
    if(r.value>(S[bestK]!=null?S[bestK]:-1)){S[bestK]=r.value;S[bestL]=r.label;}
    if(r.value===6)S[winK]=(S[winK]||0)+1;},
   oddsNote:()=>`${S.nationality}'s strength in this competition + your ability`};
}};}

/* ---------- finishers ---------- */
/* career bracket size and top bracket by position, so a keeper never rolls a striker's total */
const GOAL_RANGE={GK:[2,10],CB:[25,150],RB:[25,125],LB:[25,125],CDM:[25,150],CM:[50,300],CAM:[100,500],RM:[100,500],LM:[100,500],RW:[100,800],LW:[100,800],ST:[100,900]};
const ASSIST_RANGE={GK:[2,6],CB:[20,80],RB:[25,200],LB:[25,200],CDM:[25,125],CM:[50,250],CAM:[50,350],RM:[50,300],LM:[50,300],RW:[50,350],LW:[50,350],ST:[50,250]};
function goalsStage(){const[step,top]=GOAL_RANGE[S.position];return bracketRoller("goals","How many career goals?","⚽",top,step,expectedGoals,"Career goals",Math.round(top*1.25));}
function assistsStage(){const[step,top]=ASSIST_RANGE[S.position];return bracketRoller("assists","How many career assists?","🅰️",top,step,expectedAssists,"Career assists",Math.round(top*1.2));}
function expectedGoals(){if(isGK())return Math.round(rnd(0,2));const g=GPS[S.position]||6,finish=0.2+(S.shooting/10)*1.6,support=0.7+((S.dribbling+S.pace)/20)*0.6;return clamp(Math.round(g*S.seasons*finish*support),0,1120);}
function expectedAssists(){if(isGK())return Math.round(rnd(0,4));const a=APS[S.position]||4,vision=0.2+(S.passing/10)*1.6,support=0.7+((S.dribbling+S.pace)/20)*0.6;return clamp(Math.round(a*S.seasons*vision*support),0,410);}
function bracketRoller(id,q,e,topStart,step,expFn,capLabel,sane){return{id:id+"_b",e,build:()=>{
  const exp=expFn(),br=[];for(let lo=0;lo<topStart;lo+=step)br.push([lo,lo+step,`${lo}–${lo+step-1}`]);
  br.push([topStart,Infinity,`${topStart}+`]);
  const o=br.map(b=>({label:b[2],value:b})),w=o.map(x=>{const c=isFinite(x.value[1])?(x.value[0]+x.value[1])/2:x.value[0]+step*0.6;return gauss(c,exp,Math.max(step*0.75,exp*0.18))+.004;});
  return{qText:q,options:o,weights:w,reveal:r=>r.label,set:()=>{},oddsNote:()=>`Wheel picks your range (slice = odds), then the counter rolls the number`,
   followUp:r=>[{id,e,type:"roll",build:()=>({qText:`The final count: ${capLabel.toLowerCase()}`}),compute:()=>{const lo=r.value[0],hi=r.value[1];let v;if(!isFinite(hi)){v=Math.round(clamp(Math.max(lo,exp)+rnd(0,step*.9),lo,sane));}else{v=(exp>=lo&&exp<hi)?Math.round(clamp(exp+rnd(-step*.35,step*.35),lo,hi-1)):Math.round(rnd(lo,hi-1));}return{value:Math.max(0,v),cap:capLabel};},set:v=>S[id]=v}]};
}};}
function gpsOf(){return (S.goals||0)/Math.max(1,S.seasons||10);}
function bootsStage(){return{id:"bootsD",e:"👟",build:()=>{
  const gps=gpsOf();
  const p=clamp((gps-14)/26,0,.9);        // \~14/season = never; \~40/season = near-certain
  return{qText:"Do you win a Golden Boot?",options:YN(),weights:[1-p,p],set:r=>{if(r.value==="No")S.boots=0;},
   followUp:r=>r.value==="Yes"?[bootsCount()]:null,
   oddsNote:()=>`${gps.toFixed(0)} goals/season — league top scorer usually needs 25+`};
}};}
function bootsCount(){return{id:"boots",e:"👟",build:()=>{
  const gps=gpsOf(),exp=clamp((gps-18)/4.6,1,6.3),maxN=gps<16?1:gps<22?2:gps<30?4:8;
  const o=[1,2,3,4,5,6,7,8].map(v=>({label:v+"×",value:v}));
  const w=o.map(x=>x.value>maxN?0:gauss(x.value,exp,1.05)+.02);
  return{qText:"How many Golden Boots?",options:o,weights:w,dWeights:o.map(()=>1),
   shaded:new Set(o.map((x,idx)=>x.value>maxN?idx:-1).filter(x=>x>=0)),
   reveal:r=>`${r.value}×`,set:r=>S.boots=r.value,oddsNote:()=>`Messi's record 6 needed \~45 goals/season`};
}};}
const POSBALLON={ST:1,RW:1,LW:1,CAM:.92,CM:.5,RM:.5,LM:.5,CDM:.2,CB:.16,RB:.08,LB:.08,GK:.13};
function ballonChance(){
  const ab=abilityOf();
  const pos=POSBALLON[S.position]||.4;
  const club={1:1,2:.45,3:.12,4:.02}[bestTier()]||.05;
  const lg={1:1,2:.6,3:.15,4:.04}[S.bestLeagueTier||3]||.1;
  const perSeason=((S.goals||0)+(S.assists||0)*0.7)/Math.max(1,S.seasons||10);
  const prod=clamp(perSeason/38,0,1);
  const tro=clamp((S.uclN||0)*.2+(S.leaguesN||0)*.05+(S.wcWins||0)*.28+(S.contWins||0)*.1,0,1);
  const elite=clamp((ab-0.76)*2.6,0,1);                 // must be genuinely world-class
  return clamp(elite*pos*club*lg*(0.28+0.42*prod+0.42*tro),.001,.75);
}
function ballonStage(){return{id:"ballon",e:"🏅",build:()=>{
  const p=ballonChance();
  return{qText:"Do you win the Ballon d'Or?",options:YN(),weights:[1-p,p],set:r=>S.ballon=(r.value==="Yes"),
   followUp:r=>r.value==="Yes"?[ballonCount()]:null,
   oddsNote:()=>`Position, club, league & output all matter — defenders almost never win it`};
}};}
function ballonCount(){return{id:"ballonN",e:"🏅",build:()=>{
  const ab=abilityOf(),extra=clamp((ab-.88)*9+(S.uclN||0)*.25+(S.wcWins||0)*.4,0,3.2);
  const cap=Math.max(1,Math.min(S.seasons,8)),o=[];
  for(let v=1;v<=cap;v++)o.push({label:v+"×",value:v});
  const w=o.map(x=>Math.exp(-(x.value-1)/Math.max(.42,extra))+.002);
  return{qText:"How many Ballons d'Or?",options:o,weights:w,reveal:r=>`${r.value}×`,set:r=>S.ballonN=r.value,
   oddsNote:()=>`Winning even one is historic — multiples are Messi/Ronaldo territory`};
}};}

function totyStage(){return{id:"toty",e:"⭐",build:()=>{
  const ab=abilityOf(),trophy=clamp((S.leaguesN||0)*.05+(S.uclN||0)*.12+(S.ballonN||0)*.3,0,1);
  const rate=clamp((ab-.62)*1.5+trophy*.45,0,.72);         // share of seasons making the XI
  const exp=clamp(S.seasons*rate,0,S.seasons);
  const cap=Math.max(1,Math.min(S.seasons,15)),o=[];
  for(let v=0;v<=cap;v++)o.push({label:v+"×",value:v});
  const limit=Math.max(1,Math.ceil(exp*1.6));
  const w=o.map(x=>x.value>limit?0:gauss(x.value,exp,Math.max(.45,exp*.5))+.01);
  return{qText:"How many Team of the Year selections?",options:o,weights:w,reveal:r=>`${r.value}× TOTY`,set:r=>S.toty=r.value,
   oddsNote:()=>`The best XI in the world: your level and trophies drive this`};
}};}
function potsStage(){return{id:"pots",e:"🎖️",build:()=>{
  const ab=abilityOf(),rate=clamp((ab-.68)*1.3+(S.leaguesN||0)*.02,0,.45);
  const exp=clamp(S.seasons*rate,0,S.seasons);
  const cap=Math.max(1,Math.min(S.seasons,10)),o=[];
  for(let v=0;v<=cap;v++)o.push({label:v+"×",value:v});
  const limit=Math.max(1,Math.ceil(exp*1.6));
  const w=o.map(x=>x.value>limit?0:gauss(x.value,exp,Math.max(.45,exp*.5))+.01);
  return{qText:"How many Player of the Season awards?",options:o,weights:w,reveal:r=>`${r.value}× POTS`,set:r=>S.pots=r.value,
   oddsNote:()=>`Best player in your league that season`};
}};}

  const plain = value => String(value ?? '').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  const palette=['#c7f56b','#76c7ff','#c3a6f6','#ffda83','#ff9dbb','#83dfc6','#ffad74','#a2b5ff'];
  const queue=STAGES.slice(); let stage=null,data=null,automatic=0;
  function apply(chosen) {
    if(data.set)data.set(chosen);
    if(/^stat[0-5]$/.test(stage.id)){const key=STATS()[Number(stage.id.slice(4))][0];S[key]=clamp(S[key]+(trainingPoints[key]||0)/10,1,10);}
    queue.shift();
    const more=data.followUp?.(chosen);
    if(more)queue.unshift(...(Array.isArray(more)?more:[more]));
  }
  function prepare() {
    let guard=0;
    while(queue.length){
      if(++guard>1000)throw new Error('Career flow exceeded its step limit.');
      stage=queue[0];data=stage.build?.()||{};
      if(stage.type==='roll')return;
      const landable=data.options.map((o,i)=>({o,i})).filter(x=>data.weights[x.i]>0);
      if(landable.length>1)return;
      const only=landable[0]?.o||data.options[0];apply(only);automatic++;
    }
    stage=null;data=null;
  }
  function resolve(index) {
    const question=questionView();
    if(!stage)throw new Error('Career is complete.');
    if(stage.type==='roll'){
      const computed=stage.compute();stage.set?.(computed.value);queue.shift();
      return {question,index:0,title:String(computed.value),value:computed.value,caption:computed.cap||'',record:{id:stage.id,index:0,type:'roll',value:computed.value}};
    }
    if(!Number.isInteger(index)||index<0||index>=data.options.length||!(data.weights[index]>0))throw new Error('Invalid career outcome.');
    const chosen=data.options[index];const title=plain(data.reveal?data.reveal(chosen):chosen.label);
    const record={id:stage.id,index,type:'spin'};apply(chosen);
    return {question,index,title,caption:'',record};
  }
  function questionView(){
    if(!stage)return null;
    const question={id:stage.id,prompt:plain(data.qText||stage.q||''),options:[],presentation:stage.type==='roll'?'counter':'wheel',step:records.length+automatic+1,remaining:queue.length};
    if(stage.type!=='roll')question.options=data.options.map((o,i)=>({id:String(i),label:plain(o.label),color:palette[i%palette.length],weight:Math.max(0,data.weights[i]||0),blocked:!(data.weights[i]>0)}));
    return question;
  }
  function profileView(){
    const profile=Object.fromEntries(Object.entries(S).filter(([k])=>!k.startsWith('_')));
    const ability=STATS().every(st=>Number.isFinite(S[st[0]]))?abilityOf():.5;profile.overall=clamp(Math.round(39+ability*50+((S.weak||3)-3)*.8+((S.skill||3)-3)*.8+Math.min(6,(S.leaguesN||0)*.5+(S.uclN||0)*1.2+(S.ballonN||0)*1.5+(S.wcWins||0)*1.5)),46,99);
    profile.stats=STATS().map(st=>({key:st[0],label:st[1],value:S[st[0]]==null?null:S[st[0]]*10}));
    profile.retirementAge=S.debut&&S.seasons?S.debut+S.seasons:null;
    return profile;
  }
  prepare();
  for(const record of records){
    if(!stage||record.id!==stage.id)throw new Error('Career history does not match its question flow.');
    const result=resolve(record.index);
    if(record.type==='roll'&&record.value!==result.value)throw new Error('Career counter history is inconsistent.');
    prepare();
  }
  return {
    inspect(){return {question:questionView(),profile:profileView(),complete:!stage,automatic,choices:records.length};},
    advance(pick,forcedIndex){
      if(!stage)throw new Error('Career is complete.');
      let index=0;
      if(stage.type!=='roll'){
        const total=data.weights.reduce((a,b)=>a+Math.max(0,b),0);let draw=Math.min(.999999999,Math.max(0,pick()))*total;
        for(let i=0;i<data.weights.length;i++){draw-=Math.max(0,data.weights[i]);if(draw<0){index=i;break;}}
      }
      if(forcedIndex!==undefined)index=forcedIndex;
      const result=resolve(index);prepare();
      return {...result,profile:profileView(),complete:!stage,next:questionView(),automatic};
    }
  };
}
export function inspectCareer(seed,records=[],trainingPoints={}){return createEngine(seed,records,trainingPoints).inspect();}
export function advanceCareer(seed,records=[],pick=Math.random,trainingPoints={},forcedIndex){return createEngine(seed,records,trainingPoints).advance(pick,forcedIndex);}
