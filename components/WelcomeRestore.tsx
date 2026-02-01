
import React from 'react';
import { DB } from '../db';

interface WelcomeRestoreProps {
  isAdmin: boolean;
  onLogin: () => void;
}

const WelcomeRestore: React.FC<WelcomeRestoreProps> = ({ isAdmin, onLogin }) => {
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => DB.importAll(re.target?.result as string);
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-700">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold font-outfit text-indigo-900 dark:text-white mb-4">Welcome to Hikari</h2>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          No local data found. This might be your first time here, or your sandbox environment was reset.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-3xl p-8 text-center space-y-6">
        <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
          <i className="fa-solid fa-cloud-arrow-up"></i>
        </div>
        
        <div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Have a backup?</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            Restore your quizzes, progress, and settings instantly from your JSON backup file.
          </p>
        </div>

        {isAdmin ? (
          <label className="inline-block">
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            <div className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all cursor-pointer">
              <i className="fa-solid fa-upload mr-2"></i> Import Backup
            </div>
          </label>
        ) : (
          <button 
            onClick={onLogin}
            className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <i className="fa-solid fa-lock mr-2"></i> Admin Login Required to Import
          </button>
        )}
      </div>

      <div className="mt-12 text-center">
        <p className="text-slate-400 text-sm mb-4">New here?</p>
        {!isAdmin ? (
            <p className="text-indigo-600 dark:text-indigo-400 font-bold">
               Ask your teacher to set up a quiz!
            </p>
        ) : (
            <button 
            onClick={() => window.location.reload()} 
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
            Create your first quiz via the menu <i className="fa-solid fa-arrow-right ml-1"></i>
            </button>
        )}
      </div>
    </div>
  );
};

export default WelcomeRestore;
