import type {SpinOption} from './types';
export function wheelSegments(options:SpinOption[]){
 const weights=options.map(o=>Math.max(0,o.weight??1));const total=weights.reduce((a,b)=>a+b,0)||1;
 const offset=(weights[0]||0)/total*180;let start=0;
 return options.map((_,index)=>{const span=weights[index]/total*360;const segment={index,start,end:start+span,span,mid:start+span/2-offset,offset,probability:weights[index]/total};start+=span;return segment;});
}
export function landingRotation(options:SpinOption[],index:number){const segment=wheelSegments(options)[index];if(!segment||segment.span<=0)throw new Error('Cannot land on an unavailable option.');return 1080+((360-segment.mid)%360+360)%360;}
