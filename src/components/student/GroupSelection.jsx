import React from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { Users, UserPlus, Crown, CheckCircle2 } from 'lucide-react';

export default function GroupSelection() {
  const { groups, users, joinGroup, room } = useGame();
  const { currentUser } = useAuth();

  const maxMembers = room?.settings?.maxGroupMembers || 5;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 mb-1">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Select Your Simulation Group</h2>
        <p className="text-sm text-slate-400">
          Choose a group to join. The first member to join a group automatically becomes the <strong>Group Leader</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => {
          const groupMembers = users.filter(u => u.groupId === group.groupId || u.groupId === group.id);
          const isFull = groupMembers.length >= maxMembers;
          const currentLeader = groupMembers.find(u => String(u.std_id || u.stdId) === String(group.leaderId)) ||
                                groupMembers.find(u => u.isLeader);

          return (
            <div
              key={group.groupId || group.id}
              className="glass-card p-6 rounded-2xl border border-slate-700/80 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{group.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isFull ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {groupMembers.length}/{maxMembers} Slots
                  </span>
                </div>

                {/* Leader Info */}
                <div className="flex items-center space-x-2 text-xs text-slate-300 px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-400">Leader:</span>
                  <span className="font-semibold text-amber-300 truncate">
                    {currentLeader ? currentLeader.fullname : 'Unassigned (Join first to become Leader!)'}
                  </span>
                </div>

                {/* Member Roster Preview */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Current Members:
                  </span>
                  {groupMembers.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No members yet. Be the first!</p>
                  ) : (
                    <ul className="text-xs text-slate-300 space-y-1">
                      {groupMembers.map(m => (
                        <li key={m.std_id || m.stdId} className="flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{m.fullname}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <button
                onClick={() => joinGroup(group.groupId || group.id)}
                disabled={isFull}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isFull ? 'Group Full' : `Join ${group.name}`}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
