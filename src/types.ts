export type Role = 'user' | 'assistant' | 'model';

export type VisualState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error';

export interface AppAction {
  id: string;
  toolName:
    | 'openWebsite'
    | 'searchGoogle'
    | 'openWhatsApp'
    | 'openJawadWhatsApp'
    | 'openApp'
    | 'openUrl'
    | 'makeCall'
    | 'callContact';
  args: Record<string, any>;
  status: 'executing' | 'success' | 'failed' | 'needs_clarification';
  message: string;
  fallbackUrl?: string;
  timestamp: number;
}

export interface Contact {
  id: string;
  name: string;
  nicknames?: string[];
  phone: string;
  relationship?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  language?: string;
  audioUrl?: string;
  executedActions?: AppAction[];
  suggestedTasks?: Array<{
    title: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
  }>;
}

export type AssistantMode =
  | 'General Assistant'
  | 'Strategic Planner'
  | 'Executive Writer'
  | 'Deep Focus';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  mode?: AssistantMode;
}

export interface TaskItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueDate?: string;
  category?: string;
  createdAt: number;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  tags: string[];
}

export interface MemoryItem {
  id: string;
  key: string;
  content: string;
  category: 'preference' | 'personal' | 'work' | 'routine';
  createdAt: number;
}

export interface OwnerProfile {
  ownerName: string;
  assistantName: string;
  personality: string;
  contactWhatsApp: string;
  contactEmail: string;
  contactPhone: string;
}

export interface ChargingSettings {
  enableAlerts: boolean;
  voiceAnnouncement: boolean;
}

export interface UserPreferences {
  userName: string;
  preferredLanguage?: 'auto' | 'bn' | 'hi' | 'en';
  tone: string;
  voiceName: string;
  enableMemory?: boolean;
  animationLevel?: 'full' | 'reduced';
  hapticsEnabled?: boolean;
  theme?: 'obsidian-purple' | 'neon-rose';
  primaryGoal?: string;
  voiceAutoPlay?: boolean;
  customContext?: string;
  ownerProfile?: OwnerProfile;
  chargingSettings?: ChargingSettings;
}
