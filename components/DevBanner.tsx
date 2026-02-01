
import React from 'react';
import { Screen } from '../types';

interface DevBannerProps {
  screen: Screen;
  activeQuizId: string | null;
  isListening: boolean;
  lastAction: string;
}

const DevBanner: React.FC<DevBannerProps> = ({ screen, activeQuizId, isListening, lastAction }) => {
  // Simple dev detection
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (!isDev) return null;

  return (
    <div className="fixed bottom-2 right-2 z-[9999] bg-black/80 text-green-400 font-mono text-[10px] p-2 rounded border border-green-800 pointer-events-none opacity-80 hover:opacity-100 transition-opacity max-w-xs">
      <div className="font-bold border-b border-green-900 mb-1 text-xs">DEV MODE</div>
      <div>View: <span className="text-white">{screen}</span></div>
      <div>Quiz: <span className="text-white">{activeQuizId || 'none'}</span></div>
      <div>Mic: <span className={isListening ? "text-red-500 font-bold animate-pulse" : "text-slate-400"}>{isListening ? 'LISTENING' : 'IDLE'}</span></div>
      <div className="mt-1 border-t border-green-900 pt-1 text-slate-300 truncate">Last: {lastAction}</div>
    </div>
  );
};

export default DevBanner;
