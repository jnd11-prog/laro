// @ts-nocheck
'use client';
// Recovered from the deployed site's compiled bundle, so local names are short.
import { createElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, CircleCheck, Copy, Earth, Flag, Headphones, Heart, House, LoaderCircle, LockKeyhole, Mic, Pause, Play, Plus, Settings2, Shirt, Sparkles, Trophy, Upload, Volume2, VolumeX, X, Zap } from 'lucide-react';
import { AWARDS, WILDCARDS, exerciseDifficulty, getSpinQuestion, initialCareer, isCareerComplete, nationalityLabels, quizRewards } from '@/lib/engine';
import { landingRotation } from '@/lib/wheel';
import { quizView } from '@/lib/quiz';
import { arcade } from '@/lib/arcade';
import { CATALOG } from '@/lib/catalog';
import { AGREE_EXAMPLES, PHRASE_GUIDE } from '@/lib/phrase-guide';
import { Jersey, KIT_COLORS, PixelBall, PixelHeart, PixelTrophy, WHEEL, Wheel } from './art';

const NATIONALITIES = nationalityLabels();
const pad = (e2) => String(e2).padStart(2, `0`);
function newActionId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), (e2) => e2.toString(16).padStart(2, `0`)).join(``);
}
const ICONS = { goal: Flag, training: Zap, match: Trophy, transfer: ArrowUpRight, message: Heart, rest: Sparkles, award: Trophy };
const labels = { goal: `GOAL`, training: `TRAINING`, match: `FULL TIME`, transfer: `TRANSFER`, message: `FROM SHELOMI`, rest: `RECOVERY`, award: `TROPHY` };

export default function Game() {
    let [snap, setSnap] = useState(null), [view, setView] = useState(`career`), [busy, setBusy] = useState(false), [spinning, setSpinning] = useState(false), [rotation, setRotation] = useState(0), [auto, setAuto] = useState(false), [speed, setSpeed] = useState(1), [sound, setSound] = useState(true), [reduced, setReduced] = useState(false), [notice, setNotice] = useState(``), [error, setError] = useState(``), [settings, setSettings] = useState(false), [help, setHelp] = useState(false), [filter, setFilter] = useState(`All`), [detail, setDetail] = useState(null), [editing, setEditing] = useState(null), [audioActive, setAudioActive] = useState(false), [answerBusy, setAnswerBusy] = useState(false), [tiles, setTiles] = useState([]), [qe, H] = useState(false), [Je, Ye] = useState(``), [counterTarget, setCounterTarget] = useState(0), [activeQuestion, setActiveQuestion] = useState(null), [result, setResult] = useState(null), [activeRound, setActiveRound] = useState(1), [feedbackHold, setFeedbackHold] = useState(false), [countdown, setCountdown] = useState(6), W = useRef(false), snapshotRef = useRef(snap), st = useRef(0), ct = useRef(null), lt = useRef(null), lessonRef = useRef(null), dt = useRef({ y: 0, height: 0 }), wasLessonOpen = useRef(false);
    snapshotRef.current = snap;
    let state = snap?.state || initialCareer(), phrases = snap?.phrases || CATALOG, question = paintQuestion(activeQuestion || getSpinQuestion(state, phrases)), pending = state.pending, phrase = phrases.find((e3) => e3.id === pending?.phraseId), quiz = pending && phrase ? quizView(pending, phrase) : null, complete = isCareerComplete(state), profile = state.profile, lessonOpen = !!(pending && phrase && quiz && view === `career` && !spinning);
    useLayoutEffect(() => {
        if (wasLessonOpen.current && !lessonOpen && view === `career`) {
            let e3 = document.getElementById(`career-quest`), t3 = () => {
                e3?.scrollIntoView({ block: `start`, behavior: `instant` }), e3?.focus({ preventScroll: true });
            };
            t3(), requestAnimationFrame(t3);
        }
        wasLessonOpen.current = lessonOpen;
    }, [lessonOpen, view]);
    let duration = reduced ? 90 : (auto ? 1500 : 2300) / speed;
    useEffect(() => {
        if (!(pending && view === `career` && !spinning || detail || editing || settings || help || qe))
            return;
        let e3 = document.body.style.overflow;
        return document.body.style.overflow = `hidden`, () => {
            document.body.style.overflow = e3;
        };
    }, [pending, view, spinning, detail, editing, settings, help, qe]), useEffect(() => {
        if (!pending || view !== `career` || spinning)
            return;
        let e3 = lessonRef.current;
    (e3?.querySelector(`input[name=answer]`) || e3)?.focus({ preventScroll: true });
        let t3 = (t4) => {
            if (t4.key === `Escape` && (setAuto(false), setView(`phrasebook`)), t4.key === `Tab`) {
                let n3 = e3?.querySelectorAll(`button:not(:disabled)`);
                if (!n3?.length)
                    return;
                let r3 = n3[0], i3 = n3[n3.length - 1];
                t4.shiftKey && (document.activeElement === r3 || document.activeElement === e3) ? (t4.preventDefault(), i3.focus()) : !t4.shiftKey && document.activeElement === i3 && (t4.preventDefault(), r3.focus());
            }
        };
        return document.addEventListener(`keydown`, t3), () => document.removeEventListener(`keydown`, t3);
    }, [pending?.id, pending?.solved, view, spinning]);
    let notify = useCallback((e3) => setNotice(e3), []), load = useCallback(async () => {
        let e3 = await fetch(`/api/state`, { cache: `no-store` }), n3 = await e3.json();
        if (!e3.ok)
            throw Error(n3.error || `Could not open your career.`);
        return setSnap(n3), n3;
    }, []);
    useEffect(() => {
        let e3 = false;
        (async () => {
            try {
                await load();
                let e4 = new URLSearchParams(location.search).get(`join`);
                if (e4) {
                    let t4 = await fetch(`/api/join`, { method: `POST`, headers: { "Content-Type": `application/json` }, body: JSON.stringify({ invite: e4 }) }), n3 = await t4.json();
                    if (!t4.ok)
                        throw Error(n3.error);
                    await load(), history.replaceState(null, ``, `/`), notify(`Career connected.`);
                }
            }
            catch (t4) {
                e3 || setError(t4.message);
            }
        })();
        let t3 = localStorage.getItem(`laro-prefs-v2`);
        if (t3)
            try {
                let e4 = JSON.parse(t3);
                setSpeed(e4.speed || 1), setSound(e4.sound !== false);
            }
            catch {
            }
        return setReduced(matchMedia(`(prefers-reduced-motion: reduce)`).matches), () => {
            e3 = true, ct.current?.pause(), window.speechSynthesis?.cancel();
        };
    }, [load, notify]), useEffect(() => {
        localStorage.setItem(`laro-prefs-v2`, JSON.stringify({ speed: speed, sound: sound }));
    }, [speed, sound]), useEffect(() => {
        arcade.setEnabled(sound);
    }, [sound]), useEffect(() => () => arcade.stopSpin(), []), useEffect(() => {
        if (!notice)
            return;
        let e3 = setTimeout(() => setNotice(``), 4500);
        return () => clearTimeout(e3);
    }, [notice]), useEffect(() => {
        let e3 = () => {
            document.hidden && setAuto(false);
        };
        return document.addEventListener(`visibilitychange`, e3), () => document.removeEventListener(`visibilitychange`, e3);
    }, []), useEffect(() => {
        setTiles([]), setFeedbackHold(false), setCountdown(6);
    }, [pending?.id]);
    async function action(e3, n3 = {}, r3 = false) {
        let i3 = snapshotRef.current;
        if (!i3)
            throw Error(`Your career is still connecting.`);
        let a3 = await fetch(`/api/${e3}`, { method: `POST`, headers: { "Content-Type": `application/json` }, body: JSON.stringify({ ...n3, version: i3.version, requestId: newActionId() }) }), o3 = await a3.json();
        if (!a3.ok)
            throw a3.status === 409 && await load(), Error(o3.error || `Try again.`);
        return r3 || setSnap(o3), o3;
    }
    function advanceQuestion() {
        setResult(null), setActiveQuestion(null), setRotation(0), st.current = 0, setCounterTarget(0);
    }
    let spin = useCallback(async () => {
        if (W.current || !snapshotRef.current || snapshotRef.current.state.pending || isCareerComplete(snapshotRef.current.state))
            return;
        arcade.unlock(), arcade.click(), W.current = true, setBusy(true), setError(``), setSpinning(true), setResult(null), setCounterTarget(0);
        let e3 = getSpinQuestion(snapshotRef.current.state, snapshotRef.current.phrases);
        setActiveRound(snapshotRef.current.state.spins + 1), setActiveQuestion(e3), st.current = 0, setRotation(0);
        try {
            let n3 = await action(`spin`, {}, true), r3 = n3.event.wheel || e3;
            setActiveQuestion(r3);
            let i3 = n3.event.optionIndex ?? 0;
            if (r3.presentation === `counter`)
                setCounterTarget(Number(n3.event.outcome) || 0);
            else {
                let e4 = landingRotation(r3.options, i3);
                st.current = e4, setRotation(e4);
            }
            arcade.spin(duration), await new Promise((e4) => setTimeout(e4, duration + 90)), dt.current = { y: window.scrollY, height: document.querySelector(`.workspace`)?.getBoundingClientRect().height || document.documentElement.scrollHeight }, setSnap(n3), setResult(n3.event), arcade.result(!!n3.event.awardId);
        }
        catch (e4) {
            setError(e4.message), setAuto(false);
        }
        finally {
            arcade.stopSpin(), W.current = false, setBusy(false), setSpinning(false);
        }
    }, [duration, load]);
    useEffect(() => {
        if (!auto || busy || pending || view !== `career` || settings || help || detail || audioActive)
            return;
        if (result) {
            let e4 = setTimeout(() => {
                advanceQuestion(), complete && setAuto(false);
            }, 1100 / speed);
            return () => clearTimeout(e4);
        }
        if (complete) {
            setAuto(false);
            return;
        }
        let e3 = setTimeout(() => spin(), 600 / speed);
        return () => clearTimeout(e3);
    }, [auto, busy, pending, result, complete, view, settings, help, detail, audioActive, speed, spin]);
    async function xt() {
        if (!W.current) {
            W.current = true, setAnswerBusy(true);
            try {
                await action(`continue`), advanceQuestion(), setFeedbackHold(false);
            }
            catch (e3) {
                setError(e3.message);
            }
            finally {
                W.current = false, setAnswerBusy(false);
            }
        }
    }
    useEffect(() => {
        if (!auto || !pending?.solved || feedbackHold || audioActive || answerBusy || settings || help || view !== `career`)
            return;
        if (countdown <= 0) {
            xt();
            return;
        }
        let e3 = setTimeout(() => setCountdown((e4) => e4 - 1), 1e3);
        return () => clearTimeout(e3);
    }, [auto, pending?.solved, feedbackHold, audioActive, answerBusy, countdown, settings, help, view]);
    async function St() {
        if (!W.current) {
            W.current = true, setBusy(true), setAuto(false), setError(``);
            try {
                await action(`restart`, Je ? { nationality: Je } : {}), advanceQuestion(), setView(`career`), H(false), setSettings(false), setDetail(null), setTiles([]), setFeedbackHold(false), ct.current?.pause(), window.speechSynthesis?.cancel(), setAudioActive(false), notify(`New career started. Your Tagalog progress and XP are saved.`);
            }
            catch (e3) {
                setError(e3.message);
            }
            finally {
                W.current = false, setBusy(false);
            }
        }
    }
    async function Ct(e3) {
        if (!(W.current || !pending || pending.solved)) {
            W.current = true, setAnswerBusy(true), setError(``);
            try {
                arcade.unlock(), (await action(`answer`, { challengeId: pending.id, answer: e3 })).correct ? (arcade.correct(), setFeedbackHold(true)) : arcade.wrong(), setCountdown(6);
            }
            catch (e4) {
                setError(e4.message);
            }
            finally {
                W.current = false, setAnswerBusy(false);
            }
        }
    }
    async function wt(e3) {
        if (setFeedbackHold(true), ct.current?.pause(), window.speechSynthesis?.cancel(), setAudioActive(true), e3.audio) {
            let t4 = new Audio(e3.audio);
            ct.current = t4, t4.onended = () => setAudioActive(false), t4.onerror = () => {
                setAudioActive(false), notify(`That recording could not be played. Try again.`);
            };
            try {
                await t4.play();
            }
            catch {
                setAudioActive(false), notify(`Tap Listen again to play the recording.`);
            }
            return;
        }
        if (!(`speechSynthesis` in window)) {
            setAudioActive(false), notify(`No device voice available. Shelomi can add a recording in the studio.`);
            return;
        }
        let t3 = window.speechSynthesis.getVoices().find((e4) => /^(fil|tl)(-|$)/i.test(e4.lang));
        if (!t3) {
            setAudioActive(false), notify(`A Filipino device voice isn’t available here. Add a real recording in Shelomi’s studio`);
            return;
        }
        let n3 = new SpeechSynthesisUtterance(e3.phrase);
        n3.lang = t3.lang, n3.voice = t3, n3.rate = 0.8, n3.onend = () => setAudioActive(false), n3.onerror = () => setAudioActive(false), lt.current = n3, window.speechSynthesis.speak(n3);
    }
    function changeView(e3) {
        setView(e3), setAuto(false), setError(``);
    }
    function toggleAuto() {
        arcade.unlock(), arcade.click(), setAuto((e3) => !e3);
    }
    let Et = Object.keys(state.reviews).length, Dt = Object.values(state.reviews).filter((e3) => e3.streak >= 3).length, Ot = /^stat[0-5]$/.test(question.id);
    const lastProgress = useRef(0);
    const sceneMode = lessonOpen ? pending.solved ? `night` : `dusk` : question.id === `wildcard` ? `night` : `day`;
    const knownProgress = complete ? 100 : question.remaining === undefined ? null : Math.round((state.builder?.choices.length || 0) / Math.max(1, (state.builder?.choices.length || 0) + question.remaining) * 100);
    if (knownProgress !== null) lastProgress.current = knownProgress;
    return <div className={`app-shell ${view === `career` ? `play-mode` : ``}`}>{view === `career` && <Scene mode={sceneMode} keeper={lessonOpen && !pending.solved} fireworks={lessonOpen && pending.solved} still={reduced}/>}{lessonOpen && <div aria-hidden="true" style={{ height: dt.current.height }}/>}{!lessonOpen && <div className="workspace">{view !== `career` && <header className="topbar"><button className="adventure-brand" onClick={() => changeView(`career`)} aria-label="Laro FC home"><PixelBall size={27}/><span>LARO FC</span></button><div className="breadcrumb"><span>HYUNG’S CAREER</span><ChevronRight size={13}/><b>{view === `career` ? `RUN ${pad(state.season)}` : view === `phrasebook` ? `PHRASEBOOK` : view === `locker` ? `LOCKER ROOM` : `THE STUDIO`}</b></div><div className="top-actions"><button className="restart-button" disabled={!snap || busy || answerBusy} onClick={() => {
        setAuto(false), Ye(``), H(true);
    }}>RESTART</button><span className="save-status"><i />{snap ? `SAVED` : `CONNECTING`}</span><div className="xp-counter"><Zap size={15} fill="currentColor"/>{state.xp.toLocaleString()}<span>XP</span></div><button className="icon-button" title={sound ? `Mute game sounds` : `Enable game sounds`} aria-label={sound ? `Mute game sounds` : `Enable game sounds`} onClick={() => {
        arcade.unlock(), setSound(!sound);
    }}>{sound ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button><button className="icon-button" aria-label="Game settings" onClick={() => setSettings(true)}><Settings2 size={18}/></button><div className="user-avatar">H<span /></div></div></header>}<main>{error && <div className="error-banner" role="alert"><span>{error}</span>{!snap && <button onClick={() => load().then(() => setError(``)).catch((e3) => setError(e3.message))}>Retry</button>}<button aria-label="Dismiss error" onClick={() => setError(``)}><X size={16}/></button></div>}{view === `career` && <div id="career-quest" tabIndex={-1} className="play-screen"><div className="hud"><div className="hud-progress" role="progressbar" aria-label="Career progress" aria-valuenow={lastProgress.current} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${lastProgress.current}%` }}/></div><span className="hud-xp" aria-label={`${state.xp} XP`}>{state.xp.toLocaleString()}</span><button className="hud-gear" aria-label="Game settings" onClick={() => setSettings(true)}><Settings2 size={22}/></button></div>{complete && !result ? <><section className="career-card" aria-label="Career card"><div className="career-card-overall">{profile?.overall}</div><h1>Hyung</h1><div className="career-card-position">{profile?.position}</div><div className="career-card-trophies"><img src="/art/trophy.png" alt="Trophies"/>{Object.values(state.trophies).reduce((e3, t3) => e3 + t3, 0)}</div></section><div className="play-cta"><button className="game-cta" onClick={() => {
        arcade.unlock(), action(`season`).then(() => advanceQuestion()).catch((e3) => setError(e3.message));
    }}>Play again</button></div></> : <><div className="play-heading">{question.id === `wildcard` ? <h1 className="play-logo"><img src="/art/wildcard.png" alt="Wildcard"/></h1> : <h1 className="game-title">{result && !spinning ? result.title : question.prompt}</h1>}{result && !spinning && <p className="play-reward" role="status">{result.reward.split(` · `)[0]}</p>}</div><div className="wheel-playground">{question.id === `wildcard` ? <div className="wildcard-grid" aria-label="Possible XP outcomes">{WILDCARDS.map((card, index) => <div key={card.label} style={{ "--i": index }} className={`wildcard-tile ${card.xp < 0 ? `loss` : ``} ${spinning ? `drawing` : ``} ${result?.optionIndex === index && !spinning ? `picked` : ``}`}>{card.xp > 0 ? `+` : card.xp < 0 ? `−` : ``}{Math.abs(card.xp)}</div>)}</div> : question.presentation === `counter` ? <Counter key={question.id} target={counterTarget} animate={spinning} duration={duration}/> : <Wheel key={question.id} question={question} rotation={rotation} spinning={spinning} onSpin={() => result ? advanceQuestion() : spin()} disabled={!snap || busy || !!pending} reduced={reduced} duration={duration}/>}</div><div className="play-cta"><button className="game-cta" onClick={() => {
        arcade.unlock(), result ? advanceQuestion() : spin();
    }} disabled={!snap || busy || !!pending}>{busy ? `…` : result ? complete ? `See career` : `Next` : question.id === `wildcard` ? `Draw` : question.presentation === `counter` ? `Roll` : `Spin`}</button></div></>}</div>}{view === `phrasebook` && <><PageTitle eyebrow="TAGALOG" title="Phrasebook" description=""/><div className="summary-strip"><div><b>{Et}</b><span>REVIEWED</span></div><div><b>{Dt}</b><span>3 CORRECT REVIEWS</span></div><div><b>{phrases.length}</b><span>TOTAL PHRASES</span></div></div><div className="filter-row">{[`All`, `Lambing`, `Barkada`, `Family`, `Pop culture`, `Matchday`].map((e3) => <button key={e3} onClick={() => setFilter(e3)} className={filter === e3 ? `filter active` : `filter`}>{e3 === `Pop culture` ? `TV & pop culture` : e3 === `Barkada` ? `Group chat` : e3}</button>)}</div><div className="phrase-grid">{phrases.filter((e3) => filter === `All` || e3.category === filter).map((e3) => <button key={e3.id} className="phrase-card panel" onClick={() => setDetail(e3)}><div><span className={`category-tag ${e3.category === `Lambing` ? `pink` : ``}`}>{e3.category}</span>{state.reviews[e3.id] ? <span className="phrase-status"><Check size={13}/>{` `}{state.reviews[e3.id].streak >= 3 ? `Practiced` : `Reviewed`}</span> : <span className="phrase-status muted">New</span>}</div><span className="phrase-level">{exerciseDifficulty(e3, `meaning`).difficulty}</span><h3>{e3.phrase}</h3><p>{e3.meaning}</p><footer><span><Volume2 size={13}/>{e3.audio ? `Shelomi’s recording` : `Device voice`}</span><ArrowUpRight size={17}/></footer></button>)}</div></>}{view === `locker` && <><PageTitle eyebrow="KITS" title="Locker room" description="Unlock kits with XP."/><div className="locker-header panel"><Jersey kit={state.kit} size={130}/><div><span className="eyebrow">{`HYUNG · #07`}</span><h2>{state.club}</h2><p>{state.xp}{` career XP · `}{state.kit.charAt(0).toUpperCase() + state.kit.slice(1)}{` kit equipped`}</p></div><span className="outlined-tag">{`DIVISION `}{state.division}</span></div><div className="kit-grid">{[{ id: `lime`, name: `Home`, xp: 0, desc: `Green home kit.` }, { id: `blue`, name: `Away`, xp: 150, desc: `Blue away kit.` }, { id: `rose`, name: `Pink`, xp: 300, desc: `Pink alternate kit.` }, { id: `gold`, name: `Gold`, xp: 600, desc: `Gold kit.` }].map((t3) => <div key={t3.id} className={`kit-card panel ${state.kit === t3.id ? `equipped` : ``}`}><span className="eyebrow">{t3.xp === 0 ? `STARTER KIT` : `${t3.xp} XP UNLOCK`}</span><Jersey kit={t3.id} size={170}/><h3>{t3.name}</h3><p>{t3.desc}</p><button className={state.kit === t3.id ? `secondary-button` : `primary-button`} disabled={!snap || busy || state.xp < t3.xp || state.kit === t3.id} onClick={async () => {
        if (!W.current) {
            W.current = true, setBusy(true);
            try {
                await action(`kit`, { kit: t3.id }), notify(`Kit equipped.`);
            }
            catch (e3) {
                setError(e3.message);
            }
            finally {
                W.current = false, setBusy(false);
            }
        }
    }}>{state.kit === t3.id ? <><Check size={15}/>Equipped</> : state.xp < t3.xp ? <><LockKeyhole size={14}/>{t3.xp - state.xp}{` XP to go`}</> : <>Equip kit<ArrowRight size={15}/></>}</button></div>)}</div><section className="career-details" aria-label="Career details"><aside className="career-right"><section className="player-panel panel"><div className="player-top"><span className="eyebrow">PLAYER CARD</span><span className="rookie-tag">{state.rating || `—`}{` OVR`}</span></div><div className="player-identity"><Jersey kit={state.kit} size={112}/><div><div className="player-name pixel">HYUNG</div><span className="player-position">{profile?.position || `POSITION —`}{` · #07`}</span><div className="club-name">{profile?.club || `Club not drawn`}</div><span className="player-nationality">{profile?.nationality || `Nationality —`}</span></div></div><div className="six-stats">{(profile?.stats || []).map((e3) => <div key={e3.key}><span>{e3.label.toUpperCase()}</span><b>{e3.value ?? `—`}</b><div><i style={{ width: `${e3.value || 0}%` }}/></div></div>)}</div><div className="player-facts"><span>{`DEBUT `}<b>{profile?.debut || `—`}</b></span><span>{`HEIGHT `}<b>{profile?.height || `—`}</b></span><span>{`FOOT `}<b>{profile?.foot || `—`}</b></span><span>{`SEASONS `}<b>{profile?.seasons || `—`}</b></span></div></section><section className="trophy-panel panel"><h2 className="pixel">{`TROPHIES `}<span>{Object.values(state.trophies).reduce((e3, t3) => e3 + t3, 0)}</span></h2><div className="trophy-grid">{AWARDS.map((e3) => <div key={e3.id} title={e3.name} className={state.trophies[e3.id] ? `won` : ``}><PixelTrophy size={30}/><span>{e3.label}</span><b>{state.trophies[e3.id] ? `×${state.trophies[e3.id]}` : `—`}</b></div>)}</div></section></aside>{!!profile?.clubs?.length && <section className="club-history panel"><h2>CLUB HISTORY</h2>{profile.clubs.map((e3, t3) => <div key={t3}><span className="club-index">{pad(t3 + 1)}</span><div><b>{e3.name}</b><span>{e3.league}{` · `}{e3.years || `—`}{` seasons`}</span></div><span className="club-trophies">{e3.lt || 0}{` league · `}{e3.dc || 0}{` cups`}{e3.euroWon?.length ? ` · ${e3.euroWon.join(`, `)}` : ``}</span></div>)}</section>}<section className="united-feature" aria-labelledby="united-title"><div className="united-masthead"><span>HYUNG’S CLUB</span><span>MANCHESTER UNITED</span><span>FAN CORNER</span></div><div className="united-feature-body"><div><span className="feature-kicker">OLD TRAFFORD · MATCHDAY</span><h2 id="united-title">Manchester<br />United.</h2><button className="primary-button" onClick={() => {
        setFilter(`Matchday`), changeView(`phrasebook`), window.scrollTo({ top: 0, behavior: `instant` });
    }}>MATCHDAY TAGLISH<ArrowRight size={17}/></button></div><div className="united-scarf" aria-hidden="true"><span>UNITED</span><b>07</b><span>HYUNG</span></div></div></section><section className="culture-edit" aria-labelledby="culture-title"><div className="culture-heading"><span className="eyebrow">TAGLISH</span><h2 id="culture-title">Conversations</h2></div><div className="culture-links">{[{ category: `Pop culture`, label: `TV & reactions`, title: `Grabe ang plot twist!`, phrase: `That plot twist is wild.` }, { category: `Barkada`, label: `The group chat`, title: `Game ka na ba?`, phrase: `Are you ready?` }, { category: `Lambing`, label: `Between you two`, title: `Miss na kita.`, phrase: `I miss you.` }].map((e3, t3) => <button key={e3.category} onClick={() => {
        setFilter(e3.category), changeView(`phrasebook`), window.scrollTo({ top: 0, behavior: `instant` });
    }}><span className="culture-number">0{t3 + 1}</span><div><small>{e3.label}</small><h3>{e3.title}</h3><p>{e3.phrase}</p></div><ArrowUpRight size={21}/></button>)}</div></section><section className="story-section"><div className="section-heading"><h2 className="pixel">CAREER RECAP</h2></div><div className="story-grid">{state.history.length ? state.history.slice(0, 3).map((e3, t3) => <EventCard key={e3.id} event={e3} latest={t3 === 0}/>) : <div className="empty-story"><PixelBall size={24}/><p>No spins yet.</p></div>}</div></section></section></>}{view === `studio` && <><PageTitle eyebrow="LESSONS" title="Shelomi’s studio" description="Add phrases, context, and voice recordings."/><div className="studio-banner panel"><div className="studio-heart"><PixelHeart size={35}/></div><div><h2>Add a lesson.</h2><p>Record an existing phrase or add a new one.</p></div><button className="primary-button" onClick={() => setEditing(`new`)} disabled={!snap}><Plus size={17}/>Add a phrase</button></div><div className="studio-columns"><section className="panel studio-list"><div className="panel-heading"><h2>Your lesson collection</h2><span className="eyebrow">{phrases.length}{` PHRASES`}</span></div>{phrases.map((e3) => <div key={e3.id} className="studio-row"><div className={`studio-phrase-icon ${e3.audio ? `recorded` : ``}`}><Volume2 size={17}/></div><div><b>{e3.phrase}</b><span>{e3.category}{` · `}{e3.audio ? `Voice added` : `No recording`}</span></div><button className="small-button" onClick={() => setEditing(e3)}>{e3.audio ? `Edit voice` : `Add voice`}<Plus size={12}/></button></div>)}</section><aside><div className="panel studio-tip"><Headphones size={24}/><h3>Voice recordings</h3><p>Record the phrase, then explain its meaning and when to use it.</p><p>Default audio uses a Filipino device voice when available. Your recording replaces it.</p></div><div className="panel studio-tip"><BookOpen size={23}/><h3>Hyung’s progress</h3><p>{Et}{` phrases reviewed.`}<br />{Dt}{` recalled correctly at least three times in a row.`}</p><div className="progress-track"><span style={{ width: `${Et / phrases.length * 100}%` }}/></div></div><div className="panel studio-tip"><Heart size={23}/><h3>Invite Hyung</h3><p>An invite connects Hyung to this career as a learner. He also needs access to the app.</p><button className="secondary-button" onClick={async () => {
        if (snap?.invite)
            try {
                await navigator.clipboard.writeText(`${location.origin}/?join=${snap.invite}`), notify(`Career invite copied.`);
            }
            catch {
                notify(`Clipboard unavailable. Try again in a browser tab.`);
            }
    }}><Copy size={14}/>Copy career invite</button></div></aside></div></>}</main><nav className="mobile-nav" aria-label="Game navigation">{[[`career`, `Play`], [`phrasebook`, `Phrases`], [`locker`, `Kits and career stats`], ...snap?.role === `owner` ? [[`studio`, `Studio`]] : []].map(([id, label]) => <button key={id} aria-label={label} aria-current={view === id ? `page` : undefined} className={view === id ? `active` : ``} onClick={() => changeView(id)}><NavIcon name={id}/></button>)}</nav></div>}{lessonOpen && pending && phrase && quiz && <section className="penalty" ref={lessonRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="lesson-title"><button className="penalty-close" aria-label="Save and leave quiz" onClick={() => {
        setAuto(false), setView(`phrasebook`);
    }}><X size={24}/></button>{pending.solved ? <><div className="penalty-score" id="lesson-title">{pending.tries === 1 ? <img src="/art/gool.png" alt="Goooool!"/> : <div className="game-title">Rebound!</div>}<div className="penalty-xp">+{pending.earned}{` XP`}</div>{pending.training && <span className="penalty-chip">{pending.training.label}{` `}{pending.training.delta >= 0 ? `+` : ``}{pending.training.delta}</span>}</div><div className="penalty-actions"><div className="penalty-review"><WordReview key={pending.id} phrase={phrase}/></div><div className="penalty-row"><button className="penalty-listen" aria-label="Listen" onClick={() => wt(phrase)} disabled={audioActive}><ListenIcon/></button><button className="game-cta" onClick={() => xt()} disabled={answerBusy}>Next</button></div>{auto && <button className="text-button countdown" onClick={() => setFeedbackHold(!feedbackHold)}>{feedbackHold ? `Auto-continue paused` : `Continuing in ${countdown}s · tap to pause`}</button>}</div></> : <><div className="penalty-hero"><p className="penalty-prompt">{quiz.prompt}</p><h1 className="game-title" id="lesson-title">{quiz.title}</h1>{pending.training && <span className="penalty-chip">{pending.training.label}{` training`}</span>}<button className="penalty-listen" aria-label="Listen" onClick={() => wt(phrase)} disabled={audioActive || pending.mode === `translate` || pending.mode === `type`}><ListenIcon/></button></div><div className="penalty-actions">{pending.feedback && <p className="penalty-miss" role="status">{pending.feedback}</p>}{pending.mode === `build` ? <><div className="tile-answer">{tiles.length ? tiles.map((e3, t3) => <button key={t3} onClick={() => setTiles(tiles.filter((e4, n3) => n3 !== t3))}>{pending.options[e3]}</button>) : <span>I-tap ang words in order</span>}</div><div className="word-tiles">{pending.options.map((e3, t3) => <button key={t3} disabled={tiles.includes(t3)} onClick={() => setTiles([...tiles, t3])}>{e3}</button>)}</div><button className="game-cta" disabled={answerBusy || !tiles.length} onClick={() => Ct(tiles.map((e3) => pending.options[e3]).join(` `))}>Shoot</button></> : pending.mode === `type` ? <form onSubmit={(event) => { event.preventDefault(); const typed = String(new FormData(event.currentTarget).get(`answer`) || ``); if (typed.trim()) Ct(typed); }}><input key={pending.tries} name="answer" aria-label="Type it in Tagalog" autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="Type it in Tagalog"/><button className="game-cta" type="submit" disabled={answerBusy}>Shoot</button></form> : <div className="answer-options">{pending.options.map((e3, t3) => <button key={t3} disabled={answerBusy} onClick={() => Ct(e3)}>{e3}</button>)}</div>}</div></>}</section>}{detail && <Modal title="Phrase details" onClose={() => {
        setDetail(null), ct.current?.pause(), window.speechSynthesis?.cancel(), setAudioActive(false);
    }}><span className="category-tag">{detail.category}</span><h2 className="detail-phrase">{detail.phrase}</h2><p className="detail-meaning">{detail.meaning}</p><button className="audio-button" onClick={() => wt(detail)}><Volume2 size={17}/>Listen<span className="voice-wave">{`▂▄▆▃▅▂`}</span></button><PhraseNotes phrase={detail}/><span className="eyebrow">{detail.audio ? `SHELOMI’S RECORDING` : `FILIPINO DEVICE VOICE, WHEN AVAILABLE`}</span></Modal>}{qe && <Modal title="Start a new career" onClose={() => {
        busy || H(false);
    }}><p className="restart-copy">Replace this player and reroll your career. XP, unlocked kits, trophy collection, recordings, and Tagalog progress stay.</p><label className="restart-label">NATIONALITY<select value={Je} onChange={(e3) => Ye(e3.target.value)}><option value="">Spin for a nationality</option>{NATIONALITIES.map((e3) => <option key={e3} value={e3}>{e3}</option>)}</select></label><p className="restart-copy">Choose a country here to guarantee it on the nationality wheel.</p>{error && <p role="alert">{error}</p>}<button className="primary-button" disabled={busy} onClick={() => void St()}>{busy ? `STARTING…` : `START NEW CAREER`}<ArrowRight size={18}/></button><button className="text-button" disabled={busy} onClick={() => H(false)}>Keep playing this career</button></Modal>}{settings && <Modal title="Settings" onClose={() => setSettings(false)}><div className="setting-row"><div><b>Career speed</b><p>Time between automatic spins.</p></div><div className="segmented">{[1, 2].map((e3) => <button key={e3} className={speed === e3 ? `active` : ``} onClick={() => setSpeed(e3)}>{e3}×</button>)}</div></div><div className="setting-row"><div><b>Game sounds</b><p>Wheel ticks and result sounds.</p></div><button className={`auto-toggle ${sound ? `on` : ``}`} role="switch" aria-checked={sound} aria-label="Game sounds" onClick={() => {
        arcade.unlock(), setSound(!sound);
    }}><span className="toggle-track"><span /></span></button></div><div className="setting-row"><div><b>Reduce motion</b><p>Resolve spins without the animation.</p></div><button className={`auto-toggle ${reduced ? `on` : ``}`} role="switch" aria-checked={reduced} aria-label="Reduce motion" onClick={() => setReduced(!reduced)}><span className="toggle-track"><span /></span></button></div><div className="setting-row"><div><b>Auto-spin</b><p>Pauses for every Tagalog quiz.</p></div><button className={`auto-toggle ${auto ? `on` : ``}`} role="switch" aria-checked={auto} aria-label="Auto-spin" onClick={toggleAuto}><span className="toggle-track"><span /></span></button></div><div className="settings-action"><button className="secondary-button" onClick={() => { setSettings(false), setHelp(true); }}>How to play</button><button className="secondary-button" disabled={!snap || busy || answerBusy} onClick={() => { setSettings(false), setAuto(false), Ye(``), H(true); }}>Restart</button></div></Modal>}{help && <Modal title="How to play" onClose={() => setHelp(false)}><div className="help-steps">{[[`01`, `Spin.`, `Each round asks a football question. The wheel picks the result and updates your career.`], [`02`, `Learn.`, `Every attribute roll has a Tagalog checkpoint. First-try answers add 2–6 stat points by difficulty; a mistake deducts 1–3 once. Checkpoint wheels follow skill moves and each club’s trophies, then a wildcard can add up to 100 XP or deduct up to 60. One- and two-star rolls together have a 50% chance. Quiz XP scales with difficulty, with a one-time penalty for mistakes.`], [`03`, `Continue.`, `The questions build your player, club history, competitions, and final career card. Auto-spin pauses for Tagalog quizzes.`]].map(([e3, t3, n3]) => <div key={e3}><span className="pixel">{e3}</span><div><h3>{t3}</h3><p>{n3}</p></div></div>)}</div><button className="primary-button" onClick={() => setHelp(false)}>Close<ArrowRight size={15}/></button></Modal>}{editing && <PhraseEditor phrase={editing === `new` ? null : editing} onClose={() => setEditing(null)} onSave={async () => {
        await load(), setEditing(null), notify(`Phrase saved.`);
    }}/>}{notice && <div className="toast" role="status"><CircleCheck size={19}/><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice(``)}><X size={15}/></button></div>}</div>;
}

// The wheel's colors, chosen to keep its dark labels readable.
const WHEEL_COLORS = [`#f6c445`, `#38b6a4`, `#ea5f4d`, `#4284dc`, `#d96aa8`];
const paintedQuestions = new WeakMap();
function paintQuestion(question) {
    if (!paintedQuestions.has(question)) paintedQuestions.set(question, { ...question, options: question.options.map((option, index) => {
        const last = index > 0 && index === question.options.length - 1 && index % WHEEL_COLORS.length === 0;
        return { ...option, color: WHEEL_COLORS[last ? 2 : index % WHEEL_COLORS.length] };
    }) });
    return paintedQuestions.get(question);
}
function Scene({ mode, keeper, fireworks, still }) {
    return <div className={`scene ${still ? `still` : ``}`} aria-hidden="true"><div className="scene-stage"><img className="scene-base" src={`/art/base-${mode}.png`} alt=""/>{mode === `night` && <img className="scene-stars" src="/art/stars.png" alt=""/>}<div className={`scene-sky ${mode}`}><img className="scene-clouds" src={`/art/clouds-${mode}.png`} alt=""/></div><div className="scene-smoke" style={{ backgroundImage: `url(/art/smoke-${mode}.png)` }}/>{mode === `day` && <><div className="scene-birds"/><img className="scene-jeep" src="/art/jeep.png" alt=""/></>}{keeper && <img className="scene-keeper" src="/art/keeper.png" alt=""/>}{fireworks && <><div className="scene-burst gold"/><div className="scene-burst pink"/><div className="scene-burst mint"/></>}<img className="scene-grass" src={`/art/grass-${mode}.png`} alt=""/></div></div>;
}
const NAV_ICONS = {
    career: `M4 0h6v1h2v2h1v2h1v4h-1v2h-1v2h-2v1H4v-1H2v-2H1V9H0V5h1V3h1V1h2Zm1 4v5h4V4Z`,
    phrasebook: `M0 2h6v1h2V2h6v10H8v1H6v-1H0Zm2 2v6h4V4Zm6 0v6h4V4Z`,
    locker: `M3 1h3v1h2V1h3v1h1v1h1v1h1v3h-3v6H3V7H0V4h1V3h1V2h1Z`,
    studio: `M5 0h4v7H5ZM3 5h2v3h4V5h2v4H8v3h2v2H4v-2h2V9H3Z`,
};
function NavIcon({ name }) {
    return <svg width="28" height="28" viewBox="0 0 14 14" shapeRendering="crispEdges" fill="currentColor" aria-hidden="true"><path d={NAV_ICONS[name]}/></svg>;
}
function ListenIcon() {
    return <svg width="30" height="30" viewBox="0 0 14 14" shapeRendering="crispEdges" fill="currentColor" aria-hidden="true"><path d="M0 5h3V4h1V3h1V2h2v10H5v-1H4v-1H3V9H0ZM9 4h1v1h1v4h-1v1H9V8h1V6H9ZM11 2h1v1h1v8h-1v1h-1v-1h1V3h-1Z"/></svg>;
}

function PageTitle({ eyebrow: e2, title: t2, description: n2 }) {
    return <div className="page-title"><div className="eyebrow"><span className="live-square"/>{e2}</div><h1 className="pixel">{t2}</h1>{n2 && <p>{n2}</p>}</div>;
}

function EventCard({ event: e2, latest: t2 }) {
    let n2 = ICONS[e2.kind], r2 = WHEEL.find((t3) => t3.key === e2.kind)?.color;
    return <article className={`event-card panel ${t2 ? `latest` : ``}`}><div className="event-meta"><span style={{ color: r2 }}>{createElement(n2, { size: 13 })}{labels[e2.kind]}</span><span>S{pad(e2.season)}{` · DAY `}{pad(e2.day)}</span></div><h3>{e2.title}</h3><p>{e2.detail}</p><footer><span style={{ color: r2 }}>{e2.reward}</span>{t2 && <span className="latest-tag">LATEST</span>}</footer></article>;
}

function Modal({ title: e2, onClose: t2, children: n2 }) {
    let r2 = useRef(null);
    return useEffect(() => {
        let e3 = document.activeElement;
        r2.current?.focus();
        let n3 = (e4) => {
            if (e4.key === `Escape` && t2(), e4.key === `Tab`) {
                let t3 = r2.current?.querySelectorAll(`button:not(:disabled),input,select,textarea,a[href]`);
                if (!t3?.length)
                    return;
                let n4 = t3[0], i2 = t3[t3.length - 1];
                e4.shiftKey && document.activeElement === n4 ? (e4.preventDefault(), i2.focus()) : !e4.shiftKey && document.activeElement === i2 && (e4.preventDefault(), n4.focus());
            }
        };
        return document.addEventListener(`keydown`, n3), () => {
            document.removeEventListener(`keydown`, n3), e3?.focus();
        };
    }, []), <div className="modal-backdrop" onMouseDown={(e3) => {
        e3.target === e3.currentTarget && t2();
    }}><div className="modal" role="dialog" aria-modal="true" aria-label={e2} ref={r2} tabIndex={-1}><div className="modal-heading"><h2>{e2}</h2><button className="icon-button" aria-label="Close dialog" onClick={t2}><X size={21}/></button></div>{n2}</div></div>;
}

function PhraseEditor({ phrase: e2, onClose: t2, onSave: n2 }) {
    let [r2, i2] = useState(null), [a2, o2] = useState(false), [s2, c2] = useState(false), [u2, d2] = useState(``), f2 = useRef(null), p2 = useRef(null), m2 = useRef([]), h2 = useRef(null);
    useEffect(() => () => {
        h2.current && clearTimeout(h2.current), f2.current?.state === `recording` && f2.current.stop(), p2.current?.getTracks().forEach((e3) => e3.stop());
    }, []);
    async function ee2() {
        if (a2) {
            f2.current?.stop();
            return;
        }
        try {
            if (d2(``), !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder > `u`)
                throw Error(`Recording isn’t supported here. Upload an audio file instead.`);
            let e3 = await navigator.mediaDevices.getUserMedia({ audio: true });
            p2.current = e3;
            let t3 = new MediaRecorder(e3);
            f2.current = t3, m2.current = [], t3.ondataavailable = (e4) => {
                e4.data.size && m2.current.push(e4.data);
            }, t3.onstop = () => {
                let n3 = t3.mimeType || `audio/webm`;
                i2(new File(m2.current, `voice-recording.` + (n3.includes(`mp4`) ? `m4a` : `webm`), { type: n3 })), o2(false), e3.getTracks().forEach((e4) => e4.stop()), h2.current && clearTimeout(h2.current);
            }, t3.start(), o2(true), h2.current = setTimeout(() => t3.stop(), 3e4);
        }
        catch (e3) {
            d2(e3.name === `NotAllowedError` ? `Microphone permission wasn’t granted. You can upload a recording instead.` : e3.message);
        }
    }
    async function te2(t3) {
        if (t3.preventDefault(), a2)
            return;
        c2(true), d2(``);
        let i3 = new FormData(t3.currentTarget);
        r2 && i3.set(`audio`, r2), e2 && (CATALOG.some((t4) => t4.id === e2.id) ? (i3.set(`source`, e2.id), i3.set(`category`, e2.category)) : i3.set(`id`, e2.id));
        try {
            let e3 = await fetch(`/api/phrases`, { method: `POST`, body: i3 }), t4 = await e3.json();
            if (!e3.ok)
                throw Error(t4.error);
            await n2();
        }
        catch (e3) {
            d2(e3.message);
        }
        finally {
            c2(false);
        }
    }
    return <Modal title={e2 ? `Add your voice` : `A new phrase for Hyung`} onClose={t2}><form className="phrase-form" onSubmit={te2}><label>Tagalog phrase<input name="phrase" required={true} maxLength={180} defaultValue={e2?.phrase} readOnly={!!e2 && CATALOG.some((t3) => t3.id === e2.id)} placeholder="Lambingin mo ako."/></label><label>What it means<input name="meaning" required={true} maxLength={240} defaultValue={e2?.meaning} readOnly={!!e2 && CATALOG.some((t3) => t3.id === e2.id)} placeholder="Give me some affection."/></label><label>When would you say it?<textarea name="context" required={true} maxLength={1400} rows={3} defaultValue={e2?.context} placeholder="The context Hyung needs to understand the moment."/></label><label>Category<select name="category" disabled={!!e2 && CATALOG.some((t3) => t3.id === e2.id)} defaultValue={e2?.category || `Lambing`}>{[`Lambing`, `Barkada`, `Family`, `Pop culture`, `Matchday`].map((e3) => <option key={e3}>{e3}</option>)}</select></label><div className="record-box"><div><b>Your voice, optional.</b><span>A short recording · up to 30 seconds</span></div><div className="record-actions"><button type="button" className={`secondary-button ${a2 ? `recording` : ``}`} onClick={ee2}>{a2 ? <><span className="record-dot"/>Stop recording</> : <><Mic size={15}/>Record</>}</button><label className="upload-label"><Upload size={15}/>Upload<input type="file" accept="audio/*" onChange={(e3) => {
        i2(e3.target.files?.[0] || null);
    }}/></label></div>{r2 && <small><Check size={13}/>{r2.name}{` · `}{Math.round(r2.size / 1024)}{` KB`}</small>}</div>{u2 && <p className="form-error" role="alert">{u2}</p>}<button className="primary-button" type="submit" disabled={s2 || a2}>{s2 ? <LoaderCircle size={16} className="loading"/> : <Check size={16}/>}{` `}{s2 ? `Saving…` : `Save phrase`}</button></form></Modal>;
}

function questionGroup(e2) {
    return /^intl/.test(e2) ? `INTERNATIONAL` : /^(boot|ballon|toty|pots|goal|assist)/.test(e2) ? `CAREER TOTALS` : /^(lg|tm|yr|lt|dc|eu|imp|fam)/.test(e2) ? `CLUB CAREER` : `BUILD YOUR PLAYER`;
}

function Counter({ target: e2, animate: t2, duration: n2 }) {
    let [r2, i2] = useState(0);
    return useEffect(() => {
        let r3 = 0, a2 = 0;
        if (!e2) {
            i2(0);
            return;
        }
        function o2(s2) {
            a2 ||= s2;
            let c2 = t2 ? Math.min(1, (s2 - a2) / n2) : 1;
            i2(Math.round(e2 * (1 - (1 - c2) ** 3))), c2 < 1 && (r3 = requestAnimationFrame(o2));
        }
        return r3 = requestAnimationFrame(o2), () => cancelAnimationFrame(r3);
    }, [e2, t2, n2]), <div className="counter-stage"><span className="eyebrow">CAREER TOTAL</span><strong className="pixel">{r2.toLocaleString()}</strong><span>{t2 ? `ROLLING…` : `READY TO ROLL`}</span></div>;
}

function PhraseNotes({ phrase: e2 }) {
    let t2 = PHRASE_GUIDE[e2.id], n2 = t2?.parts || e2.phrase.split(/\s+/).map((e3) => ({ word: e3, meaning: `` }));
    return <section className="phrase-breakdown" aria-label="Phrase breakdown"><h3>1. Follow the word order</h3><p className="breakdown-caption">Read left to right. These are meaning notes, not a literal English sentence.</p><ol className="word-map">{n2.map((e3, t3) => <li key={t3}><small>{t3 + 1}</small><b>{e3.word}</b>{e3.meaning && <span>{e3.meaning}</span>}</li>)}</ol><h3>2. Why it works</h3><p>{t2?.why || e2.context}</p>{t2 && <><h3>3. In a conversation</h3><p className="taglish-example">{t2.taglish}</p><small>Casual Taglish. Wording varies by person and situation.</small>{t2.pattern && <div className="pattern-practice"><h3>4. Use the same pattern</h3><p className="sentence-pattern">{t2.pattern}</p><p>Keep the pattern. Swap in a word you already know.</p><ul>{t2.swaps?.map((e3) => <li key={e3}>{e3}</li>)}</ul></div>}</>}</section>;
}

function WordReview({ phrase: e2 }) {
    let [t2, n2] = useState(0), r2 = e2.phrase.trim().split(/\s+/), i2 = PHRASE_GUIDE[e2.id], a2 = e2.id === `taglish-agree` ? AGREE_EXAMPLES[t2] : void 0, o2 = i2?.parts[t2], s2 = (e3) => `hsl(${(39 + e3 * 137.5) % 360} 80% 78%)`;
    return <div className="word-review"><h2 id="lesson-title" className="review-accessible-title">{e2.phrase}</h2><p className="review-instruction">Tap a word to see how it’s used.</p><div className="review-words" role="group" aria-label="Words in sentence order">{r2.map((e3, r3) => <button key={r3} type="button" aria-pressed={t2 === r3} aria-controls="word-use" style={{ color: s2(r3) }} onClick={() => n2(r3)}><b>{e3}</b>{i2?.parts[r3] && <small>{i2.parts[r3].meaning}</small>}</button>)}</div><p className="review-translation" data-testid="quiz-meaning">{e2.meaning}</p><div id="word-use" aria-live="polite" className="word-use"><h3 style={{ color: s2(t2) }}>{o2?.word ?? r2[t2]}</h3><p>{a2?.[0] ?? o2?.meaning ?? e2.context}</p><blockquote>{a2?.[1] ?? i2?.taglish ?? e2.phrase}</blockquote>{a2 && <small>{a2[2]}</small>}</div><details className="review-order"><summary>{`Word order & practice`}</summary><p>{i2?.why ?? e2.context}</p>{i2?.pattern && <><b>{i2.pattern}</b><ul>{i2.swaps?.map((e3) => <li key={e3}>{e3}</li>)}</ul></>}</details></div>;
}
