// Synthesised sound for Museum at Night: no audio files, every effect is
// built from WebAudio oscillators and filtered noise, so the game still
// plays with no network request. Audio starts only after the first key
// press or click (browsers require a user gesture).
export class Sound {
  constructor() {
    this.context = null;
    this.muted = false;
    this._master = null;
    this._ambient = null;
  }

  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this._master = this.context.createGain();
    this._master.gain.value = 0.5;
    this._master.connect(this.context.destination);
    this._startAmbient();
  }

  _startAmbient() {
    // A low museum hum: two detuned sines kept very quiet.
    const gain = this.context.createGain();
    gain.gain.value = 0.035;
    gain.connect(this._master);
    for (const freq of [55, 55.7]) {
      const osc = this.context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start();
    }
    this._ambient = gain;
  }

  _tone(freq, seconds, type, volume, slideTo) {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    osc.connect(gain);
    gain.connect(this._master);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  _noise(seconds, volume, filterFreq) {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime;
    const length = Math.max(1, Math.floor(this.context.sampleRate * seconds));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this._master);
    source.start(now);
  }

  // A soft shoe scuff. `near` (0..1) is how close the walker is.
  footstep(near) {
    this._noise(0.07, 0.05 + 0.16 * near, 500);
  }

  // The coin the thief tosses: a bright metallic clink.
  coinToss() {
    this._tone(1900, 0.12, 'triangle', 0.16, 2400);
    this._tone(2600, 0.08, 'sine', 0.1, 3200);
  }

  coinPickup() {
    this._tone(880, 0.09, 'triangle', 0.14);
    this._tone(1318, 0.14, 'triangle', 0.14);
  }

  artifactPickup() {
    this._tone(523, 0.16, 'triangle', 0.16);
    this._tone(659, 0.16, 'triangle', 0.16);
    this._tone(784, 0.3, 'triangle', 0.18);
  }

  // The rising sting when a guard's suspicion tops out.
  alarm() {
    this._tone(220, 0.5, 'sawtooth', 0.16, 660);
    this._tone(330, 0.5, 'square', 0.07, 990);
  }

  // A soft "huh?" blip when a guard first notices something.
  noticed() {
    this._tone(440, 0.12, 'sine', 0.12, 620);
  }

  caught() {
    this._tone(196, 0.7, 'sawtooth', 0.18, 98);
    this._tone(147, 0.9, 'sawtooth', 0.14, 73);
  }

  win() {
    for (const [i, freq] of [523, 659, 784, 1047].entries()) {
      setTimeout(() => this._tone(freq, 0.35, 'triangle', 0.16), i * 130);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this._master) this._master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }
}
