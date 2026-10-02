/**
 * AudioRecorder captures microphone audio at native device sample rate (e.g. 44.1kHz or 48kHz),
 * downsamples cleanly to 16kHz PCM16 little-endian, and streams base64 chunks to Gemini Live API.
 */
export class AudioRecorder {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private silenceGain: GainNode | null = null;
  private isRecording: boolean = false;
  private onAudioData?: (base64PCM16: string) => void;

  constructor(onAudioData?: (base64PCM16: string) => void) {
    this.onAudioData = onAudioData;
  }

  public async start(): Promise<void> {
    if (this.isRecording) return;

    try {
      // 1. Request microphone access with echo cancellation & noise suppression
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: any) {
      console.error('Microphone permission or hardware error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি। অনুগ্রহ করে ব্রাউজারের সেটিংসে গিয়ে মাইক্রোফোন অনুমতি প্রদান করুন।');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('আপনার ডিভাইসে কোনো মাইক্রোফোন খুঁজে পাওয়া যায়নি।');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        throw new Error('মাইক্রোফোনটি বর্তমানে অন্য কোনো অ্যাপ দ্বারা ব্যবহৃত হচ্ছে।');
      }
      throw new Error('মাইক্রোফোন চালু করতে সমস্যা হয়েছে: ' + (err.message || ''));
    }

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      // Try creating context. Don't force unsupported sample rate on mobile; let it use native rate
      // and downsample mathematically to guarantee Gemini always receives accurate 16kHz audio.
      try {
        this.audioCtx = new AudioContextClass({ sampleRate: 16000 });
      } catch (e) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const inputSampleRate = this.audioCtx.sampleRate;
      console.log(`[AudioRecorder] Active at sample rate: ${inputSampleRate}Hz (target: 16000Hz)`);

      this.source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;

      // 4096 buffer size
      this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);

        // Downsample to exactly 16000Hz if device is running at 44.1kHz or 48kHz
        const samples16k = this.downsampleTo16k(inputChannelData, inputSampleRate);
        const sampleCount = samples16k.length;
        if (sampleCount === 0) return;

        // Convert Float32 to 16-bit PCM Little Endian
        const pcm16Buffer = new ArrayBuffer(sampleCount * 2);
        const dataView = new DataView(pcm16Buffer);

        for (let i = 0; i < sampleCount; i++) {
          const s = Math.max(-1, Math.min(1, samples16k[i]));
          const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
          dataView.setInt16(i * 2, int16, true); // true = little-endian
        }

        // Convert ArrayBuffer to base64
        const bytes = new Uint8Array(pcm16Buffer);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        this.onAudioData?.(base64);
      };

      // Use a zero-gain node to connect processor to destination.
      // This prevents the user's mic from feeding back through their own speaker,
      // while keeping the ScriptProcessor active in Web Audio pipeline.
      this.silenceGain = this.audioCtx.createGain();
      this.silenceGain.gain.value = 0;

      this.source.connect(this.analyser);
      this.analyser.connect(this.processor);
      this.processor.connect(this.silenceGain);
      this.silenceGain.connect(this.audioCtx.destination);

      this.isRecording = true;
      console.log('[AudioRecorder] Recording started successfully.');
    } catch (err: any) {
      this.stop();
      console.error('[AudioRecorder] Initialization error:', err);
      throw new Error('অডিও প্রসেসর চালু করতে ব্যর্থ হয়েছে: ' + (err.message || ''));
    }
  }

  /**
   * Resamples an input Float32 audio buffer from inputSampleRate to 16000Hz
   * using linear interpolation.
   */
  private downsampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
    if (inputSampleRate === 16000) {
      return input;
    }

    const ratio = inputSampleRate / 16000;
    const newLength = Math.round(input.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originalIdx = i * ratio;
      const idx0 = Math.floor(originalIdx);
      const idx1 = Math.min(idx0 + 1, input.length - 1);
      const weight = originalIdx - idx0;
      result[i] = input[idx0] * (1 - weight) + input[idx1] * weight;
    }

    return result;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public stop(): void {
    this.isRecording = false;

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.silenceGain) {
      this.silenceGain.disconnect();
      this.silenceGain = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
    console.log('[AudioRecorder] Recording stopped.');
  }
}
