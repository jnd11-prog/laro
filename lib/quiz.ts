import type {Challenge,Phrase} from './types';
// A quiz never receives a visible gloss or explanation until it is solved.
export function quizView(challenge:Challenge,phrase:Phrase){
 return {
  title:challenge.solved?phrase.phrase:(challenge.cue||phrase.phrase),
  meaning:challenge.solved?phrase.meaning:null,
  context:challenge.solved?phrase.context:null,
  prompt:challenge.prompt,
 };
}
