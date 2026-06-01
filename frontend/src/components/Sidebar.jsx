import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Lightbulb, 
  UploadCloud, 
  FileText, 
  RotateCcw,
  Zap,
  User,
  MessageCircle
} from 'lucide-react';

const Sidebar = ({ currentStep, onStepClick, onReset, darkMode }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'upload', label: 'Upload Data', icon: UploadCloud },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'chatbot', label: 'AI Chatbot', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-screen w-[250px] flex flex-col border-r z-50 transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#0f172a] border-slate-800'
    }`}>
      {/* Branding */}
      <div className="p-6 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Zap size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-white font-black text-lg leading-tight tracking-tight">AI Forecaster</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Sales Analytics</p>
          </div>
        </div>
      </div>

      {/* Start Over Button */}
      <div className="px-4 mb-6">
        <button 
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#f97316] hover:bg-orange-600 text-white rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-500/20"
        >
          <RotateCcw size={18} />
          Start Over
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onStepClick(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentStep === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={currentStep === item.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </div>
            {currentStep === item.id && (
              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
          </button>
        ))}
      </nav>

      {/* Version Tag Pinned to Bottom */}
      <div className="p-6 mt-auto">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest text-center border-t border-slate-800 pt-4">
          AI Sales Forecaster V1.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

