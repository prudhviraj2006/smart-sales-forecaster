import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Percent, 
  ShieldCheck, 
  LineChart as LineChartIcon,
  PlusCircle,
  MinusCircle,
  Zap,
  Target,
  AlertTriangle,
  FileDown,
  ChevronRight,
  Sparkles,
  BarChart3,
  RefreshCw,
  Search
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  ComposedChart
} from 'recharts';
import ScenarioSimulator from './ScenarioSimulator';
import { downloadReport } from '../services/api';

const ForecastView = ({ forecastData, darkMode, jobId }) => {
  const [model, setModel] = useState('Prophet');
  const [volume, setVolume] = useState(100);
  const [price, setPrice] = useState(100);
  const [seasonality, setSeasonality] = useState(50);
  const [marketing, setMarketing] = useState(100);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!jobId) {
      alert("Error: No Job ID found. Please try again.");
      return;
    }
    
    setIsExporting(true);
    try {
      await downloadReport(jobId, 'pdf');
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please check your connection and try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Sample data for the timeline
  const timelineData = [
    { name: 'Jan', actual: 4200, forecast: 4200, upper: 4500, lower: 3900 },
    { name: 'Feb', actual: 4800, forecast: 4800, upper: 5100, lower: 4500 },
    { name: 'Mar', actual: 5100, forecast: 5100, upper: 5400, lower: 4800 },
    { name: 'Apr', forecast: 5800, upper: 6400, lower: 5200 },
    { name: 'May', forecast: 6200, upper: 7000, lower: 5400 },
    { name: 'Jun', forecast: 7100, upper: 8200, lower: 6000 },
  ];

  const formatINR = (val) => `₹${val.toLocaleString()}`;

  const kpis = [
    { label: 'Next Month Forecast', value: '₹6,200', icon: Calendar, color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { label: 'Quarter Forecast', value: '₹18,500', icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'YoY Growth', value: '18.8%', icon: Percent, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Forecast Confidence', value: '82%', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  const scenarios = [
    { name: 'Pessimistic', change: '-10%', revenue: '₹27,444', color: 'red' },
    { name: 'Realistic', change: '+18.8%', revenue: '₹36,227', color: 'blue' },
    { name: 'Optimistic', change: '+35%', revenue: '₹41,167', color: 'green' },
  ];

  const insights = [
    { 
      title: 'Best Sales Month', 
      desc: 'June 2018 is projected to be your strongest month with a 24% increase from average.',
      icon: TrendingUp,
      color: 'text-emerald-500'
    },
    { 
      title: 'Recommended Action', 
      desc: 'Increase inventory buffer for Product Category A by 15% to meet upcoming demand.',
      icon: Target,
      color: 'text-blue-500'
    },
    { 
      title: 'Demand Alert', 
      desc: 'Significant demand spike detected in the North-East region for mid-May.',
      icon: AlertTriangle,
      color: 'text-amber-500'
    }
  ];

  const RiskGauge = ({ level = 30 }) => (
    <div className="mt-4">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="h-full w-1/3 bg-green-500/30" />
          <div className="h-full w-1/3 bg-yellow-500/30" />
          <div className="h-full w-1/3 bg-red-500/30" />
        </div>
        <div 
          className="absolute top-0 h-full w-1 bg-slate-900 dark:bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-1000"
          style={{ left: `${level}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700 pb-12">
      {/* Top Header & Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-600 rounded-2xl text-white shadow-lg shadow-purple-600/20">
            <Zap size={24} />
          </div>
          <div>
            <h2 className={`text-4xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>Advanced Simulation</h2>
            <div className="flex flex-col mt-1">
              <span className="text-slate-500 font-black uppercase tracking-widest text-[10px] opacity-70">INTERACTIVE SENSITIVITY ENGINE</span>
              <span className="text-purple-600 font-black uppercase tracking-[0.2em] text-[11px] mt-0.5">Sales Scenario Simulator</span>
            </div>
          </div>
        </div>

        <div className={`p-1 rounded-xl flex gap-1 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          {['Prophet', 'LightGBM'].map((m) => (
            <button
              key={m}
              onClick={() => setModel(m)}
              className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${
                model === m 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className={`p-6 rounded-3xl border transition-all hover:scale-[1.02] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${kpi.bg}`}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </div>
            <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{kpi.value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column (7/12) */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          {/* Main Chart */}
          <div className={`p-8 rounded-[40px] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <LineChartIcon className="text-purple-500" size={24} />
                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>6-Month Forecast Timeline</h3>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-blue-600" /> Actual</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-purple-500 border-t border-dashed" /> Forecast</div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: darkMode ? '#0f172a' : '#fff' }}
                  />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="#a855f7" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#a855f7" fillOpacity={0.1} />
                  <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
                  <Line type="monotone" dataKey="forecast" stroke="#a855f7" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#a855f7' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scenario Comparison */}
          <div className="space-y-4">
            <h3 className={`text-lg font-black tracking-tight flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <RefreshCw size={20} className="text-blue-500" />
              Scenario Comparison
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {scenarios.map((s, i) => (
                <div key={i} className={`p-6 rounded-3xl border ${
                  s.color === 'red' ? 'bg-red-500/5 border-red-500/20' : 
                  s.color === 'blue' ? 'bg-blue-500/5 border-blue-500/20' : 
                  'bg-emerald-500/5 border-emerald-500/20'
                }`}>
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                    s.color === 'red' ? 'text-red-500' : s.color === 'blue' ? 'text-blue-500' : 'text-emerald-500'
                  }`}>{s.name}</div>
                  <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{s.revenue}</div>
                  <div className={`text-xs font-bold mt-1 ${s.color === 'red' ? 'text-red-400' : s.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`}>{s.change}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-8 rounded-[40px] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
            <ScenarioSimulator jobId={jobId} darkMode={darkMode} onClose={() => {}} />
          </div>
        </div>

        {/* Right Column (5/12) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
          <div className={`p-8 rounded-[40px] border flex-1 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
            <div className="flex items-center gap-3 mb-10">
              <Sparkles className="text-amber-500" size={24} />
              <h3 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Strategic Insights</h3>
            </div>
            
            <div className="space-y-6">
              {insights.map((ins, i) => (
                <div key={i} className={`p-6 rounded-3xl border transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm ${ins.color}`}>
                      <ins.icon size={24} />
                    </div>
                    <div>
                      <h4 className={`text-lg font-black leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{ins.title}</h4>
                      <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">{ins.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-8 rounded-[32px] bg-purple-600/5 border border-purple-600/10 relative overflow-hidden">
               <div className="flex flex-col gap-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">AI Narrative Analysis</div>
                <p className="text-sm text-slate-500 leading-relaxed font-bold italic">
                  "Based on the realistic scenario, we expect a strong rebound in consumer tech spending by mid-year. Marketing ROI is projected at 4.2x if budgets are reallocated toward regional channels."
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForecastView;
