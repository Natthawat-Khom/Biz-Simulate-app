import React from 'react';
import { useGame } from '../../context/GameContext';
import { ArrowUpRight, Zap, User, Users, ShieldAlert, History } from 'lucide-react';

export default function LiveTransactionLogs() {
  const { transactions } = useGame();

  const getSenderIcon = (type) => {
    if (type === 'personal') return <User className="w-3.5 h-3.5 text-indigo-400" />;
    if (type === 'group') return <Users className="w-3.5 h-3.5 text-amber-400" />;
    return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Live Transaction Stream</h3>
            <p className="text-xs text-slate-400">Real-time audit log of all personal & group wallet transfers</p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
          {transactions.length} Events
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm italic glass-panel rounded-2xl border border-slate-800">
          No transactions recorded yet. Transactions will stream live here.
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {transactions.map((tx) => {
            const timeStr = tx.timestamp?.seconds 
              ? new Date(tx.timestamp.seconds * 1000).toLocaleTimeString()
              : 'Just now';

            return (
              <div
                key={tx.id || tx.id}
                className="flex items-center justify-between p-3.5 glass-panel rounded-xl border border-slate-800 hover:border-slate-700/80 transition-all text-xs"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                    {getSenderIcon(tx.senderType)}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-200 truncate">{tx.senderName}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-bold text-indigo-300 shrink-0">{tx.receiverGroupName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {tx.note || tx.type}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <span className="text-sm font-mono font-bold text-emerald-400 block">
                    +${tx.amount}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
