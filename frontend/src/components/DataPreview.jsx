import { CheckCircle, AlertTriangle, Info, Calendar, Hash, Table, RefreshCw } from 'lucide-react';

function DataPreview({ data, onRefresh, darkMode }) {
  if (!data) return null;

  const validation = data.validation || data.validation_result || {};
  let preview = Array.isArray(data.preview) && data.preview.length > 0 
    ? data.preview 
    : (Array.isArray(validation.preview) && validation.preview.length > 0 ? validation.preview : []);
  const columns = Array.isArray(data.columns) ? data.columns : (Array.isArray(validation.columns) ? validation.columns : []);
  const numeric_columns = Array.isArray(data.numeric_columns) ? data.numeric_columns : (Array.isArray(validation.numeric_columns) ? validation.numeric_columns : []);
  const categorical_columns = Array.isArray(data.categorical_columns) && data.categorical_columns.length > 0
    ? data.categorical_columns 
    : (Array.isArray(validation.categorical_columns) && validation.categorical_columns.length > 0
      ? validation.categorical_columns 
      : columns.filter(c => !numeric_columns.includes(c) && c !== (data.date_column || validation.date_column)));

  const totalRows = validation.row_count ?? data.row_count ?? 0;
  const totalCols = validation.column_count ?? data.column_count ?? columns.length ?? 0;
  let dateRange = validation.date_range || data.date_range;

  if (!dateRange || !dateRange.start) {
    if (preview && preview.length > 0) {
      const dCol = data.date_column || validation.date_column || columns.find(c => c.toLowerCase().includes('date'));
      if (dCol) {
        const dVals = preview
          .map(r => r[dCol])
          .filter(v => v && v !== '-' && v !== 'NaT' && !isNaN(new Date(v).getTime()))
          .map(v => new Date(v).toISOString().split('T')[0])
          .sort();
        if (dVals.length > 0) {
          dateRange = { start: dVals[0], end: dVals[dVals.length - 1] };
        }
      }
    }
  }

  const errors = Array.isArray(data.errors) && data.errors.length > 0 
    ? data.errors 
    : (Array.isArray(validation.errors) ? validation.errors : []);

  const warnings = Array.isArray(data.warnings) && data.warnings.length > 0 
    ? data.warnings 
    : (Array.isArray(validation.warnings) && validation.warnings.length > 0 
      ? validation.warnings 
      : []);

  const isNumCol = (col) => {
    const colLower = String(col).trim().toLowerCase();
    if (colLower === 'row id' || colLower === 'row_id' || colLower === 'rowid' || colLower === 'row') return true;
    if (numeric_columns.includes(col)) return true;
    const typeObj = (data.columns_with_types || validation.columns_with_types || []).find(c => c.name === col);
    if (typeObj && typeObj.type === 'numeric') return true;
    // Check if values in preview are actually numbers
    if (preview && preview.length > 0) {
      const val = preview[0][col];
      if (val !== undefined && val !== null && val !== '-' && !isNaN(Number(val)) && typeof val !== 'boolean') {
        if (!colLower.includes('date') && !colLower.includes('order id') && !colLower.includes('customer id') && !colLower.includes('postal') && !colLower.includes('zip')) {
          return true;
        }
      }
    }
    return false;
  };

  const displayNumericColumns = columns.filter(c => isNumCol(c));
  const displayCategoricalColumns = columns.filter(c => !isNumCol(c) && c !== (data.date_column || validation.date_column));

  return (
    <div className="space-y-6">
      <div className={`rounded-xl shadow-sm border overflow-hidden ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        <div className={`p-6 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-700' : 'border-gray-100'
        }`}>
          <div>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Data Preview</h2>
            <p className={darkMode ? 'text-gray-300 mt-1' : 'text-gray-600 mt-1'}>Review your uploaded data before proceeding</p>
          </div>
          <button
            onClick={onRefresh}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
              darkMode 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white' 
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-md'
            }`}
          >
            <RefreshCw size={18} />
            <span>Refresh Data</span>
          </button>
        </div>

        <div className={`grid md:grid-cols-3 gap-4 p-6 ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
          <div className={`flex items-center gap-3 p-4 rounded-lg shadow-sm ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Table size={20} className="text-blue-600" />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Rows</p>
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{totalRows.toLocaleString()}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 p-4 rounded-lg shadow-sm ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Hash size={20} className="text-purple-600" />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Columns</p>
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{totalCols}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 p-4 rounded-lg shadow-sm ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar size={20} className="text-green-600" />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date Range</p>
              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {dateRange?.start ? `${dateRange.start} to ${dateRange.end}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {((errors && errors.length > 0) || (warnings && warnings.length > 0)) && (
          <div className={`p-6 border-t space-y-3 ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
            {errors?.map((error, idx) => (
              <div key={idx} className="flex items-start gap-2 text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{typeof error === 'object' ? error.msg || JSON.stringify(error) : String(error)}</span>
              </div>
            ))}
            {warnings?.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-amber-800 bg-[#fffbeb] p-3.5 rounded-lg border border-amber-200/80 font-medium text-sm">
                <Info size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
                <span>{typeof warning === 'object' ? warning.msg || JSON.stringify(warning) : String(warning)}</span>
              </div>
            ))}
          </div>
        )}

        {(validation.is_valid || validation.row_count > 0 || totalRows > 0) && (
          <div className={`p-4 border-t bg-[#f0fdf4] flex items-center gap-2.5 text-emerald-800 border-emerald-100 ${
            darkMode ? 'border-slate-700 bg-slate-800/80 text-emerald-400' : ''
          }`}>
            <CheckCircle size={20} className="text-emerald-600" />
            <span className="font-medium text-sm">Data validation passed! Ready for forecasting.</span>
          </div>
        )}
      </div>

      {columns.length > 0 && (
        <div className={`rounded-xl shadow-sm border overflow-hidden ${
          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
        }`}>
          <div className={`p-4 border-b ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Sample Data {preview.length > 0 ? `(First ${preview.length} rows)` : ''}
            </h3>
          </div>
          {preview.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={darkMode ? 'bg-slate-900' : 'bg-gray-50'}>
                  <tr>
                    {columns.map((col) => {
                      const isNumeric = isNumCol(col);
                      return (
                        <th key={col} className={`px-4 py-3 text-left font-semibold whitespace-nowrap ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {col}
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                            isNumeric 
                              ? 'bg-blue-100 text-blue-700 font-medium' 
                              : darkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {isNumeric ? 'num' : 'text'}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
                  {preview.map((row, idx) => (
                    <tr key={idx} className={darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}>
                      {columns.map((col) => (
                        <td key={col} className={`px-4 py-3 whitespace-nowrap ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400">
              Session loaded. Proceed to Forecast Configuration.
            </div>
          )}
        </div>
      )}

      <div className={`rounded-xl shadow-sm border p-6 ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Column Summary</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Numeric Columns ({displayNumericColumns.length})</h4>
            <div className="flex flex-wrap gap-2">
              {displayNumericColumns.map((col) => (
                <span key={col} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {col}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Categorical Columns ({displayCategoricalColumns.length})</h4>
            <div className="flex flex-wrap gap-2">
              {displayCategoricalColumns.map((col) => (
                <span key={col} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataPreview;
