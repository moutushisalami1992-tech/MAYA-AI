import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
  FunctionDeclaration,
} from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '25mb' }));

// Server-side Gemini initialization with required telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Create HTTP server
const server = http.createServer(app);

// Mount WebSocket server on /live
const wss = new WebSocketServer({ server, path: '/live' });

// Function declarations for Gemini Live Tools (Web + Android bridge)
const liveTools: FunctionDeclaration[] = [
  {
    name: 'openWebsite',
    description:
      'Opens any website, service, or URL requested by the user in a new tab.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: 'The destination URL (e.g. https://github.com, https://google.com)',
        },
        description: {
          type: Type.STRING,
          description: 'A brief description of what is being opened',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'searchGoogle',
    description: 'Searches Google for the requested query or topic.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Search terms to query on Google',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'openApp',
    description:
      'Launches or opens applications such as YouTube, WhatsApp, Instagram, Spotify, Chrome, or Maps.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: {
          type: Type.STRING,
          description:
            'The name of the app to launch (e.g. YouTube, WhatsApp, Instagram, Spotify, Chrome, Maps)',
        },
      },
      required: ['appName'],
    },
  },
  {
    name: 'openWhatsApp',
    description:
      'Opens WhatsApp, optionally to a specific contact or pre-filled message.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        recipient: {
          type: Type.STRING,
          description: 'Optional contact name or phone number',
        },
        message: {
          type: Type.STRING,
          description: 'Optional prefilled message text',
        },
      },
    },
  },
  {
    name: 'makeCall',
    description: 'Dials a specific phone number using the phone dialer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        phoneNumber: {
          type: Type.STRING,
          description: 'The phone number to dial',
        },
      },
      required: ['phoneNumber'],
    },
  },
  {
    name: 'callContact',
    description:
      'Calls a contact from the user address book by name (e.g. Mom, Dad, Rahul).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        contactName: {
          type: Type.STRING,
          description: 'The name or nickname of the contact to call',
        },
      },
      required: ['contactName'],
    },
  },
  {
    name: 'openJawadWhatsApp',
    description:
      "Opens Jawad's official WhatsApp link (https://wa.link/mvgabh) when user confirms they want to contact Jawad.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

const MAYA_SYSTEM_INSTRUCTION = `তুমি মায়া, জাওয়াদের ব্যক্তিগত এআই অ্যাসিস্ট্যান্ট (Maya AI — Creator: Jawad)।

========================================
১. ব্যক্তিগত পরিচয় ও মালিক (OWNER: JAWAD)
========================================
- তোমার নির্মাতা, ক্রিয়েটর ও মালিক হচ্ছেন জাওয়াদ (Jawad)।
- যখনই ব্যবহারকারী জিজ্ঞেস করবে:
  * "তোমাকে কে বানিয়েছে?" / "Who created you?" / "Who made you?"
  * "তোমার বস কে?" / "তোমার ওনার কে?" / "তুমি কার অ্যাসিস্ট্যান্ট?" / "তোমার মালিকের নাম কী?"
  * "জাওয়াদ কে?" / "Who is Jawad?"
  * "আমি কি জাওয়াদের সঙ্গে যোগাযোগ করতে পারব?" / "Can I contact Jawad?"
- সর্বদা স্বাভাবিক ও মার্জিত বাংলাদেশি বাংলায় উত্তর দেবে:
  "আমাকে তৈরি করেছেন জাওয়াদ। তিনি আমার ক্রিয়েটর এবং বস। আপনি কি জাওয়াদের সঙ্গে WhatsApp-এ যোগাযোগ করতে চান? চাইলে আমি আপনার জন্য WhatsApp লিংকটি খুলে দিতে পারি।"

- WhatsApp যোগাযোগ নিশ্চিতকরণ (Confirmation):
  * মায়া কখনোই ব্যবহারকারীর স্পষ্ট সম্মতি ছাড়া লিংক খুলবে না।
  * ব্যবহারকারী যদি সম্মতি দেয় (যেমন: "হ্যাঁ", "দাও", "খুলে দাও", "Yes", "Open WhatsApp" বা অন্য কোনো সম্মতিবাচক কথা বলে), কেবল তখনই 'openJawadWhatsApp' টুলটি কল করবে এবং মিষ্টি করে বলবে: "আমি জাওয়াদের WhatsApp লিংকটি খুলে দিচ্ছি।"
  * ব্যবহারকারী যদি না বলে বা অন্য বিষয়ে কথা বলতে চায়, স্বাভাবিকভাবে কথোপকথন চালিয়ে যাবে।
  * জাওয়াদের কোনো মনগড়া ফোন নম্বর বা ব্যক্তিগত তথ্য বানাবে না। শুধুমাত্র জাওয়াদের নির্ধারিত অফিসিয়াল লিঙ্ক (https://wa.link/mvgabh) বা অ্যাপে সংরক্ষিত তথ্য ব্যবহার করবে।

========================================
২. একক বাংলা ভাষা নীতি (BANGLA ONLY)
========================================
- তুমি সবসময় এবং যেকোনো পরিস্থিতিতে কেবল প্রাঞ্জল বাংলাদেশি বাংলায় কথা বলবে।
- ব্যবহারকারী ইংরেজি, হিন্দি বা অন্য যে ভাষাতেই প্রশ্ন করুক, তুমি তা বুঝে নিয়ে সবসময় মিষ্টি ও প্রাঞ্জল বাংলায় উত্তর প্রদান করবে।
- সাধারণ কথোপকথনে কখনোই হিন্দি বা ইংরেজিতে উত্তর দেবে না।
- তবে টেকনিক্যাল টার্মস, কোড, ওয়েবসাইট ইউআরএল বা ব্যক্তির নাম অপরিবর্তিত রাখবে।
- উত্তর হবে স্বাভাবিক, স্পষ্ট, সংক্ষিপ্ত এবং সরাসরি সহায়ক। কখনো রোবটের মতো শোনাবে না।

========================================
৩. স্মার্ট ডিভাইস কন্ট্রোল ও টুলস
========================================
ব্যবহারকারী কোনো কাজের নির্দেশ দিলে সাথে সাথে টুলটি কল করবে:
- জাওয়াদের WhatsApp খুলতে সম্মতি দিলে -> openJawadWhatsApp({})
- সাধারণ WhatsApp খুলতে বললে -> openWhatsApp({})
- ইউটিউব খুলতে বললে -> openApp({ appName: 'youtube' })
- গুগলে কিছু খুঁজতে বললে -> searchGoogle({ query: ... })
- কাউকে কল করতে বললে -> callContact({ contactName: ... }) অথবা makeCall({ phoneNumber: ... })
- কোনো ওয়েবসাইট খুলতে বললে -> openWebsite({ url: ... })`;

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Maya AI 2.0 Live WebSocket');
  let session: any = null;
  const ai = getGeminiClient();

  const connectToLiveModel = async () => {
    // Primary: gemini-3.8-live, fallback: gemini-3.1-flash-live-preview
    const modelsToTry = [
      'gemini-3.8-live',
      'gemini-3.1-flash-live-preview',
    ];

    for (const model of modelsToTry) {
      try {
        console.log(`[GeminiLive] Connecting with model: ${model}`);
        const liveSession = await ai.live.connect({
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Aoede' }, // Aoede / Kore
              },
            },
            systemInstruction: MAYA_SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: liveTools }],
            outputAudioTranscription: {},
            inputAudioTranscription: {},
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              if (clientWs.readyState !== WebSocket.OPEN) return;

              // 1. Audio stream chunks (PCM16 24kHz)
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts && parts.length > 0) {
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'audio',
                        data: part.inlineData.data,
                      })
                    );
                  }
                }
              }

              // 2. Interruption notification
              if (message.serverContent?.interrupted) {
                console.log('[GeminiLive] User interrupted, notifying client');
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }

              // 3. Turn complete notification
              if (message.serverContent?.turnComplete) {
                clientWs.send(JSON.stringify({ type: 'turnComplete' }));
              }

              // 4. Tool Calls (Function calling)
              if (message.toolCall?.functionCalls) {
                for (const fc of message.toolCall.functionCalls) {
                  console.log('[GeminiLive] Tool call received:', fc.name, fc.args);
                  clientWs.send(
                    JSON.stringify({
                      type: 'toolCall',
                      call: fc,
                    })
                  );
                }
              }

              // 5. Transcription subtitles
              const outText = (message.serverContent as any)?.outputTranscription?.text;
              if (outText) {
                clientWs.send(
                  JSON.stringify({
                    type: 'transcript',
                    text: outText,
                    isUser: false,
                  })
                );
              }
              const inText = (message.serverContent as any)?.inputTranscription?.text;
              if (inText) {
                clientWs.send(
                  JSON.stringify({
                    type: 'transcript',
                    text: inText,
                    isUser: true,
                  })
                );
              }
            },
            onclose: () => {
              console.log('[GeminiLive] Session closed');
            },
            onerror: (err) => {
              console.error('[GeminiLive] Session error:', err);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'error',
                    message: 'জেমিনি লাইভ সংযোগে ত্রুটি দেখা দিয়েছে।',
                  })
                );
              }
            },
          },
        });
        return liveSession;
      } catch (err: any) {
        console.warn(`Live model ${model} failed:`, err?.message);
      }
    }
    throw new Error('Unable to connect to Gemini Live with supported models.');
  };

  const messageQueue: any[] = [];
  let isSessionReady = false;

  const processClientMsg = (msg: any) => {
    if (!session) return;
    try {
      // 1. Stream real-time mic PCM16 (16kHz) to Gemini Live
      if (msg.type === 'audio' && msg.data) {
        session.sendRealtimeInput({
          audio: {
            data: msg.data,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      }
      // 2. Send text input to Gemini Live to generate spoken audio response
      else if (msg.type === 'text' && msg.text) {
        console.log('[GeminiLive] Sending text turn to generate spoken response:', msg.text);
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: msg.text }] }],
          turnComplete: true,
        });
      }
      // 3. Send toolResponse back to Gemini session
      else if (msg.type === 'toolResponse' && msg.id && msg.name) {
        console.log('[GeminiLive] Sending tool response back to Gemini:', msg.name);
        session.sendToolResponse({
          functionResponses: [
            {
              id: msg.id,
              name: msg.name,
              response: msg.response || { status: 'success' },
            },
          ],
        });
      }
    } catch (err) {
      console.warn('[GeminiLive] Error sending data to session:', err);
    }
  };

  // Register message handler immediately so early messages/chunks are never dropped
  clientWs.on('message', (rawData) => {
    try {
      const msg = JSON.parse(rawData.toString());
      if (!isSessionReady) {
        messageQueue.push(msg);
        return;
      }
      processClientMsg(msg);
    } catch (e) {
      console.warn('Error parsing client message:', e);
    }
  });

  clientWs.on('close', () => {
    console.log('Client WebSocket closed, cleaning up Live session');
    try {
      session?.close?.();
    } catch (e) {}
    session = null;
  });

  clientWs.on('error', (err) => {
    console.error('Client WebSocket error:', err);
    try {
      session?.close?.();
    } catch (e) {}
    session = null;
  });

  try {
    session = await connectToLiveModel();
    isSessionReady = true;
    console.log('Maya AI 2.0 Live session established successfully');

    // Notify client that live audio pipeline is active
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'ready' }));
    }

    // Flush any early queued messages
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift();
      processClientMsg(msg);
    }
  } catch (err: any) {
    console.error('Failed to establish Live session for client:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message: err?.message || 'Could not connect to Gemini Live API',
        })
      );
      clientWs.close();
    }
  }
});

// Standard text fallback API endpoint for chat messages
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userPreferences, memories } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const ai = getGeminiClient();

    let contextSupplement = '';
    if (userPreferences?.ownerProfile) {
      const op = userPreferences.ownerProfile;
      contextSupplement += `\nOwner & Creator Information:\n- Creator & Owner: ${op.ownerName || 'জাওয়াদ (Jawad)'}\n- Official WhatsApp Link: ${op.contactWhatsApp || 'https://wa.link/mvgabh'}`;
      if (op.contactEmail) contextSupplement += `\n- Configured Email: ${op.contactEmail}`;
      if (op.contactPhone) contextSupplement += `\n- Configured Phone: ${op.contactPhone}`;
    }
    if (userPreferences?.userName) {
      contextSupplement += `\nUser's Name: ${userPreferences.userName}`;
    }
    if (userPreferences?.preferredLanguage && userPreferences.preferredLanguage !== 'auto') {
      contextSupplement += `\nPreferred Language: ${userPreferences.preferredLanguage}`;
    }
    if (Array.isArray(memories) && memories.length > 0) {
      contextSupplement += `\nApproved User Memories:\n${memories.map((m: any) => `- ${m.key}: ${m.content}`).join('\n')}`;
    }

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chatModelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash'];
    let response: any = null;
    let lastErr: any = null;

    for (const model of chatModelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: `${MAYA_SYSTEM_INSTRUCTION}\n${contextSupplement}`,
              tools: [{ functionDeclarations: liveTools }],
            },
          });
          if (response) break;
        } catch (e: any) {
          lastErr = e;
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }
      if (response) break;
    }

    if (!response) {
      throw lastErr || new Error('Failed to generate response from models');
    }

    let reply = response.text || '';
    let executedTool = null;
    if (response.functionCalls && response.functionCalls.length > 0) {
      const fc = response.functionCalls[0];
      executedTool = {
        name: fc.name,
        args: fc.args,
      };
      if (!reply) {
        if (fc.name === 'openJawadWhatsApp') {
          reply = 'আমি জাওয়াদের WhatsApp লিংকটি খুলে দিচ্ছি।';
        } else if (fc.name === 'openWhatsApp') {
          reply = 'আমি WhatsApp খুলে দিচ্ছি।';
        } else if (fc.name === 'openApp') {
          reply = `আমি ${(fc.args as any)?.appName || 'অ্যাপটি'} খুলে দিচ্ছি।`;
        } else {
          reply = 'নিশ্চয়ই, কাজটি করা হচ্ছে।';
        }
      }
    }

    return res.json({ reply, toolCall: executedTool });
  } catch (err: any) {
    console.error('Error in /api/chat endpoint:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate response' });
  }
});

// Mount Vite or serve static
const startServer = async () => {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Maya AI 2.0 Premium server listening on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
