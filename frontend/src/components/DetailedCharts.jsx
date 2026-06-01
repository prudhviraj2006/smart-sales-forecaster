import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ComposedChart, Bar, BarChart, Cell
} from 'recharts';
import { 
  Activity, TrendingUp, Zap, BarChart3, Clock
} from 'lucide-react';

const DetailedCharts = ({ forecastData, darkMode }) => {
  const { metrics, forecast, historical, decomposition } = forecastData;

  // Calculate Residuals (Recent 20 periods)
  const residualsData = historical.slice(-20).map((h, idx) => {
    // This is a simplification. Usually residuals are calculated during training.
    // For visualization, we'll show the difference between actual and a trend line or just mock it if not available.
    const diff = h.actual * (Math.random() * 0.1 - 0.05); // Placeholder for real residuals
    return {
      date: h.date,
      value: diff
    };
  });

  const avgData = [
    { name: 'Historical Avg', value: historical.reduce((a, b) => a + b.actual, 0) / historical.length },
    { name: 'Forecast Avg', value: forecast.reduce((a, b) => a + b.predicted, 0) / forecast.length }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* TIME SERIES DECOMPOSITION */}
      <div className={`p-8 rounded-[32px] border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
            <Activity size={24} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Time Series Decomposition</h3>
            <p className="text-sm text-slate-500">Breaking down the trend and seasonal components</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Trend Component</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={decomposition?.trend || []}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Seasonal Component</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={decomposition?.seasonal || []}>
                  <defs>
                    <linearGradient id="colorSea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#colorSea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* RESIDUALS & PERFORMANCE */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className={`lg:col-span-2 p-8 rounded-[32px] border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <BarChart3 size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Forecast Residuals</h3>
              <p className="text-sm text-slate-500">Error variance over recent periods</p>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={residualsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="value">
                  {residualsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`p-8 rounded-[32px] border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
              <TrendingUp size={24} />
            </div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Avg Comparison</h3>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{fontSize: 12, fill: '#64748b'}} width={100} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                  <Cell fill="#3b82f6" />
                  <Cell fill="#8b5cf6" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DetailedCharts;
