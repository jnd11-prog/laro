'use client';
// Synthesized locally: no audio downloads, tracking, or external API.
class ArcadeAudio {
  private context: AudioContext|null=null;
  private output: GainNode|null=null;
  private enabled=true;
  private timers: ReturnType<typeof setTimeout>[]=[];
  unlock(){
    if(typeof window==='undefined')return;
    try{
      if(!this.context){this.context=new AudioContext();this.output=this.context.createGain();this.output.gain.value=this.enabled ? 0.055 : 0;this.output.connect(this.context.destination);}
      if(this.context.state==='suspended')void this.context.resume();
    }catch{/* Audio is optional when the browser has no Web Audio support. */}
  }
  setEnabled(value:boolean){this.enabled=value;if(this.context&&this.output)this.output.gain.setTargetAtTime(value ? 0.055 : 0,this.context.currentTime,.02);if(!value)this.stopSpin();}
  private tone(freq:number,when:number,duration:number,wave:OscillatorType='square',volume=1){
    const c=this.context;if(!c||!this.output||!this.enabled||c.state!=='running')return;
    const o=c.createOscillator(),g=c.createGain();o.type=wave;o.frequency.value=freq;
    const at=c.currentTime+when;g.gain.setValueAtTime(volume,at);g.gain.exponentialRampToValueAtTime(.001,at+duration);
    o.connect(g);g.connect(this.output);o.start(at);o.stop(at+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  click(){this.tone(520,0,.035,'square',.45);}
  spin(duration=2050){this.stopSpin();if(!this.enabled)return;for(let i=0;i<23;i++){const time=Math.pow(i/23,1.85)*duration;this.timers.push(setTimeout(()=>this.tone(1200-(i%3)*120,0,.018,'square',.3),time));}}
  stopSpin(){this.timers.forEach(clearTimeout);this.timers=[];}
  result(award=false){this.stopSpin();const notes=award?[523,659,784,1047,1319,1568]:[659,880,1047];notes.forEach((n,i)=>this.tone(n,i*.07,.15,'square',.65));}
  correct(){[523,659,784,1047].forEach((n,i)=>this.tone(n,i*.065,.12,'square',.6));}
  wrong(){this.tone(196,0,.09,'triangle',.7);this.tone(147,.09,.12,'triangle',.7);}
}
export const arcade=new ArcadeAudio();
