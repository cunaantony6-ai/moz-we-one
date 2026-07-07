// Procedural Web Audio Engine for Moz We On
// Generates live synthesis beats based on Mozambican genres: Marrabenta, Pandza, Amapiano, Kizomba, Afro House

export class RhythmicSynthEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private tempo = 120;
  private intervalId: any = null;
  private currentPreset = 'default';
  private currentBeat = 0;
  private gainNode: GainNode | null = null;
  private masterVolume = 0.5;

  constructor() {}

  public init() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  public play(presetName: string) {
    this.init();
    if (this.isPlaying && this.currentPreset === presetName) return;
    this.stop();

    this.currentPreset = presetName.replace('synth:', '');
    this.isPlaying = true;
    this.currentBeat = 0;

    // Adjust tempo based on genre
    switch (this.currentPreset) {
      case 'marrabenta_guitar':
        this.tempo = 132; // Energetic traditional
        break;
      case 'amapiano_bass':
        this.tempo = 113; // Heavy shuffle slow tempo
        break;
      case 'kizomba_lead':
        this.tempo = 92; // Romantic slow vibe
        break;
      case 'pandza_drums':
        this.tempo = 140; // High-tempo electronic
        break;
      case 'afro_marimba':
        this.tempo = 124; // Afro house driving beat
        break;
      default:
        this.tempo = 120;
    }

    const stepTime = 60 / this.tempo / 4; // 16th notes
    let nextStepTime = this.ctx!.currentTime;

    const scheduler = () => {
      while (nextStepTime < this.ctx!.currentTime + 0.1) {
        this.playBeatStep(this.currentBeat, nextStepTime);
        nextStepTime += stepTime;
        this.currentBeat = (this.currentBeat + 1) % 16;
      }
    };

    this.intervalId = setInterval(scheduler, 25);
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private playBeatStep(step: number, time: number) {
    if (!this.ctx || !this.gainNode) return;

    // Simple Drum Synth parts
    const playKick = (freq = 150, decay = 0.15) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.gainNode!);

      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + decay);

      gain.gain.setValueAtTime(1.0, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

      osc.start(time);
      osc.stop(time + decay);
    };

    const playHihat = (decay = 0.05) => {
      // Noise buffer for hihats
      const bufferSize = this.ctx!.sampleRate * decay;
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx!.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.gainNode!);

      noise.start(time);
      noise.stop(time + decay);
    };

    const playSnare = (timeValue: number) => {
      playKick(180, 0.08); // snare snap body
      playHihat(0.12);     // snare noise tail
    };

    const playSynthNote = (freq: number, type: 'sawtooth' | 'sine' | 'triangle' | 'square', duration: number, vol = 0.3) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = type;
      osc.connect(gain);
      gain.connect(this.gainNode!);

      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.start(time);
      osc.stop(time + duration);
    };

    // Genre Specific Patterns
    switch (this.currentPreset) {
      case 'marrabenta_guitar': {
        // Fast syncopated guitar plucking (Triangle wave with highpass)
        const marrabentaChords = [261.63, 329.63, 392.00, 523.25]; // C chord tones
        const marrabentaChordsG = [293.66, 349.23, 392.00, 587.33]; // G chord tones
        const chord = Math.floor(step / 8) === 0 ? marrabentaChords : marrabentaChordsG;

        // Guitar picking syncopation
        if (step % 4 === 0 || step === 2 || step === 6 || step === 11 || step === 14) {
          const noteIndex = (step * 3) % chord.length;
          playSynthNote(chord[noteIndex] * 1.5, 'triangle', 0.15, 0.25);
        }

        // Marrabenta traditional percussion
        if (step % 4 === 0) playKick(120, 0.1);
        if (step % 2 === 1) playHihat(0.04);
        if (step === 4 || step === 12) playSnare(time);
        break;
      }

      case 'amapiano_bass': {
        // Deep FM Log Drum heavy bass shuffles
        const bassScale = [55.00, 65.41, 73.42, 82.41, 98.00]; // A minor sub-bass frequencies
        const bassNote = bassScale[(Math.floor(step / 3)) % bassScale.length];

        // Heavy log drums pattern on off-beats
        if (step === 2 || step === 3 || step === 7 || step === 8 || step === 10 || step === 14) {
          playSynthNote(bassNote, 'sine', 0.25, 0.6); // log drum sub
          playSynthNote(bassNote * 2, 'triangle', 0.1, 0.3); // log drum punchy knock
        }

        // Amapiano shakers roll
        playHihat(0.03);
        if (step % 4 === 0) {
          playKick(60, 0.2); // Low fat sub kick
        }
        if (step === 8) {
          playSnare(time);
        }
        break;
      }

      case 'kizomba_lead': {
        // Kizomba 92 BPM slow sensual groove
        // Kizomba classic drum beat: Kick... snare-kick-snare
        if (step === 0 || step === 8) {
          playKick(75, 0.25); // Heavy fat kick
        }
        if (step === 6 || step === 14) {
          playSnare(time); // Kizomba snare accent
        }
        if (step === 4 || step === 12) {
          playKick(70, 0.1);
        }
        if (step % 2 === 0) {
          playHihat(0.06);
        }

        // Smooth Kizomba keyboard melody (sine waves with delay vibe)
        const kizombaMelody = [261.63, 293.66, 329.63, 349.23, 392.00]; // major scale pentatonic
        if (step === 1 || step === 3 || step === 7 || step === 9 || step === 13) {
          const note = kizombaMelody[(Math.floor(step / 2)) % kizombaMelody.length];
          playSynthNote(note, 'sine', 0.3, 0.15);
          playSynthNote(note * 2, 'triangle', 0.25, 0.05); // sweet chorus harmonic
        }
        break;
      }

      case 'pandza_drums': {
        // High tempo Pandza beat
        // Crazy fast kicks and claps
        if (step % 2 === 0) {
          playKick(140, 0.08); // fast dry kicks
        }
        if (step === 4 || step === 12 || step === 14) {
          playSnare(time);
        }
        playHihat(0.04); // continuous energetic hi-hats

        // High pitch electronic synth beep
        if (step % 3 === 0) {
          const freqs = [523.25, 587.33, 659.25, 783.99];
          playSynthNote(freqs[step % freqs.length], 'square', 0.05, 0.1);
        }
        break;
      }

      case 'afro_marimba': {
        // Wooden polyrhythmic marimbas
        const marimbaScale = [196.00, 220.00, 246.94, 293.66, 329.63, 392.00]; // G Major scale notes
        if (step % 3 === 0 || step === 5 || step === 11 || step === 14) {
          const note = marimbaScale[(step * 2) % marimbaScale.length];
          // Wooden marimba simulation: triangle wave + decay + short sine overtone
          playSynthNote(note, 'triangle', 0.12, 0.35);
          playSynthNote(note * 3, 'sine', 0.06, 0.15); // wooden hammer knock
        }

        // Afro house percussion (organic djembe & shaker)
        if (step % 4 === 0) {
          playKick(80, 0.18);
        }
        if (step === 4 || step === 10 || step === 12) {
          // Conga/snare
          playSynthNote(200, 'sine', 0.08, 0.2);
          playHihat(0.08);
        } else if (step % 2 === 1) {
          playHihat(0.03); // continuous shaker
        }
        break;
      }

      default: {
        // Default chill drum machine
        if (step % 4 === 0) playKick(100, 0.2);
        if (step % 4 === 2) playSnare(time);
        if (step % 2 === 1) playHihat(0.05);
        break;
      }
    }
  }
}
