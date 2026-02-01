
import React, { useState } from 'react';
import { Quiz, Card } from '../types';

interface CreateQuizProps {
  onCreate: (q: Quiz, cards: Card[]) => void;
  t: any;
}

const CreateQuiz: React.FC<CreateQuizProps> = ({ onCreate, t }) => {
  const [name, setName] = useState('');
  const [lang, setLang] = useState('fr-FR');
  const [goalScore, setGoalScore] = useState(80);
  const [items, setItems] = useState<{ id: string; target: string; accepted: string; image: string }[]>([
    { id: '1', target: '', accepted: '', image: 'https://picsum.photos/400/300?random=1' }
  ]);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), target: '', accepted: '', image: `https://picsum.photos/400/300?random=${items.length + 1}` }]);
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, image: reader.result as string } : item));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || items.some(i => !i.target)) return alert('Please fill quiz name and all target sentences.');

    const quizId = Date.now().toString();
    const newQuiz: Quiz = {
      id: quizId,
      name,
      templateId: 'speak-to-match',
      createdAt: Date.now(),
      settings: { language: lang, goalScore, shuffle: true }
    };

    const newCards: Card[] = items.map(item => ({
      id: item.id,
      quizId,
      image: item.image,
      targetSentence: item.target,
      acceptedSentences: item.accepted.split(',').map(s => s.trim()).filter(s => !!s)
    }));

    onCreate(newQuiz, newCards);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold font-outfit dark:text-white">{t.createQuiz}</h2>
        <p className="text-slate-500">Template: Speak-to-Match (Image Describing)</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Quiz Name</label>
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
                <option value="fr-CA">French (Canada)</option>
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
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold dark:text-white">Cards ({items.length})</h3>
            <button type="button" onClick={addItem} className="text-indigo-600 font-bold hover:underline">
              <i className="fa-solid fa-plus mr-1"></i> Add Card
            </button>
          </div>

          {items.map((item, idx) => (
            <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative group">
                  <img src={item.image} alt="Preview" className="w-full h-full object-cover" />
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(item.id, e)} />
                    <span className="text-sm font-bold">Change Image</span>
                  </label>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Sentence</label>
                  <input 
                    type="text" 
                    value={item.target}
                    onChange={e => setItems(prev => prev.map(p => p.id === item.id ? { ...p, target: e.target.value } : p))}
                    placeholder="Le chat est sur la table."
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Accepted Variants (comma separated)</label>
                  <input 
                    type="text" 
                    value={item.accepted}
                    onChange={e => setItems(prev => prev.map(p => p.id === item.id ? { ...p, accepted: e.target.value } : p))}
                    placeholder="Un chat est sur la table, Le chat sur la table"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-8">
          <button 
            type="submit" 
            className="px-12 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transform hover:-translate-y-1 transition-all"
          >
            Create Quiz
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuiz;
