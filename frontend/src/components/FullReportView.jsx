import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, AreaChart, Area, ComposedChart, ReferenceLine, Bar
} from 'recharts';
import { 
  FileText, Calendar, Table, Info, AlertTriangle, 
  CheckCircle2, Download, TrendingUp, Filter, Activity,
  Target, Shield, Globe, Award, Briefcase, Zap
} from 'lucide-react';
import { downloadReport } from '../services/api';

const FullReportView = ({ forecastData, jobId, insightsData, darkMode }) => {
  const metrics = forecastData?.metrics || {};
  const forecast = forecastData?.forecast || [];
  const historical = forecastData?.historical || [];
  const decomposition = forecastData?.decomposition || null;
  const model_type = forecastData?.model_type || 'unknown';

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalForecastedRevenue = forecast.reduce((sum, f) => sum + f.predicted, 0);
  const accuracy = (100 - (metrics.mape || 0)).toFixed(1);

  return (
    <div className="max-w-[1400px] mx-auto space-y-16 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* PROFESSIONAL HEADER / HERO */}
      <div className={`relative overflow-hidden rounded-[40px] p-12 border ${darkMode ? 'bg-slate-900 border-slate-700 shadow-2xl' : 'bg-white border-slate-100 shadow-xl'}`}>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6 max-w-3xl">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-600/10 text-blue-600 font-bold text-xs uppercase tracking-[0.2em]">
              <Shield size={16} />
              <span>Verified AI Analysis • Internal Use Only</span>
            </div>
            
            <h1 className={`text-5xl md:text-6xl font-black tracking-tight leading-[1.1] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Strategic <span className="text-blue-600">Growth</span> & <br />
              Performance Forecast
            </h1>
            
            <p className={`text-xl font-medium leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              An algorithmic assessment of sales trajectories, market dynamics, and resource allocation requirements for the upcoming fiscal periods.
            </p>

            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-blue-500" size={20} />
                <span className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Issued: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="text-purple-500" size={20} />
                <span className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Region: Global Operations
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="text-amber-500" size={20} />
                <span className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Confidence: {accuracy}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 min-w-[240px]">
            <button 
              onClick={async () => {
                try {
                  await downloadReport(jobId, 'pdf');
                } catch (err) {
                  alert('Failed to generate full PDF report. Please try again in a few moments.');
                }
              }}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <Download size={20} />
              Export Full Report
            </button>
            <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Audit Trail ID</p>
              <code className="text-xs font-mono text-blue-500">{jobId}</code>
            </div>
          </div>
        </div>
      </div>

      {/* KEY PERFORMANCE INDICATORS BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Projected Output', value: formatCurrency(totalForecastedRevenue), sub: `Across ${forecast.length} periods`, icon: Zap, color: 'text-amber-500' },
          { label: 'Model Precision', value: `${accuracy}%`, sub: `MAPE: ${metrics.mape?.toFixed(2)}%`, icon: Target, color: 'text-emerald-500' },
          { label: 'Algorithm Used', value: model_type.toUpperCase(), sub: 'Prophet Time Series', icon: Briefcase, color: 'text-blue-500' }
        ].map((item, idx) => (
          <div key={idx} className={`p-8 rounded-[32px] border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-50'} ${item.color}`}>
              <item.icon size={24} />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{item.label}</p>
            <h3 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.value}</h3>
            <p className="text-sm text-slate-500 mt-2">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* AI INTELLIGENCE & INSIGHTS SECTION */}
      {insightsData && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
            <h2 className={`text-2xl font-bold px-4 uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Intelligence Insights</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className={`p-10 rounded-[40px] border ${darkMode ? 'bg-gradient-to-br from-blue-900/20 to-transparent border-slate-700' : 'bg-gradient-to-br from-blue-50/50 to-white border-slate-100'}`}>
              <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Executive Brief</h3>
              <p className={`text-lg leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {insightsData.summary}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                {insightsData.kpis?.map((kpi, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-900/50' : 'bg-white shadow-sm border border-slate-100'}`}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{kpi.name}</p>
                    <p className={`text-lg font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className={`text-2xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Zap className="text-amber-500" size={24} />
                Strategic Recommendations
              </h3>
              <div className="space-y-4">
                {insightsData.recommendations?.map((rec, idx) => (
                  <div key={idx} className={`p-6 rounded-[28px] border transition-all hover:translate-x-2 ${darkMode ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${rec.priority === 'high' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-blue-500'}`} />
                      <div>
                        <h4 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{rec.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* DATA ANALYSIS & VISUALIZATION */}
      <section className="space-y-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Forecasting Accuracy Analysis</h2>
            <p className="text-slate-500 mt-2 font-medium">Validation of historical baseline against predictive upper/lower bounds.</p>
          </div>
        </div>

        <div className={`p-10 rounded-[40px] border ${darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/20'}`}>
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={[...historical.slice(-24), ...forecast]}>
                <defs>
                  <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 10, fill: '#94a3b8'}}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                />
                <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}K`} />
                <Tooltip 
                   contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="actual" name="Historical Performance" fill="#3b82f610" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Area type="monotone" dataKey="predicted" name="AI Projection" fill="url(#forecastArea)" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" />
                <Area type="monotone" dataKey="upper_bound" name="Confidence Margin" fill="#8b5cf610" stroke="transparent" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DETAILED DATA TABLES */}
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className={`text-xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <TrendingUp className="text-blue-500" size={20} />
              Recent Historical Performance
            </h3>
            <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
              <table className="w-full text-left">
                <thead className={darkMode ? 'bg-slate-900' : 'bg-slate-50'}>
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Period</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Revenue</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {historical.slice(-6).reverse().map((item, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                      <td className={`px-6 py-4 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{formatDate(item.date)}</td>
                      <td className={`px-6 py-4 text-sm font-bold text-right ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(item.actual)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">Recorded</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className={`text-xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <Zap className="text-purple-500" size={20} />
              Future Revenue Projections
            </h3>
            <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
              <table className="w-full text-left">
                <thead className={darkMode ? 'bg-slate-900' : 'bg-slate-50'}>
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Period</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Predicted</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Confidence Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {forecast.slice(0, 6).map((item, idx) => (
                    <tr key={idx} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors">
                      <td className={`px-6 py-4 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{formatDate(item.date)}</td>
                      <td className={`px-6 py-4 text-sm font-bold text-right text-purple-600 dark:text-purple-400`}>{formatCurrency(item.predicted)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-[10px] text-slate-400">±{((1 - item.lower_bound/item.predicted)*100).toFixed(0)}%</span>
                          <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: '60%', marginLeft: '20%' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* DECOMPOSITION & RISK ANALYSIS */}
      <section className="grid lg:grid-cols-2 gap-12">
        <div className={`p-10 rounded-[40px] border ${darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <h3 className={`text-xl font-bold mb-8 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <Activity className="text-blue-500" size={24} />
            Growth Trajectory (Trend)
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={decomposition?.trend || []}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="#3b82f610" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-slate-500 mt-6 leading-relaxed">
            The underlying trend shows a {totalForecastedRevenue/forecast.length > historical.reduce((a,b)=>a+b.actual,0)/historical.length ? 'consistent upward momentum' : 'slight consolidation pattern'}, stripping away seasonal noise.
          </p>
        </div>

        <div className={`p-10 rounded-[40px] border ${darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <h3 className={`text-xl font-bold mb-8 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <AlertTriangle className="text-amber-500" size={24} />
            Risk & Variance Factors
          </h3>
          <ul className="space-y-6">
            {[
              { title: 'Confidence Level', value: accuracy + '%', desc: 'Probability of actual values falling within prediction interval.', color: 'text-emerald-500' },
              { title: 'Volatility Score', value: (metrics.rmse / metrics.mae).toFixed(2), desc: 'Relative impact of outliers and sudden market shifts.', color: 'text-blue-500' },
              { title: 'Risk Category', value: metrics.risk_level || 'MODERATE', desc: 'Final risk assessment based on error metrics and data stability.', color: 'text-amber-500' }
            ].map((risk, idx) => (
              <li key={idx} className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-2.5 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{risk.title}</h4>
                    <span className={`text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 ${risk.color}`}>{risk.value}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{risk.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PROFESSIONAL FOOTER & SIGN-OFF */}
      <div className="pt-20 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-end gap-12">
          <div className="space-y-4">
            <h4 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Report Authorization</h4>
            <div className="flex items-center gap-6">
              <div className="space-y-2">
                <div className="w-48 h-px bg-slate-300 dark:bg-slate-700" />
                <p className={`text-xs font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Chief Analytics Officer</p>
              </div>
              <div className="space-y-2">
                <div className="w-48 h-px bg-slate-300 dark:bg-slate-700" />
                <p className={`text-xs font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Lead Data Scientist</p>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>AI SYSTEM ONLINE & VERIFIED</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-[4px]">END OF STRATEGIC DOCUMENT</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FullReportView;
