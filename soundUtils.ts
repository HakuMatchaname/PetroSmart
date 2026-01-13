
class SoundManager {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number, endFreq?: number) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playClick() {
    this.playTone(800, 'sine', 0.1, 0.1, 1200);
  }

  playSuccess() {
    this.playTone(440, 'sine', 0.2, 0.1, 880);
  }

  playAiChime() {
    this.playTone(660, 'triangle', 0.3, 0.05, 880);
    setTimeout(() => this.playTone(880, 'triangle', 0.3, 0.05, 1100), 100);
  }

  playAction() {
    this.playTone(200, 'sine', 0.15, 0.1, 100);
  }

  playMenuTransition() {
    this.playTone(100, 'sine', 0.5, 0.1, 400);
  }

  playGameOver() {
    this.playTone(300, 'sawtooth', 0.8, 0.05, 50);
  }
}

export const sounds = new SoundManager();
