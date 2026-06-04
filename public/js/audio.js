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

    // Add a reverb-like effect via delay
    const delayNode = context.createDelay();
    delayNode.delayTime.value = 0.04;
    const delayGain = context.createGain();
    delayGain.gain.value = 0.3;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (bend) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency + bend), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    gain.connect(delayNode).connect(delayGain).connect(context.destination);

    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
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
    const volume = 0.16 * this.settings.sfxVolume;
    if (crit) {
      // Sparkly crit sound
      this.tone({ frequency: 1046, duration: 0.06, type: "square", volume, bend: 400 });
      this.tone({ frequency: 1567, duration: 0.08, type: "sine", volume: volume * 0.7, delay: 0.02 });
      this.tone({ frequency: 2093, duration: 0.1, type: "triangle", volume: volume * 0.4, delay: 0.04 });
      this.noise({ duration: 0.06, volume: 0.03 * this.settings.sfxVolume, delay: 0.01 });
    } else {
      // Satisfying pop
      this.tone({ frequency: 880, duration: 0.07, type: "sine", volume, bend: 100 });
      this.tone({ frequency: 1320, duration: 0.09, type: "triangle", volume: volume * 0.5, delay: 0.02 });
    }
  }

  reward() {
    const volume = 0.2 * this.settings.sfxVolume;
    // Magical ascending chime
    [523, 659, 784, 1046, 1318].forEach((frequency, index) => {
      this.tone({ frequency, duration: 0.15, type: "sine", volume: volume * (1 - index * 0.06), delay: index * 0.06 });
    });
    this.tone({ frequency: 1046, duration: 0.3, type: "triangle", volume: volume * 0.2, delay: 0.3 });
  }

  upgrade() {
    const volume = 0.2 * this.settings.sfxVolume;
    // Mechanical crunch + chime
    this.noise({ duration: 0.08, volume: 0.06 * this.settings.sfxVolume });
    this.tone({ frequency: 440, duration: 0.08, type: "square", volume });
    this.tone({ frequency: 659, duration: 0.12, type: "triangle", volume: volume * 0.85, delay: 0.05, bend: 200 });
    this.tone({ frequency: 880, duration: 0.18, type: "sine", volume: volume * 0.5, delay: 0.1 });
  }

  battle(win = true) {
    const volume = 0.2 * this.settings.sfxVolume;
    this.noise({ duration: 0.2, volume: 0.08 * this.settings.sfxVolume });
    if (win) {
      // Triumphant fanfare
      [262, 330, 392, 523, 659].forEach((frequency, index) => {
        this.tone({ frequency, duration: 0.2, type: index === 0 ? "sawtooth" : "triangle", volume, delay: index * 0.08 });
      });
    } else {
      // Descending failure
      [440, 370, 311, 262].forEach((frequency, index) => {
        this.tone({ frequency, duration: 0.2, type: "triangle", volume: volume * 0.8, delay: index * 0.1 });
      });
    }
  }

  ability() {
    const volume = 0.18 * this.settings.sfxVolume;
    // Swooshy power-up
    this.noise({ duration: 0.12, volume: 0.04 * this.settings.sfxVolume });
    [740, 880, 1175, 1480].forEach((frequency, index) => {
      this.tone({ frequency, duration: 0.2, type: "triangle", volume, delay: index * 0.04, bend: 200 });
    });
    this.tone({ frequency: 1175, duration: 0.4, type: "sine", volume: volume * 0.25, delay: 0.2 });
  }

  startMusic() {
    if (!this.settings.music || this.musicTimer) return;
    this.ensureContext();
    // Ethereal ambient scale
    const scale = [196, 247, 294, 330, 392, 494, 587, 659, 784];
    this.musicTimer = setInterval(() => {
      if (!this.settings.music) return;
      const volume = 0.025 * this.settings.musicVolume;
      const root = scale[this.step % scale.length];
      this.tone({ frequency: root, duration: 0.4, type: "sine", volume, delay: 0 });
      this.tone({ frequency: root * 1.5, duration: 0.3, type: "triangle", volume: volume * 0.35, delay: 0.1 });

      // Harmonic shimmer every 3 steps
      if (this.step % 3 === 0) {
        this.tone({ frequency: root * 2, duration: 0.25, type: "sine", volume: volume * 0.2, delay: 0.15 });
      }
      // Deep bass every 4 steps
      if (this.step % 4 === 0) {
        this.tone({ frequency: root / 2, duration: 0.6, type: "sine", volume: volume * 0.55, delay: 0.02 });
      }
      this.step += 1;
    }, 500);
  }

  stopMusic() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
