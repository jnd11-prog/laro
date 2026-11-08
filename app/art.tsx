'use client';
import {useEffect,useRef,type CSSProperties} from 'react';
import {wheelSegments} from '@/lib/wheel';
import type {SpinQuestion} from '@/lib/types';
export function PixelBall({size=32}:{size?:number}) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges" aria-hidden="true"><path d="M5 0h6v1h2v2h2v2h1v6h-1v2h-2v2h-2v1H5v-1H3v-2H1v-2H0V5h1V3h2V1h2Z" fill="#eaf1e4"/><path d="M6 5h4v1h1v4h-1v1H6v-1H5V6h1ZM5 0h6v2H9v1H7V2H5ZM0 5h2v2h1v2H2v2H0ZM14 5h2v6h-2V9h-1V7h1ZM5 14h2v-1h2v1h2v2H5Z" fill="#0a1320"/><path d="M3 2h2v1H4v2H2V3h1ZM11 2h2v1h1v2h-2V3h-1ZM2 11h2v2h1v1H3v-1H2ZM12 11h2v2h-1v1h-2v-1h1Z" fill="#93a29a"/></svg>; }
export const KIT_COLORS:Record<string,string>={lime:'#c5f46d',blue:'#69c9ff',rose:'#ff8ba8',gold:'#ffd86a'};
export function Jersey({kit='lime',size=120}:{kit?:string;size?:number}) {return <svg width={size} height={size} viewBox="0 0 64 64" shapeRendering="crispEdges" role="img" aria-label={`${kit} number seven jersey`}>
  <path d="M20 8h8v4h8V8h8v4h4v4h4v4h4v12H44v24H20V32H8V20h4v-4h4v-4h4Z" fill="#070c15" transform="translate(0 3)"/>
  <path d="M20 8h8v4h8V8h8v4h4v4h4v4h4v12H44v24H20V32H8V20h4v-4h4v-4h4Z" fill={KIT_COLORS[kit]||KIT_COLORS.lime}/>
  <path d="M20 12h4v40h-4ZM40 12h4v40h-4M8 28h12v4H8ZM44 28h12v4H44Z" fill="#143d35" opacity=".45"/><path d="M28 8v4h8V8h4v8H24V8Z" fill="#10251c"/>
  <path d="M28 24h12v4h-4v4h-4v4h-4v8h-4v-8h4v-4h4v-4h-4Z" fill="#11291d"/>
  <path d="M44 12h4v4h4v4h4v4h-8v-4h-4ZM20 8h8v4h-8Z" fill="#f2ffca" opacity=".6"/>
  <rect x="23" y="19" width="4" height="3" fill="#fffde6"/>
</svg>}
export function PixelHeart({size=24}:{size?:number}){return <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true"><path d="M2 2h4v2h4V2h4v2h2v6h-2v2h-2v2h-2v2H6v-2H4v-2H2v-2H0V4h2Z" fill="#ff8aa9"/><path d="M2 4h4v2H2Z" fill="#ffd1dd"/></svg>}
export function PixelTrophy({size=24}:{size?:number}) {return <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true"><path d="M4 0h8v2h4v6h-4v2h-2v3h3v3H3v-3h3v-3H4V8H0V2h4ZM2 4v2h2V4Zm10 0v2h2V4Z" fill="#ffd86a"/><path d="M8 1h3v6H8ZM4 14h8v1H4Z" fill="#fff1b3"/></svg>}
export function Pitch(){return <svg className="pitch-art" viewBox="0 0 700 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="grass" width="100" height="450" patternUnits="userSpaceOnUse"><rect width="50" height="450" fill="#a7daae" opacity=".03"/></pattern></defs><rect width="700" height="450" fill="url(#grass)"/><g fill="none" stroke="#72bcaa" strokeWidth="1.5" opacity=".13"><rect x="45" y="45" width="610" height="360"/><path d="M350 45v360M45 130h100v190H45M655 130H555v190h100M45 175h40v100H45M655 175h-40v100h40"/><circle cx="350" cy="225" r="67"/><circle cx="350" cy="225" r="3" fill="#72bcaa"/></g></svg>}
export const WHEEL=[{key:'goal',label:'GOAL!',color:'#c5f46d',ink:'#182915',symbol:'★'},{key:'training',label:'TRAINING',color:'#72bfff',ink:'#132941',symbol:'↗'},{key:'match',label:'MATCHDAY',color:'#b5a0ee',ink:'#28213d',symbol:'⚑'},{key:'transfer',label:'TRANSFER',color:'#ffd47d',ink:'#463616',symbol:'⇄'},{key:'message',label:'SHELOMI',color:'#f69ab1',ink:'#492230',symbol:'♥'},{key:'rest',label:'RECOVERY',color:'#7ed7bf',ink:'#133e33',symbol:'✦'}];
export function Wheel({question,rotation,spinning,onSpin,disabled,reduced,duration=2200}:{question:SpinQuestion;rotation:number;spinning:boolean;onSpin:()=>void;disabled:boolean;reduced:boolean;duration?:number}){
  const canvas=useRef<HTMLCanvasElement>(null),segments=wheelSegments(question.options);
  useEffect(()=>{
    const ctx=canvas.current?.getContext('2d');if(!ctx||!question.options.length)return;
    const image=ctx.createImageData(128,128),parts=wheelSegments(question.options);
    const rgb=(hex:string)=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const dx=x-63.5,dy=y-63.5,r=Math.sqrt(dx*dx+dy*dy);if(r>63)continue;
      const angle=(Math.atan2(dy,dx)*180/Math.PI+90+(parts[0]?.offset||0)+360)%360;
      const part=parts.find(p=>angle<p.end&&p.span>0)||parts[parts.length-1];
      const edge=Math.min(angle-part.start,part.end-angle);
      const hex=r>61?'#6b829e':r>59?'#091321':r<19?'#091321':r<21?'#6b829e':edge<.7?'#132033':question.options[part.index].color;
      const c=rgb(hex),at=(y*128+x)*4;image.data[at]=c[0];image.data[at+1]=c[1];image.data[at+2]=c[2];image.data[at+3]=255;
    }
    ctx.putImageData(image,0,0);ctx.fillStyle='#b6c9cc';
    for(let i=0;i<24;i++){const a=i*15*Math.PI/180;ctx.fillRect(Math.round(63+61.5*Math.cos(a)),Math.round(63+61.5*Math.sin(a)),1,1);}
  },[question]);
  return <div className={`wheel-stage ${spinning?'is-spinning':''}`}>
    <svg className="pixel-pointer" width="30" height="24" viewBox="0 0 24 20" shapeRendering="crispEdges" aria-hidden="true"><path d="M0 0h24v4h-4v4h-4v4h-4v4H8v-4H4V8H0Z" fill="#ffe27a"/><path d="M4 0h16v3H4Z" fill="#fff2bf"/></svg>
    <div className="wheel-disc" style={{transform:`rotate(${rotation}deg)`,transitionDuration:reduced?'0.01s':`${duration}ms`} as CSSProperties}>
      <canvas width="128" height="128" ref={canvas} className="pixel-wheel" aria-hidden="true"/>
      <svg viewBox="0 0 400 400" className="wheel-labels" role="img" aria-label={question.options.filter(o=>!o.blocked).map(o=>o.label).join(', ')}>
        {segments.filter(part=>part.span>=7).map(part=>{const o=question.options[part.index],size=Math.min(12,Math.max(8,part.span*.35)),maxChars=Math.floor(115/(size*.62)),label=o.label.length>maxChars?o.label.slice(0,maxChars-1)+'…':o.label;return <text key={o.id} transform={`rotate(${part.mid-90} 200 200)`} x="370" y="200" textAnchor="end" dominantBaseline="central" fontFamily="Laro,monospace" fontSize={size} fill="#132033">{label}</text>;})}
      </svg>
    </div>
    <button onClick={onSpin} disabled={disabled} className="wheel-center" aria-label="Spin career wheel"><PixelBall size={25}/><span>{spinning?'...':'SPIN'}</span></button>
  </div>;
}
