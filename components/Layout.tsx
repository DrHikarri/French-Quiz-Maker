
import React from 'react';
import { Screen, UserStats } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  screen: Screen;
  setScreen: (s: Screen) => void;
  stats: UserStats;
  t: any;
  isAdmin: boolean;
  onOpenAdmin: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, screen, setScreen, stats, t, isAdmin, onOpenAdmin }) => {
  // Public Menu
  const publicItems = [
    { id: 'dashboard', icon: 'fa-house', label: t.dashboard },
    { id: 'study', icon: 'fa-book-open', label: t.study },
  ];

  // Admin Menu Extensions
  const adminItems = [
    { id: 'create', icon: 'fa-plus', label: t.create },
    { id: 'library', icon: 'fa-folder', label: t.library },
    { id: 'trash', icon: 'fa-trash-can', label: t.trash },
    { id: 'settings', icon: 'fa-gear', label: t.settings },
  ];

  const menuItems = isAdmin ? [...publicItems, ...adminItems] : publicItems;

  const hideNav = ['quiz-player'].includes(screen);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors">
      {!hideNav && (
        <>
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen overflow-y-auto">
            <div className="p-6">
              <h1 className="text-xl font-bold font-outfit text-indigo-600 dark:text-indigo-400">Hikari French Practice</h1>
              <div className="mt-6">
                <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    {stats.level}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider truncate">{t.levelLabel} {stats.level}</p>
                    <p className="text-sm font-semibold dark:text-slate-200 truncate">{stats.xp} {t.xpLabel}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <nav className="flex-1 px-4 space-y-1 mt-2 mb-4">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setScreen(item.id as Screen)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    screen === item.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <i className={`fa-solid ${item.icon} text-lg w-6 text-center`}></i>
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 mt-auto">
               {!isAdmin ? (
                 <button onClick={onOpenAdmin} className="text-[10px] text-slate-300 hover:text-indigo-400 text-center w-full">
                   Admin Access
                 </button>
               ) : (
                 <div className="text-[10px] text-emerald-500 text-center w-full font-bold">
                   <i className="fa-solid fa-lock-open mr-1"></i> Admin Unlocked
                 </div>
               )}
            </div>
          </aside>

          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[60]">
            <h1 className="text-xl font-bold font-outfit text-indigo-600">Hikari French Practice</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold dark:text-slate-300">Lvl {stats.level}</span>
              <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600" style={{ width: `${(stats.xp % 100)}%` }}></div>
              </div>
            </div>
          </header>

          {/* Mobile Bottom Nav */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around p-1 z-50 overflow-x-auto scrollbar-hide">
            {menuItems.slice(0, 5).map(item => ( // Show first 5 on mobile bottom nav
              <button
                key={item.id}
                onClick={() => setScreen(item.id as Screen)}
                className={`flex flex-col items-center p-2 rounded-lg min-w-[64px] ${
                  screen === item.id ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <i className={`fa-solid ${item.icon} text-lg`}></i>
                <span className="text-[10px] mt-1 font-medium whitespace-nowrap">{item.label}</span>
              </button>
            ))}
             {!isAdmin && (
                <button onClick={onOpenAdmin} className="flex flex-col items-center p-2 rounded-lg min-w-[64px] text-slate-300">
                   <i className="fa-solid fa-lock text-xs mt-1"></i>
                   <span className="text-[9px] mt-1">Admin</span>
                </button>
             )}
          </nav>
        </>
      )}

      <main className={`flex-1 overflow-auto pb-24 md:pb-8 ${hideNav ? '' : 'px-4 md:px-8 py-6'}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
