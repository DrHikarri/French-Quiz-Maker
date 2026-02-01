
import { Quiz, Card, Attempt, UserStats, Settings, QuizSessionState } from './types';

const STORAGE_KEYS = {
  QUIZZES: 'ls_quizzes',
  CARDS: 'ls_cards',
  ATTEMPTS: 'ls_attempts',
  STATS: 'ls_stats',
  SETTINGS: 'ls_settings',
  LAST_QUIZ: 'ls_last_quiz',
  SESSIONS: 'ls_sessions',
  ADMIN_SESSION: 'hikari_admin_session_v1'
};

export const DB = {
  getQuizzes: (): Quiz[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZZES) || '[]'),
  saveQuizzes: (quizzes: Quiz[]) => localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes)),
  
  getCards: (): Card[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]'),
  saveCards: (cards: Card[]) => localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards)),

  getAttempts: (): Attempt[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTEMPTS) || '[]'),
  saveAttempts: (attempts: Attempt[]) => localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts)),

  getStats: (): UserStats => JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS) || JSON.stringify({
    xp: 0,
    level: 1,
    totalSessions: 0,
    streak: 0,
    lastActive: Date.now()
  })),
  saveStats: (stats: UserStats) => localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats)),

  getSettings: (): Settings => JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || JSON.stringify({
    uiLanguage: 'en',
    speechLang: 'fr-FR',
    xpMultiplier: 1
  })),
  saveSettings: (settings: Settings) => localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)),

  getSession: (quizId: string): QuizSessionState | null => {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '{}');
    return sessions[quizId] || null;
  },
  saveSession: (session: QuizSessionState) => {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '{}');
    sessions[session.quizId] = session;
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },
  clearSession: (quizId: string) => {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '{}');
    delete sessions[quizId];
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  setLastQuiz: (id: string | null) => id ? localStorage.setItem(STORAGE_KEYS.LAST_QUIZ, id) : localStorage.removeItem(STORAGE_KEYS.LAST_QUIZ),
  getLastQuiz: () => localStorage.getItem(STORAGE_KEYS.LAST_QUIZ),

  // Admin Session Management
  getAdminSession: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) || 'null');
    } catch { return null; }
  },
  saveAdminSession: (session: { role: string, lastActiveAt: number }) => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
  },
  clearAdminSession: () => {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  },

  importAll: (json: string) => {
    try {
      // Validation: Check for Blob URLs which break on import
      if (json.includes('"image":"blob:') || json.includes('"image": "blob:')) {
        const proceed = window.confirm(
          "Warning: This backup contains temporary 'blob:' links instead of embedded images. Images may not load. Import anyway?"
        );
        if (!proceed) return;
      }

      const data = JSON.parse(json);
      const existingQuizzes = DB.getQuizzes();
      const existingCards = DB.getCards();
      const existingAttempts = DB.getAttempts();
      const existingStats = DB.getStats();

      // Merge Logic
      const importedQuizzes: Quiz[] = data.quizzes || [];
      const importedCards: Card[] = data.cards || [];
      const importedAttempts: Attempt[] = data.attempts || [];
      
      const newQuizzes = [...existingQuizzes];
      const newCards = [...existingCards];
      const newAttempts = [...existingAttempts];

      importedQuizzes.forEach(iq => {
        let finalTitle = iq.name;
        // Avoid duplicate names if it's a new import
        if (newQuizzes.some(nq => nq.id === iq.id)) {
           const existingIdx = newQuizzes.findIndex(nq => nq.id === iq.id);
           newQuizzes[existingIdx] = iq;
        } else {
           while (newQuizzes.some(nq => nq.name === finalTitle)) {
             finalTitle += " (imported)";
           }
           iq.name = finalTitle;
           newQuizzes.push(iq);
        }
      });

      // Simple merge for cards/attempts based on IDs
      importedCards.forEach(ic => {
        if (!newCards.find(c => c.id === ic.id)) newCards.push(ic);
      });
      importedAttempts.forEach(ia => {
        if (!newAttempts.find(a => a.id === ia.id)) newAttempts.push(ia);
      });

      DB.saveQuizzes(newQuizzes);
      DB.saveCards(newCards);
      DB.saveAttempts(newAttempts);
      
      // Merge stats (take max)
      if (data.stats && data.stats.xp > existingStats.xp) {
        DB.saveStats(data.stats);
      }
      
      // Restore settings if present - merge with existing to avoid losing supported keys
      if (data.settings) {
         // We only import supported keys
         const current = DB.getSettings();
         DB.saveSettings({ ...current, ...data.settings });
      }

      window.location.reload();
    } catch (e) {
      console.error('Import failed', e);
      alert('Failed to import backup. The file format may be invalid.');
    }
  },

  // Returns the JSON string and estimated size
  generateBackup: () => {
    const data = {
      quizzes: DB.getQuizzes(),
      cards: DB.getCards(),
      attempts: DB.getAttempts(),
      stats: DB.getStats(),
      settings: DB.getSettings(),
      sessions: JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '{}')
    };
    const json = JSON.stringify(data, null, 2);
    const sizeBytes = new Blob([json]).size;
    return { json, sizeBytes };
  },

  downloadBackup: (json: string) => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hikari-french-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
