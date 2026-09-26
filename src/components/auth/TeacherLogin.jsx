import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Sparkles, PlusCircle, LogIn, Lock, User, AlertCircle } from 'lucide-react';

import RoomHistoryList from '../teacher/RoomHistoryList';

export default function TeacherLogin({ onOpenCreateModal }) {
  const { loginAsTeacher } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [existingCode, setExistingCode] = useState('');
  const [error, setError] = useState('');

  const handleTeacherAuth = (e) => {
    e.preventDefault();
    setError('');

    if (username.trim() === 'natthawat' && password.trim() === '2526') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid Username or Password.');
    }
  };

  const handleJoinExisting = (e) => {
    e.preventDefault();
    if (!existingCode || existingCode.length !== 6) {
      alert("Please enter a valid 6-digit Room Code.");
      return;
    }
    loginAsTeacher(existingCode);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 mb-1">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Teacher Dashboard Access</h2>
        <p className="text-sm text-slate-400">
          Sign in with instructor credentials to access the simulation dashboard.
        </p>
      </div>

      {!isAuthenticated ? (
        /* Teacher Authentication Form (Cleaned UI, no hardcoded hint text) */
        <form onSubmit={handleTeacherAuth} className="glass-card p-6 rounded-2xl border border-slate-700/60 max-w-md mx-auto space-y-4">
          
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Username</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-white outline-none transition-all"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-white outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all"
          >
            Authenticate as Teacher
          </button>
        </form>

      ) : (

        /* Authenticated Options: Create Room or Monitor Existing */
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Create New Room Option */}
            <div className="glass-card p-6 rounded-2xl border border-indigo-500/40 hover:border-indigo-500/70 transition-all group flex flex-col justify-between space-y-4 glow-indigo">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>New Classroom Session</span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Create New Room
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configure activity name, import student roster Excel file, set balances, and launch room.
                </p>
              </div>

              <button
                onClick={onOpenCreateModal}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Simulation Room</span>
              </button>
            </div>

            {/* Access Existing Room Option */}
            <div className="glass-card p-6 rounded-2xl border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-slate-400 font-semibold text-sm">
                  <LogIn className="w-4 h-4" />
                  <span>Active Room Monitor</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Join Existing Room
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your previously generated 6-digit room code to monitor an active session.
                </p>
              </div>

              <form onSubmit={handleJoinExisting} className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  value={existingCode}
                  onChange={(e) => setExistingCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-amber-500 rounded-xl text-center font-mono text-sm tracking-widest text-white placeholder-slate-500 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={existingCode.length !== 6}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold rounded-xl text-sm transition-all"
                >
                  Enter Dashboard
                </button>
              </form>
            </div>

          </div>

          {/* Firestore Room History Stream */}
          <RoomHistoryList />
        </div>
      )}
    </div>
  );
}
