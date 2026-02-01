
import React, { useState } from 'react';
import { Settings } from '../types';
import { DB } from '../db';
import Modal from './Modal';

interface SettingsProps {
  settings: Settings;
  setSettings: (s: Settings) => void;
  t: any;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsProps> = ({ settings, setSettings, t, onLogout }) => {
  const [showExportWarning, setShowExportWarning] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<string | null>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => DB.importAll(re.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleExportClick = () => {
    const { json, sizeBytes } = DB.generateBackup();
    const sizeMB = sizeBytes / (1024 * 1024);
    
    if (sizeMB > 10) {
      setPendingBackup(json);
      setShowExportWarning(true);
    } else {
      DB.downloadBackup(json);
    }
  };

  const confirmExport = () => {
    if (pendingBackup) {
      DB.downloadBackup(pendingBackup);
      setPendingBackup(null);
      setShowExportWarning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold font-outfit dark:text-white">{t.settings}</h2>
        <button 
          onClick={onLogout}
          className="px-4 py-2 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 font-bold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors text-sm"
        >
          <i className="fa-solid fa-right-from-bracket mr-2"></i> Log Out
        </button>
      </div>

      <section className="space-y-6">
        <h3 className="text-xl font-bold font-outfit dark:text-white">Preferences</h3>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          
          {/* Language Selector */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-medium dark:text-slate-200">Interface Language</span>
            <select 
              value={settings.uiLanguage}
              onChange={e => setSettings({ ...settings, uiLanguage: e.target.value as any })}
              className="bg-slate-100 dark:bg-slate-800 dark:text-white px-3 py-1 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-bold font-outfit dark:text-white">Data Management</h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleExportClick}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
          >
            <i className="fa-solid fa-download text-2xl text-indigo-500 mb-3 group-hover:scale-110 transition-transform"></i>
            <p className="font-bold dark:text-white">{t.export}</p>
            <p className="text-xs text-slate-500">Download .json backup</p>
          </button>
          <label className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer">
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            <i className="fa-solid fa-upload text-2xl text-amber-500 mb-3 group-hover:scale-110 transition-transform"></i>
            <p className="font-bold dark:text-white">{t.import}</p>
            <p className="text-xs text-slate-500">Upload .json backup</p>
          </label>
        </div>
      </section>

      {/* Export Size Warning Modal */}
      <Modal
        isOpen={showExportWarning}
        onClose={() => { setShowExportWarning(false); setPendingBackup(null); }}
        title="Large Backup File"
        type="warning"
        actions={(
          <>
            <button 
              onClick={() => { setShowExportWarning(false); setPendingBackup(null); }}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200"
            >
              Cancel
            </button>
            <button 
              onClick={confirmExport}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
            >
              Download Anyway
            </button>
          </>
        )}
      >
        <div className="space-y-4">
           <p className="text-slate-600 dark:text-slate-300">
             This backup contains embedded images and audio, resulting in a large file size (over 10MB).
           </p>
           <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
             <strong>Note:</strong> We store images as Base64 text to ensure your quizzes work offline and after imports. This increases file size by ~33% compared to raw files.
           </p>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsView;
