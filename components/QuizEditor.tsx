
import React, { useState } from 'react';
import { Quiz, Card, QuizStatus } from '../types';
import Modal from './Modal';

interface QuizEditorProps {
  onSave: (q: Quiz, cards: Card[]) => void;
  onCancel: () => void;
  t: any;
  existingQuiz?: Quiz | null;
  existingCards?: Card[];
}

const QuizEditor: React.FC<QuizEditorProps> = ({ onSave, onCancel, t, existingQuiz, existingCards }) => {
  const [name, setName] = useState(existingQuiz?.name || '');
  const [lang, setLang] = useState(existingQuiz?.settings.language || 'fr-FR');
  const [goalScore, setGoalScore] = useState(existingQuiz?.settings.goalScore || 80);
  const [randomize, setRandomize] = useState(existingQuiz?.settings.randomize ?? false);
  const [status, setStatus] = useState<QuizStatus>(existingQuiz?.status || 'draft');

  const [items, setItems] = useState<Partial<Card>[]>(
    existingCards && existingCards.length > 0 
      ? JSON.parse(JSON.stringify(existingCards)) 
      : [{ id: 'card_' + Date.now(), targetSentence: '', acceptedSentences: [], image: 'https://picsum.photos/400/300?random=1' }]
  );

  // Modal States
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const addItem = () => {
    setItems(prev => [...prev, { 
      id: 'card_' + Date.now() + Math.random().toString(36).substr(2, 5), 
      targetSentence: '', 
      acceptedSentences: [], 
      image: `https://picsum.photos/400/300?random=${prev.length + 1}` 
    }]);
  };

  const confirmDeleteCard = () => {
    if (cardToDelete) {
      setItems(prev => prev.filter(i => i.id !== cardToDelete));
      setCardToDelete(null);
    }
  };

  const handleRemoveClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (items.length <= 1) {
      setValidationErrors(["A quiz must have at least one card."]);
      return;
    }
    setCardToDelete(id);
  };

  const handleFileUpload = (id: string, type: 'image' | 'audio', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setItems(prev => prev.map(item => item.id === id ? { 
          ...item, 
          [type === 'image' ? 'image' : 'audioOverride']: reader.result as string 
        } : item));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: string[] = [];
    if (!name.trim()) errors.push("Quiz name is required.");
    if (items.length === 0) errors.push("A quiz must have at least one card.");
    
    items.forEach((item, idx) => {
      if (!item.targetSentence?.trim()) {
        errors.push(`Card #${idx + 1}: Target sentence is required.`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const quizId = existingQuiz?.id || 'quiz_' + Date.now();
    const quiz: Quiz = {
      id: quizId,
      name,
      templateId: 'speak-to-match',
      createdAt: existingQuiz?.createdAt || Date.now(),
      isTrashed: existingQuiz?.isTrashed || false,
      deletedAt: existingQuiz?.deletedAt,
      status: status,
      settings: { language: lang, goalScore, shuffle: true, randomize }
    };

    const cards: Card[] = items.map(item => ({
      id: item.id!,
      quizId,
      image: item.image || '',
      targetSentence: item.targetSentence || '',
      acceptedSentences: Array.isArray(item.acceptedSentences) ? item.acceptedSentences : [],
      preferredModelAnswer: item.preferredModelAnswer,
      audioOverride: item.audioOverride
    }));

    onSave(quiz, cards);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-outfit dark:text-white">
            {existingQuiz ? `${t.edit}: ${name}` : t.createQuiz}
          </h2>
          <p className="text-slate-500">Template: Speak-to-Match (Image Describing)</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
      </header>
      
      {/* Sandbox Warning */}
      <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
        <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-1"></i>
        <div>
           <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Sandbox Environment</p>
           <p className="text-xs text-amber-700 dark:text-amber-500/80">
             In this preview environment, your data may be reset if the app restarts. Please export a backup from Settings frequently.
           </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Quiz Name <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Household Objects"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Language</label>
              <select 
                value={lang}
                onChange={e => setLang(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <option value="fr-FR">French (France)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Spanish (Spain)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Goal Score %</label>
              <input 
                type="number" 
                value={goalScore}
                onChange={e => setGoalScore(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 pt-2">
             <label className="flex items-center gap-3 cursor-pointer">
               <input 
                 type="checkbox" 
                 checked={randomize} 
                 onChange={e => setRandomize(e.target.checked)}
                 className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
               />
               <div>
                 <p className="text-sm font-bold dark:text-slate-200">Randomize Order</p>
                 <p className="text-xs text-slate-500">Shuffle cards for every new run</p>
               </div>
             </label>

             <label className="flex items-center gap-3 cursor-pointer">
               <input 
                 type="checkbox" 
                 checked={status === 'published'} 
                 onChange={e => setStatus(e.target.checked ? 'published' : 'draft')}
                 className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
               />
               <div>
                 <p className="text-sm font-bold dark:text-slate-200">Publish to Students</p>
                 <p className="text-xs text-slate-500">Make visible in public Study tab</p>
               </div>
             </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold dark:text-white">Cards ({items.length})</h3>
            <button type="button" onClick={addItem} className="text-indigo-600 font-bold hover:underline">
              <i className="fa-solid fa-plus mr-1"></i> Add Card
            </button>
          </div>

          {items.map((item, idx) => (
            <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 group relative">
              <button 
                type="button"
                onClick={(e) => handleRemoveClick(item.id!, e)}
                className="absolute -top-3 -right-3 h-8 w-8 bg-rose-500 text-white rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg z-10 cursor-pointer hover:bg-rose-600"
                title="Delete Card"
              >
                <i className="fa-solid fa-trash-can text-xs pointer-events-none"></i>
              </button>

              <div className="w-full md:w-1/3 space-y-4">
                <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative group/img">
                  <img src={item.image} alt="Preview" className="w-full h-full object-contain" />
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(item.id!, 'image', e)} />
                    <span className="text-sm font-bold">Change Image</span>
                  </label>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Audio Overide (Optional)</p>
                   {item.audioOverride ? (
                     <div className="flex items-center gap-2">
                       <i className="fa-solid fa-circle-check text-emerald-500"></i>
                       <span className="text-xs text-slate-500 truncate">Audio uploaded</span>
                       <button type="button" onClick={() => setItems(prev => prev.map(p => p.id === item.id ? { ...p, audioOverride: undefined } : p))} className="ml-auto text-rose-500 text-xs">Clear</button>
                     </div>
                   ) : (
                     <label className="text-xs text-indigo-600 font-bold cursor-pointer hover:underline">
                       <input type="file" className="hidden" accept="audio/*" onChange={e => handleFileUpload(item.id!, 'audio', e)} />
                       <i className="fa-solid fa-upload mr-1"></i> Upload MP3/WAV
                     </label>
                   )}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Sentence <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={item.targetSentence}
                    onChange={e => setItems(prev => prev.map(p => p.id === item.id ? { ...p, targetSentence: e.target.value } : p))}
                    placeholder="Le chat est sur la table."
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Variants (comma separated)</label>
                  <input 
                    type="text" 
                    value={item.acceptedSentences?.join(', ') || ''}
                    onChange={e => setItems(prev => prev.map(p => p.id === item.id ? { ...p, acceptedSentences: e.target.value.split(',').map(s => s.trim()).filter(s => !!s) } : p))}
                    placeholder="Un chat est sur la table, Le chat sur la table"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Preferred Model (for labels/TTS)</label>
                  <input 
                    type="text" 
                    value={item.preferredModelAnswer || ''}
                    onChange={e => setItems(prev => prev.map(p => p.id === item.id ? { ...p, preferredModelAnswer: e.target.value } : p))}
                    placeholder="Optimal answer text"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onCancel} className="px-8 py-4 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
          <button 
            type="submit" 
            className="px-12 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transform hover:-translate-y-1 transition-all"
          >
            {existingQuiz ? 'Save Changes' : 'Create Quiz'}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!cardToDelete} 
        onClose={() => setCardToDelete(null)}
        title="Delete Card"
        type="danger"
        actions={(
          <>
            <button 
              onClick={() => setCardToDelete(null)}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDeleteCard}
              className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700"
            >
              Delete Permanently
            </button>
          </>
        )}
      >
        <p className="text-slate-600 dark:text-slate-300">
          Are you sure you want to delete this card? This action cannot be undone.
        </p>
      </Modal>

      {/* Validation Error Modal */}
      <Modal 
        isOpen={validationErrors.length > 0} 
        onClose={() => setValidationErrors([])}
        title="Please Fix Errors"
        type="warning"
      >
        <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
          {validationErrors.map((err, i) => (
            <li key={i} className="text-sm">{err}</li>
          ))}
        </ul>
      </Modal>
    </div>
  );
};

export default QuizEditor;
