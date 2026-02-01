
export type TemplateId = 'speak-to-match';

export type QuizStatus = 'draft' | 'published';

export interface Quiz {
  id: string;
  name: string;
  templateId: TemplateId;
  createdAt: number;
  updatedAt?: number; // Track content changes for session invalidation
  status?: QuizStatus; // Default to 'draft' if undefined
  isTrashed?: boolean;
  deletedAt?: number;
  settings: {
    language: string; // e.g., 'fr-FR'
    goalScore: number;
    shuffle: boolean; // Legacy shuffle
    randomize?: boolean; // New per-quiz shuffle setting
  };
}

export interface Card {
  id: string;
  quizId: string;
  image: string; // base64 or URL
  targetSentence: string;
  acceptedSentences: string[];
  preferredModelAnswer?: string; // Sentence used for TTS/audio label
  hint?: string;
  audioOverride?: string; // base64 audio data
}

export interface Attempt {
  id: string;
  cardId: string;
  quizId: string;
  timestamp: number;
  coreScore: number;
  accentScore: number;
  passed: boolean;
  xpChange: number;
  transcript: string;
}

export interface QuizSessionState {
  quizId: string;
  quizUpdatedAt?: number; // To check against current quiz version
  shuffledCardIds?: string[]; // The specific order for this session
  currentIndex: number;
  sessionAttempts: Attempt[];
  startTime: number;
  pausedAt: number;
}

export interface UserStats {
  xp: number;
  level: number;
  totalSessions: number;
  streak: number;
  lastActive: number;
}

export interface Settings {
  uiLanguage: 'en' | 'fr';
  ttsVoice?: string;
  speechLang: string;
  xpMultiplier: number;
}

export type Screen = 'dashboard' | 'study' | 'create' | 'edit' | 'library' | 'settings' | 'quiz-player' | 'quiz-summary' | 'trash';
