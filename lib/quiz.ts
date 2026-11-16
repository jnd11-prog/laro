import type {Challenge,Phrase} from './types';
// A quiz never receives the answer's gloss or explanation until it is solved. It can carry a scene,
// the English being practiced (for fill-in and word order) and one more hint after each miss.
export function quizView(challenge:Challenge,phrase:Phrase){
 const misses=challenge.solved?0:challenge.tries,hints=challenge.hints||[];
 return {
  title:challenge.solved?phrase.phrase:(challenge.cue||phrase.phrase),
  meaning:challenge.solved?phrase.meaning:null,
  context:challenge.solved?phrase.context:null,
  prompt:challenge.prompt,
  scene:challenge.solved?null:challenge.scene||null,
  support:challenge.solved?null:challenge.support||null,
  hint:misses>0&&hints.length?hints[Math.min(misses,hints.length)-1]:null,
  options:(challenge.options||[]).filter(o=>!(challenge.removed||[]).includes(o)),
 };
}
