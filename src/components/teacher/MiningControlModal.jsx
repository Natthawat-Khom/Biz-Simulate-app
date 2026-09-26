import React from 'react';
import { useGame } from '../../context/GameContext';
import { Zap, Trophy, Play, Square, LogOut, CheckCircle2, Flame } from 'lucide-react';

export default function MiningControlModal({ isOpen, onClose }) {
  const { room, users, startMiningEvent, stopMiningEvent } = useGame();

  if (!isOpen) return null;

  const isMining = room?.status === 'mining';
  const winners = room?.miningState?.winners || [];

  // Sort students by tap count
  const sortedStudents = [...users].sort((a, b) => (b.miningTaps || 0) - (a.miningTaps || 0));

  const handleExitMining = async () => {
    if (isMining) {
      try {
        await stopMiningEvent();
      } catch (err) {
        console.error("Error stopping mining event:", err);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 lg:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-amber-500/40 shadow-2xl glow-amber">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Tap / Clicker Mining Event Control</h2>
              <p className="text-xs text-slate-400">First 3 students to tap 50 times win bonus token rewards!</p>
            </div>
          </div>

          <button
            onClick={handleExitMining}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Close & Exit</span>
          </button>
        </div>

        {/* Action Toggle Button */}
        <div className="flex items-center justify-between p-4 glass-card rounded-2xl border border-slate-700">
          <div>
            <span className="text-sm font-bold text-white block">Event Status</span>
            <span className={`text-xs font-semibold ${isMining ? 'text-amber-400' : 'text-slate-400'}`}>
              {isMining ? '⚡ Mini-game is LIVE on student screens!' : 'Idle / Off'}
            </span>
          </div>

          {isMining ? (
            <button
              onClick={stopMiningEvent}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-rose-600/30 transition-all"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Mining Event</span>
            </button>
          ) : (
            <button
              onClick={startMiningEvent}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/30 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>LAUNCH MINING EVENT NOW</span>
            </button>
          )}
        </div>

        {/* Top 3 Winners Showcase */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Race Winners Podium (Top 3)</span>
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((rank) => {
              const winner = winners.find(w => w.rank === rank);
              const rewards = { 1: 500, 2: 300, 3: 100 };

              return (
                <div
                  key={rank}
                  className={`p-4 rounded-2xl border text-center space-y-1.5 ${
                    winner ? 'glass-card border-amber-500/50 bg-gradient-to-b from-amber-950/30 to-slate-900 glow-amber' :
                    'glass-panel border-slate-800 opacity-60'
                  }`}
                >
                  <div className="text-xs font-mono font-bold text-amber-400 uppercase">
                    Rank #{rank}
                  </div>
                  {winner ? (
                    <>
                      <div className="text-sm font-bold text-white truncate">{winner.fullname}</div>
                      <div className="text-[11px] text-indigo-300 font-medium">
                        {winner.groupId.replace('group_', 'Group ')}
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-400 pt-1">
                        +${rewards[rank]} Reward
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 italic py-2">Waiting for winner...</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Student Tap Leaderboard */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Live Tap Counters ({sortedStudents.length} Students)</span>
          </h3>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {sortedStudents.map((st) => {
              const taps = st.miningTaps || 0;
              const pct = Math.min(100, Math.round((taps / 50) * 100));

              return (
                <div key={st.std_id || st.stdId} className="flex items-center space-x-3 p-2.5 glass-panel rounded-xl border border-slate-800 text-xs">
                  <span className="font-mono text-slate-500 w-6 text-center">{st.std_id || st.stdId}</span>
                  <div className="flex-1 truncate">
                    <span className="font-medium text-slate-200 block truncate">{st.fullname}</span>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="font-mono font-bold text-amber-300 w-12 text-right">
                    {taps}/50
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Exit & Return to Dashboard Button */}
        <div className="border-t border-slate-800 pt-4">
          <button
            onClick={handleExitMining}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Close & Return to Dashboard (ปิดและกลับสู่หน้าหลัก)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
