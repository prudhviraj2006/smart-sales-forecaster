import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    ...(API_KEY && { 'X-API-Key': API_KEY }),
  },
  timeout: 120000, // 2 minute timeout for long forecasting operations
});

// Log all API errors to console for easier debugging
api.interceptors.request.use((config) => {
  console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail || error.message;
    console.error(`[API Error] ${status} - ${detail}`, error.config?.url);
    return Promise.reject(error);
  }
);

export const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const runForecast = async (params) => {
  const response = await api.post('/forecast', params);
  return response.data;
};

export const getForecast = async (jobId) => {
  const response = await api.get(`/forecast/${jobId}`);
  return response.data;
};

export const getInsights = async (jobId) => {
  const response = await api.get('/insights', {
    params: { job_id: jobId }
  });
  return response.data;
};

export const downloadReport = async (jobId, format = 'csv') => {
  const response = await api.get('/download', {
    params: { job_id: jobId, format },
    responseType: 'blob',
  });
  
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `forecast_${jobId}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const getRecentJobs = async (limit = 10) => {
  const response = await api.get('/recent-jobs', {
    params: { limit }
  });
  return response.data;
};

export const getJobFullData = async (jobId) => {
  const response = await api.get(`/job/${jobId}/full`);
  return response.data;
};

export const deleteJob = async (jobId) => {
  const response = await api.delete(`/job/${jobId}`);
  return response.data;
};

export const getAnomalies = async (jobId) => {
  const response = await api.get(`/anomalies/${jobId}`);
  return response.data;
};

export const getRecommendations = async (jobId) => {
  const response = await api.get(`/recommendations/${jobId}`);
  return response.data;
};

export const runScenario = async (jobId, params) => {
  const response = await api.post(`/scenario/${jobId}`, params);
  return response.data;
};

export const chatWithAI = async (jobId, message, conversationHistory = []) => {
  const response = await api.post(`/chat`, {
    job_id: jobId,
    message: message,
    conversation_history: conversationHistory
  });
  return response.data;
};

export default api;
