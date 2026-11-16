'use client';
// Game music and sound effects, synthesized locally with Web Audio: no audio downloads,
// tracking, or external API. All melodies are original.

export type Mood = 'day' | 'quiz' | 'fiesta' | 'wildcard' | 'lounge';
type Voice = 'kalimba' | 'keys' | 'bell' | 'flute';
type Note = [step: number, midi: number, length: number];
type Track = {
  bpm: number;
  swing: number;
  /** One chord per bar, lowest note first; the bass follows the first note. */
  chords: number[][];
  /** Lead melody per bar; shorter lists repeat. */
  lead: Note[][];
  leadVoice: Voice;
  padVoice: Voice;
  /** [step, length in sixteenths] where the chord sounds. */
  pad: [number, number][];
  /** [step, semitones above the root, length] for the bass line. */
  bass: [number, number, number][];
  /** 16-character drum lanes: x = hit, o = soft hit. */
  kick: string;
  snare: string;
  hat: string;
  level: number;
};

const n = (step: number, midi: number, length: number): Note => [step, midi, length];
// Warm seventh chords, a slow swing and brushed drums: cozy lo-fi, quiet enough to read over.
const TRACKS: Record<Mood, Track> = {
  // Sunday kickabout, for spinning the wheel.
  day: {
    bpm: 86, swing: 0.22, level: 1,
    chords: [[41, 57, 60, 64], [40, 55, 59, 62], [38, 53, 57, 60], [36, 52, 55, 59]],
    lead: [
      [n(0, 72, 3), n(4, 76, 2), n(6, 79, 2), n(10, 77, 4)],
      [n(2, 76, 2), n(4, 74, 2), n(8, 71, 6)],
      [n(0, 69, 2), n(2, 72, 2), n(4, 77, 4), n(10, 76, 2), n(12, 74, 4)],
      [n(0, 72, 8), n(12, 67, 2), n(14, 69, 2)],
      [n(0, 81, 3), n(4, 79, 2), n(6, 77, 2), n(8, 76, 4)],
      [n(0, 74, 2), n(4, 79, 4), n(10, 76, 4)],
      [n(0, 77, 2), n(2, 76, 2), n(4, 74, 2), n(6, 72, 2), n(8, 69, 6)],
      [n(4, 71, 2), n(6, 72, 10)],
    ],
    leadVoice: 'kalimba', padVoice: 'keys', pad: [[0, 7], [10, 6]],
    bass: [[0, 0, 6], [7, 7, 2], [10, 0, 5]],
    kick: 'x.........x.....', snare: '....o.......o...', hat: '..o...o...o...o.',
  },
  // Study lamp, for the Tagalog quiz: no drums to speak of, nothing to compete with reading.
  quiz: {
    bpm: 70, swing: 0, level: 0.8,
    chords: [[45, 55, 60, 64], [41, 57, 60, 64], [36, 55, 59, 64], [43, 55, 59, 64]],
    lead: [[n(0, 76, 4), n(8, 72, 6)], [n(4, 77, 4), n(10, 76, 4)], [n(0, 79, 4), n(8, 74, 6)], [n(6, 71, 4), n(10, 74, 6)]],
    leadVoice: 'bell', padVoice: 'keys', pad: [[0, 16]],
    bass: [[0, 0, 12]],
    kick: 'o...............', snare: '................', hat: '................',
  },
  // Barrio party, for goals and the career card: brighter, still unhurried.
  fiesta: {
    bpm: 96, swing: 0.15, level: 1,
    chords: [[36, 52, 55, 59, 64], [45, 55, 60, 64], [38, 53, 57, 60], [43, 53, 59, 62]],
    lead: [
      [n(0, 76, 2), n(2, 79, 2), n(4, 84, 2), n(8, 83, 2), n(10, 79, 2), n(12, 76, 4)],
      [n(0, 77, 2), n(2, 76, 2), n(4, 72, 4), n(10, 69, 2), n(12, 72, 4)],
      [n(0, 74, 2), n(2, 77, 2), n(4, 81, 4), n(8, 79, 2), n(10, 77, 2), n(12, 74, 4)],
      [n(0, 79, 4), n(4, 74, 2), n(6, 71, 2), n(8, 74, 8)],
    ],
    leadVoice: 'kalimba', padVoice: 'keys', pad: [[0, 3], [6, 3], [10, 5]],
    bass: [[0, 0, 4], [6, 7, 2], [8, 0, 4], [14, 7, 2]],
    kick: 'x.....x.x.......', snare: '....o.......o...', hat: '.o.o.o.o.o.o.o.o',
  },
  // Wildcard: slow pads, a faint heartbeat and a music-box motif while the XP is drawn.
  wildcard: {
    bpm: 64, swing: 0, level: 0.85,
    chords: [[38, 53, 57, 64], [34, 50, 57, 62], [43, 53, 58, 62], [33, 52, 57, 62]],
    lead: [[n(0, 74, 4), n(8, 69, 8)], [n(4, 77, 4), n(8, 76, 8)], [n(0, 74, 4), n(8, 70, 8)], [n(4, 73, 4), n(8, 69, 8)]],
    leadVoice: 'bell', padVoice: 'flute', pad: [[0, 16]],
    bass: [[0, 0, 14]],
    kick: 'o..o............', snare: '................', hat: '................',
  },
  // Sari-sari lo-fi, for the phrasebook, locker room and studio.
  lounge: {
    bpm: 74, swing: 0.25, level: 0.9,
    chords: [[50, 54, 57, 61, 64], [47, 50, 54, 57, 62], [43, 50, 54, 59, 62], [45, 49, 52, 55, 61]],
    lead: [[n(6, 78, 2), n(8, 76, 4)], [n(10, 74, 2), n(12, 73, 4)], [n(4, 71, 2), n(6, 74, 2), n(8, 78, 6)], [n(8, 76, 2), n(10, 73, 6)]],
    leadVoice: 'flute', padVoice: 'keys', pad: [[0, 7], [7, 9]],
    bass: [[0, 0, 6], [7, 0, 3], [10, 7, 5]],
    kick: 'x.........x.....', snare: '........o.......', hat: '..o...o...o...o.',
  },
};

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
// Phone speakers barely play soft sine tones, so the music needs real headroom to be heard.
const SFX_LEVEL = 0.3, MUSIC_LEVEL = 0.5;

class ArcadeAudio {
  private context: AudioContext | null = null;
  private sfx: GainNode | null = null;
  private music: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private echo: DelayNode | null = null;
  private noise: AudioBuffer | null = null;
  private enabled = true;
  private musicOn = true;
  private mood: Mood = 'day';
  private playing: Mood | null = null;
  private step = 0;
  private bar = 0;
  private nextTime = 0;
  private scheduler: ReturnType<typeof setInterval> | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private switchTimer: ReturnType<typeof setTimeout> | null = null;

  /** Creates the audio graph. Browsers allow this only after a tap or key press. */
  unlock() {
    if (typeof window === 'undefined') return;
    try {
      // iOS mutes Web Audio under the silent switch unless the page asks for playback audio.
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
      if (session && session.type !== 'playback') session.type = 'playback';
      if (!this.context) this.build();
      if (this.context?.state === 'suspended') void this.context.resume();
      this.syncMusic();
    } catch { /* Audio is optional when the browser has no Web Audio support. */ }
  }
  private build() {
    const c = new AudioContext();
    this.context = c;
    // A gentle low-pass and compressor keep every sound soft on small phone speakers.
    const tone = c.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 6500;
    const glue = c.createDynamicsCompressor(); glue.threshold.value = -18; glue.ratio.value = 3; glue.attack.value = 0.01; glue.release.value = 0.25;
    tone.connect(glue).connect(c.destination);
    this.sfx = c.createGain(); this.sfx.gain.value = this.enabled ? SFX_LEVEL : 0; this.sfx.connect(tone);
    this.duckGain = c.createGain(); this.duckGain.connect(tone);
    // Music runs through a warm low-pass, like a small radio in the next room.
    const warm = c.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.value = 3200; warm.Q.value = 0.4; warm.connect(this.duckGain);
    this.music = c.createGain(); this.music.gain.value = 0; this.music.connect(warm);
    // A short generated room reverb and a dotted-eighth echo give the music some air.
    const length = Math.floor(c.sampleRate * 1.8), impulse = c.createBuffer(2, length, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = impulse.getChannelData(ch); for (let i = 0; i < length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.6; }
    this.reverb = c.createConvolver(); this.reverb.buffer = impulse;
    const wet = c.createGain(); wet.gain.value = 0.32; this.reverb.connect(wet).connect(this.duckGain);
    const sfxWet = c.createGain(); sfxWet.gain.value = 0.25; this.reverb.connect(sfxWet).connect(this.sfx);
    this.echo = c.createDelay(1); const feedback = c.createGain(); feedback.gain.value = 0.28; const echoOut = c.createGain(); echoOut.gain.value = 0.18;
    this.echo.connect(feedback).connect(this.echo); this.echo.connect(echoOut).connect(this.music);
    this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  setEnabled(value: boolean) {
    this.enabled = value;
    if (this.context && this.sfx) this.sfx.gain.setTargetAtTime(value ? SFX_LEVEL : 0, this.context.currentTime, 0.02);
    if (!value) this.stopSpin();
  }
  setMusic(value: boolean) { this.musicOn = value; this.syncMusic(); }
  setMood(mood: Mood) { this.mood = mood; this.syncMusic(); }
  /** Lowers the music while a recording or device voice is speaking. */
  duck(on: boolean) { if (this.context && this.duckGain) this.duckGain.gain.setTargetAtTime(on ? 0.18 : 1, this.context.currentTime, 0.12); }

  private syncMusic() {
    const c = this.context;
    if (!c || !this.music) return;
    const want = this.musicOn && c.state !== 'closed';
    if (!want) {
      this.music.gain.setTargetAtTime(0, c.currentTime, 0.15);
      if (this.scheduler) { clearInterval(this.scheduler); this.scheduler = null; }
      if (this.switchTimer) { clearTimeout(this.switchTimer); this.switchTimer = null; }
      this.playing = null;
      return;
    }
    if ((this.scheduler || this.switchTimer) && this.playing === this.mood) return;
    if (this.scheduler || this.switchTimer) {
      // Change songs with a short fade so a mood switch never cuts mid-note.
      const at = c.currentTime;
      this.music.gain.setTargetAtTime(0, at, 0.12);
      if (this.scheduler) clearInterval(this.scheduler); this.scheduler = null;
      if (this.switchTimer) clearTimeout(this.switchTimer);
      this.switchTimer = setTimeout(() => { this.switchTimer = null; this.startSong(); }, 420);
      this.playing = this.mood;
      return;
    }
    this.startSong();
  }
  private startSong() {
    const c = this.context;
    if (!c || !this.music || !this.musicOn) return;
    this.playing = this.mood; this.step = 0; this.bar = 0; this.nextTime = c.currentTime + 0.08;
    const track = TRACKS[this.mood];
    this.music.gain.cancelScheduledValues(c.currentTime);
    this.music.gain.setTargetAtTime(MUSIC_LEVEL * track.level, c.currentTime, 0.4);
    if (this.echo) this.echo.delayTime.value = (60 / track.bpm) * 0.75;
    this.scheduler = setInterval(() => this.pump(), 30);
    this.pump();
  }
  private pump() {
    const c = this.context;
    if (!c || c.state !== 'running') return;
    // A throttled background tab can fall behind; skip ahead instead of playing a burst.
    if (this.nextTime < c.currentTime - 0.25) this.nextTime = c.currentTime + 0.05;
    const track = TRACKS[this.playing || this.mood], sixteenth = 60 / track.bpm / 4;
    while (this.nextTime < c.currentTime + 0.18) {
      const swing = this.step % 2 ? track.swing * sixteenth : 0;
      this.playStep(track, this.bar, this.step, this.nextTime + swing, sixteenth);
      this.nextTime += sixteenth;
      if (++this.step === 16) { this.step = 0; this.bar++; }
    }
  }
  private playStep(t: Track, bar: number, step: number, at: number, sixteenth: number) {
    const chord = t.chords[bar % t.chords.length], lead = t.lead[bar % t.lead.length];
    for (const [s, held] of t.pad) if (s === step) chord.slice(1).forEach((m, i) => this.voice(t.padVoice, hz(m), at + i * 0.012, held * sixteenth, 0.06, false));
    for (const [s, semis, len] of t.bass) if (s === step) this.bass(hz(chord[0] + semis), at, sixteenth * len);
    for (const [s, m, len] of lead) if (s === step) this.voice(t.leadVoice, hz(m), at, len * sixteenth, 0.12, true);
    // Vinyl crackle: a few faint dust clicks per bar.
    if (Math.random() < 0.18) this.hit(at + Math.random() * sixteenth, 0.05, 'highpass', 3000, 0.008, this.music);
    if (t.kick[step] !== '.') this.kick(at, t.kick[step] === 'x' ? 0.6 : 0.32);
    if (t.snare[step] !== '.') this.snare(at, t.snare[step] === 'x' ? 0.16 : 0.1);
    if (t.hat[step] !== '.') this.hat(at, t.hat[step] === 'x' ? 0.06 : 0.035);
  }

  // Instruments. Each note is a few short-lived oscillators that disconnect when done.
  private env(at: number, attack: number, peak: number, release: number, bus: AudioNode) {
    const g = this.context!.createGain();
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(peak, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + attack + release);
    g.connect(bus); return g;
  }
  private osc(type: OscillatorType, freq: number, at: number, stop: number, into: AudioNode, detune = 0) {
    const o = this.context!.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
    o.connect(into); o.start(at); o.stop(stop); o.onended = () => o.disconnect();
  }
  private voice(kind: Voice, freq: number, at: number, length: number, level: number, lead: boolean, bus: AudioNode | null = this.music) {
    const c = this.context; if (!c || !bus) return;
    const send = (node: AudioNode) => { if (this.reverb) node.connect(this.reverb); if (lead && this.echo && bus === this.music) node.connect(this.echo); };
    if (kind === 'kalimba') {
      // A thumb piano: a soft sine with a faint, quickly fading overtone.
      const g = this.env(at, 0.004, level, Math.min(1.2, 0.35 + length), bus); send(g);
      this.osc('sine', freq, at, at + 1.4, g);
      const o = c.createGain(); o.gain.setValueAtTime(0.18, at); o.gain.exponentialRampToValueAtTime(0.001, at + 0.12); o.connect(g); this.osc('sine', freq * 5.4, at, at + 0.15, o);
    } else if (kind === 'bell') {
      // A music box: pure tone, long tail.
      const g = this.env(at, 0.004, level * 0.8, 1.8, bus); send(g);
      this.osc('sine', freq, at, at + 1.9, g); const h = c.createGain(); h.gain.value = 0.12; h.connect(g); this.osc('sine', freq * 4, at, at + 0.4, h);
    } else if (kind === 'flute') {
      const g = this.env(at, Math.min(0.35, length * 0.35), level * 0.6, length, bus); send(g);
      const vib = c.createOscillator(), depth = c.createGain(); vib.frequency.value = 4.5; depth.gain.value = freq * 0.005; vib.connect(depth);
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq; depth.connect(o.frequency); o.connect(g);
      vib.start(at); o.start(at); vib.stop(at + length + 0.5); o.stop(at + length + 0.5); o.onended = () => { o.disconnect(); vib.disconnect(); depth.disconnect(); };
    } else {
      // Electric piano: sine body, a touch of second harmonic, slow tremolo.
      const g = this.env(at, 0.012, level, Math.max(0.5, length), bus); send(g);
      const trem = c.createGain(); trem.gain.value = 1; trem.connect(g);
      const lfo = c.createOscillator(), amt = c.createGain(); lfo.frequency.value = 3.2; amt.gain.value = 0.18; lfo.connect(amt).connect(trem.gain); lfo.start(at); lfo.stop(at + length + 0.6); lfo.onended = () => { lfo.disconnect(); amt.disconnect(); };
      this.osc('sine', freq, at, at + length + 0.6, trem); const h = c.createGain(); h.gain.value = 0.16; h.connect(trem); this.osc('sine', freq * 2, at, at + length + 0.6, h, 3);
    }
  }
  private bass(freq: number, at: number, length: number) {
    if (!this.music) return;
    // A round, upright-ish bass.
    // The second and third harmonics let small speakers "hear" the bass note.
    const g = this.env(at, 0.02, 0.36, length, this.music);
    this.osc('sine', freq, at, at + length + 0.1, g); const s = this.context!.createGain(); s.gain.value = 0.35; s.connect(g); this.osc('triangle', freq * 2, at, at + length + 0.1, s);
    const t = this.context!.createGain(); t.gain.value = 0.15; t.connect(g); this.osc('sine', freq * 3, at, at + length + 0.1, t);
  }
  private kick(at: number, level: number, bus: AudioNode | null = this.music) {
    const c = this.context; if (!c || !bus) return;
    const g = this.env(at, 0.003, level * 0.8, 0.22, bus), o = c.createOscillator();
    o.frequency.setValueAtTime(95, at); o.frequency.exponentialRampToValueAtTime(45, at + 0.12); o.connect(g); o.start(at); o.stop(at + 0.3); o.onended = () => o.disconnect();
  }
  private hit(at: number, level: number, type: BiquadFilterType, freq: number, length: number, bus: AudioNode | null) {
    const c = this.context; if (!c || !bus || !this.noise) return;
    const src = c.createBufferSource(); src.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = this.env(at, 0.002, level, length, bus); src.connect(f).connect(g); if (this.reverb && type === 'bandpass') g.connect(this.reverb);
    src.start(at, Math.random() * 0.5, length + 0.05); src.onended = () => src.disconnect();
  }
  private snare(at: number, level: number) { this.hit(at, level, 'bandpass', 2600, 0.12, this.music); }
  private hat(at: number, level: number) { this.hit(at, level, 'bandpass', 8000, 0.03, this.music); }

  // Sound effects.
  private ready() { const c = this.context; return !!(c && this.sfx && this.enabled && c.state === 'running'); }
  private chime(notes: number[], gap: number, kind: Voice = 'bell', level = 0.5) {
    if (!this.ready()) return;
    const at = this.context!.currentTime + 0.01;
    notes.forEach((m, i) => this.voice(kind, hz(m), at + i * gap, gap * 1.6, level, false, this.sfx));
  }
  click() { this.chime([84], 0.05, 'kalimba', 0.3); }
  spin(duration = 2050) {
    this.stopSpin(); if (!this.enabled) return;
    // Ticks slow down with the wheel and climb a pentatonic scale, ending on a held note.
    const scale = [72, 74, 76, 79, 81];
    for (let i = 0; i < 22; i++) {
      const time = Math.pow(i / 22, 1.9) * duration;
      this.timers.push(setTimeout(() => { if (this.ready()) { const at = this.context!.currentTime; this.voice('kalimba', hz(scale[i % 5] + 12 * Math.floor(i / 10)), at, 0.05, 0.2, false, this.sfx); } }, time));
    }
  }
  stopSpin() { this.timers.forEach(clearTimeout); this.timers = []; }
  result(award = false) {
    this.stopSpin();
    if (award) { this.chime([72, 76, 79, 84, 88, 91], 0.08, 'kalimba', 0.4); this.later(() => this.chime([96], 0.5, 'bell', 0.5), 520); }
    else this.chime([76, 79, 84], 0.08, 'bell', 0.45);
    if (this.ready()) this.kick(this.context!.currentTime, 0.6, this.sfx);
  }
  correct() { this.chime([72, 76, 79, 84], 0.07, 'kalimba', 0.45); this.later(() => this.chime([88], 0.4, 'bell', 0.4), 300); }
  wrong() { this.chime([62, 61], 0.14, 'flute', 0.5); }
  /** Glasses on: a bright little sparkle. Glasses off: the same, falling. */
  glasses(on: boolean) { this.chime(on ? [79, 83, 86, 91, 95] : [91, 86, 83, 79], 0.05, 'bell', 0.35); }
  private later(fn: () => void, ms: number) { this.timers.push(setTimeout(fn, ms)); }
}
export const arcade = new ArcadeAudio();
