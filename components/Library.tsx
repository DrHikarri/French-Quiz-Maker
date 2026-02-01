
import React from 'react';
import { Quiz, Card } from '../types';
import { DB } from '../db';

interface LibraryProps {
  quizzes: Quiz[];
  cards: Card[];
  onDelete: (id: string) => void;
  onEdit: (q: Quiz) => void;
  onPlay: (q: Quiz, reset?: boolean) => void;
  t: any;
  mode?: 'study' | 'manage';
  isAdmin: boolean;
}

const Library: React.FC<LibraryProps> = ({ quizzes, cards, onDelete, onEdit, onPlay, t, mode = 'manage', isAdmin }) => {
  
  const handlePlayAction = (e: React.MouseEvent, quiz: Quiz, reset: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`[Library] Clicked ${reset ? 'Restart' : 'Resume'} for ${quiz.id}`);
    onPlay(quiz, reset);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold font-outfit dark:text-white">
          {mode === 'study' ? t.study : t.library}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {mode === 'study' ? 'Choose a topic to practice your French' : 'Manage your custom quiz collections'}
        </p>
      </header>

      {quizzes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
          <i className="fa-solid fa-folder-open text-5xl text-slate-200 mb-4"></i>
          <p className="text-slate-500 mb-6">{t.noQuizzes}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(quiz => {
            const quizCards = cards.filter(c => c.quizId === quiz.id);
            const session = DB.getSession(quiz.id);
            const hasSession = session && session.currentIndex >= 0 && session.currentIndex < quizCards.length;
            const isPublished = quiz.status === 'published';

            return (
              <div 
                key={quiz.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center relative">
                      <i className="fa-solid fa-microphone-lines text-xl"></i>
                      {hasSession && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                      )}
                    </div>
                    {mode === 'manage' && isAdmin && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => onEdit(quiz)}
                          className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button 
                          onClick={() => onDelete(quiz.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Move to Trash"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  <h4 className="text-lg font-bold dark:text-white mb-1">{quiz.name}</h4>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                      {quizCards.length} Cards
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded">
                      {quiz.settings.language}
                    </span>
                    {isAdmin && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isPublished ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                    )}
                  </div>
                  
                  {hasSession ? (
                    <div className="flex gap-2">
                       <button 
                        onClick={(e) => handlePlayAction(e, quiz, false)}
                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1 text-sm"
                      >
                        <i className="fa-solid fa-play"></i> Resume
                      </button>
                      <button 
                        onClick={(e) => handlePlayAction(e, quiz, true)}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 text-sm"
                      >
                        <i className="fa-solid fa-rotate-left"></i> Restart
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => handlePlayAction(e, quiz, true)}
                      className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      Play Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Library;
