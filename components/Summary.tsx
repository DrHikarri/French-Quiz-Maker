
import React from 'react';
import { Attempt } from '../types';
import { formatTime } from '../utils';

interface SummaryProps {
  results: {
    attempts: Attempt[];
    xpGained: number;
    timeSpent: number;
  };
  onClose: () => void;
  t: any;
}

const Summary: React.FC<SummaryProps> = ({ results, onClose, t }) => {
  const avgAccuracy = results.attempts.length > 0
    ? Math.round(results.attempts.reduce((acc, curr) => acc + curr.coreScore, 0) / results.attempts.length)
    : 0;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-in zoom-in-95 duration-500">
      <div className="mb-8">
        <div className="h-24 w-24 bg-indigo-600 text-white rounded-3xl mx-auto flex items-center justify-center text-4xl mb-4 rotate-3">
          <i className="fa-solid fa-trophy"></i>
        </div>
        <h2 className="text-4xl font-black font-outfit dark:text-white">Quiz Complete!</h2>
        <p className="text-slate-500 mt-2">Magnifique ! You're making progress.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">XP Gained</p>
          <p className="text-2xl font-black text-indigo-600">+{results.xpGained}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
          <p className="text-2xl font-black text-emerald-500">{avgAccuracy}%</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Duration</p>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300">{formatTime(results.timeSpent)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <button 
          onClick={onClose}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
        >
          Return to Dashboard
        </button>
        <p className="text-slate-400 text-sm">Badge progress updated in Dashboard</p>
      </div>
    </div>
  );
};

export default Summary;
