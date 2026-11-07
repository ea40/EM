export interface AudioFailure {
  operation: string;
  message: string;
  at: number;
}

/**
 * Web Audio tone generator for the console's alert cues.
 *
 * Every cue is best-effort: browser autoplay policy can refuse to start an
 * AudioContext, and a silent siren must never take the triage UI down with it.
 * Failures are therefore caught — but recorded rather than discarded, so the
 * diagnostics view can tell an operator that audio is not actually working
 * instead of leaving them to wonder why nothing beeped.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private failures: AudioFailure[] = [];

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;

    if (!this.ctx) {
      const AudioCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) {
        this.reportFailure('init', new Error('Web Audio API unavailable in this browser.'));
        return null;
      }
      this.ctx = new AudioCtor();
    }

    if (this.ctx.state === 'suspended') {
      // Rejected until the user has interacted with the page; harmless to retry.
      void this.ctx.resume().catch((error: unknown) => this.reportFailure('resume', error));
    }

    return this.ctx;
  }

  private reportFailure(operation: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.failures.push({ operation, message, at: Date.now() });
    // Bounded: this is a diagnostic breadcrumb, not an audit log.
    if (this.failures.length > 20) this.failures.shift();
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getFailures(): readonly AudioFailure[] {
    return this.failures;
  }

  /** Runs `render` against a ready context, swallowing (and recording) failures. */
  private play(operation: string, render: (ctx: AudioContext, now: number) => void): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      render(ctx, ctx.currentTime);
    } catch (error: unknown) {
      this.reportFailure(operation, error);
    }
  }

  /** Code RED — repetitive dual-tone pulse. */
  public playRedAlert(): void {
    this.play('playRedAlert', (ctx, now) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(1760, now + 0.15);
      osc1.frequency.setValueAtTime(880, now + 0.3);

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    });
  }

  /** Code AMBER — two-note warning. */
  public playAmberAlert(): void {
    this.play('playAmberAlert', (ctx, now) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(740, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  /** Clinical ECG QRS blip — authentic pulse oximeter / bedside monitor tone. */
  public playECGBlip(pitch = 520): void {
    this.play('playECGBlip', (ctx, now) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);

      // Smooth attack to prevent pop/click, then clean resonant hospital monitor decay
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    });
  }

  /** Ambulance dispatch confirmation chirp. */
  public playDispatchSound(): void {
    this.play('playDispatchSound', (ctx, now) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  /** Resolution chime — major triad. */
  public playResolveSound(): void {
    this.play('playResolveSound', (ctx, now) => {
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startAt = now + index * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startAt);

        gain.gain.setValueAtTime(0.18, startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startAt);
        osc.stop(startAt + 0.4);
      });
    });
  }

  /** Outbound ring — dual-frequency dial tone. */
  public playPhoneRing(): void {
    this.play('playPhoneRing', (ctx, now) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    });
  }

  /** Call teardown — short descending tone. */
  public playPhoneDisconnect(): void {
    this.play('playPhoneDisconnect', (ctx, now) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    });
  }
}

export const audioSynth = new SoundEngine();
