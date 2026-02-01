
import React, { useState } from 'react';
import { Quiz } from '../types';
import Modal from './Modal';

interface TrashViewProps {
  quizzes: Quiz[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  t: any;
}

const TrashView: React.FC<TrashViewProps> = ({ quizzes, onRestore, onPermanentDelete, t }) => {
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);

  const confirmDelete = () => {
    if (quizToDelete) {
      onPermanentDelete(quizToDelete);
      setQuizToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold font-outfit dark:text-white">{t.trash}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Items here are saved until you permanently delete them.</p>
      </header>

      {quizzes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
          <i className="fa-solid fa-trash-can text-5xl text-slate-200 mb-4"></i>
          <p className="text-slate-500">Trash is empty.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map(quiz => (
            <div 
              key={quiz.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
            >
              <div>
                <h4 className="text-lg font-bold dark:text-white">{quiz.name}</h4>
                <p className="text-xs text-slate-400">Deleted on {new Date(quiz.deletedAt || Date.now()).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => onRestore(quiz.id)}
                  className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                >
                  <i className="fa-solid fa-arrow-rotate-left mr-2"></i> Restore
                </button>
                <button 
                  onClick={() => setQuizToDelete(quiz.id)}
                  className="px-4 py-2 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 font-bold hover:bg-rose-100 rounded-xl transition-colors"
                >
                  <i className="fa-solid fa-trash-can mr-2"></i> Delete Permanently
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={!!quizToDelete} 
        onClose={() => setQuizToDelete(null)}
        title="Delete Forever?"
        type="danger"
        actions={(
          <>
            <button 
              onClick={() => setQuizToDelete(null)}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700"
            >
              Delete Permanently
            </button>
          </>
        )}
      >
        <p className="text-slate-600 dark:text-slate-300">
          This will wipe the quiz and all associated progress history. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default TrashView;
