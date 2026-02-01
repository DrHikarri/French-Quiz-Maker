
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
  type?: 'default' | 'danger' | 'warning';
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, children, onClose, actions, type = 'default' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className={`text-xl font-bold font-outfit ${type === 'danger' ? 'text-rose-600' : 'dark:text-white'}`}>
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {children}
        </div>

        <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3 justify-end">
          {actions || (
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
