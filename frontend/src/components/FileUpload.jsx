import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileSpreadsheet, AlertCircle, CheckCircle,
  RefreshCw, Loader2
} from 'lucide-react';
import { uploadCSV } from '../services/api';

/* ───────────── Main FileUpload Component ───────────── */
function FileUpload({ onUploadSuccess, onLoadSession, setLoading, setLoadingMessage, setError, darkMode, refreshCounter }) {
  const [uploadStatus, setUploadStatus] = useState(null);

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Upload Sales Data
        </h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Upload your historical sales CSV file to generate AI-powered forecasts
        </p>
      </div>

      {/* Upload Zone */}
      <div className={`rounded-xl p-8 shadow-sm border mb-8 transition-colors ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? darkMode
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-blue-500 bg-blue-50'
              : darkMode
                ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              darkMode ? 'bg-slate-700 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              <Upload size={32} />
            </div>

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
