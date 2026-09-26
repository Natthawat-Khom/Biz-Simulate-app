import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Award, Lock, TrendingUp } from 'lucide-react';

export default function FinalSummaryView() {
  const { groups, users } = useGame();

  // Compute final group revenues
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
      memberCount: groupMembers.length,
      members: groupMembers
    };
  }).sort((a, b) => b.totalWealth - a.totalWealth);

  // Trigger celebration confetti
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 }
    });
  }, []);

  const firstPlace = rankedGroups[0];
  const secondPlace = rankedGroups[1];
  const thirdPlace = rankedGroups[2];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      
      {/* Frozen Session Banner */}
      <div className="p-4 glass-card rounded-2xl border border-rose-500/40 bg-rose-950/40 text-rose-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">SIMULATION SESSION FROZEN & COMPLETED</h2>
            <p className="text-xs text-rose-300">All transaction features are disabled. Final leaderboard is locked.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-xs font-mono font-bold text-rose-300">
          ENDED
        </span>
      </div>

      {/* Podium Celebration */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
          🏆 FINAL WINNERS PODIUM
        </h1>
        <p className="text-sm text-slate-400">Congratulations to all simulation business teams!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
        
        {/* 2nd Place */}
        {secondPlace && (
          <div className="glass-panel rounded-3xl p-6 border border-slate-400/30 text-center space-y-3 order-2 md:order-1">
            <div className="inline-flex p-3 bg-slate-400/10 border border-slate-400/30 rounded-full text-slate-300">
              <Medal className="w-8 h-8" />
            </div>
            <div className="text-xs font-mono font-bold text-slate-400">2ND PLACE</div>
            <h3 className="text-xl font-bold text-white">{secondPlace.name}</h3>
            <div className="text-2xl font-mono font-extrabold text-emerald-400">${secondPlace.totalWealth}</div>
            <div className="text-xs text-slate-400 font-medium">
              Group Wallet: ${secondPlace.gBal} | Personal: ${secondPlace.personalTotal}
            </div>
          </div>
        )}

        {/* 1st Place */}
        {firstPlace && (
          <div className="glass-panel rounded-3xl p-8 border border-amber-500/50 text-center space-y-4 glow-amber bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 order-1 md:order-2 transform md:-translate-y-4">
            <div className="inline-flex p-4 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400">
              <Trophy className="w-12 h-12" />
            </div>
            <div className="text-sm font-mono font-extrabold text-amber-400 tracking-wider">🥇 CHAMPION 1ST PLACE</div>
            <h2 className="text-2xl font-extrabold text-white">{firstPlace.name}</h2>
            <div className="text-4xl font-mono font-black text-amber-300">${firstPlace.totalWealth}</div>
            <div className="text-xs text-slate-300 font-medium">
              Group Wallet: ${firstPlace.gBal} | Personal: ${firstPlace.personalTotal}
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {thirdPlace && (
          <div className="glass-panel rounded-3xl p-6 border border-amber-700/30 text-center space-y-3 order-3">
            <div className="inline-flex p-3 bg-amber-700/10 border border-amber-700/30 rounded-full text-amber-600">
              <Award className="w-8 h-8" />
            </div>
            <div className="text-xs font-mono font-bold text-amber-600">3RD PLACE</div>
            <h3 className="text-xl font-bold text-white">{thirdPlace.name}</h3>
            <div className="text-2xl font-mono font-extrabold text-emerald-400">${thirdPlace.totalWealth}</div>
            <div className="text-xs text-slate-400 font-medium">
              Group Wallet: ${thirdPlace.gBal} | Personal: ${thirdPlace.personalTotal}
            </div>
          </div>
        )}

      </div>

      {/* Full Leaderboard Table */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <span>Complete Final Group Standings</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Group Name</th>
                <th className="p-3">Members</th>
                <th className="p-3">Group Wallet</th>
                <th className="p-3">Personal Total</th>
                <th className="p-3 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rankedGroups.map((g, idx) => (
                <tr key={g.groupId || g.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-mono font-bold text-indigo-400">#{idx + 1}</td>
                  <td className="p-3 font-semibold text-white">{g.name}</td>
                  <td className="p-3">{g.memberCount} Students</td>
                  <td className="p-3 font-mono text-emerald-400">${g.gBal}</td>
                  <td className="p-3 font-mono text-emerald-400">${g.personalTotal}</td>
                  <td className="p-3 font-mono font-bold text-amber-300 text-right text-sm">
                    ${g.totalWealth}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
