/**
 * AudioStreamer handles progressive gapless playback of 24kHz raw PCM16 audio chunks
 * streamed from Gemini Live API with instant interruption and mobile autoplay compliance.
 */
export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlaying: boolean = false;
  private onPlaybackStateChange?: (playing: boolean) => void;

  constructor(onPlaybackStateChange?: (playing: boolean) => void) {
    this.onPlaybackStateChange = onPlaybackStateChange;
  }

  /**
   * Prepares and unlocks the AudioContext during a user interaction gesture
   * to satisfy Android Chrome and Safari mobile autoplay restrictions.
   */
  public async prepare(): Promise<void> {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
        console.log('[AudioStreamer] AudioContext unlocked successfully via user gesture.');
      } catch (e) {
        console.warn('[AudioStreamer] AudioContext resume failed:', e);
      }
    }
  }

  private initContext() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      // Try creating 24kHz context. If mobile browser rejects custom sample rate,
      // fallback to native context rate (Web Audio createBuffer with 24000 handles resampling).
      try {
        this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
      } catch (e) {
        this.audioCtx = new AudioContextClass();
      }

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 1.0;

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
      console.log(`[AudioStreamer] Initialized playback context at ${this.audioCtx.sampleRate}Hz.`);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public getAnalyser(): AnalyserNode | null {
    this.initContext();
    return this.analyser;
  }

  /**
   * Enqueue a base64 encoded raw PCM16 (24kHz, mono, little-endian) chunk
   */
  public addPCM16Chunk(base64Data: string) {
    this.initContext();
    if (!this.audioCtx || !this.analyser) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    try {
      // Decode base64 to binary bytes
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      if (len === 0) return;

      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 16-bit PCM little-endian to Float32 (-1.0 to 1.0)
      const sampleCount = Math.floor(len / 2);
      if (sampleCount === 0) return;

      const float32Samples = new Float32Array(sampleCount);
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, len);

      for (let i = 0; i < sampleCount; i++) {
        const int16 = dataView.getInt16(i * 2, true); // true = little-endian
        float32Samples[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
      }

      // Create an AudioBuffer at 24kHz
      const audioBuffer = this.audioCtx.createBuffer(1, sampleCount, 24000);
      audioBuffer.getChannelData(0).set(float32Samples);

      // Create buffer source
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);

      // Schedule gapless progressive playback
      const now = this.audioCtx.currentTime;
      const startTime = Math.max(now + 0.01, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + audioBuffer.duration;

      this.activeSources.push(source);

      if (!this.isPlaying) {
        this.isPlaying = true;
        this.onPlaybackStateChange?.(true);
      }

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0) {
          this.isPlaying = false;
          this.onPlaybackStateChange?.(false);
        }
      };
    } catch (err) {
      console.warn('[AudioStreamer] Error decoding audio chunk:', err);
    }
  }

  /**
   * Stop immediately when user interrupts Maya
   */
  public stop() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // ignore already stopped
      }
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextPlayTime = this.audioCtx.currentTime;
    }
    if (this.isPlaying) {
      this.isPlaying = false;
      this.onPlaybackStateChange?.(false);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public close() {
    this.stop();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch (e) {}
    }
    this.audioCtx = null;
    this.analyser = null;
    this.gainNode = null;
  }
}
