import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function startOfWeekISO(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function seedFromISO(iso: string) {
  return iso.split("-").join("").split("").reduce((acc, n) => acc + Number(n || 0), 0);
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function formatISOToLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function prettyDow(d: number) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d];
}

export function computeWeekDates(weekStartISO: string) {
  const start = new Date(weekStartISO + "T00:00:00");
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const tz = d.getTimezoneOffset() * 60000;
    out.push(new Date(d.getTime() - tz).toISOString().slice(0, 10));
  }
  return out;
}

// --- Audio Synthesizer ---

let audioCtx: AudioContext | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(e => console.error("Audio resume failed", e));
  }
  return audioCtx;
};

// Auto-initialize on first interaction
if (typeof window !== 'undefined') {
  const enableAudio = () => {
    initAudio();
    window.removeEventListener('click', enableAudio);
    window.removeEventListener('keydown', enableAudio);
  };
  window.addEventListener('click', enableAudio);
  window.addEventListener('keydown', enableAudio);
}

export const playSound = (type: 'success' | 'click' | 'hover' | 'hero' | 'laser' | 'gameover') => {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'hover') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
      osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    } else if (type === 'hero') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(220, now + 1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.start(now);
      osc.stop(now + 1.5);
    } else if (type === 'laser') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'gameover') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.8);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    }
  } catch (e) {
    console.error("Sound error:", e);
  }
};