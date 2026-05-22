type AudioContextRef = { ctx: AudioContext | null; ready: boolean };

const state: AudioContextRef = { ctx: null, ready: false };

function ensureContext() {
  if (typeof window === "undefined") return null;
  if (!state.ctx) {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) return null;
    state.ctx = new AudioCtor();
  }
  if (state.ctx.state === "suspended") {
    state.ctx.resume().then(() => {
      state.ready = true;
    }).catch(() => {});
  } else {
    state.ready = true;
  }
  return state.ctx;
}

export function unlockAudio() {
  ensureContext();
}

export function playPour() {
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const duration = 0.42;

  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.7;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(380, now + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.32, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + duration + 0.02);
}

export function playComplete() {
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.04);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
  master.connect(ctx.destination);

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + idx * 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now + idx * 0.07);
    g.gain.linearRampToValueAtTime(0.6, now + idx * 0.07 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.55);
    osc.connect(g);
    g.connect(master);
    osc.start(now + idx * 0.07);
    osc.stop(now + idx * 0.07 + 0.6);
  });
}

export function playWin() {
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const sequence = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.28, now + 0.05);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
  master.connect(ctx.destination);

  sequence.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const start = now + idx * 0.11;
    osc.frequency.setValueAtTime(freq, start);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.55, start + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
    osc.connect(g);
    g.connect(master);
    osc.start(start);
    osc.stop(start + 0.8);
  });
}
