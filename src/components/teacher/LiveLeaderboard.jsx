import React from 'react';
import { useGame } from '../../context/GameContext';
import { Trophy, TrendingUp, Medal, Award } from 'lucide-react';

export default function LiveLeaderboard() {
  const { groups, users } = useGame();

  // Compute total revenue / balance per group
  const rankedGroups = groups.map(g => {
    const groupMembers = users.filter(u => u.groupId === g.groupId || u.groupId === g.id);
    const personalTotal = groupMembers.reduce((acc, u) => acc + (Number(u.personalBalance) || 0), 0);
    const gBal = Number(g.groupBalance) || 0;
    const totalWealth = gBal + personalTotal;

    return {
      ...g,
      gBal,
      personalTotal,
      totalWealth,
      memberCount: groupMembers.length
    };
  }).sort((a, b) => b.totalWealth - a.totalWealth);

  const maxWealth = Math.max(...rankedGroups.map(g => g.totalWealth), 1000);

  const getRankBadge = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="font-mono text-sm font-bold text-slate-500">#{rank}</span>;
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Real-Time Group Leaderboard</h3>
            <p className="text-xs text-slate-400">Rankings updated dynamically via Firestore live stream</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rankedGroups.map((g, idx) => {
          const rank = idx + 1;
          const percentage = Math.min(100, Math.round((g.totalWealth / maxWealth) * 100));

          return (
            <div
              key={g.groupId || g.id}
              className={`glass-panel p-4 rounded-2xl border transition-all space-y-2.5 ${
                rank === 1 ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-slate-900 glow-amber' :
                rank === 2 ? 'border-slate-500/40 bg-slate-900/70' :
                rank === 3 ? 'border-amber-700/40 bg-slate-900/60' :
                'border-slate-800 bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900/80 border border-slate-700">
                    {getRankBadge(rank)}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center space-x-2">
                      <span>{g.name}</span>
                      <span className="text-xs font-normal text-slate-400">({g.memberCount} members)</span>
                    </h4>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                      <span>Group Wallet: <strong className="text-slate-200 font-mono">${g.gBal}</strong></span>
                      <span>Personal Sum: <strong className="text-slate-200 font-mono">${g.personalTotal}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-emerald-400 flex items-center space-x-1 justify-end">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>${g.totalWealth}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Revenue</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    rank === 1 ? 'bg-gradient-to-r from-amber-500 to-emerald-400' :
                    rank === 2 ? 'bg-gradient-to-r from-slate-400 to-indigo-400' :
                    rank === 3 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                    'bg-indigo-500/60'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
