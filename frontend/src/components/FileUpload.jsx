import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileSpreadsheet, AlertCircle, CheckCircle,
  RefreshCw, Loader2, Clock, TrendingUp, FileText, ChevronRight, X
} from 'lucide-react';
import { uploadCSV, getRecentJobs, deleteJob } from '../services/api';

/* ───────────── Inline Recent Sessions ───────────── */
function InlineRecentSessions({ onLoadSession, darkMode, refreshKey }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRecentJobs(8)
      .then((data) => { if (!cancelled) { setJobs(data.jobs || []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleDelete = async (e, jobId) => {
    e.stopPropagation();
    if (!confirm('Delete this session?')) return;
    try {
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.job_id !== jobId));
    } catch {
      alert('Failed to delete session');
    }
  };

  const formatDate = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3_600_000);
    const d = Math.floor(diff / 86_400_000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    if (d < 7) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const card = `rounded-xl border p-5 mt-6 ${
    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'
  }`;

  if (loading) {
    return (
      <div className={card}>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-gray-400" />
          <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recent Sessions</h3>
        </div>
        <div className="animate-pulse space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className={`h-14 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`} />
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className={card}>
        <div className="flex items-center gap-2 mb-2">
          <Clock size={18} className="text-gray-400" />
          <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recent Sessions</h3>
        </div>
        <p className={`text-sm py-3 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          No sessions yet — upload your first CSV to begin!
        </p>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="flex items-center gap-2 mb-3">
        <Clock size={18} className="text-gray-400" />
        <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recent Sessions</h3>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
          {jobs.length}
        </span>
      </div>

      <div className="space-y-1.5">
        {jobs.map((job) => (
          <div
            key={job.job_id}
            className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
              darkMode
                ? 'hover:bg-slate-700/60 bg-slate-700/30'
                : 'hover:bg-blue-50 bg-gray-50'
            }`}
            onClick={() => onLoadSession(job.job_id)}
          >
            {/* icon */}
            <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
              job.has_forecast
                ? 'bg-green-100'
                : darkMode ? 'bg-slate-600' : 'bg-gray-200'
            }`}>
              {job.has_forecast
                ? <TrendingUp size={17} className="text-green-600" />
                : <FileText size={17} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              }
            </div>

            {/* info */}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {job.original_filename}
              </p>
              <div className={`flex items-center gap-2 text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span>{formatDate(job.created_at)}</span>
                <span>·</span>
                <span>{job.row_count?.toLocaleString()} rows</span>
                {job.has_forecast && (
                  <>
                    <span>·</span>
                    <span className="text-green-500 font-medium">
                      {job.model_type?.toUpperCase()} · {job.horizon}mo
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <ChevronRight size={16} className={`transition-colors ${darkMode ? 'text-gray-600 group-hover:text-blue-400' : 'text-gray-300 group-hover:text-blue-500'}`} />
              <button
                onClick={(e) => handleDelete(e, job.job_id)}
                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-all ${
                  darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-100 text-red-500'
                }`}
                title="Delete session"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Main FileUpload Component ───────────── */
function FileUpload({ onUploadSuccess, onLoadSession, setLoading, setLoadingMessage, setError, darkMode, refreshCounter }) {
  const [uploadStatus, setUploadStatus] = useState(null);
  const [sessionsKey, setSessionsKey] = useState(0);

  useEffect(() => {
    if (refreshCounter) {
      setUploadStatus(null);
    }
  }, [refreshCounter]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setLoadingMessage('Uploading and validating your data...');
    setUploadStatus('uploading');
    setError(null);

    try {
      const data = await uploadCSV(file);
      setUploadStatus('success');
      setLoadingMessage('Upload successful! Loading preview...');
      setSessionsKey((k) => k + 1); // refresh sessions list
      onUploadSuccess(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setUploadStatus('error');
      const detail = err.response?.data?.detail;
      let errMsg = 'Failed to upload file. Please check your file and try again.';
      if (typeof detail === 'string') {
        errMsg = detail;
      } else if (Array.isArray(detail)) {
        errMsg = detail.map(d => (typeof d === 'object' ? d.msg || JSON.stringify(d) : String(d))).join(', ');
      } else if (detail && typeof detail === 'object') {
        errMsg = detail.msg || detail.message || JSON.stringify(detail);
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
      console.error('Upload error:', err);
    }
  }, [onUploadSuccess, setLoading, setLoadingMessage, setError]);

  const handleRefresh = () => {
    setUploadStatus(null);
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Upload Your Sales Data
          </h2>
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
              darkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
            }`}
            title="Refresh to upload new data"
          >
            <RefreshCw size={18} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
        <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
          Upload a CSV file with your historical sales data to get started with forecasting
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
          ${isDragActive
            ? 'border-blue-500 bg-blue-50'
            : darkMode
              ? 'border-slate-600 hover:border-blue-400 bg-slate-800 hover:bg-slate-700'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${uploadStatus === 'error' ? '!border-red-300 !bg-red-50' : ''}
          ${uploadStatus === 'success' ? '!border-green-300 !bg-green-50' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {uploadStatus === 'uploading' ? (
            <Loader2 size={48} className="text-blue-500 animate-spin" />
          ) : uploadStatus === 'success' ? (
            <CheckCircle size={48} className="text-green-500" />
          ) : uploadStatus === 'error' ? (
            <AlertCircle size={48} className="text-red-500" />
          ) : (
            <div className={`p-4 rounded-full ${isDragActive ? 'bg-blue-100' : darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <Upload size={32} className={isDragActive ? 'text-blue-600' : darkMode ? 'text-gray-400' : 'text-gray-400'} />
            </div>
          )}

          <div>
            {uploadStatus === 'uploading' ? (
              <p className="text-lg font-medium text-blue-500">Uploading and validating your data...</p>
            ) : uploadStatus === 'success' ? (
              <p className="text-lg font-medium text-green-600">Upload successful! Proceeding...</p>
            ) : uploadStatus === 'error' ? (
              <p className="text-lg font-medium text-red-600">Upload failed. Please try again.</p>
            ) : (
              <>
                <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                  {isDragActive ? 'Drop your file here' : 'Drag and drop your CSV file'}
                </p>
                <p className={darkMode ? 'text-gray-400 mt-1' : 'text-gray-500 mt-1'}>or click to browse</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Recent Sessions — directly below dropzone */}
      <InlineRecentSessions
        onLoadSession={onLoadSession}
        darkMode={darkMode}
        refreshKey={sessionsKey}
      />

      {/* Expected CSV Format */}
      <div className={`mt-6 rounded-xl p-6 shadow-sm border ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="text-blue-600 mt-1" size={24} />
          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Expected CSV Format</h3>
            <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Your CSV should contain the following columns:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">date</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">product_id</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">region</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">units_sold</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">revenue</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">price</span>
              <span className={`px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>promotion_flag*</span>
              <span className={`px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>product_name*</span>
            </div>
            <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>* Optional columns</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
