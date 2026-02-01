
import React, { useMemo } from 'react';
import { Attempt, UserStats, Quiz, Card } from '../types';
import { formatTime } from '../utils';
import { DB } from '../db';

interface DashboardProps {
  stats: UserStats;
  attempts: Attempt[];
  quizzes: Quiz[];
  cards: Card[]; // Added to check session validity
  t: any;
  onStartQuiz: (q: Quiz, reset?: boolean) => void;
  setScreen: (s: any) => void;
  lastQuizId: string | null;
  isAdmin: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, attempts, quizzes, cards, t, onStartQuiz, setScreen, lastQuizId, isAdmin }) => {
  const derivedStats = useMemo(() => {
    const accuracy = attempts.length > 0 
      ? Math.round(attempts.reduce((acc, curr) => acc + curr.coreScore, 0) / attempts.length) 
      : 0;

    const quizStats = quizzes.map(q => {
      const qAttempts = attempts.filter(a => a.quizId === q.id);
      const qAvg = qAttempts.length > 0 ? qAttempts.reduce((acc, curr) => acc + curr.coreScore, 0) / qAttempts.length : 100;
      return { quiz: q, avg: qAvg };
    }).sort((a, b) => a.avg - b.avg).slice(0, 3);

    return { accuracy, quizStats };
  }, [attempts, quizzes]);

  const statTiles = [
    { label: t.streak, value: `${stats.streak} 🔥`, icon: 'fa-fire', color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
    { label: t.sessions, value: stats.totalSessions, icon: 'fa-calendar-check', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
    { label: t.accuracy, value: `${derivedStats.accuracy}%`, icon: 'fa-bullseye', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: t.time, value: formatTime(attempts.length * 15000), icon: 'fa-clock', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
  ];

  const lastQuiz = quizzes.find(q => q.id === lastQuizId);
  const lastQuizSession = lastQuiz ? DB.getSession(lastQuiz.id) : null;
  const lastQuizHasSession = lastQuiz && lastQuizSession && lastQuizSession.currentIndex >= 0 && 
    lastQuizSession.currentIndex < cards.filter(c => c.quizId === lastQuiz.id).length;

  const handleContinueAction = (e: React.MouseEvent, reset: boolean) => {
    e.stopPropagation();
    if (lastQuiz) {
      console.log(`[Dashboard] Clicked ${reset ? 'Restart' : 'Resume'} for ${lastQuiz.id}`);
      onStartQuiz(lastQuiz, reset);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-outfit dark:text-white">Bonjour! 👋</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Ready to boost your French today?</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setScreen('study')}
            className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
          >
            <i className="fa-solid fa-play mr-2"></i> {t.studyNow}
          </button>
          {isAdmin && (
            <button 
              onClick={() => setScreen('create')}
              className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <i className="fa-solid fa-plus mr-2"></i> {t.createQuiz}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statTiles.map(tile => (
          <div key={tile.label} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${tile.color}`}>
              <i className={`fa-solid ${tile.icon} text-xl`}></i>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{tile.label}</p>
            <p className="text-2xl font-bold dark:text-white">{tile.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xl font-bold font-outfit dark:text-white">{t.weakest}</h3>
          {derivedStats.quizStats.length === 0 ? (
            <div className="bg-slate-100 dark:bg-slate-900/50 p-8 rounded-2xl text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-400">{t.noQuizzes}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {derivedStats.quizStats.map(({ quiz, avg }) => {
                const session = DB.getSession(quiz.id);
                const hasSession = session && session.currentIndex >= 0 && session.currentIndex < cards.filter(c => c.quizId === quiz.id).length;
                
                return (
                  <div 
                    key={quiz.id}
                    onClick={() => onStartQuiz(quiz, false)} // Default to resume if clicked
                    className="group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-900 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center relative">
                        <i className="fa-solid fa-microphone text-slate-400"></i>
                        {hasSession && <div className="absolute -top-1 -right-1 h-2 w-2 bg-amber-500 rounded-full"></div>}
                      </div>
                      <div>
                        <p className="font-bold dark:text-slate-200">{quiz.name}</p>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Speak-to-Match</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${avg < 70 ? 'text-rose-500' : 'text-amber-500'}`}>{Math.round(avg)}%</p>
                      <p className="text-[10px] text-slate-400 uppercase">Accuracy</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold font-outfit dark:text-white">{t.continue}</h3>
          {lastQuiz ? (
            <div 
              className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100 dark:shadow-none flex flex-col justify-between"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
                  {lastQuizHasSession ? 'Resume Session' : 'Jump Back In'}
                </p>
                <h4 className="text-xl font-bold mb-4">{lastQuiz.name}</h4>
              </div>
              
              {lastQuizHasSession ? (
                 <div className="flex gap-2 mt-2">
                    <button 
                      onClick={(e) => handleContinueAction(e, false)}
                      className="flex-1 py-2 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors text-sm"
                    >
                      Resume
                    </button>
                    <button 
                      onClick={(e) => handleContinueAction(e, true)}
                      className="px-3 py-2 bg-indigo-700 text-white font-bold rounded-lg hover:bg-indigo-800 transition-colors text-sm"
                    >
                      Restart
                    </button>
                 </div>
              ) : (
                <button 
                  onClick={() => onStartQuiz(lastQuiz, true)}
                  className="flex items-center justify-between w-full hover:bg-indigo-500/50 p-2 rounded-lg -mx-2 transition-colors"
                >
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">Speak-to-Match</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-400 italic">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
