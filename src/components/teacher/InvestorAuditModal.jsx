import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { X, Users, ShieldAlert, CheckCircle2, AlertTriangle, Circle, DollarSign } from 'lucide-react';

export default function InvestorAuditModal({ isOpen, onClose }) {
  const { users, groups, room } = useGame();
  const [filter, setFilter] = useState('all'); // 'all' | 'hoarders' | 'online'

  if (!isOpen) return null;

  const initialCap = room?.settings?.startingPersonalBalance || 1000;
  const now = Date.now();

  const auditList = users.map(u => {
    const bal = Number(u.personalBalance) ?? initialCap;
    const initial = Number(u.initialPersonalBalance) || initialCap;
    const deployed = Math.max(0, initial - bal);
    const deployedPct = Math.min(100, Math.round((deployed / initial) * 100));
    
    // Heartbeat online check (within last 90 seconds = Online)
    const lastActiveMs = u.lastActive?.seconds ? u.lastActive.seconds * 1000 : 0;
    const isOnline = lastActiveMs > 0 && (now - lastActiveMs) < 90000;

    const groupObj = groups.find(g => (g.groupId || g.id) === u.groupId);

    return {
      ...u,
      bal,
      initial,
      deployed,
      deployedPct,
      isOnline,
      groupName: groupObj ? groupObj.name : 'Unassigned',
      isHoarding: deployedPct === 0
    };
  });

  const filteredList = auditList.filter(u => {
    if (filter === 'hoarders') return u.isHoarding;
    if (filter === 'online') return u.isOnline;
    return true;
  });

  const hoarderCount = auditList.filter(u => u.isHoarding).length;
  const onlineCount = auditList.filter(u => u.isOnline).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl glass-panel rounded-3xl p-6 lg:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-indigo-500/30 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Investor Audit & Presence Terminal</h2>
              <p className="text-xs text-slate-400">Monitor active student connections & identify capital hoarders (0% deployed)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills & Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              filter === 'all' ? 'border-indigo-500 bg-indigo-950/40 text-white' : 'border-slate-800 glass-card text-slate-400'
            }`}
          >
            <span className="text-[11px] font-semibold uppercase block">Total Registered Students</span>
            <span className="text-2xl font-mono font-bold text-indigo-300">{auditList.length}</span>
          </button>

          <button
            onClick={() => setFilter('online')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              filter === 'online' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 glass-card text-slate-400'
            }`}
          >
            <span className="text-[11px] font-semibold uppercase block flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Currently Online</span>
            </span>
            <span className="text-2xl font-mono font-bold text-emerald-400">{onlineCount}</span>
          </button>

          <button
            onClick={() => setFilter('hoarders')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              filter === 'hoarders' ? 'border-rose-500 bg-rose-950/40 text-white' : 'border-slate-800 glass-card text-slate-400'
            }`}
          >
            <span className="text-[11px] font-semibold uppercase block text-rose-400 flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Capital Hoarders (0% Deployed)</span>
            </span>
            <span className="text-2xl font-mono font-bold text-rose-400">{hoarderCount}</span>
          </button>
        </div>

        {/* Audit Data Table */}
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Status</th>
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Group</th>
                  <th className="p-3">Remaining Balance</th>
                  <th className="p-3">Capital Deployed %</th>
                  <th className="p-3 text-right">Audit Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((st) => (
                  <tr
                    key={st.std_id || st.stdId}
                    className={`hover:bg-slate-900/40 transition-colors ${
                      st.isHoarding ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="p-3">
                      {st.isOnline ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Circle className="w-2 h-2 fill-current" />
                          <span>Online</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          <Circle className="w-2 h-2 fill-current opacity-40" />
                          <span>Offline</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-mono font-bold text-indigo-300">
                      {st.std_id || st.stdId}
                    </td>

                    <td className="p-3 font-medium text-white truncate max-w-xs">
                      {st.fullname}
                    </td>

                    <td className="p-3 text-slate-300 font-semibold">
                      {st.groupName}
                    </td>

                    <td className="p-3 font-mono font-bold text-emerald-400">
                      ${st.bal}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              st.deployedPct === 0 ? 'bg-rose-500' :
                              st.deployedPct >= 50 ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${st.deployedPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-300">{st.deployedPct}%</span>
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      {st.isHoarding ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <ShieldAlert className="w-3 h-3" />
                          <span>0% DEPLOYED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active VC</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
