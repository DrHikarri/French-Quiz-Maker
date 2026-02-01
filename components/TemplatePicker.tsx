
import React from 'react';

interface TemplatePickerProps {
  onSelect: (templateId: string) => void;
  t: any;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({ onSelect, t }) => {
  const templates = [
    {
      id: 'speak-to-match',
      title: 'Flashcard image speak quiz',
      subtitle: 'Speak-to-Match (Image Describing)',
      icon: 'fa-microphone-lines',
      color: 'bg-indigo-600',
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold font-outfit dark:text-white">{t.create}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Select a template to start creating your practice material.</p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <div 
            key={template.id}
            className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => onSelect(template.id)}
          >
            <div className={`h-16 w-16 ${template.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
              <i className={`fa-solid ${template.icon} text-2xl`}></i>
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-2">{template.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{template.subtitle}</p>
            <button 
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 dark:text-white font-bold rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all z-10 relative"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(template.id);
              }}
            >
              Use template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplatePicker;
