import React from 'react';
import SummaryDashboard from './SummaryDashboard';
import DetailedCharts from './DetailedCharts';
import ChatBot from './ChatBot';

function Dashboard({ forecastData, jobId, insightsData, uploadData, darkMode }) {
  return (
    <div className="space-y-12 pb-32 max-w-[1600px] mx-auto px-4 md:px-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* HEADER OVERVIEW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className={`text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Forecast <span className="text-blue-600">Intelligence</span> Dashboard
          </h1>
          <p className={`mt-2 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Comprehensive real-time analysis of your sales performance and predictive trends.
          </p>
        </div>
        
        <div className={`px-6 py-3 rounded-2xl border flex items-center gap-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Session</span>
            <span className={`text-xs font-mono font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{jobId}</span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model Status</span>
            <span className="text-xs font-bold text-emerald-500">LIVE & ACCURATE</span>
          </div>
        </div>
      </div>

      {/* CORE SUMMARY SECTION */}
      <SummaryDashboard forecastData={forecastData} darkMode={darkMode} />

      {/* DETAILED ANALYTICS SECTION (Added directly here) */}
      <div className="pt-8 space-y-12 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
          <h2 className={`text-xs font-bold uppercase tracking-[0.3em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Deep-Dive Analysis</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
        </div>
        
        <DetailedCharts forecastData={forecastData} darkMode={darkMode} />
      </div>

      <ChatBot jobId={jobId} darkMode={darkMode} />
    </div>
  );
}

export default Dashboard;
