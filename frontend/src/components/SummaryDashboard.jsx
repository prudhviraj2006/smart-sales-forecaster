import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ComposedChart, Bar
} from 'recharts';
import { 
  TrendingUp, Activity, Target, Zap, 
  ArrowUpRight, ArrowDownRight, Users, ShoppingBag
} from 'lucide-react';

const SummaryDashboard = ({ forecastData, darkMode }) => {
  const { metrics, forecast, historical } = forecastData;

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toFixed(2);
  };

  const combinedData = [
    ...historical.slice(-12).map(h => ({ date: h.date, actual: h.actual, predicted: null, type: 'historical' })),
    ...forecast.map(f => ({ date: f.date, actual: null, predicted: f.predicted, type: 'forecast' }))
  ];

  const totalForecast = forecast.reduce((sum, f) => sum + f.predicted, 0);
  const avgHistorical = historical.reduce((sum, h) => sum + h.actual, 0) / historical.length;
  const growth = ((totalForecast / (avgHistorical * forecast.length) - 1) * 100).toFixed(1);

  const stats = [
    { label: 'Projected Revenue', value: `₹${formatNumber(totalForecast)}`, trend: `${growth}%`, up: growth > 0, icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Avg Monthly Sales', value: `₹${formatNumber(forecast[0]?.predicted || 0)}`, trend: '+5.2%', up: true, icon: ShoppingBag, color: 'text-purple-500' },
    { label: 'Model Confidence', value: `${(100 - metrics.mape).toFixed(1)}%`, trend: 'Stable', up: true, icon: Target, color: 'text-emerald-500' },
    { label: 'Active Users', value: '1,284', trend: '+12%', up: true, icon: Users, color: 'text-amber-500' }
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} transition-all hover:scale-[1.02]`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{stat.trend}</span>
              </div>
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
              <h3 className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <div className={`lg:col-span-2 p-8 rounded-3xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Sales Velocity & Projections</h3>
              <p className="text-sm text-slate-500 mt-1">Real-time overview of current trends vs AI forecast</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-slate-500">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs font-medium text-slate-500">Forecast</span>
              </div>
            </div>
          </div>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedData}>
                <defs>
                  <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 10, fill: '#64748b'}}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short' })}
                />
                <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={formatNumber} />
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="actual" fill="url(#colorAct)" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Glance Widgets */}
        <div className="space-y-8">
          <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-gradient-to-br from-blue-900/40 to-slate-800/50 border-slate-700' : 'bg-gradient-to-br from-blue-50 to-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <Activity size={20} />
              </div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Recent Stability</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Volatilty Index</span>
                <span className="text-sm font-bold text-emerald-500">Low (0.12)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[12%]" />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Data Freshness</span>
                <span className="text-sm font-bold text-blue-500">99.8%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[99%]" />
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
            <h3 className={`text-lg font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>System Health</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model</p>
                <p className="text-sm font-bold text-emerald-500 mt-1">OPTIMIZED</p>
              </div>
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uptime</p>
                <p className="text-sm font-bold text-blue-500 mt-1">100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDashboard;
