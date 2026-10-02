import { Message, UserPreferences, AssistantMode, AppAction } from '../types';
import { AndroidActionBridge } from './androidBridge';

export interface ChatStreamOptions {
  messages: Array<{ role: string; content: string }>;
  userPreferences: UserPreferences;
  mode: AssistantMode;
  onChunk: (chunk: string) => void;
  onDone: (
    fullText: string,
    extractedTasks: any[],
    executedActions?: AppAction[]
  ) => void;
  onError: (err: any) => void;
  onActionTriggered?: (action: AppAction) => void;
}

export const streamChatWithAssistant = async ({
  messages,
  userPreferences,
  mode,
  onChunk,
  onDone,
  onError,
  onActionTriggered,
}: ChatStreamOptions) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        userContext: {
          userName: userPreferences.userName,
          tone: userPreferences.tone,
          currentMode: mode,
          userNotes: userPreferences.customContext,
          localTime: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData.error || `HTTP ${response.status}: Failed to reach assistant`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Readable stream not supported in this browser.');
    }

    const decoder = new TextDecoder();
    let accumulatedText = '';
    let buffer = '';
    const executedActions: AppAction[] = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));

            // Process tool calls from Gemini
            if (Array.isArray(data.toolCalls) && data.toolCalls.length > 0) {
              for (const tc of data.toolCalls) {
                const actionId = `action-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 5)}`;
                let execResult: {
                  success: boolean;
                  status: 'success' | 'failed' | 'needs_clarification';
                  message: string;
                  fallbackUrl?: string;
                } = {
                  success: false,
                  status: 'failed',
                  message: 'Action could not be executed',
                  fallbackUrl: undefined,
                };

                const args = tc.args || {};
                if (tc.name === 'openWhatsApp') {
                  execResult = AndroidActionBridge.openWhatsApp(
                    args.phone,
                    args.message
                  );
                } else if (tc.name === 'openApp') {
                  execResult = AndroidActionBridge.openApp(args.appName);
                } else if (tc.name === 'openUrl') {
                  execResult = AndroidActionBridge.openUrl(args.url);
                } else if (tc.name === 'makeCall') {
                  execResult = AndroidActionBridge.makeCall(args.phoneNumber);
                } else if (tc.name === 'callContact') {
                  execResult = AndroidActionBridge.callContact(args.contactName);
                }

                const actionItem: AppAction = {
                  id: actionId,
                  toolName: tc.name,
                  args,
                  status: execResult.status,
                  message: execResult.message,
                  fallbackUrl: execResult.fallbackUrl,
                  timestamp: Date.now(),
                };

                executedActions.push(actionItem);
                onActionTriggered?.(actionItem);
              }
            }

            if (data.text) {
              accumulatedText += data.text;
              onChunk(data.text);
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e: any) {
            // ignore partial json
          }
        }
      }
    }

    // Extract any embedded task markers
    const extractedTasks: any[] = [];
    const taskRegex = /<!--TASK:([\s\S]*?)-->/g;
    let match;
    while ((match = taskRegex.exec(accumulatedText)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        extractedTasks.push(parsed);
      } catch (e) {
        // ignore
      }
    }

    // Cleaned text without task markers for display
    const cleanedText = accumulatedText
      .replace(/<!--TASK:[\s\S]*?-->/g, '')
      .trim();

    onDone(cleanedText, extractedTasks, executedActions);
  } catch (err: any) {
    console.error('streamChatWithAssistant error:', err);
    onError(err);
  }
};

// Aliased export for compatibility
export const streamChatWithMayra = streamChatWithAssistant;

export const fetchDailyBriefing = async (
  userPreferences: UserPreferences,
  tasks: any[],
  notes: any[]
): Promise<string> => {
  const res = await fetch('/api/briefing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: userPreferences.userName,
      userGoal: userPreferences.primaryGoal,
      tasks: tasks.slice(0, 10),
      notes: notes.slice(0, 5),
      localTime: new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to generate briefing');
  }

  const data = await res.json();
  return data.briefing;
};

export const requestMayraSpeech = async (
  text: string,
  voiceName: string = 'Kore'
): Promise<string> => {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'TTS generation failed');
  }

  const data = await res.json();
  return data.audioUrl;
};

export const runExecutiveTool = async (action: string, input: string) => {
  const res = await fetch('/api/quick-tool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, input }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Tool execution failed');
  }

  const data = await res.json();
  return data.result;
};
