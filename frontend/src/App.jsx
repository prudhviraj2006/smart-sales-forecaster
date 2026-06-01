import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import ForecastConfig from './components/ForecastConfig';
import MultiPageDashboard from './components/MultiPageDashboard';
import InsightsCard from './components/InsightsCard';
import LoadingOverlay from './components/LoadingOverlay';
import RecentSessions from './components/RecentSessions';
import ProfilePage from './components/ProfilePage';
import { auth, onAuthStateChanged, signOut } from './services/firebase';
import LoginPage from './components/LoginPage';
import { getJobFullData } from './services/api';
import FullReportView from './components/FullReportView';
import ScenarioSimulator from './components/ScenarioSimulator';
import AnomalyMarker from './components/AnomalyMarker';
import RecommendationCards from './components/RecommendationCards';
import ConfidenceRiskCard from './components/ConfidenceRiskCard';
import DetailedCharts from './components/DetailedCharts';
import ForecastView from './components/ForecastView';
import ChatBotPage from './components/ChatBotPage';
import { TrendingUp, ShieldAlert, Sparkles, Map, BarChart3 } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [step, setStep] = useState('upload');
  const [uploadData, setUploadData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [anomaliesData, setAnomaliesData] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleUploadSuccess = (data) => {
    setUploadData(data);
    setError(null);
    setStep('preview');
  };

  const handleConfigComplete = (forecast, insights) => {
    setForecastData(forecast);
    setInsightsData(insights);
    setStep('dashboard');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      handleReset();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setUploadData(null);
    setForecastData(null);
    setInsightsData(null);
    setError(null);

  };

  const handleRefreshData = () => {
    if (uploadData) {
      setStep('upload');
      setUploadData(null);
      setForecastData(null);
      setInsightsData(null);

    }
  };

  const handleStepClick = (stepId) => {
    if (stepId === 'upload') {
      setStep('upload');
    } else if (stepId === 'preview' && uploadData) {
      setStep('preview');
    } else if (stepId === 'config' && uploadData) {
      setStep('config');
    } else if (stepId === 'dashboard' && forecastData) {
      setStep('dashboard');
    } else if (stepId === 'forecast' && forecastData) {
      handleFetchAdvancedData(uploadData?.job_id);
      setStep('forecast');
    } else if (stepId === 'reports' && forecastData) {
      setStep('reports');
    } else if (stepId === 'chatbot') {
      setStep('chatbot');
    } else if (stepId === 'profile') {
      setStep('profile');
    }
  };

  const handleFetchAdvancedData = async (jobId) => {
    if (!jobId) return;
    try {
      const { getAnomalies, getRecommendations } = await import('./services/api');
      const [anomalies, recommendations] = await Promise.all([
        getAnomalies(jobId),
        getRecommendations(jobId)
      ]);
      setAnomaliesData(anomalies.anomalies);
      setRecommendationsData(recommendations.recommendations);
    } catch (err) {
      console.error('Error fetching advanced data:', err);
    }
  };

  const handleLoadSession = async (jobId) => {
    try {
      setLoading(true);
      setLoadingMessage('Loading previous session...');
      setError(null);
      
      const data = await getJobFullData(jobId);
      
      if (data.forecast) {
        setUploadData({ job_id: jobId, ...data.job });
        
        const parseIfString = (value, fallback) => {
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch {
              return fallback;
            }
          }
          return value ?? fallback;
        };
        
        const forecastResult = {
          model_type: data.forecast.model_type,
          aggregation: data.forecast.aggregation,
          horizon: data.forecast.horizon,
          target_column: data.forecast.target_column,
          metrics: parseIfString(data.forecast.metrics, {}),
          forecast: parseIfString(data.forecast.forecast_data, []),
          historical: parseIfString(data.forecast.historical_data, []),
          decomposition: parseIfString(data.forecast.decomposition_data, null),
          feature_importance: parseIfString(data.forecast.feature_importance, null),
          top_products: parseIfString(data.forecast.top_products, null),
          top_regions: parseIfString(data.forecast.top_regions, null)
        };
        
        setForecastData(forecastResult);
        
        if (data.insights) {
          setInsightsData({
            title: data.insights.title,
            summary: data.insights.summary,
            kpis: parseIfString(data.insights.kpis, []),
            bullets: parseIfString(data.insights.bullets, []),
            recommendations: parseIfString(data.insights.recommendations, [])
          });
        }
        
        setStep('dashboard');
      } else {
        setUploadData({ job_id: jobId, ...data.job });
        setStep('preview');
      }
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Unable to load the selected session. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  if (authLoading) {
    return <LoadingOverlay message="Authenticating..." />;
  }

  if (!user) {
    return <LoginPage darkMode={darkMode} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Sidebar 
        currentStep={step}
        onStepClick={handleStepClick}
        onReset={handleReset}
        darkMode={darkMode}
      />
      
      <div className="flex-1 ml-[250px] flex flex-col min-h-screen relative overflow-x-hidden">
        <Header 
          currentStep={step} 
          darkMode={darkMode} 
          onToggleDarkMode={() => setDarkMode(!darkMode)} 
          user={user}
          onLogout={handleLogout}
          onProfileClick={() => setStep('profile')}
        />
        
        <div className="flex-1 flex flex-col relative z-0">
          {loading && <LoadingOverlay message={loadingMessage} />}
          
          <div className="max-w-[1600px] mx-auto w-full px-8 py-8 flex-1 flex flex-col">
            {error && (
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 shadow-sm">
                  {error}
                </div>
              </div>
            )}
          
            <main className="w-full flex-1">
              {step === 'profile' && (
                <ProfilePage user={user} onLogout={handleLogout} darkMode={darkMode} />
              )}

              {step === 'upload' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <FileUpload 
                    onUploadSuccess={handleUploadSuccess}
                    setLoading={setLoading}
                    setLoadingMessage={setLoadingMessage}
                    setError={setError}
                    darkMode={darkMode}
                    refreshCounter={refreshCounter}
                  />
                  <RecentSessions onLoadSession={handleLoadSession} darkMode={darkMode} />
                </div>
              )}
              
              {step === 'preview' && uploadData && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <DataPreview 
                    data={uploadData} 
                    onRefresh={handleRefreshData}
                    darkMode={darkMode}
                  />
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => setStep('config')}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                      Continue to Forecast Configuration
                    </button>
                  </div>
                </div>
              )}
              
              {step === 'config' && uploadData && (
                <div className="animate-in fade-in duration-500">
                  <ForecastConfig
                    uploadData={uploadData}
                    onComplete={handleConfigComplete}
                    setLoading={setLoading}
                    setLoadingMessage={setLoadingMessage}
                    setError={setError}
                    onBack={() => setStep('preview')}
                    darkMode={darkMode}
                  />
                </div>
              )}
              
              {step === 'dashboard' && forecastData && (
                <MultiPageDashboard 
                  forecastData={forecastData} 
                  jobId={uploadData?.job_id}
                  insightsData={insightsData}
                  darkMode={darkMode}
                  onReconfigure={() => setStep('config')}
                />
              )}

              {step === 'forecast' && forecastData && (
                <ForecastView 
                  forecastData={forecastData}
                  darkMode={darkMode}
                  jobId={uploadData?.job_id}
                />
              )}

              {step === 'reports' && forecastData && (
                <FullReportView 
                  forecastData={forecastData} 
                  jobId={uploadData?.job_id}
                  insightsData={insightsData}
                  darkMode={darkMode}
                />
              )}

              {step === 'chatbot' && (
                <ChatBotPage 
                  jobId={uploadData?.job_id}
                  darkMode={darkMode}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
