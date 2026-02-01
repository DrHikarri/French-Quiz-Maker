
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DB } from './db';
import { Screen, Quiz, Card, Attempt, UserStats, Settings, QuizSessionState } from './types';
import { shuffleArray } from './utils';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Library from './components/Library';
import QuizEditor from './components/QuizEditor';
import SettingsView from './components/Settings';
import QuizPlayer from './components/QuizPlayer';
import Summary from './components/Summary';
import TrashView from './components/TrashView';
import TemplatePicker from './components/TemplatePicker';
import DevBanner from './components/DevBanner';
import WelcomeRestore from './components/WelcomeRestore';
import Modal from './components/Modal';

// Numeric Obfuscation
const _K = [72, 105, 107, 97, 114, 105, 70, 114, 101, 110, 99, 104, 50, 48, 50, 54];
const validateAdminPassword = (input: string) => {
  if (!input || input.length !== _K.length) return false;
  for (let i = 0; i < input.length; i++) {
    if (input.charCodeAt(i) !== _K[i]) return false;
  }
  return true;
};

const ADMIN_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [quizzes, setQuizzes] = useState<Quiz[]>(DB.getQuizzes());
  const [cards, setCards] = useState<Card[]>(DB.getCards());
  const [attempts, setAttempts] = useState<Attempt[]>(DB.getAttempts());
  const [stats, setStats] = useState<UserStats>(DB.getStats());
  const [settings, setSettings] = useState<Settings>(DB.getSettings());
  
  // Auth State Helpers
  const checkAdminSession = () => {
    const session = DB.getAdminSession();
    if (session && session.role === 'admin') {
      if (Date.now() - session.lastActiveAt < ADMIN_TIMEOUT_MS) {
        return true;
      }
    }
    return false;
  };

  const [isAdmin, setIsAdmin] = useState(checkAdminSession());
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeSessionCards, setActiveSessionCards] = useState<Card[]>([]); 
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  
  const [sessionResults, setSessionResults] = useState<{
    attempts: Attempt[];
    xpGained: number;
    timeSpent: number;
  } | null>(null);

  // Dev state
  const [lastAction, setLastAction] = useState<string>('App Init');
  const [isListeningDebug, setIsListeningDebug] = useState(false);

  const logAction = (action: string) => {
    console.log(`[Action]: ${action}`);
    setLastAction(action);
  };

  // Sync with DB
  useEffect(() => {
    DB.saveQuizzes(quizzes);
    DB.saveCards(cards);
    DB.saveAttempts(attempts);
    DB.saveStats(stats);
    DB.saveSettings(settings);
  }, [quizzes, cards, attempts, stats, settings]);

  // Enforce Dark Mode & Document Title
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.title = "Hikari French Practice";
  }, []);

  // Admin Timeout Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const valid = checkAdminSession();
      if (isAdmin && !valid) {
        setIsAdmin(false);
        logAction('Admin Session Expired');
      }
    }, 5000); 
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Route Guard
  useEffect(() => {
    if (screen === 'settings' && !isAdmin) {
      logAction('Route Guard Redirect');
      setScreen('dashboard');
    }
  }, [screen, isAdmin]);

  const recordActivity = () => {
    if (isAdmin) {
      DB.saveAdminSession({ role: 'admin', lastActiveAt: Date.now() });
    }
  };

  const handleNav = (s: Screen) => {
    recordActivity();
    logAction(`Nav to ${s}`);
    setScreen(s);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAdminPassword(passwordInput)) {
      const now = Date.now();
      DB.saveAdminSession({ role: 'admin', lastActiveAt: now });
      setIsAdmin(true);
      setShowAdminLogin(false);
      setPasswordInput('');
      setLoginError('');
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      setLoginError('Incorrect password');
    }
  };

  const handleLogout = () => {
    DB.clearAdminSession();
    setIsAdmin(false);
    setScreen('dashboard');
    logAction('Admin Logout');
  };

  const t = useMemo(() => {
    const en = {
      appName: 'Hikari French Practice',
      dashboard: 'Dashboard', study: 'Study', create: 'Create', library: 'Library', 
      stats: 'Card Stats', settings: 'Settings', streak: 'Day Streak', xp: 'Total XP', 
      accuracy: 'Avg Accuracy', sessions: 'Sessions', time: 'Practice Time',
      createQuiz: 'Create New Quiz', studyNow: 'Start Learning', weakest: 'Needs Focus',
      noQuizzes: 'No quizzes yet. Create one to start!', continue: 'Resume Last',
      xpLabel: 'XP', levelLabel: 'Level', deleteConfirm: 'Delete this quiz permanently? This cannot be undone.',
      export: 'Export Data', import: 'Import Backup', edit: 'Edit', trash: 'Trash',
      moveToTrash: 'Moved to Trash', restore: 'Restored quiz', permanentDelete: 'Permanently deleted'
    };
    const fr = {
      appName: 'Hikari French Practice',
      dashboard: 'Tableau', study: 'Étudier', create: 'Créer', library: 'Bibliothèque', 
      stats: 'Stats Cartes', settings: 'Paramètres', streak: 'Série de jours', xp: 'Total XP', 
      accuracy: 'Précision Moy.', sessions: 'Sessions', time: 'Temps de pratique',
      createQuiz: 'Créer un quiz', studyNow: 'Commencer', weakest: 'À réviser',
      noQuizzes: 'Aucun quiz. Créez-en un pour commencer !', continue: 'Reprendre',
      xpLabel: 'XP', levelLabel: 'Niveau', deleteConfirm: 'Supprimer ce quiz définitivement ? Cette action est irréversible.',
      export: 'Exporter', import: 'Importer', edit: 'Modifier', trash: 'Corbeille',
      moveToTrash: 'Mis à la corbeille', restore: 'Quiz restauré', permanentDelete: 'Supprimé définitivement'
    };
    return settings.uiLanguage === 'fr' ? fr : en;
  }, [settings.uiLanguage]);

  const addAttempt = useCallback((attempt: Attempt) => {
    setAttempts(prev => [...prev, attempt]);
    setStats(prev => {
      const newXp = Math.max(0, prev.xp + attempt.xpChange);
      const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
      return { ...prev, xp: newXp, level: newLevel, lastActive: Date.now() };
    });
    logAction(`Attempt added: ${attempt.passed ? 'Pass' : 'Fail'}`);
  }, []);

  const launchQuizSession = (quiz: Quiz, session?: QuizSessionState) => {
    const quizCards = cards.filter(c => c.quizId === quiz.id);
    let orderedCards: Card[] = [];

    if (session) {
      // Resume Existing Session
      if (session.shuffledCardIds && session.shuffledCardIds.length > 0) {
        orderedCards = session.shuffledCardIds
          .map(id => quizCards.find(c => c.id === id))
          .filter(c => !!c) as Card[];
        if (orderedCards.length === 0) orderedCards = quizCards;
      } else {
        orderedCards = quizCards;
      }
    } else {
      // Start New Session
      if (quiz.settings.randomize) {
        orderedCards = shuffleArray(quizCards);
      } else {
        orderedCards = quizCards;
      }
      const newSession: QuizSessionState = {
        quizId: quiz.id,
        quizUpdatedAt: quiz.updatedAt || quiz.createdAt,
        shuffledCardIds: orderedCards.map(c => c.id),
        currentIndex: 0,
        sessionAttempts: [],
        startTime: Date.now(),
        pausedAt: Date.now()
      };
      DB.saveSession(newSession);
    }

    setActiveSessionCards(orderedCards);
    setActiveQuiz(quiz);
    setScreen('quiz-player');
  };

  const handleStartQuiz = (quiz: Quiz, reset: boolean = false) => {
    console.log(`[App] handleStartQuiz: ${quiz.name} (ID: ${quiz.id}) | Reset: ${reset}`);
    recordActivity();
    
    // 1. Explicit Reset Request
    if (reset) {
      console.log('[App] Resetting session per user request.');
      DB.clearSession(quiz.id);
      launchQuizSession(quiz, undefined);
      return;
    }

    // 2. Check for Existing Session
    const existingSession = DB.getSession(quiz.id);
    const quizCards = cards.filter(c => c.quizId === quiz.id);

    // 3. Validation Logic
    const isValidSession = existingSession 
        && existingSession.currentIndex >= 0 
        && existingSession.currentIndex < quizCards.length;

    if (isValidSession) {
      const quizTime = quiz.updatedAt || quiz.createdAt;
      const sessionTime = existingSession!.quizUpdatedAt || 0;
      
      // Invalidate if quiz updated since session start
      if (quizTime > sessionTime + 1000) {
         console.warn('[App] Session invalidated due to content update. Starting fresh.');
         DB.clearSession(quiz.id);
         launchQuizSession(quiz, undefined);
         return;
      }
      
      console.log('[App] Resuming valid session at index', existingSession!.currentIndex);
      launchQuizSession(quiz, existingSession!);
    } else {
      console.log('[App] No valid session found. Starting new.');
      launchQuizSession(quiz, undefined);
    }
  };

  const handleFinishQuiz = (results: { attempts: Attempt[]; xpGained: number; timeSpent: number }) => {
    logAction('Quiz Finished');
    DB.clearSession(activeQuiz!.id);
    setSessionResults(results);
    setStats(prev => ({ ...prev, totalSessions: prev.totalSessions + 1 }));
    setScreen('quiz-summary');
  };

  const handleSaveQuizRequest = (quiz: Quiz, quizCards: Card[]) => {
    recordActivity();
    if (isAdmin) {
      performSaveQuiz(quiz, quizCards);
    } else {
      setPendingAction(() => () => performSaveQuiz(quiz, quizCards));
      setShowAdminLogin(true);
      setLoginError('Session expired. Re-enter password to save.');
    }
  };

  const performSaveQuiz = (quiz: Quiz, quizCards: Card[]) => {
    logAction(`Save Quiz: ${quiz.name}`);
    const updatedQuiz = { ...quiz, updatedAt: Date.now() };
    setQuizzes(prev => {
      const idx = prev.findIndex(q => q.id === quiz.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = updatedQuiz;
        return next;
      }
      return [...prev, updatedQuiz];
    });
    setCards(prev => {
      const filtered = prev.filter(c => c.quizId !== quiz.id);
      return [...filtered, ...quizCards];
    });
    setScreen('library');
  };

  const handleEditQuiz = (quiz: Quiz) => {
    handleNav('edit');
    setEditingQuiz(quiz);
  };

  const handleMoveToTrash = (id: string) => {
    recordActivity();
    logAction(`Move to Trash: ${id}`);
    setQuizzes(prev => prev.map(q => q.id === id ? { ...q, isTrashed: true, deletedAt: Date.now() } : q));
    DB.clearSession(id);
    if (DB.getLastQuiz() === id) DB.setLastQuiz(null);
  };

  const handleRestoreFromTrash = (id: string) => {
    recordActivity();
    logAction(`Restore: ${id}`);
    setQuizzes(prev => prev.map(q => q.id === id ? { ...q, isTrashed: false, deletedAt: undefined } : q));
  };

  const handlePermanentDelete = (id: string) => {
    recordActivity();
    logAction(`Perm Delete: ${id}`);
    setQuizzes(prev => prev.filter(q => q.id !== id));
    setCards(prev => prev.filter(c => c.quizId !== id));
    setAttempts(prev => prev.filter(a => a.quizId !== id));
    DB.clearSession(id);
    if (DB.getLastQuiz() === id) DB.setLastQuiz(null);
  };

  const visibleQuizzes = useMemo(() => {
    if (isAdmin) return quizzes.filter(q => !q.isTrashed);
    return quizzes.filter(q => !q.isTrashed && q.status === 'published');
  }, [quizzes, isAdmin]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors relative" onClick={recordActivity}>
      <DevBanner 
        screen={screen} 
        activeQuizId={activeQuiz?.id || null} 
        isListening={isListeningDebug}
        lastAction={lastAction}
      />
      
      <Layout 
        screen={screen} 
        setScreen={handleNav} 
        stats={stats} 
        t={t} 
        isAdmin={isAdmin}
        onOpenAdmin={() => { setShowAdminLogin(true); setLoginError(''); }}
      >
        {screen === 'dashboard' && visibleQuizzes.length === 0 && quizzes.length === 0 ? (
          <WelcomeRestore isAdmin={isAdmin} onLogin={() => { setShowAdminLogin(true); setLoginError(''); }} />
        ) : screen === 'dashboard' ? (
          <Dashboard 
            stats={stats} 
            attempts={attempts} 
            quizzes={visibleQuizzes} 
            cards={cards} // Pass cards to Dashboard for session checking
            t={t} 
            onStartQuiz={handleStartQuiz} 
            setScreen={handleNav} 
            lastQuizId={DB.getLastQuiz()} 
            isAdmin={isAdmin}
          />
        ) : null}
        
        {(screen === 'library' || screen === 'study') && (
          <Library 
            quizzes={visibleQuizzes} 
            cards={cards} 
            onDelete={handleMoveToTrash} 
            onEdit={handleEditQuiz} 
            onPlay={handleStartQuiz} 
            t={t} 
            mode={screen === 'study' ? 'study' : 'manage'} 
            isAdmin={isAdmin}
          />
        )}
        {screen === 'trash' && isAdmin && (
          <TrashView quizzes={quizzes.filter(q => q.isTrashed)} onRestore={handleRestoreFromTrash} onPermanentDelete={handlePermanentDelete} t={t} />
        )}
        {screen === 'create' && isAdmin && (
          <TemplatePicker onSelect={() => { logAction('Selected Template'); handleNav('edit'); }} t={t} />
        )}
        {(screen === 'edit') && (isAdmin || editingQuiz) && (
          <QuizEditor 
            onSave={handleSaveQuizRequest} 
            t={t} 
            existingQuiz={editingQuiz}
            existingCards={editingQuiz ? cards.filter(c => c.quizId === editingQuiz.id) : []}
            onCancel={() => { logAction('Cancel Edit'); setEditingQuiz(null); handleNav('library'); }}
          />
        )}
        {screen === 'settings' && isAdmin && <SettingsView settings={settings} setSettings={setSettings} t={t} onLogout={handleLogout} />}
        {screen === 'quiz-player' && activeQuiz && (
          <QuizPlayer 
            quiz={activeQuiz} 
            allCards={activeSessionCards}
            onFinish={handleFinishQuiz}
            onExit={() => { logAction('Exited Quiz'); setActiveQuiz(null); handleNav('study'); }}
            onAddAttempt={addAttempt}
            settings={settings}
            initialSession={DB.getSession(activeQuiz.id)}
            onListeningChange={setIsListeningDebug}
          />
        )}
        {screen === 'quiz-summary' && sessionResults && (
          <Summary results={sessionResults} onClose={() => handleNav('dashboard')} t={t} />
        )}
      </Layout>

      <Modal isOpen={showAdminLogin} onClose={() => { setShowAdminLogin(false); setPendingAction(null); }} title="Admin Access">
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            Unlock management tools and advanced settings.
          </p>
          <div>
             <input 
               type="password" 
               className="w-full p-3 rounded-xl border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
               placeholder="Password"
               value={passwordInput}
               onChange={(e) => setPasswordInput(e.target.value)}
               autoFocus
             />
             {loginError && <p className="text-rose-500 text-sm mt-2">{loginError}</p>}
          </div>
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl"
            >
              Unlock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default App;
