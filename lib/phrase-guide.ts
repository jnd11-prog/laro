// Word-by-word notes shown after a correct answer, keyed by phrase id.
import type { PhraseGuide } from './types';

const RECOVERED_GUIDE: Record<string, PhraseGuide> = { galing: { parts: [{ word: `Ang`, meaning: `exclamation marker` }, { word: `Galing`, meaning: `skill / excellence` }, { word: `mo`, meaning: `your` }], why: `Ang + quality + mo makes this an exclamation about your skill. English turns it into “You’re so good!”`, taglish: `Ang galing mo sa game!` }, lambing: { parts: [{ word: `Lambingin`, meaning: `give affection to` }, { word: `mo`, meaning: `you, the doer` }, { word: `ako`, meaning: `me, the recipient` }], why: `Lambing is affectionate attention. The ending -in makes lambingin a verb directed at someone. The action comes before mo ako.`, taglish: `Lambingin mo ako, please.` }, miss: { parts: [{ word: `Miss`, meaning: `miss` }, { word: `na`, meaning: `now / already` }, { word: `kita`, meaning: `I → you` }], why: `English miss fits inside a Tagalog pattern. Kita packages “I” doing something to “you”; na adds a feeling of already or now.`, taglish: `Miss na kita.`, pattern: `Miss + na + kita`, swaps: [`Miss na kita. = I miss you now.`, `Miss kita. = I miss you.`] }, tara: { parts: [{ word: `Tara`, meaning: `come on` }, { word: `kain`, meaning: `eat` }, { word: `tayo`, meaning: `we, including you` }], why: `Tara invites. Kain names the action; tayo includes both of us. English uses “let’s” to express that invitation.`, taglish: `Tara, lunch tayo!` }, ano: { parts: [{ word: `Ano`, meaning: `what` }, { word: `raw`, meaning: `reportedly / someone said` }], why: `Raw points back to somebody else’s words. The short question leaves out “did they say,” which English supplies.`, taglish: `Ano raw? Can you repeat?` }, kuya: { parts: [{ word: `Si`, meaning: `personal-name marker` }, { word: `Kuya`, meaning: `older brother / familiar title` }], why: `Si introduces a named person. It is not the English “is.” Kuya can be a family title or a respectful form of address.`, taglish: `Si Kuya, ready na.` }, mama: { parts: [{ word: `Si`, meaning: `personal-name marker` }, { word: `Mama`, meaning: `Mom` }], why: `Si marks Mama as a named person. This is a noun phrase, not a complete sentence with an invisible “is.”`, taglish: `Si Mama, nasa kitchen.` }, papa: { parts: [{ word: `Si`, meaning: `personal-name marker` }, { word: `Papa`, meaning: `Dad` }], why: `Si marks Papa as the person being identified. Family titles can work like names.`, taglish: `Si Papa, busy pa.` }, okay: { parts: [{ word: `Okay`, meaning: `okay` }, { word: `lang`, meaning: `just / only` }], why: `Lang follows okay and softens it: “just okay” or reassuring “it’s okay,” depending on tone.`, taglish: `Okay lang, no pressure.`, pattern: `[description] + lang`, swaps: [`Okay lang.`, `Busy lang.`] }, ingat: { parts: [{ word: `Ingat`, meaning: `care / caution` }, { word: `ka`, meaning: `you` }], why: `This short goodbye uses care + you. English expands it into the instruction “take care.”`, taglish: `Ingat ka. Text me when you get home.` }, saan: { parts: [{ word: `Saan`, meaning: `where` }, { word: `ka`, meaning: `you` }, { word: `pupunta`, meaning: `will go` }], why: `The question word comes first, followed by the short pronoun ka. Pupunta is the contemplated form of punta: the trip has not happened yet.`, taglish: `Saan ka pupunta after class?` }, salamat: { parts: [{ word: `Salamat`, meaning: `thanks` }, { word: `po`, meaning: `respect marker` }], why: `Po adds respect, not a separate action. It has no exact one-word English equivalent.`, taglish: `Salamat po for dinner.` }, kaya: { parts: [{ word: `Kaya`, meaning: `can / capable` }, { word: `mo`, meaning: `you, the doer` }, { word: `yan`, meaning: `that` }], why: `Ability comes first, followed by who can do it and what they can do. Yan is the casual form of iyan.`, taglish: `Kaya mo yan. One more try.` }, kilig: { parts: [{ word: `Kinikilig`, meaning: `feeling romantic excitement` }, { word: `ako`, meaning: `I` }], why: `The root is kilig. Kinikilig describes the feeling as ongoing. Tagalog puts that feeling before ako here.`, taglish: `Kinikilig ako sa message mo.` }, mahal: { parts: [{ word: `Mahal`, meaning: `loved / dear` }, { word: `kita`, meaning: `I → you` }], why: `Mahal expresses love here, and kita joins “I” with “you.” It is not simply another word for you.`, taglish: `Mahal kita, always.` }, gets: { parts: [{ word: `Hindi`, meaning: `not` }, { word: `ko`, meaning: `I, the experiencer` }, { word: `gets`, meaning: `understand` }], why: `The English word gets sits inside Hindi ko __. Negation comes first; ko follows it before gets.`, taglish: `Hindi ko gets. Explain mo?` }, grabe: { parts: [{ word: `Grabe`, meaning: `intense / wow` }, { word: `ang`, meaning: `marks what is described` }, { word: `plot`, meaning: `plot` }, { word: `twist`, meaning: `twist` }], why: `The reaction comes first. Ang introduces what caused that reaction: the English phrase plot twist.`, taglish: `Grabe ang plot twist!` }, "taglish-ready": { parts: [{ word: `Ready`, meaning: `ready` }, { word: `na`, meaning: `now / already` }, { word: `ako`, meaning: `I` }], why: `Na follows the description and marks the new state. Ako comes after na.`, taglish: `Ready na ako. Let’s go!`, pattern: `[description] + na + ako`, swaps: [`Okay na ako.`, `Late na ako.`] }, "taglish-busy": { parts: [{ word: `Busy`, meaning: `busy` }, { word: `ka`, meaning: `you` }, { word: `ba`, meaning: `question marker` }], why: `Ba turns the statement into a yes/no question. The short pronoun ka comes before ba in this pattern.`, taglish: `Busy ka ba after class?`, pattern: `[description] + ka + ba?`, swaps: [`Free ka ba?`, `Sure ka ba?`] }, "taglish-later": { parts: [{ word: `Later`, meaning: `later` }, { word: `na`, meaning: `now, in this phrase choosing an alternative` }, { word: `lang`, meaning: `just` }], why: `Na lang together often signals an alternative or adjustment: let’s just do it later. Don’t translate the two particles separately here.`, taglish: `Later na lang. I’m tired.` }, "taglish-game": { parts: [{ word: `Game`, meaning: `up for it` }, { word: `ka`, meaning: `you` }, { word: `na`, meaning: `already / now` }, { word: `ba`, meaning: `question marker` }], why: `Game here means willing or ready, not a video game. Keep ka → na → ba in this question.`, taglish: `Game ka na ba? Let’s eat.`, pattern: `[description] + ka + na + ba?`, swaps: [`Ready ka na ba?`, `Okay ka na ba?`] }, "taglish-text": { parts: [{ word: `Text`, meaning: `text` }, { word: `mo`, meaning: `you, the doer` }, { word: `ako`, meaning: `me, the recipient` }, { word: `mamaya`, meaning: `later` }], why: `The English action leads, followed by doer → recipient → time. Mo ako is not the same form as ka.`, taglish: `Text mo ako mamaya.`, pattern: `[action] + mo + ako + [time]`, swaps: [`Text mo ako later.`, `Call mo ako tomorrow.`] }, "taglish-wait": { parts: [{ word: `Wait`, meaning: `wait` }, { word: `lang`, meaning: `just / a moment here` }, { word: `please`, meaning: `please` }], why: `Lang softens the instruction. This is conversational code-switching, with English wait and please around a Tagalog particle.`, taglish: `Wait lang, please. One minute.`, pattern: `[request] + lang`, swaps: [`Wait lang.`, `One minute lang.`] }, "taglish-try": { parts: [{ word: `Try`, meaning: `try` }, { word: `natin`, meaning: `we, including you, as doers` }, { word: `ulit`, meaning: `again` }], why: `Action → inclusive doers → repetition. Natin includes the listener; English expresses this invitation with “let’s.”`, taglish: `Try natin ulit.`, pattern: `[action] + natin + ulit`, swaps: [`Try natin ulit.`, `Check natin ulit.`] }, "taglish-proud": { parts: [{ word: `Proud`, meaning: `proud` }, { word: `ako`, meaning: `I` }, { word: `sa`, meaning: `marks the target of the feeling` }, { word: `iyo`, meaning: `you` }], why: `Description → experiencer → sa iyo. English starts with I; this Taglish sentence starts with the feeling.`, taglish: `Proud ako sa iyo. You did it.` }, "taglish-still": { parts: [{ word: `Hindi`, meaning: `not` }, { word: `pa`, meaning: `yet` }, { word: `ako`, meaning: `I` }, { word: `ready`, meaning: `ready` }], why: `Hindi pa works together as “not yet.” The pronoun follows that pair; ready comes last. Compare Ready na ako: I’m ready now.`, taglish: `Hindi pa ako ready. Give me a minute.`, pattern: `Hindi + pa + ako + [description]`, swaps: [`Hindi pa ako sure.`, `Hindi pa ako done.`] }, "taglish-ending": { parts: [{ word: `Huwag`, meaning: `don’t` }, { word: `mo`, meaning: `you, the doer` }, { word: `munang`, meaning: `for now + linker -ng` }, { word: `i-spoil`, meaning: `spoil` }, { word: `ang`, meaning: `marks the affected thing` }, { word: `ending`, meaning: `ending` }], why: `Huwag makes a negative command. Munang is muna + the linker -ng. The Tagalog prefix i- attaches to English spoil. Keep the object ang ending at the end here.`, taglish: `Huwag mo munang i-spoil ang ending.` }, "taglish-dinner": { parts: [{ word: `Kumain`, meaning: `ate / have eaten` }, { word: `ka`, meaning: `you` }, { word: `na`, meaning: `already` }, { word: `ba`, meaning: `question marker` }, { word: `or`, meaning: `or` }, { word: `order`, meaning: `order` }, { word: `tayo`, meaning: `we, including you` }], why: `The first clause checks whether eating has happened: ka → na → ba. The second switches to an invitation using English order and inclusive tayo.`, taglish: `Kumain ka na ba, or order tayo?` }, "taglish-home": { parts: [{ word: `Message`, meaning: `message` }, { word: `mo`, meaning: `you, the doer` }, { word: `ako`, meaning: `me, the recipient` }, { word: `kapag`, meaning: `when / once` }, { word: `nakauwi`, meaning: `have made it home` }, { word: `ka`, meaning: `you` }, { word: `na`, meaning: `already` }], why: `Command first, then a kapag time clause. Nakauwi emphasizes having reached home. Ka na ends that clause.`, taglish: `Message mo ako kapag nakauwi ka na.` }, "taglish-late": { parts: [{ word: `Late`, meaning: `late` }, { word: `na`, meaning: `already / now` }, { word: `ako`, meaning: `I` }], why: `Start with a familiar English description, then na ako. Na marks the state as true now.`, taglish: `Late na ako. I’ll text you when I’m there.`, pattern: `[description] + na + ako`, swaps: [`Ready na ako.`, `Okay na ako.`] }, "taglish-sure": { parts: [{ word: `Sure`, meaning: `sure` }, { word: `ka`, meaning: `you` }, { word: `ba`, meaning: `yes/no question marker` }], why: `Keep the order sure → ka → ba. You can reuse ka ba after other descriptions.`, taglish: `Sure ka ba? We can change the plan.`, pattern: `[description] + ka + ba?`, swaps: [`Busy ka ba?`, `Okay ka ba?`] }, "taglish-hungry": { parts: [{ word: `Gutom`, meaning: `hungry` }, { word: `na`, meaning: `now / already` }, { word: `ako`, meaning: `I` }], why: `Gutom is the new word. Na ako is the same ending as Ready na ako.`, taglish: `Gutom na ako. Want to order?`, pattern: `[feeling] + na + ako`, swaps: [`Pagod na ako. = I’m tired now.`, `Ready na ako. = I’m ready now.`] }, "taglish-order": { parts: [{ word: `Order`, meaning: `order` }, { word: `tayo`, meaning: `we, including you` }], why: `Tayo includes the person you’re speaking to. Here it turns an English action into a casual invitation.`, taglish: `Order tayo. What do you want?`, pattern: `[action] + tayo`, swaps: [`Lunch tayo.`, `Coffee tayo.`] }, "taglish-tired": { parts: [{ word: `Pagod`, meaning: `tired` }, { word: `ako`, meaning: `I` }, { word: `today`, meaning: `today` }], why: `Put the feeling first, then ako, then the time. The time can stay in English.`, taglish: `Pagod ako today. Stay in na lang?`, pattern: `[feeling] + ako + [time]`, swaps: [`Busy ako today.`, `Free ako tomorrow.`] }, "taglish-text-later": { parts: [{ word: `Text`, meaning: `text` }, { word: `mo`, meaning: `you, the doer` }, { word: `ako`, meaning: `me, the recipient` }, { word: `later`, meaning: `later` }], why: `English text and later stay familiar. Mo ako tells you who does the action and who receives it.`, taglish: `Text mo ako later, okay?`, pattern: `[action] + mo + ako + [time]`, swaps: [`Call mo ako later.`, `Message mo ako tomorrow.`] }, "taglish-where": { parts: [{ word: `Saan`, meaning: `where` }, { word: `tayo`, meaning: `we, including you` }, { word: `next`, meaning: `next` }], why: `Saan adds the place question. The shared plan makes “going” understood in this short question.`, taglish: `Saan tayo next? Coffee?`, pattern: `Saan + tayo + [time / next]?`, swaps: [`Saan tayo tomorrow?`, `Saan tayo later?`] }, "taglish-watch": { parts: [{ word: `Watch`, meaning: `watch` }, { word: `tayo`, meaning: `we, including you` }, { word: `later`, meaning: `later` }], why: `The English action stays. Tayo includes both of you; later tells you when.`, taglish: `Watch tayo later. No spoilers.`, pattern: `[action] + tayo + [time]`, swaps: [`Play tayo later.`, `Call tayo tonight.`] }, "taglish-episode": { parts: [{ word: `One`, meaning: `one` }, { word: `more`, meaning: `more` }, { word: `episode`, meaning: `episode` }, { word: `lang`, meaning: `just / only` }], why: `Lang limits the whole phrase before it. It adds “just” without rebuilding the English phrase.`, taglish: `One more episode lang, promise.`, pattern: `[amount / request] + lang`, swaps: [`Five minutes lang.`, `One game lang.`] }, "taglish-agree": { parts: [{ word: `Same`, meaning: `same` }, { word: `hindi`, meaning: `not` }, { word: `ko`, meaning: `I, the experiencer` }, { word: `rin`, meaning: `also / either` }, { word: `gets`, meaning: `understand` }], why: `Start with English same, then the familiar Hindi ko gets pattern. Rin adds “either” in this negative sentence.`, taglish: `Same, hindi ko rin gets. What happened?`, pattern: `Hindi + ko + rin + [understood action]`, swaps: [`Hindi ko rin alam. = I don’t know either.`, `Hindi ko rin gusto. = I don’t like it either.`] }, "taglish-replay": { parts: [{ word: `Replay`, meaning: `replay` }, { word: `natin`, meaning: `we, including you, as doers` }], why: `Natin connects both of you to an action on something already understood, such as a clip.`, taglish: `Replay natin. Was that offside?`, pattern: `[action on something] + natin`, swaps: [`Check natin.`, `Try natin.`] }, "taglish-sayang": { parts: [{ word: `Sayang`, meaning: `regret at a missed opportunity` }, { word: `almost`, meaning: `almost` }], why: `Sayang gives the reaction to a missed chance. Almost can stay in English; the match supplies the context.`, taglish: `Sayang, almost! Good attempt though.`, pattern: `Sayang + [reaction / explanation]`, swaps: [`Sayang, one point na lang. = So close, only one more point.`, `Sayang, sold out na. = Too bad, it’s sold out now.`] } };

export const AGREE_EXAMPLES = [[`You agree with the person who just spoke.`, `Same, pagod din ako.`, `Same, I’m tired too.`], [`Put hindi before what you’re saying is untrue. Here it turns “I get it” into “I don’t get it.”`, `Hindi ko gets.`, `I don’t get it.`], [`Ko tells you who doesn’t understand: me. In this sentence it comes right after hindi.`, `Hindi ko alam.`, `I don’t know.`], [`Rin adds you to someone else’s experience. If they don’t get it, you can say you don’t get it either.`, `Hindi ko rin alam.`, `I don’t know either.`], [`Gets is the English word used for “understand” in this Taglish sentence.`, `Gets mo ba?`, `Do you get it?`]];

const ADDED_GUIDE: Record<string, PhraseGuide> = {
 "kumain": {
  "parts": [
   {
    "word": "Kumain",
    "meaning": "eat / ate"
   },
   {
    "word": "ka",
    "meaning": "you"
   },
   {
    "word": "na?",
    "meaning": "yet / already"
   }
  ],
  "why": "Verb first, then who, then na. Tagalog usually opens with the action.",
  "taglish": "Kumain ka na? May food sa ref."
 },
 "sundo": {
  "parts": [
   {
    "word": "Susunduin",
    "meaning": "will pick up"
   },
   {
    "word": "kita",
    "meaning": "I … you"
   },
   {
    "word": "mamaya.",
    "meaning": "later today"
   }
  ],
  "why": "Kita packs “I” and “you” into one word, so no separate word for I is needed.",
  "taglish": "Susunduin kita mamaya after work."
 },
 "tabi": {
  "parts": [
   {
    "word": "Dito",
    "meaning": "here"
   },
   {
    "word": "ka",
    "meaning": "you"
   },
   {
    "word": "sa",
    "meaning": "at / to"
   },
   {
    "word": "tabi",
    "meaning": "side"
   },
   {
    "word": "ko.",
    "meaning": "my"
   }
  ],
  "why": "Sa tabi ko is literally “at my side.” Ko comes after the word it owns.",
  "taglish": "Dito ka sa tabi ko, may seat pa."
 },
 "pahinga": {
  "parts": [
   {
    "word": "Magpahinga",
    "meaning": "rest"
   },
   {
    "word": "ka",
    "meaning": "you"
   },
   {
    "word": "muna.",
    "meaning": "first / for now"
   }
  ],
  "why": "Muna softens the suggestion: do this first, the rest can wait.",
  "taglish": "Magpahinga ka muna, you worked so hard today."
 },
 "kwento": {
  "parts": [
   {
    "word": "Kuwento",
    "meaning": "story / tell"
   },
   {
    "word": "mo",
    "meaning": "you"
   },
   {
    "word": "sa",
    "meaning": "to"
   },
   {
    "word": "akin.",
    "meaning": "me"
   }
  ],
  "why": "The noun for story works as the action here; sa akin says who hears it.",
  "taglish": "Kuwento mo sa akin what happened sa office."
 },
 "sama": {
  "parts": [
   {
    "word": "Sama",
    "meaning": "come along"
   },
   {
    "word": "ka",
    "meaning": "you"
   },
   {
    "word": "sa",
    "meaning": "with"
   },
   {
    "word": "amin.",
    "meaning": "us (not you)"
   }
  ],
  "why": "Amin leaves the listener out, which is why the invitation makes sense.",
  "taglish": "Sama ka sa amin sa mall later."
 },
 "libre": {
  "parts": [
   {
    "word": "Libre",
    "meaning": "treat / free"
   },
   {
    "word": "kita",
    "meaning": "I … you"
   },
   {
    "word": "ngayon.",
    "meaning": "today / now"
   }
  ],
  "why": "Libre kita means “you are my treat”; kita carries both people.",
  "taglish": "Libre kita ngayon, my payday na."
 },
 "ambag": {
  "parts": [
   {
    "word": "Magkano",
    "meaning": "how much"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "ambag",
    "meaning": "contribution"
   },
   {
    "word": "ko?",
    "meaning": "my"
   }
  ],
  "why": "Question word first, then the thing being asked about.",
  "taglish": "Magkano ang ambag ko sa pizza?"
 },
 "ulit": {
  "parts": [
   {
    "word": "Puwede",
    "meaning": "can / may"
   },
   {
    "word": "bang",
    "meaning": "question marker"
   },
   {
    "word": "pakiulit?",
    "meaning": "please repeat"
   }
  ],
  "why": "Puwede + ba makes a gentle request; paki- adds please.",
  "taglish": "Puwede bang pakiulit? Medyo mahina yung sound."
 },
 "tulong": {
  "parts": [
   {
    "word": "May",
    "meaning": "there is"
   },
   {
    "word": "maitutulong",
    "meaning": "can help with"
   },
   {
    "word": "po",
    "meaning": "respect marker"
   },
   {
    "word": "ba",
    "meaning": "question marker"
   },
   {
    "word": "ako?",
    "meaning": "I"
   }
  ],
  "why": "Po and ba sit together right after the first idea; po always shows respect.",
  "taglish": "May maitutulong po ba ako sa kitchen?"
 },
 "busog": {
  "parts": [
   {
    "word": "Busog",
    "meaning": "full (from eating)"
   },
   {
    "word": "na",
    "meaning": "already / now"
   },
   {
    "word": "po",
    "meaning": "respect marker"
   },
   {
    "word": "ako.",
    "meaning": "I"
   }
  ],
  "why": "Description first, then na, po, and finally who it describes.",
  "taglish": "Busog na po ako, ang sarap ng food."
 },
 "mano": {
  "parts": [
   {
    "word": "Mano",
    "meaning": "hand / blessing"
   },
   {
    "word": "po.",
    "meaning": "respect marker"
   }
  ],
  "why": "Said while taking an elder’s hand to your forehead.",
  "taglish": "Pagdating sa bahay: “Mano po, Lola.”"
 },
 "buti": {
  "parts": [
   {
    "word": "Mabuti",
    "meaning": "good / well"
   },
   {
    "word": "naman",
    "meaning": "actually / thankfully"
   },
   {
    "word": "po.",
    "meaning": "respect marker"
   }
  ],
  "why": "Naman softens the reply so it sounds warm rather than clipped.",
  "taglish": "Mabuti naman po, medyo busy lang sa work."
 },
 "teleserye": {
  "parts": [
   {
    "word": "Ano",
    "meaning": "what"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "susunod",
    "meaning": "next"
   },
   {
    "word": "na",
    "meaning": "linker"
   },
   {
    "word": "mangyayari?",
    "meaning": "will happen"
   }
  ],
  "why": "The na here is a linker joining “next” to “will happen.”",
  "taglish": "Ano ang susunod na mangyayari sa episode na ’to?"
 },
 "sayang": {
  "parts": [
   {
    "word": "Sayang",
    "meaning": "what a waste"
   },
   {
    "word": "naman!",
    "meaning": "emphasis"
   }
  ],
  "why": "Naman adds feeling; alone, sayang is already the whole reaction.",
  "taglish": "Sayang naman! Almost goal na yun."
 },
 "bawi": {
  "parts": [
   {
    "word": "Babawi",
    "meaning": "will make up for it"
   },
   {
    "word": "tayo",
    "meaning": "we (including you)"
   },
   {
    "word": "sa",
    "meaning": "at / on"
   },
   {
    "word": "susunod.",
    "meaning": "next time"
   }
  ],
  "why": "Tayo includes the listener, so the comeback is shared.",
  "taglish": "Babawi tayo sa susunod na game."
 },
 "pasa": {
  "parts": [
   {
    "word": "Ipasa",
    "meaning": "pass (it)"
   },
   {
    "word": "mo",
    "meaning": "you"
   },
   {
    "word": "sa",
    "meaning": "to"
   },
   {
    "word": "akin!",
    "meaning": "me"
   }
  ],
  "why": "The action comes first; sa akin says where the ball should go.",
  "taglish": "Ipasa mo sa akin, open ako!"
 },
 "depensa": {
  "parts": [
   {
    "word": "Higpitan",
    "meaning": "tighten"
   },
   {
    "word": "natin",
    "meaning": "we (including you)"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "depensa.",
    "meaning": "defense"
   }
  ],
  "why": "Natin marks everyone on the team as doing the tightening.",
  "taglish": "Higpitan natin ang depensa this half."
 },
 "pagod": {
  "parts": [
   {
    "word": "Kahit",
    "meaning": "even though"
   },
   {
    "word": "pagod",
    "meaning": "tired"
   },
   {
    "word": "ako,",
    "meaning": "I"
   },
   {
    "word": "gusto",
    "meaning": "want"
   },
   {
    "word": "pa",
    "meaning": "still"
   },
   {
    "word": "rin",
    "meaning": "too / still"
   },
   {
    "word": "kitang",
    "meaning": "you (I … you + link)"
   },
   {
    "word": "makita.",
    "meaning": "to see"
   }
  ],
  "why": "Pa rin together means “still.” Kitang is kita plus a linker before the next verb.",
  "taglish": "Kahit pagod ako, gusto pa rin kitang makita tonight."
 },
 "nandito": {
  "parts": [
   {
    "word": "Nandito",
    "meaning": "here (present)"
   },
   {
    "word": "lang",
    "meaning": "just"
   },
   {
    "word": "ako",
    "meaning": "I"
   },
   {
    "word": "kung",
    "meaning": "if"
   },
   {
    "word": "kailangan",
    "meaning": "need"
   },
   {
    "word": "mo",
    "meaning": "you"
   },
   {
    "word": "ng",
    "meaning": "a / of"
   },
   {
    "word": "kausap.",
    "meaning": "someone to talk to"
   }
  ],
  "why": "Kung opens the condition. Kausap is a person, not the act of talking.",
  "taglish": "Nandito lang ako kung kailangan mo ng kausap, okay?"
 },
 "ingatlagi": {
  "parts": [
   {
    "word": "Mag-ingat",
    "meaning": "take care"
   },
   {
    "word": "ka",
    "meaning": "you"
   },
   {
    "word": "palagi,",
    "meaning": "always"
   },
   {
    "word": "lalo",
    "meaning": "more / especially"
   },
   {
    "word": "na",
    "meaning": "linker"
   },
   {
    "word": "kapag",
    "meaning": "when"
   },
   {
    "word": "umuuwi",
    "meaning": "go home"
   },
   {
    "word": "ka",
    "meaning": "you"
   },
   {
    "word": "nang",
    "meaning": "at / in"
   },
   {
    "word": "gabi.",
    "meaning": "night"
   }
  ],
  "why": "Lalo na means especially; kapag is for things that happen repeatedly.",
  "taglish": "Mag-ingat ka palagi, lalo na kapag late ka umuuwi."
 },
 "pakiusap": {
  "parts": [
   {
    "word": "Sabihin",
    "meaning": "tell"
   },
   {
    "word": "mo",
    "meaning": "you"
   },
   {
    "word": "sa",
    "meaning": "to"
   },
   {
    "word": "akin",
    "meaning": "me"
   },
   {
    "word": "kung",
    "meaning": "if"
   },
   {
    "word": "may",
    "meaning": "there is"
   },
   {
    "word": "bumabagabag",
    "meaning": "something troubling"
   },
   {
    "word": "sa",
    "meaning": "to"
   },
   {
    "word": "iyo.",
    "meaning": "you"
   }
  ],
  "why": "Two sa phrases: sa akin is who hears it, sa iyo is who is affected.",
  "taglish": "Sabihin mo sa akin kung may bumabagabag sa iyo, ha."
 },
 "salamatlagi": {
  "parts": [
   {
    "word": "Salamat",
    "meaning": "thank you"
   },
   {
    "word": "sa",
    "meaning": "for"
   },
   {
    "word": "pag-intindi",
    "meaning": "understanding"
   },
   {
    "word": "kahit",
    "meaning": "even though"
   },
   {
    "word": "hindi",
    "meaning": "not"
   },
   {
    "word": "ako",
    "meaning": "I"
   },
   {
    "word": "laging",
    "meaning": "always"
   },
   {
    "word": "madaling",
    "meaning": "easy"
   },
   {
    "word": "kausap.",
    "meaning": "to talk to"
   }
  ],
  "why": "Pag- turns a verb into a noun, so sa pag-intindi is “for the understanding.”",
  "taglish": "Salamat sa pag-intindi kahit moody ako today."
 },
 "huwagpilit": {
  "parts": [
   {
    "word": "Hindi",
    "meaning": "not"
   },
   {
    "word": "mo",
    "meaning": "you"
   },
   {
    "word": "kailangang",
    "meaning": "need to"
   },
   {
    "word": "pilitin",
    "meaning": "force"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "sarili",
    "meaning": "self"
   },
   {
    "word": "mo.",
    "meaning": "your"
   }
  ],
  "why": "Hindi comes first and negates everything after it.",
  "taglish": "Hindi mo kailangang pilitin ang sarili mo, rest ka muna."
 },
 "sabay": {
  "parts": [
   {
    "word": "Sabay",
    "meaning": "together"
   },
   {
    "word": "na",
    "meaning": "now / already"
   },
   {
    "word": "tayong",
    "meaning": "we (with link)"
   },
   {
    "word": "umuwi",
    "meaning": "go home"
   },
   {
    "word": "para",
    "meaning": "so that"
   },
   {
    "word": "hindi",
    "meaning": "not"
   },
   {
    "word": "ka",
    "meaning": "you"
   },
   {
    "word": "mag-isa.",
    "meaning": "alone"
   }
  ],
  "why": "Para opens the reason. Tayong is tayo plus a linker before the verb.",
  "taglish": "Sabay na tayong umuwi para may kasama ka."
 },
 "linaw": {
  "parts": [
   {
    "word": "Linawin",
    "meaning": "clarify"
   },
   {
    "word": "muna",
    "meaning": "first"
   },
   {
    "word": "natin",
    "meaning": "we (including you)"
   },
   {
    "word": "para",
    "meaning": "so that"
   },
   {
    "word": "walang",
    "meaning": "no / none"
   },
   {
    "word": "hindi",
    "meaning": "not"
   },
   {
    "word": "pagkakaintindihan.",
    "meaning": "mutual understanding"
   }
  ],
  "why": "Hindi pagkakaintindihan together means a misunderstanding.",
  "taglish": "Linawin muna natin para walang away later."
 },
 "plano": {
  "parts": [
   {
    "word": "Tuloy",
    "meaning": "go ahead / continue"
   },
   {
    "word": "pa",
    "meaning": "still"
   },
   {
    "word": "ba",
    "meaning": "question marker"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "plano",
    "meaning": "plan"
   },
   {
    "word": "natin",
    "meaning": "our (including you)"
   },
   {
    "word": "mamaya?",
    "meaning": "later"
   }
  ],
  "why": "Pa ba asks if something is still the case.",
  "taglish": "Tuloy pa ba ang plano natin mamaya? Baka umulan."
 },
 "late": {
  "parts": [
   {
    "word": "Pasensiya",
    "meaning": "patience / sorry"
   },
   {
    "word": "na",
    "meaning": "please (softener)"
   },
   {
    "word": "kung",
    "meaning": "if"
   },
   {
    "word": "nahuli",
    "meaning": "was late"
   },
   {
    "word": "ako,",
    "meaning": "I"
   },
   {
    "word": "naipit",
    "meaning": "got stuck"
   },
   {
    "word": "ako",
    "meaning": "I"
   },
   {
    "word": "sa",
    "meaning": "in"
   },
   {
    "word": "trapiko.",
    "meaning": "traffic"
   }
  ],
  "why": "Pasensiya na is the set phrase for sorry; kung names what you are sorry for.",
  "taglish": "Pasensiya na kung nahuli ako, grabe ang traffic sa EDSA."
 },
 "intindi": {
  "parts": [
   {
    "word": "Naiintindihan",
    "meaning": "understand"
   },
   {
    "word": "ko",
    "meaning": "I"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "ibig",
    "meaning": "meaning / want"
   },
   {
    "word": "mong",
    "meaning": "you (with link)"
   },
   {
    "word": "sabihin.",
    "meaning": "to say"
   }
  ],
  "why": "Ibig mong sabihin is a fixed expression: “what you mean.”",
  "taglish": "Naiintindihan ko ang ibig mong sabihin, don’t worry."
 },
 "bagalan": {
  "parts": [
   {
    "word": "Puwede",
    "meaning": "can / may"
   },
   {
    "word": "bang",
    "meaning": "question marker"
   },
   {
    "word": "bagalan",
    "meaning": "slow down"
   },
   {
    "word": "mo",
    "meaning": "you"
   },
   {
    "word": "nang",
    "meaning": "by / a bit of"
   },
   {
    "word": "kaunti",
    "meaning": "a little"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "pagsasalita?",
    "meaning": "speaking"
   }
  ],
  "why": "Nang kaunti means “a little.” Pag- names the act of speaking.",
  "taglish": "Puwede bang bagalan mo nang kaunti? Nag-aaral pa lang ako."
 },
 "alin": {
  "parts": [
   {
    "word": "Alin",
    "meaning": "which"
   },
   {
    "word": "sa",
    "meaning": "of"
   },
   {
    "word": "mga",
    "meaning": "plural marker"
   },
   {
    "word": "ito",
    "meaning": "these"
   },
   {
    "word": "ang",
    "meaning": "the one"
   },
   {
    "word": "mas",
    "meaning": "more"
   },
   {
    "word": "gusto",
    "meaning": "like"
   },
   {
    "word": "mo?",
    "meaning": "you"
   }
  ],
  "why": "Mga makes ito plural. Mas gusto means prefer.",
  "taglish": "Alin sa mga ito ang mas gusto mo, jollibee or mcdo?"
 },
 "bahala": {
  "parts": [
   {
    "word": "Ako",
    "meaning": "I / me"
   },
   {
    "word": "na",
    "meaning": "already (I’ll do it)"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "bahala,",
    "meaning": "one responsible"
   },
   {
    "word": "basta",
    "meaning": "as long as"
   },
   {
    "word": "sabihin",
    "meaning": "tell"
   },
   {
    "word": "mo",
    "meaning": "you"
   },
   {
    "word": "kung",
    "meaning": "what / if"
   },
   {
    "word": "ano",
    "meaning": "what"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "kailangan.",
    "meaning": "needed"
   }
  ],
  "why": "Ako na ang bahala is a set phrase for “leave it to me.”",
  "taglish": "Ako na ang bahala, basta send mo sa akin yung list."
 },
 "pakisabi": {
  "parts": [
   {
    "word": "Pakisabi",
    "meaning": "please tell"
   },
   {
    "word": "po",
    "meaning": "respect marker"
   },
   {
    "word": "kay",
    "meaning": "to (a person)"
   },
   {
    "word": "Mama",
    "meaning": "Mom"
   },
   {
    "word": "na",
    "meaning": "that"
   },
   {
    "word": "pauwi",
    "meaning": "heading home"
   },
   {
    "word": "na",
    "meaning": "already"
   },
   {
    "word": "kami.",
    "meaning": "we (not you)"
   }
  ],
  "why": "The first na means “that”; the second means “already.” Kami leaves out the listener.",
  "taglish": "Pakisabi po kay Mama na pauwi na kami, malapit na."
 },
 "luto": {
  "parts": [
   {
    "word": "Napakasarap",
    "meaning": "so delicious"
   },
   {
    "word": "po",
    "meaning": "respect marker"
   },
   {
    "word": "ng",
    "meaning": "of"
   },
   {
    "word": "luto",
    "meaning": "cooking"
   },
   {
    "word": "ninyo.",
    "meaning": "your (respectful)"
   },
   {
    "word": "Ano",
    "meaning": "what"
   },
   {
    "word": "po",
    "meaning": "respect marker"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "mga",
    "meaning": "plural marker"
   },
   {
    "word": "sangkap?",
    "meaning": "ingredients"
   }
  ],
  "why": "Napaka- means “so very.” Ninyo is the respectful or plural your.",
  "taglish": "Napakasarap po ng luto ninyo, ano po ang secret?"
 },
 "paalam": {
  "parts": [
   {
    "word": "Magpapaalam",
    "meaning": "will say goodbye"
   },
   {
    "word": "po",
    "meaning": "respect marker"
   },
   {
    "word": "muna",
    "meaning": "first"
   },
   {
    "word": "kami",
    "meaning": "we (not you)"
   },
   {
    "word": "bago",
    "meaning": "before"
   },
   {
    "word": "umalis.",
    "meaning": "leaving"
   }
  ],
  "why": "Muna and bago frame the order: say goodbye first, then leave.",
  "taglish": "Magpapaalam po muna kami bago umalis, Tita."
 },
 "pakilala": {
  "parts": [
   {
    "word": "Ikinagagalak",
    "meaning": "pleased"
   },
   {
    "word": "ko",
    "meaning": "I"
   },
   {
    "word": "po",
    "meaning": "respect marker"
   },
   {
    "word": "kayong",
    "meaning": "you (respectful, with link)"
   },
   {
    "word": "makilala.",
    "meaning": "to meet"
   }
  ],
  "why": "A formal set phrase; kayong is the respectful kayo plus a linker.",
  "taglish": "Ikinagagalak ko po kayong makilala, Tito at Tita."
 },
 "padala": {
  "parts": [
   {
    "word": "May",
    "meaning": "there is"
   },
   {
    "word": "gusto",
    "meaning": "want"
   },
   {
    "word": "po",
    "meaning": "respect marker"
   },
   {
    "word": "ba",
    "meaning": "question marker"
   },
   {
    "word": "kayong",
    "meaning": "you (respectful, with link)"
   },
   {
    "word": "ipabili",
    "meaning": "have someone buy"
   },
   {
    "word": "bago",
    "meaning": "before"
   },
   {
    "word": "kami",
    "meaning": "we (not you)"
   },
   {
    "word": "dumating?",
    "meaning": "arrive"
   }
  ],
  "why": "Ipa- means asking someone else to do it, so ipabili is “have bought for you.”",
  "taglish": "May gusto po ba kayong ipabili bago kami dumating? Dadaan kami sa grocery."
 },
 "karakter": {
  "parts": [
   {
    "word": "Hindi",
    "meaning": "not"
   },
   {
    "word": "ko",
    "meaning": "I"
   },
   {
    "word": "inakalang",
    "meaning": "thought that"
   },
   {
    "word": "siya",
    "meaning": "that person"
   },
   {
    "word": "pala",
    "meaning": "turns out"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "kontrabida.",
    "meaning": "villain"
   }
  ],
  "why": "Pala signals surprise at finding something out.",
  "taglish": "Hindi ko inakalang siya pala ang kontrabida, plot twist!"
 },
 "kiligscene": {
  "parts": [
   {
    "word": "Nakakakilig",
    "meaning": "gives butterflies"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "eksena",
    "meaning": "scene"
   },
   {
    "word": "kahit",
    "meaning": "even though"
   },
   {
    "word": "alam",
    "meaning": "know"
   },
   {
    "word": "kong",
    "meaning": "I (with link)"
   },
   {
    "word": "palabas",
    "meaning": "show"
   },
   {
    "word": "lang.",
    "meaning": "just"
   }
  ],
  "why": "Nakaka- describes something that causes a feeling.",
  "taglish": "Nakakakilig ang eksena kahit alam kong palabas lang."
 },
 "spoiler": {
  "parts": [
   {
    "word": "Huwag",
    "meaning": "don’t"
   },
   {
    "word": "mo",
    "meaning": "you"
   },
   {
    "word": "munang",
    "meaning": "yet (with link)"
   },
   {
    "word": "sabihin",
    "meaning": "tell"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "ending,",
    "meaning": "ending"
   },
   {
    "word": "hindi",
    "meaning": "not"
   },
   {
    "word": "ko",
    "meaning": "I"
   },
   {
    "word": "pa",
    "meaning": "yet"
   },
   {
    "word": "napapanood.",
    "meaning": "have watched"
   }
  ],
  "why": "Huwag starts a “don’t” instruction. Hindi pa means “not yet.”",
  "taglish": "Huwag mo munang sabihin ang ending, hindi ko pa napapanood!"
 },
 "pagkatalo": {
  "parts": [
   {
    "word": "Hindi",
    "meaning": "not"
   },
   {
    "word": "pa",
    "meaning": "yet"
   },
   {
    "word": "tapos",
    "meaning": "finished"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "laban",
    "meaning": "match"
   },
   {
    "word": "hangga’t",
    "meaning": "until / as long as"
   },
   {
    "word": "hindi",
    "meaning": "not"
   },
   {
    "word": "tumutunog",
    "meaning": "sounds"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "huling",
    "meaning": "last (with link)"
   },
   {
    "word": "pito.",
    "meaning": "whistle"
   }
  ],
  "why": "Hangga’t hindi works like “until” in English.",
  "taglish": "Hindi pa tapos ang laban hangga’t hindi tumutunog ang huling pito, guys."
 },
 "tiwala": {
  "parts": [
   {
    "word": "Mas",
    "meaning": "more"
   },
   {
    "word": "mahalaga",
    "meaning": "important"
   },
   {
    "word": "ang",
    "meaning": "the"
   },
   {
    "word": "tiwala",
    "meaning": "trust"
   },
   {
    "word": "sa",
    "meaning": "in"
   },
   {
    "word": "koponan",
    "meaning": "team"
   },
   {
    "word": "kaysa",
    "meaning": "than"
   },
   {
    "word": "sa",
    "meaning": "to"
   },
   {
    "word": "sariling",
    "meaning": "one’s own"
   },
   {
    "word": "papuri.",
    "meaning": "praise"
   }
  ],
  "why": "Mas … kaysa sa is the comparison pattern: more … than.",
  "taglish": "Mas mahalaga ang tiwala sa koponan kaysa sa stats mo."
 },
 "pagkakamali": {
  "parts": [
   {
    "word": "Matuto",
    "meaning": "learn"
   },
   {
    "word": "tayo",
    "meaning": "we (including you)"
   },
   {
    "word": "sa",
    "meaning": "from"
   },
   {
    "word": "pagkakamali",
    "meaning": "mistake"
   },
   {
    "word": "sa",
    "meaning": "instead"
   },
   {
    "word": "halip",
    "meaning": "place"
   },
   {
    "word": "na",
    "meaning": "of"
   },
   {
    "word": "magsisihan.",
    "meaning": "blame each other"
   }
  ],
  "why": "Sa halip na is one phrase meaning “instead of.” Magsi- … -an shows doing it to each other.",
  "taglish": "Matuto tayo sa pagkakamali, wag magsisihan."
 }
};

export const PHRASE_GUIDE: Record<string, PhraseGuide> = { ...RECOVERED_GUIDE, ...ADDED_GUIDE };
