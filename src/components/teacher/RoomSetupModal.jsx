import React, { useState } from 'react';
import { generateRoomCode } from '../../utils/roomCodeGenerator';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import ExcelImporter from './ExcelImporter';
import { X, Sparkles, DollarSign, Users, Hash, ShieldCheck, AlertCircle, FileText, Target } from 'lucide-react';

export default function RoomSetupModal({ isOpen, onClose }) {
  const { createRoomWithRoster } = useGame();
  const { loginAsTeacher } = useAuth();

  const [generatedCode] = useState(() => generateRoomCode());
  const [activityName, setActivityName] = useState('Startup Investment Pitch 2026');
  const [softCapTarget, setSoftCapTarget] = useState(5000);
  const [startingPersonalBalance, setStartingPersonalBalance] = useState(1000);
  const [startingGroupBalance, setStartingGroupBalance] = useState(2000);
  const [maxGroupMembers, setMaxGroupMembers] = useState(5);
  const [numGroups, setNumGroups] = useState(4);
  const [studentRoster, setStudentRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (studentRoster.length === 0) {
      alert("Please import a valid student roster Excel file first!");
      return;
    }

    setLoading(true);

    try {
      const finalActivityName = activityName.trim() || `Startup Ecosystem #${generatedCode}`;
      const settings = {
        activityName: finalActivityName,
        softCapTarget: Number(softCapTarget) || 5000,
        startingPersonalBalance: Number(startingPersonalBalance) || 1000,
        startingGroupBalance: Number(startingGroupBalance) || 2000,
        maxGroupMembers: Number(maxGroupMembers) || 5,
        numGroups: Number(numGroups) || 4,
      };

      await createRoomWithRoster(generatedCode, settings, studentRoster);
      loginAsTeacher(generatedCode);
      onClose();
    } catch (err) {
      console.error("🔥 Explicit Room Setup Error caught in Modal:", err);
      const errMsg = err.message || 'Unknown error occurred while creating room.';
      setErrorMessage(errMsg);
      alert(`⚠️ Failed to initialize simulation room:\n\n${errMsg}\n\nPlease check your Firebase Console -> Firestore Security Rules.`);
    } finally {
      // ALWAYS turn off loading state so UI never hangs!
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 lg:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-indigo-500/30 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Launch Startup Pitch Ecosystem</h2>
              <p className="text-xs text-slate-400">Set soft cap funding targets, balances & upload student roster</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-start space-x-2.5 p-3.5 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Initialization Error:</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleCreateRoom} className="space-y-6">
          
          {/* Room Code Showcase */}
          <div className="flex items-center justify-between p-4 glass-card rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-900">
            <div>
              <span className="text-xs font-semibold text-indigo-300 block">Generated Room Code</span>
              <span className="text-xs text-slate-400">Share this code with your student investors</span>
            </div>
            <div className="px-4 py-2 bg-indigo-950 border border-indigo-500/50 rounded-xl font-mono text-2xl font-bold text-indigo-300 tracking-widest shadow-inner">
              {generatedCode}
            </div>
          </div>

          {/* Activity Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Activity / Pitching Session Name</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Startup Investment Pitch 2026"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-white outline-none transition-all"
            />
          </div>

          {/* Config Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Soft Cap Funding Target ($) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Startup Soft Cap Target Goal ($)</span>
              </label>
              <input
                type="number"
                min={1000}
                step={500}
                value={softCapTarget}
                onChange={(e) => setSoftCapTarget(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-amber-500/40 focus:border-amber-400 rounded-xl text-sm font-mono text-amber-300 font-bold outline-none"
                required
              />
              <p className="text-[11px] text-slate-400">Each startup team tries to reach this funding milestone from investors.</p>
            </div>

            {/* Starting Group Wallet Balance */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Starting Startup Treasury ($)</span>
              </label>
              <input
                type="number"
                min={0}
                value={startingGroupBalance}
                onChange={(e) => setStartingGroupBalance(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm font-mono text-white outline-none"
                required
              />
            </div>

            {/* Starting Personal Wallet Balance */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Student Investor Capital ($)</span>
              </label>
              <input
                type="number"
                min={0}
                value={startingPersonalBalance}
                onChange={(e) => setStartingPersonalBalance(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm font-mono text-white outline-none"
                required
              />
            </div>

            {/* Max Group Members (2 to 6 people) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Max Capacity Per Group</span>
              </label>
              <select
                value={maxGroupMembers}
                onChange={(e) => setMaxGroupMembers(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-white outline-none"
              >
                <option value={2}>2 Members / Group</option>
                <option value={3}>3 Members / Group</option>
                <option value={4}>4 Members / Group</option>
                <option value={5}>5 Members / Group</option>
                <option value={6}>6 Members / Group</option>
              </select>
            </div>

            {/* Number of Auto-created Groups */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                <span>Number of Startup Groups</span>
              </label>
              <input
                type="number"
                min={2}
                max={12}
                value={numGroups}
                onChange={(e) => setNumGroups(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-white outline-none"
                required
              />
            </div>
          </div>

          {/* Excel Importer Module */}
          <ExcelImporter onStudentsParsed={setStudentRoster} />

          {/* Action Footer */}
          <div className="flex items-center justify-end space-x-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || studentRoster.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Initializing...' : 'Launch Pitch Ecosystem'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
