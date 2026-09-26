import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import StartupTrajectoryChart from '../common/StartupTrajectoryChart';
import RoomSettingsModal from './RoomSettingsModal';
import TransactionAuditModal from './TransactionAuditModal';
import { 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  Zap, 
  Users, 
  DollarSign, 
  Flame, 
  Activity,
  Play,
  Lock,
  Settings,
  ClipboardList
} from 'lucide-react';

const COLOR_PALETTE = [
  '#6366f1', // Indigo (Group 1)
  '#10b981', // Emerald (Group 2)
  '#f59e0b', // Amber (Group 3)
  '#ec4899', // Pink (Group 4)
  '#8b5cf6', // Violet (Group 5)
  '#06b6d4', // Cyan (Group 6)
  '#f97316', // Orange (Group 7)
  '#84cc16'  // Lime (Group 8)
];

export default function StockMarketDashboard({ onOpenMiningModal, onOpenAuditModal }) {
  const { room, groups, users, transactions, startRoomSession, endSession } = useGame();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTransactionAuditOpen, setIsTransactionAuditOpen] = useState(false);

  const softCapTarget = room?.settings?.softCapTarget || 5000;
  const maxMembers = room?.settings?.maxGroupMembers || 5;

  // 1. Compute Funding & Leaderboard per group (Raised Capital ONLY - starts at $0, strictly NO personal sums)
  const marketGroups = useMemo(() => {
    return groups.map((g, idx) => {
      const groupMembers = users.filter(u => u.groupId === g.groupId || u.groupId === g.id);
      const raisedCapital = Number(g.raisedCapital) || 0;
      const percentage = Math.min(100, Math.round((raisedCapital / softCapTarget) * 100));
      const isFunded = raisedCapital >= softCapTarget;

      return {
        ...g,
        raisedCapital,
        percentage,
        isFunded,
        memberCount: groupMembers.length,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
      };
    }).sort((a, b) => b.raisedCapital - a.raisedCapital);
  }, [groups, users, softCapTarget]);

  // 2. Step 3 Formula: Total Capital Deployed = Sum of all completed investment transactions
  const totalEcosystemRaised = useMemo(() => {
    const completedTotal = transactions
      .filter(tx => tx.status === 'completed' || !tx.status)
      .reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);

    const groupRaisedTotal = marketGroups.reduce((acc, g) => acc + (Number(g.raisedCapital) || 0), 0);

    return Math.max(completedTotal, groupRaisedTotal);
  }, [transactions, marketGroups]);

  const fundedCount = marketGroups.filter(g => g.isFunded).length;

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden flex flex-col space-y-3 font-sans">
      
      {/* 1. STATS & CONTROL BAR (4 EQUAL COLUMNS) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 shrink-0">
        
        {/* Metric 1: Total Ecosystem Capital Deployed */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between col-span-1">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Capital Deployed
            </span>
            <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block">
              ${totalEcosystemRaised.toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Soft Cap Goal Target */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between col-span-1">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Soft Cap Target Goal
            </span>
            <span className="text-2xl font-mono font-black text-amber-300 mt-1 block">
              ${softCapTarget.toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Funded Startups (Clean Metric Only) */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between col-span-1">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Funded Startups
            </span>
            <span className="text-2xl font-mono font-black text-indigo-400 mt-1 block">
              {fundedCount} / {groups.length}
            </span>
          </div>
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Action Panel (Column 4: Consolidated Action Buttons) */}
        <div className="glass-panel p-3 rounded-2xl border border-slate-800 col-span-1 flex items-center justify-end">
          <div className="flex flex-wrap items-center justify-end gap-2 w-full h-full">
            {room?.status === 'setup' && (
              <button
                onClick={startRoomSession}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-lg transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start</span>
              </button>
            )}

            <button
              onClick={onOpenMiningModal}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center space-x-1 shadow-lg transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Mining</span>
            </button>

            <button
              onClick={() => setIsTransactionAuditOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-lg transition-all"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Audit Log</span>
            </button>

            <button
              onClick={onOpenAuditModal}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-lg transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Attendance</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Room Settings & Reset"
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (confirm("End pitching session and freeze leaderboard?")) endSession();
              }}
              title="End Pitching Session"
              className="p-2 bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition-all"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 3. MAIN TERMINAL GRID: ZERO-BASELINE LINECHART & MARKET OVERVIEW */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        
        {/* LEFT / CENTER: ZERO-BASELINE LINECHART (8 Cols) */}
        <div className="lg:col-span-8 glass-card rounded-3xl p-4 border border-slate-800 flex flex-col justify-between min-h-0">
          <StartupTrajectoryChart />
        </div>

        {/* RIGHT: MARKET OVERVIEW / STARTUP FUNDING BOARD (4 Cols) */}
        <div className="lg:col-span-4 glass-card rounded-3xl p-4 border border-slate-800 flex flex-col justify-between min-h-0 overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Startup Raised Capital Board</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Soft Cap: ${softCapTarget}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 py-2 pr-1 min-h-0">
            {marketGroups.map((g) => (
              <div
                key={g.groupId || g.id}
                className={`p-3 rounded-2xl border transition-all space-y-2 ${
                  g.isFunded ? 'glass-card border-emerald-500/50 bg-gradient-to-r from-emerald-950/30 to-slate-900 glow-emerald' :
                  'glass-panel border-slate-800 bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                      <h4 className="text-xs font-bold text-white">{g.name}</h4>
                      {g.isFunded && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[9px] font-extrabold flex items-center space-x-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>FUNDED 🚀</span>
                        </span>
                      )}
                    </div>
                    
                    {/* Treasury Left Display (Step 1 requirement) */}
                    <div className="text-[11px] font-mono text-amber-400 font-semibold mt-0.5">
                      Treasury Left: ${(g.treasuryCapital ?? g.groupBalance ?? 0).toLocaleString()}
                    </div>

                    {/* Member Count Display */}
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>Members: <strong>{g.memberCount}/{maxMembers}</strong></span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-sm font-bold text-emerald-400 block">${g.raisedCapital.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">{g.percentage}% Raised</span>
                  </div>
                </div>

                {/* Progress Bar against Soft Cap Target */}
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      g.isFunded ? 'bg-gradient-to-r from-emerald-400 to-teal-300' :
                      'bg-gradient-to-r from-indigo-500 to-amber-400'
                    }`}
                    style={{ width: `${g.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Settings Modal */}
      <RoomSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Full Transaction Audit Modal */}
      <TransactionAuditModal
        isOpen={isTransactionAuditOpen}
        onClose={() => setIsTransactionAuditOpen(false)}
      />

    </div>
  );
}
