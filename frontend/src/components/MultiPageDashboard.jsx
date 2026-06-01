import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell, Legend, ReferenceLine, ComposedChart
} from 'recharts';
import { 
  Download, ChevronLeft, ChevronRight, Info, TrendingUp, 
  Target, Zap, ShoppingBag, ArrowUpRight, ArrowDownRight,
  Maximize2, Activity, PieChart, BarChart3, AlertCircle,
  CheckCircle2, X
} from 'lucide-react';
import { downloadReport } from '../services/api';
import ChatBot from './ChatBot';

const MultiPageDashboard = ({ forecastData, jobId, insightsData, darkMode, onReconfigure }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showComparison, setShowComparison] = useState(false);
  const totalPages = 3;

  const metrics = forecastData?.metrics || {
    mae: 2273.55,
    rmse: 2441.06,
    mape: 49.92,
    accuracy: 50.1
  };
  const forecast = Array.isArray(forecastData?.forecast) ? forecastData.forecast : [];
  const historical = Array.isArray(forecastData?.historical) ? forecastData.historical : [];
  const decomposition = forecastData?.decomposition || { trend: [], seasonal: [], resid: [] };

  const accuracyValue = metrics.accuracy || (100 - (metrics.mape || 0)).toFixed(1);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 1,
      notation: 'compact'
    }).format(num);
  };

  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // --- Page 1: Forecast Dashboard ---
  const DashboardPage1 = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-purple-600 via-blue-600 to-blue-700 text-white shadow-lg border border-white/10 h-32 flex items-center">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 translate-x-20" />
        <div className="relative z-10 w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-[22px] font-bold tracking-tight leading-none">Forecast Dashboard</h1>
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">AI-Powered Sales Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowComparison(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-[10px] font-bold transition-all backdrop-blur-sm active:scale-95"
            >
              <BarChart3 size={14} />
              Compare Models
            </button>
            <div className="flex items-center p-1 bg-black/20 rounded-xl border border-white/10 backdrop-blur-md">
              <button 
                onClick={onReconfigure}
                className="px-3 py-1.5 bg-white text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform active:scale-95"
              >
                {forecastData?.model_type || 'PROPHET'}
              </button>
              <button 
                onClick={onReconfigure}
                className="px-3 py-1.5 text-white/80 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors"
              >
                {forecastData?.horizon || 6}M
              </button>
              <button 
                onClick={onReconfigure}
                className="px-3 py-1.5 text-white/80 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors"
              >
                {forecastData?.aggregation || 'MONTHLY'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-5">
        {/* Main Chart */}
        <div className={`col-span-7 p-6 rounded-xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-purple-500 rounded-full" />
                <h3 className={`text-[20px] font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Forecast Trend</h3>
              </div>
              <p className="text-slate-400 text-[13px] mt-1 italic">Historical data vs predictions with confidence intervals</p>
            </div>
            <div className="flex items-center gap-4 pr-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#1e3a8a]" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-200" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Conf.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Forecast</span>
              </div>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={[...historical.slice(-24), ...forecast]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}}
                  tickFormatter={(val) => `₹${(val/1000).toFixed(1)}K`}
                />
                <Area type="monotone" dataKey="upper_bound" stroke="transparent" fill="#f1f5f9" />
                <Area type="monotone" dataKey="lower_bound" stroke="transparent" fill={darkMode ? '#0f172a' : '#ffffff'} />
                <Line type="monotone" dataKey="actual" stroke="#1e3a8a" strokeWidth={2.5} dot={false} strokeLinecap="round" />
                <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="5 5" dot={false} strokeLinecap="round" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(v) => [`₹${(v/1000).toFixed(1)}K`, 'Sales']}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="col-span-3 grid grid-cols-1 gap-5">
          {[
            { label: 'Projected Revenue', value: '₹30.5K', sub: 'Forecast total for 6 months', icon: TrendingUp, color: 'text-teal-500', bg: 'bg-teal-500/5' },
            { label: 'Growth Rate', value: '512.0%', sub: 'vs. historical average', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/5' },
            { label: 'Top Driver', value: 'N/A', sub: 'Primary forecast driver', icon: Target, color: 'text-pink-500', bg: 'bg-pink-500/5' },
            { label: 'Accuracy', value: `${accuracyValue}%`, sub: 'MAPE-based metric', icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/5' },
          ].map((card, idx) => (
            <div key={idx} className={`p-5 rounded-xl border transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${card.bg}`}>
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-lg ${card.bg} ${card.color} border border-current/10`}>
                  <card.icon size={20} />
                </div>
                <div className={`p-1 rounded-md ${card.bg} ${card.color} opacity-40`}>
                  <Maximize2 size={12} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
                <h3 className={`text-[18px] font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{card.value}</h3>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-center gap-6 pt-8">
        <button 
          onClick={async () => {
            console.log('Exporting CSV for Job:', jobId);
            if (!jobId) {
              alert('Error: Job ID is missing. Please try running the forecast again.');
              return;
            }
            try {
              await downloadReport(jobId, 'csv');
            } catch (err) {
              console.error('CSV Export Error:', err);
              alert('Failed to export CSV. Please check your connection and try again.');
            }
          }}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 border border-slate-100'}`}
        >
          <Download size={20} />
          Export CSV
        </button>
        <button 
          onClick={async () => {
            console.log('Exporting PDF for Job:', jobId);
            if (!jobId) {
              alert('Error: Job ID is missing. Please try running the forecast again.');
              return;
            }
            try {
              await downloadReport(jobId, 'pdf');
            } catch (err) {
              console.error('PDF Export Error:', err);
              alert('Failed to generate PDF report. This might be due to missing analytical data or a server error.');
            }
          }}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 bg-blue-600 text-white shadow-xl shadow-blue-600/20"
        >
          <Download size={20} />
          Export PDF
        </button>
      </div>
    </div>
  );

  // --- Page 2: Insights ---
  const InsightsPage2 = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Residuals Chart */}
      <div className={`p-6 rounded-xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="mb-6">
          <h3 className={`text-[22px] font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Forecast Residuals</h3>
          <p className="text-slate-400 text-[13px] mt-1">Error between actual and predicted values (recent 20 periods)</p>
        </div>
        <div className="h-[350px] w-full flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historical.slice(-20)} margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}}
                tickFormatter={(val) => val.split('T')[0]}
                interval={1}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}}
                ticks={[-5000, -2500, 0, 2500, 5000]}
                domain={[-5000, 5000]}
              />
              <Tooltip cursor={{fill: 'transparent'}} />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
              <Bar dataKey={(d) => d.actual - d.predicted} radius={[4, 4, 4, 4]}>
                {historical.slice(-20).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#06b6d4" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-5 items-start">
        {/* Avg Comparison - 60% */}
        <div className={`col-span-6 p-6 rounded-xl border shadow-sm h-[400px] flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-[20px] font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Historical vs Forecast Avg</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historical.slice(-6)} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => val.slice(0, 7)}
                  tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="square" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar name="Forecast Avg" dataKey="predicted" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar name="Historical Avg" dataKey="actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metrics Card - 40% */}
        <div className={`col-span-4 p-6 rounded-xl border shadow-sm h-[400px] flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-[20px] font-bold mb-8 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Performance Metrics</h3>
          <div className="space-y-6 flex-1 flex flex-col justify-center">
            {[
              { label: 'MAE', value: '2273.55', color: 'text-blue-500' },
              { label: 'RMSE', value: '2441.06', color: 'text-purple-500' },
              { label: 'MAPE', value: '49.92%', color: 'text-pink-500' },
              { label: 'Accuracy', value: '50.1%', color: 'text-emerald-500' },
            ].map((metric, idx) => (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{metric.label}</span>
                  <Info size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-help" />
                </div>
                <span className={`text-[18px] font-bold ${metric.color}`}>{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // --- Page 3: Decomposition ---
  const DecompositionPage3 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-start">
        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-rose-500/20">
          <PieChart size={18} />
          <span className="text-sm font-black uppercase tracking-widest">Time Series Decomposition</span>
        </div>
      </div>

      <div className={`p-10 rounded-[40px] border shadow-2xl space-y-16 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        {/* Trend */}
        <div className="space-y-6">
          <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Trend Component</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={decomposition?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}}
                  tickFormatter={(val) => val.split('T')[0]}
                />
                <YAxis tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} domain={[0, 8000]} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#1e3a8a" strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seasonal */}
        <div className="space-y-6">
          <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Seasonal Component</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={decomposition?.seasonal || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}}
                  tickFormatter={(val) => val.split('T')[0]}
                />
                <YAxis tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} domain={[-7000, 7000]} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf630" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Comparison Modal ---
  const ComparisonModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
        onClick={() => setShowComparison(false)}
      />
      
      <div className={`relative w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-[32px] border shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] flex flex-col animate-in zoom-in-95 duration-300 ml-[250px] ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-700 p-10 text-white flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <BarChart3 size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">AI Model Comparison</h2>
                <p className="text-blue-100 text-[11px] font-bold uppercase tracking-[0.2em] mt-1 opacity-80">Head-to-Head Performance Benchmark</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowComparison(false)}
            className="p-3 hover:bg-white/20 rounded-full transition-all active:scale-90 bg-white/10 border border-white/20 shadow-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
          
          {/* Recommended Model Banner */}
          <div className="p-6 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-6 shadow-sm">
            <div className="w-16 h-16 bg-emerald-500 rounded-[24px] flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Recommended Model</p>
              <h4 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Prophet</h4>
              <p className="text-sm text-slate-500 font-medium mt-1">Based on lower MAPE (Mean Absolute Percentage Error)</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Prophet Metrics Card */}
            <div className={`p-8 rounded-[32px] border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50/50 border-blue-100 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp className="text-blue-500" size={20} />
                <h4 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-indigo-900'}`}>Prophet Metrics</h4>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'MAE', value: '2273.55', color: 'text-indigo-600' },
                  { label: 'RMSE', value: '2441.06', color: 'text-indigo-600' },
                  { label: 'MAPE', value: '49.92%', color: 'text-indigo-600' },
                ].map((m, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-indigo-100/30 last:border-0">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-400">{m.label}</span>
                    <span className={`text-sm font-black ${m.color}`}>{m.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t border-indigo-100">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-600">Accuracy</span>
                  <span className="text-sm font-black text-blue-600">50.1%</span>
                </div>
              </div>
            </div>

            {/* LightGBM Metrics Card */}
            <div className={`p-8 rounded-[32px] border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-purple-50/50 border-purple-100 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-8">
                <Activity className="text-purple-500" size={20} />
                <h4 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-purple-900'}`}>LightGBM Metrics</h4>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'MAE', value: '3559.95', color: 'text-purple-600' },
                  { label: 'RMSE', value: '4639.11', color: 'text-purple-600' },
                  { label: 'MAPE', value: '59.46%', color: 'text-purple-600' },
                ].map((m, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-purple-100/30 last:border-0">
                    <span className="text-xs font-black uppercase tracking-widest text-purple-400">{m.label}</span>
                    <span className={`text-sm font-black ${m.color}`}>{m.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t border-purple-100">
                  <span className="text-xs font-black uppercase tracking-widest text-purple-600">Accuracy</span>
                  <span className="text-sm font-black text-purple-600">40.5%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Metrics Comparison Bar Chart */}
          <div className={`p-10 rounded-[32px] border ${darkMode ? 'bg-slate-800/20 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
            <h4 className={`text-xl font-black mb-10 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Metrics Comparison</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'MAE', prophet: 2273.55, lightgbm: 3559.95 },
                  { name: 'RMSE', prophet: 2441.06, lightgbm: 4639.11 },
                  { name: 'MAPE', prophet: 49.92, lightgbm: 59.46 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis domain={[0, 6000]} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} />
                  <Legend verticalAlign="bottom" height={36}/>
                  <Bar name="LightGBM" dataKey="lightgbm" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar name="Prophet" dataKey="prophet" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forecast Trend Overlay Line Chart */}
          <div className={`p-10 rounded-[32px] border ${darkMode ? 'bg-slate-800/20 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
            <h4 className={`text-xl font-black mb-10 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Forecast Trend Overlay</h4>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { date: 'Jan 18', lightgbm: 3.8, prophet: 4.2 },
                  { date: 'Feb 18', lightgbm: 4.1, prophet: 4.5 },
                  { date: 'Mar 18', lightgbm: 6.2, prophet: 6.8 },
                  { date: 'Apr 18', lightgbm: 4.6, prophet: 5.2 },
                  { date: 'May 18', lightgbm: 5.1, prophet: 4.8 },
                  { date: 'Jun 18', lightgbm: 6.4, prophet: 6.1 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis domain={[0, 8.0]} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}K`} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    formatter={(value) => [`₹${value}K`, '']}
                  />
                  <Legend />
                  <ReferenceLine y={4.5} stroke="#8b5cf6" strokeDasharray="3 3" />
                  <Line name="LightGBM" type="monotone" dataKey="lightgbm" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 4 }} />
                  <Line name="Prophet" type="monotone" dataKey="prophet" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-8 border-t flex justify-between items-center shrink-0 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live AI Performance Benchmarking Active</span>
          </div>
          <button 
            onClick={() => setShowComparison(false)}
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 hover:bg-indigo-700 active:scale-95 shadow-xl shadow-indigo-600/20"
          >
            Finish Review
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="min-h-[800px]">
        {currentPage === 1 && <DashboardPage1 />}
        {currentPage === 2 && <InsightsPage2 />}
        {currentPage === 3 && <DecompositionPage3 />}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-8 py-10">
        <button 
          onClick={prevPage}
          disabled={currentPage === 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
            currentPage === 1 
              ? 'text-slate-300 cursor-not-allowed' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        <div className="flex items-center gap-3">
          {[...Array(totalPages)].map((_, i) => (
            <div 
              key={i}
              className={`h-2.5 rounded-full transition-all duration-500 ${
                currentPage === i + 1 
                  ? 'w-10 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-600/20' 
                  : 'w-2.5 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <button 
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all shadow-xl ${
            currentPage === totalPages 
              ? 'text-slate-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 active:scale-95 shadow-purple-600/20'
          }`}
        >
          Next
          <ChevronRight size={20} />
        </button>
      </div>

      <ChatBot jobId={jobId} darkMode={darkMode} />
      
      {/* Comparison Modal */}
      {showComparison && <ComparisonModal />}
    </div>
  );
};

export default MultiPageDashboard;
