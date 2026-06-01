import { BarChart3, Moon, Sun, LogOut, User, Zap } from 'lucide-react';

function Header({ currentStep, darkMode, onToggleDarkMode, user, onLogout, onProfileClick }) {
  const steps = [
    { id: 'upload', label: 'UPLOAD' },
    { id: 'preview', label: 'PREVIEW' },
    { id: 'config', label: 'CONFIGURE' },
    { id: 'dashboard', label: 'DASHBOARD' },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <header className="bg-gradient-to-r from-purple-700 via-blue-600 to-blue-700 text-white shadow-xl sticky top-0 z-40 h-16 flex items-center w-full">
      <div className="w-full px-8">
        <div className="flex items-center justify-between h-full">
          {/* Left: App Name */}
          <div className="flex items-center gap-4 min-w-[300px]">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/20">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">AI Sales Forecaster</h1>
              <p className="text-[9px] font-bold text-blue-100 uppercase tracking-widest mt-0.5">Business Insight Generator</p>
            </div>
          </div>
          
          {/* Center: Step Indicators */}
          <nav className="flex-1 flex justify-center items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all duration-300 border
                  ${index <= currentIndex 
                    ? 'bg-white text-blue-600 border-white shadow-lg shadow-white/10' 
                    : 'bg-white/5 text-blue-100 border-white/10'}
                `}>
                  {step.label}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-[1px] mx-1 transition-all duration-500 ${index < currentIndex ? 'bg-white' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </nav>

          {/* Right: Controls */}
          <div className="flex items-center gap-4 min-w-[300px] justify-end">
            <button
              onClick={onToggleDarkMode}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all hover:scale-105 active:scale-95 border border-white/10"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun size={18} className="text-yellow-300" />
              ) : (
                <Moon size={18} className="text-white" />
              )}
            </button>

            {user && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={onProfileClick}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900/30 hover:bg-slate-900/50 rounded-xl border border-white/10 transition-all group"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center border border-white/20 overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-black">{user.displayName?.charAt(0) || 'P'}</span>
                    )}
                  </div>
                  <span className="text-xs font-black hidden lg:block tracking-wide">{user.displayName || 'Prudhvi raj B'}</span>
                </button>
                
                <button
                  onClick={onLogout}
                  className="p-2 bg-white/10 hover:bg-rose-500/80 rounded-xl transition-all group border border-white/10"
                  title="Logout"
                >
                  <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

