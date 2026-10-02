import { AudioRecorder } from './AudioRecorder';
import { AudioStreamer } from './AudioStreamer';
import { AndroidActionBridge, getSavedContacts } from '../androidBridge';

export type SessionState = 'disconnected' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface ToolCallEvent {
  id: string;
  name: string;
  args: Record<string, any>;
  message: string;
  url?: string;
  status?: 'success' | 'failed' | 'needs_clarification';
}

export interface LiveSessionCallbacks {
  onStateChange: (state: SessionState) => void;
  onInterrupted: () => void;
  onToolCall: (event: ToolCallEvent) => void;
  onTranscript?: (text: string, isUser: boolean) => void;
  onError: (err: string) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private recorder: AudioRecorder;
  private streamer: AudioStreamer;
  private state: SessionState = 'disconnected';
  private callbacks: LiveSessionCallbacks;

  constructor(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks;

    this.streamer = new AudioStreamer((isPlaying) => {
      if (this.state === 'disconnected' || this.state === 'connecting') return;
      if (isPlaying) {
        this.setState('speaking');
      } else {
        this.setState('listening');
      }
    });

    this.recorder = new AudioRecorder((base64PCM16) => {
      this.sendAudioChunk(base64PCM16);
    });
  }

  public getState(): SessionState {
    return this.state;
  }

  public getStreamerAnalyser(): AnalyserNode | null {
    return this.streamer.getAnalyser();
  }

  public getRecorderAnalyser(): AnalyserNode | null {
    return this.recorder.getAnalyser();
  }

  private setState(newState: SessionState) {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange(newState);
    }
  }

  public async connect(): Promise<void> {
    if (this.state === 'connecting' || this.state === 'listening' || this.state === 'speaking') {
      return;
    }

    this.setState('connecting');

    try {
      // 1. Prepare playback context during user gesture to satisfy browser autoplay policy
      await this.streamer.prepare();

      // 2. Initialize mic and start recording
      await this.recorder.start();

      // 3. Establish WebSocket connection to backend /live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/live`;

      console.log('[LiveSession] Connecting WebSocket to:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[LiveSession] Connected to Maya AI Live audio server.');
        this.setState('listening');
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'audio' && msg.data) {
            this.streamer.addPCM16Chunk(msg.data);
          } else if (msg.type === 'turnComplete') {
            if (!this.streamer.getIsPlaying()) {
              this.setState('listening');
            }
          } else if (msg.type === 'interrupted') {
            console.log('[LiveSession] Interruption received, cutting off audio.');
            this.streamer.stop();
            this.callbacks.onInterrupted();
            this.setState('listening');
          } else if (msg.type === 'toolCall' && msg.call) {
            this.handleToolCall(msg.call);
          } else if (msg.type === 'transcript') {
            this.callbacks.onTranscript?.(msg.text, msg.isUser);
          } else if (msg.type === 'error') {
            this.setState('error');
            this.callbacks.onError(msg.message || 'মায়ার সাথে সংযোগে ত্রুটি হয়েছে।');
          }
        } catch (e) {
          console.warn('[LiveSession] Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[LiveSession] WebSocket connection error:', e);
        this.setState('error');
        this.callbacks.onError('মায়ার সাথে সংযোগ বিচ্ছিন্ন হয়েছে। পুনরায় সংযোগ করতে বৃত্তটিতে ট্যাপ করুন।');
        this.disconnect();
      };

      this.ws.onclose = () => {
        console.log('[LiveSession] WebSocket connection closed.');
        if (this.state !== 'disconnected') {
          this.disconnect();
        }
      };
    } catch (err: any) {
      console.error('[LiveSession] Failed to start Live session:', err);
      this.setState('error');
      this.callbacks.onError(
        err.message || 'মাইক্রোফোনের অনুমতি প্রয়োজন। অনুগ্রহ করে সেটিংসে গিয়ে অনুমতি দিন।'
      );
      this.disconnect();
    }
  }

  public sendTextMessage(text: string): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.setState('thinking');
      this.ws.send(JSON.stringify({ type: 'text', text }));
      return true;
    }
    return false;
  }

  private sendAudioChunk(base64PCM16: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'audio', data: base64PCM16 }));
    }
  }

  private handleToolCall(call: { id: string; name: string; args: any }) {
    const { id, name, args } = call;
    let message = `Executed ${name}`;
    let targetUrl: string | undefined;
    let executionStatus: 'success' | 'failed' | 'needs_clarification' = 'success';

    const contacts = getSavedContacts();

    if (name === 'openWebsite') {
      const url = args.url?.startsWith('http') ? args.url : `https://${args.url}`;
      targetUrl = url;
      message = `Opening ${args.description || url}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (name === 'searchGoogle') {
      const queryUrl = `https://www.google.com/search?q=${encodeURIComponent(args.query)}`;
      targetUrl = queryUrl;
      message = `Searching Google for "${args.query}"`;
      window.open(queryUrl, '_blank', 'noopener,noreferrer');
    } else if (name === 'openApp') {
      const res = AndroidActionBridge.openApp(args.appName);
      message = res.message;
      targetUrl = res.fallbackUrl;
      executionStatus = res.status;
    } else if (name === 'openWhatsApp') {
      const res = AndroidActionBridge.openWhatsApp(args.recipient, args.message);
      message = res.message;
      targetUrl = res.fallbackUrl;
      executionStatus = res.status;
    } else if (name === 'openJawadWhatsApp') {
      const res = AndroidActionBridge.openJawadWhatsApp();
      message = res.message;
      targetUrl = res.fallbackUrl;
      executionStatus = res.status;
    } else if (name === 'makeCall') {
      const res = AndroidActionBridge.makeCall(args.phoneNumber);
      message = res.message;
      targetUrl = res.fallbackUrl;
      executionStatus = res.status;
    } else if (name === 'callContact') {
      const res = AndroidActionBridge.callContact(args.contactName);
      message = res.message;
      targetUrl = res.fallbackUrl;
      executionStatus = res.status;
    }

    const event: ToolCallEvent = {
      id,
      name,
      args,
      message,
      url: targetUrl,
      status: executionStatus,
    };

    this.callbacks.onToolCall(event);

    // Send verified tool response back to server/Gemini Live
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'toolResponse',
          id,
          name,
          response: { status: executionStatus, message },
        })
      );
    }
  }

  public disconnect() {
    this.recorder.stop();
    this.streamer.stop();

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }

    this.setState('disconnected');
  }
}
