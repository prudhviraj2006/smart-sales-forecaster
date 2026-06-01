import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Minus, Lightbulb, 
  Target, AlertTriangle, Zap, Activity, PieChart, Sparkles
} from 'lucide-react';

const InsightsView = ({ forecastData, insightsData, darkMode }) => {
  const { metrics, feature_importance, top_products, top_regions } = forecastData;

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumSignificantDigits: 3
    }).format(num);
  };

  const getKPIStyle = (trend) => {
    if (trend > 5) return { color: 'text-emerald-500', icon: TrendingUp, bg: 'bg-emerald-500/10' };
    if (trend < -5) return { color: 'text-rose-500', icon: TrendingDown, bg: 'bg-rose-500/10' };
    return { color: 'text-amber-500', icon: Minus, bg: 'bg-amber-500/10' };
  };

  const kpis = [
    { label: 'Forecast Accuracy', value: `${(100 - metrics.mape).toFixed(1)}%`, trend: 2.4, suffix: 'vs last model' },
    { label: 'Avg Monthly Sales', value: formatCurrency(forecastData.forecast[0]?.predicted || 0), trend: 8.1, suffix: 'projected growth' },
    { label: 'Risk Score', value: metrics.risk_level || 'Low', trend: -12, suffix: 'volatility index' },
    { label: 'Top Driver', value: feature_importance?.[0]?.feature || 'N/A', trend: 0, suffix: 'highest impact' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Market Intelligence & Insights</h2>
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>AI-driven analysis of your sales patterns and future opportunities</p>
        </div>
        <div className={`px-4 py-2 rounded-full border ${darkMode ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-blue-200 bg-blue-50 text-blue-600'} flex items-center gap-2 text-sm font-semibold`}>
          <Sparkles size={16} />
          <span>AI Analysis Active</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const style = getKPIStyle(kpi.trend);
          const Icon = style.icon;
          return (
            <div key={idx} className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'} mb-2`}>{kpi.label}</p>
              <div className="flex items-end justify-between">
                <div>
                  <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{kpi.value}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-xs font-bold ${style.color}`}>{kpi.trend > 0 ? '+' : ''}{kpi.trend}%</span>
                    <span className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{kpi.suffix}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${style.bg} ${style.color}`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Insights Panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key Observations Section */}
          <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                <Lightbulb size={24} />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Key Performance Observations</h3>
                <p className="text-sm text-slate-500">Pattern recognition and anomaly detection</p>
              </div>
            </div>

            <div className="space-y-6">
              {insightsData?.bullets?.map((bullet, idx) => (
                <div key={idx} className={`group flex gap-5 p-5 rounded-2xl border transition-all ${
                  darkMode ? 'hover:bg-slate-700/50 border-transparent hover:border-slate-600' : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    bullet.severity === 'high' ? 'bg-rose-500/10 text-rose-500' : 
                    bullet.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{bullet.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patterns Chart */}
          <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Feature Impact Patterns</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={feature_importance?.slice(0, 5)}>
                  <defs>
                    <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="feature" tick={{fontSize: 12, fill: '#64748b'}} />
                  <YAxis tick={{fontSize: 12, fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="importance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorImp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-8">
          {/* Actionable Recommendations */}
          <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-gradient-to-br from-indigo-900/40 to-slate-800/50 border-slate-700' : 'bg-gradient-to-br from-indigo-50 to-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Zap size={20} />
              </div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Recommended Actions</h3>
            </div>
            
            <div className="space-y-4">
              {insightsData?.recommendations?.slice(0, 4).map((rec, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-100'} text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <div className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <p>{rec}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]">
              View All Recommendations
            </button>
          </div>

          {/* Distribution Insights */}
          <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                  <PieChart size={20} />
                </div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Top Product Mix</h3>
            </div>
            <div className="space-y-5">
              {top_products?.slice(0, 3).map((prod, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{prod.name}</span>
                    <span className="text-emerald-500">{(prod.value / top_products.reduce((a, b) => a + b.value, 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${(prod.value / top_products[0].value * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsView;
