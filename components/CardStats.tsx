
import React from 'react';
import { Card, Attempt } from '../types';

interface CardStatsProps {
  cards: Card[];
  attempts: Attempt[];
  t: any;
}

const CardStatsView: React.FC<CardStatsProps> = ({ cards, attempts, t }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold font-outfit dark:text-white">{t.stats}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Review performance across all flashcards</p>
      </header>

      {cards.length === 0 ? (
        <div className="text-center py-20 text-slate-400">No cards practiced yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(card => {
            const cardAttempts = attempts.filter(a => a.cardId === card.id);
            const bestCore = cardAttempts.length > 0 ? Math.max(...cardAttempts.map(a => a.coreScore)) : 0;
            const lastPracticed = cardAttempts.length > 0 ? new Date(Math.max(...cardAttempts.map(a => a.timestamp))).toLocaleDateString() : 'Never';

            return (
              <div key={card.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="h-32 bg-slate-100 overflow-hidden">
                  <img src={card.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-sm font-bold dark:text-slate-200 line-clamp-1 mb-3">"{card.targetSentence}"</p>
                  <div className="mt-auto grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <div>
                      <p>Best</p>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">{bestCore}%</p>
                    </div>
                    <div>
                      <p>Attempts</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{cardAttempts.length}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 italic border-t pt-2 border-slate-50 dark:border-slate-800">Last: {lastPracticed}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CardStatsView;
