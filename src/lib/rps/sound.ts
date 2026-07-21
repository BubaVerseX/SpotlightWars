import { SOUND_PREF_KEY } from "./constants";
import { DEFAULT_SOUND_PACK } from "./cosmetics";

/**
 * ---------------------------------------------------------------------
 * SOUND SYSTEM — nothing in this repo plays audio yet, and there's no
 * asset pipeline to source real sound files through, so every pack is
 * synthesized on the fly with the Web Audio API instead of static files.
 * Respects the existing `rps:sound-enabled` localStorage flag (previously
 * stubbed in SettingsPage — this module is what actually wires it up).
 * ---------------------------------------------------------------------
 */

export type SoundEvent = "moveSelect" | "roundWin" | "roundLose" | "matchWin" | "matchLose";

interface Tone {
  frequency: number;
  duration: number;
  waveform: OscillatorType;
  /** Seconds after the sound starts before this tone begins — lets a pack
   * play a short sequence (e.g. a two-note "win" jingle). */
  delay?: number;
  gain?: number;
}

type SoundTable = Record<SoundEvent, Tone[]>;

const SOUND_TABLES: Record<string, SoundTable> = {
  "soundPack:default": {
    moveSelect: [{ frequency: 440, duration: 0.08, waveform: "sine" }],
    roundWin: [{ frequency: 660, duration: 0.12, waveform: "sine" }],
    roundLose: [{ frequency: 220, duration: 0.16, waveform: "sine" }],
    matchWin: [
      { frequency: 523.25, duration: 0.14, waveform: "sine" },
      { frequency: 659.25, duration: 0.18, waveform: "sine", delay: 0.14 },
    ],
    matchLose: [
      { frequency: 349.23, duration: 0.14, waveform: "sine" },
      { frequency: 261.63, duration: 0.22, waveform: "sine", delay: 0.14 },
    ],
  },
  "soundPack:arcadeBlips": {
    moveSelect: [{ frequency: 880, duration: 0.05, waveform: "square", gain: 0.15 }],
    roundWin: [
      { frequency: 784, duration: 0.06, waveform: "square", gain: 0.18 },
      { frequency: 988, duration: 0.09, waveform: "square", delay: 0.06, gain: 0.18 },
    ],
    roundLose: [{ frequency: 196, duration: 0.2, waveform: "square", gain: 0.18 }],
    matchWin: [
      { frequency: 659.25, duration: 0.07, waveform: "square", gain: 0.2 },
      { frequency: 830.61, duration: 0.07, waveform: "square", delay: 0.07, gain: 0.2 },
      { frequency: 1046.5, duration: 0.16, waveform: "square", delay: 0.14, gain: 0.2 },
    ],
    matchLose: [
      { frequency: 293.66, duration: 0.1, waveform: "square", gain: 0.18 },
      { frequency: 220, duration: 0.24, waveform: "square", delay: 0.1, gain: 0.18 },
    ],
  },
  "soundPack:retroSynth": {
    moveSelect: [{ frequency: 330, duration: 0.1, waveform: "triangle", gain: 0.16 }],
    roundWin: [{ frequency: 493.88, duration: 0.22, waveform: "sawtooth", gain: 0.12 }],
    roundLose: [{ frequency: 164.81, duration: 0.26, waveform: "sawtooth", gain: 0.12 }],
    matchWin: [
      { frequency: 392, duration: 0.2, waveform: "triangle", gain: 0.15 },
      { frequency: 587.33, duration: 0.32, waveform: "triangle", delay: 0.18, gain: 0.15 },
    ],
    matchLose: [
      { frequency: 293.66, duration: 0.2, waveform: "sawtooth", gain: 0.13 },
      { frequency: 196, duration: 0.34, waveform: "sawtooth", delay: 0.18, gain: 0.13 },
    ],
  },
};

let ctx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  // Browsers suspend a freshly-created context until a user gesture — every
  // call site here (move click, sound toggle) already is one.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SOUND_PREF_KEY) !== "off";
}

function playTones(tones: Tone[]): void {
  const audioCtx = getAudioContext();
  if (!audioCtx) return;

  for (const tone of tones) {
    const start = audioCtx.currentTime + (tone.delay ?? 0);
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = tone.waveform;
    osc.frequency.setValueAtTime(tone.frequency, start);

    const peakGain = tone.gain ?? 0.2;
    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(peakGain, start + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + tone.duration + 0.02);
  }
}

/** Plays `event` from `packId`'s table, no-op if sound is off, the browser
 * has no Web Audio support, or we're server-side. Falls back to the default
 * pack for an unrecognized/missing id rather than staying silent. */
export function playSound(event: SoundEvent, packId: string | null | undefined): void {
  if (!isSoundEnabled()) return;
  const table = SOUND_TABLES[packId ?? ""] ?? SOUND_TABLES[DEFAULT_SOUND_PACK];
  playTones(table[event]);
}

/** Used by the Settings page to give immediate feedback when sound is
 * switched on, bypassing the isSoundEnabled() check (the toggle has already
 * been flipped in state by the time this is called, but the caller passes
 * the pack explicitly so this doesn't need to re-read localStorage). */
export function previewSound(packId: string | null | undefined): void {
  const table = SOUND_TABLES[packId ?? ""] ?? SOUND_TABLES[DEFAULT_SOUND_PACK];
  playTones(table.roundWin);
}
