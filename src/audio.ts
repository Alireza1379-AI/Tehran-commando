// Retro audio synthesizer using Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private currentBgmNode: OscillatorNode | null = null;
  private currentBgmGain: GainNode | null = null;
  private bgmPlaying: boolean = false;

  constructor() {
    // Lazy initialisation to prevent autoplay block warnings
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(val: boolean) {
    this.muted = val;
    if (this.muted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
  }

  public getMuted(): boolean {
    return this.muted;
  }

  // Shoot sound
  public playShoot(isSMG = false) {
    this.init();
    if (this.muted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // Noise buffer for realistic static gun trigger
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isSMG ? 1200 : 800, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.12);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      // Pitch core oscillator to add metal punch
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isSMG ? 220 : 180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

      oscGain.gain.setValueAtTime(0.15, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 0.12);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Knife swipe Sound
  public playKnife() {
    this.init();
    if (this.muted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(4000, now);
      filter.frequency.linearRampToValueAtTime(12000, now + 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 0.08);
    } catch (e) {
      console.warn(e);
    }
  }

  // Jump Sound
  public playJump() {
    this.init();
    if (this.muted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn(e);
    }
  }

  // Explosion sound (Greandes, crates, SUV boss)
  public playExplosion() {
    this.init();
    if (this.muted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.45;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(10, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      // Low frequency rumble osc
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(130, now);
      subOsc.frequency.linearRampToValueAtTime(20, now + 0.3);

      subGain.gain.setValueAtTime(0.6, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + duration);
      subOsc.start(now);
      subOsc.stop(now + 0.3);
    } catch (e) {
      console.warn(e);
    }
  }

  // Hurt sound
  public playHurt() {
    this.init();
    if (this.muted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.18);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.18);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      console.warn(e);
    }
  }

  // Pickup sound
  public playPickup() {
    this.init();
    if (this.muted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(330, now);
      osc1.frequency.setValueAtTime(440, now + 0.08);
      osc1.frequency.setValueAtTime(660, now + 0.16);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(165, now);
      osc2.frequency.setValueAtTime(220, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.25);
      osc2.stop(now + 0.25);
    } catch (e) {
      console.warn(e);
    }
  }

  // Crate shatter
  public playCrateShatter() {
    this.init();
    if (this.muted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const noiseGain = this.ctx.createGain();

      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(250, now);

      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      noiseNode.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 0.12);
    } catch (e) {
      console.warn(e);
    }
  }

  // Boss Siren Alarm
  public playBossSiren() {
    this.init();
    if (this.muted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.2);
      osc.frequency.linearRampToValueAtTime(400, now + 0.4);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn(e);
    }
  }

  // Switch weapon beep
  public playSwitchWeapon() {
    this.init();
    if (this.muted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn(e);
    }
  }

  // Background Chiptune music loop
  public startBGM() {
    this.init();
    if (this.muted || !this.ctx || this.bgmPlaying) return;

    try {
      const now = this.ctx.currentTime;
      
      // Let's create an ongoing rhythm loop using simple timers or oscillator schedules.
      // To keep it clean and non-blocking, let's schedule notes repeatedly or do a retro synthesised bassline.
      this.bgmPlaying = true;
      this.playBgmStep(0);
    } catch (e) {
      console.warn(e);
    }
  }

  private playBgmStep(step: number) {
    if (!this.bgmPlaying || this.muted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const tempo = 130; // BPM
      const stepDuration = 60 / tempo / 2; // eighth notes

      // Simple 8-bit minor bass progression: Tehran Dark Theme
      // step counter modulo 16
      const currentStep = step % 16;
      const notes = [
        110.00, 110.00, 130.81, 110.00, // A, A, C, A
        146.83, 146.83, 130.81, 164.81, // D, D, C, E
        110.00, 110.00, 130.81, 110.00, // A, A, C, A
        196.00, 164.81, 146.83, 130.81  // G, E, D, C
      ];

      const bassPitch = notes[currentStep] * 0.5; // low octaves
      
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassPitch, now);

      bassGain.gain.setValueAtTime(0.04, now);
      // Fast decay to feel like staccato bass notes
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration - 0.02);

      // Simple bandpass to make the bass sound warm and crunchy
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);

      bassOsc.connect(filter);
      filter.connect(bassGain);
      bassGain.connect(this.ctx.destination);

      bassOsc.start(now);
      bassOsc.stop(now + stepDuration);

      // Add a higher lead melody occasionally
      if (step % 4 === 0) {
        // melody notes over Amin/Dmin progression
        const melodyPitches = [
          440.00, 523.25, 440.00, 587.33,
          659.25, 659.25, 587.33, 523.25,
          440.00, 523.25, 587.33, 659.25,
          783.99, 659.25, 587.33, 440.00
        ];
        const melIdx = (Math.floor(step / 2)) % 16;
        const melodyPitch = melodyPitches[melIdx];

        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        melOsc.type = 'triangle';
        melOsc.frequency.setValueAtTime(melodyPitch, now);

        melGain.gain.setValueAtTime(0.015, now);
        melGain.gain.exponentialRampToValueAtTime(0.0001, now + stepDuration * 2 - 0.05);

        const melFilter = this.ctx.createBiquadFilter();
        melFilter.type = 'bandpass';
        melFilter.frequency.setValueAtTime(1000, now);

        melOsc.connect(melFilter);
        melFilter.connect(melGain);
        melGain.connect(this.ctx.destination);

        melOsc.start(now);
        melOsc.stop(now + stepDuration * 2);
      }

      // Schedule next beat
      setTimeout(() => {
        this.playBgmStep(step + 1);
      }, stepDuration * 1000);

    } catch (e) {
      console.warn(e);
    }
  }

  public stopBGM() {
    this.bgmPlaying = false;
  }
}

export const sounds = new SoundManager();
