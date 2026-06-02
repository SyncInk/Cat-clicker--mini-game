export class AudioDirector {
  constructor() {
    this.context = null;
    this.musicTimer = null;
    this.step = 0;
    this.settings = {
      music: true,
      sound: true,
      musicVolume: 0.45,
      sfxVolume: 0.75
    };
  }

  hydrate(settings = {}) {
    this.settings = { ...this.settings, ...settings };
    if (!this.settings.music) {
      this.stopMusic();
    }
  }

  ensureContext() {
    if (!this.context) {
      this.context = new AudioContext();
    }
    if (this.context.state === "suspended") {
      this.context.resume();
    }
    return this.context;
  }

  tone({ frequency, duration = 0.12, type = "sine", volume = 0.2, delay = 0, bend = 0 }) {
    if (!this.settings.sound && volume > 0.03) return;
    const context = this.ensureContext();
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (bend) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency + bend), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  noise({ duration = 0.18, volume = 0.12, delay = 0 }) {
    if (!this.settings.sound) return;
    const context = this.ensureContext();
    const start = context.currentTime + delay;
    const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length);
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume * this.settings.sfxVolume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(gain).connect(context.destination);
    source.start(start);
  }

  click(crit = false) {
    const volume = 0.13 * this.settings.sfxVolume;
    this.tone({ frequency: crit ? 980 : 660, duration: 0.055, type: "triangle", volume, bend: crit ? 220 : 60 });
    this.tone({ frequency: crit ? 1470 : 990, duration: 0.07, type: "sine", volume: volume * 0.45, delay: 0.025 });
  }

  reward() {
    const volume = 0.18 * this.settings.sfxVolume;
    [523, 659, 784, 1046].forEach((frequency, index) => {
      this.tone({ frequency, duration: 0.12, type: "sine", volume: volume * (1 - index * 0.08), delay: index * 0.055 });
    });
  }

  upgrade() {
    const volume = 0.16 * this.settings.sfxVolume;
    this.tone({ frequency: 392, duration: 0.09, type: "square", volume });
    this.tone({ frequency: 587, duration: 0.12, type: "triangle", volume: volume * 0.8, delay: 0.065, bend: 120 });
    this.noise({ duration: 0.13, volume: 0.045 * this.settings.sfxVolume, delay: 0.02 });
  }

  battle(win = true) {
    const volume = 0.18 * this.settings.sfxVolume;
    this.noise({ duration: 0.22, volume: 0.07 * this.settings.sfxVolume });
    const notes = win ? [220, 330, 440, 660] : [330, 277, 220];
    notes.forEach((frequency, index) => {
      this.tone({ frequency, duration: 0.16, type: index === 0 ? "sawtooth" : "triangle", volume, delay: index * 0.08 });
    });
  }

  ability() {
    const volume = 0.17 * this.settings.sfxVolume;
    [740, 880, 1175].forEach((frequency, index) => {
      this.tone({ frequency, duration: 0.18, type: "triangle", volume, delay: index * 0.045, bend: 160 });
    });
  }

  startMusic() {
    if (!this.settings.music || this.musicTimer) return;
    this.ensureContext();
    const scale = [196, 247, 294, 330, 392, 494, 587, 659];
    this.musicTimer = setInterval(() => {
      if (!this.settings.music) return;
      const volume = 0.028 * this.settings.musicVolume;
      const root = scale[this.step % scale.length];
      this.tone({ frequency: root, duration: 0.34, type: "sine", volume, delay: 0 });
      this.tone({ frequency: root * 1.5, duration: 0.24, type: "triangle", volume: volume * 0.42, delay: 0.08 });
      if (this.step % 4 === 0) {
        this.tone({ frequency: root / 2, duration: 0.5, type: "sine", volume: volume * 0.52, delay: 0.02 });
      }
      this.step += 1;
    }, 430);
  }

  stopMusic() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
