import React, { useState } from 'react';
import { parseStudentExcel } from '../../utils/excelParser';
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ExcelImporter({ onStudentsParsed }) {
  const [file, setFile] = useState(null);
  const [parsedList, setParsedList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setLoading(true);

    try {
      const students = await parseStudentExcel(selectedFile);
      setParsedList(students);
      onStudentsParsed(students);
    } catch (err) {
      console.error("Excel parse error:", err);
      setError(err.message || 'Failed to parse Excel file.');
      setParsedList([]);
      onStudentsParsed([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Import Student Roster (.xlsx / .xls / HTML Table)</span>
        </label>
        {parsedList.length > 0 && (
          <span className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{parsedList.length} Students Ready</span>
          </span>
        )}
      </div>

      {/* File Dropzone */}
      <div className="relative group border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-2xl p-6 text-center transition-all bg-slate-900/50 hover:bg-slate-900/80 cursor-pointer">
        <input
          type="file"
          accept=".xlsx, .xls, .html, .csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="flex flex-col items-center space-y-2 pointer-events-none">
          {loading ? (
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          )}
          <div className="text-sm font-medium text-slate-200">
            {file ? file.name : 'Click or drop Excel file here'}
          </div>
          <p className="text-xs text-slate-500">
            Supports .xlsx, .xls (standard or HTML exported tables), with columns <code className="text-indigo-300">std_id</code> and <code className="text-indigo-300">fullname</code>
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Parsed Preview Table */}
      {parsedList.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-950/60 p-2 space-y-1">
          <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 px-3 py-1 border-b border-slate-800">
            <span className="col-span-1">#</span>
            <span className="col-span-4">std_id</span>
            <span className="col-span-5">fullname</span>
            <span className="col-span-2 text-right">Auto PIN</span>
          </div>
          {parsedList.map((st, idx) => (
            <div key={st.std_id} className="grid grid-cols-12 text-xs text-slate-300 px-3 py-1 hover:bg-slate-900/60 rounded transition-colors">
              <span className="col-span-1 font-mono text-slate-500">{idx + 1}</span>
              <span className="col-span-4 font-mono font-medium text-indigo-300">{st.std_id}</span>
              <span className="col-span-5 truncate">{st.fullname}</span>
              <span className="col-span-2 font-mono font-bold text-emerald-400 text-right">{st.pin}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
