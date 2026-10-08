import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Users, Crown, ShieldAlert, Check, ArrowRightLeft, UserMinus, LogOut } from 'lucide-react';

export default function GroupManager() {
  const { groups, users, overrideGroupLeader, moveStudentToGroup, removeStudentFromGroup, room } = useGame();
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [movingStudentId, setMovingStudentId] = useState(null);

  const maxMembers = room?.settings?.maxGroupMembers || 5;

  const handleOpenOverride = (group) => {
    setEditingGroupId(group.groupId);
    setSelectedLeaderId(group.leaderId || '');
  };

  const handleSaveLeader = async (groupId) => {
    if (!selectedLeaderId) return;
    await overrideGroupLeader(groupId, selectedLeaderId);
    setEditingGroupId(null);
  };

  const handleRemoveMember = async (studentId, studentName) => {
    if (!window.confirm(`นำ "${studentName}" ออกจากกลุ่มนี้หรือไม่?`)) return;
    await removeStudentFromGroup(studentId);
  };

  const handleMoveMember = async (studentId, targetGroupId) => {
    if (!targetGroupId) return;
    await moveStudentToGroup(studentId, targetGroupId);
    setMovingStudentId(null);
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Group Roster & Leader Override</h3>
            <p className="text-xs text-slate-400">Manage student groups, member allocations, and leaders</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => {
          const currentGroupId = group.groupId || group.id;
          const groupMembers = users.filter(u => u.groupId === currentGroupId);
          const currentLeader = groupMembers.find(u => String(u.std_id || u.stdId) === String(group.leaderId)) || 
                                groupMembers.find(u => u.isLeader);

          const isEditing = editingGroupId === currentGroupId;

          return (
            <div
              key={currentGroupId}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition-all space-y-4"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>{group.name}</span>
                    <span className="text-xs font-normal text-slate-400">
                      ({groupMembers.length}/{maxMembers} members)
                    </span>
                  </h4>
                  <div className="text-xs text-emerald-400 font-mono font-medium mt-0.5">
                    Group Balance: ${group.groupBalance ?? 0}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenOverride(group)}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Leader Override</span>
                </button>
              </div>

              {/* Leader Override Form Inline */}
              {isEditing ? (
                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-amber-300 flex items-center space-x-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Select New Leader for {group.name}</span>
                  </span>
                  <select
                    value={selectedLeaderId}
                    onChange={(e) => setSelectedLeaderId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none"
                  >
                    <option value="">-- Choose Student --</option>
                    {groupMembers.map(m => (
                      <option key={m.std_id || m.stdId} value={m.std_id || m.stdId}>
                        {m.fullname} ({m.std_id || m.stdId})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      onClick={() => setEditingGroupId(null)}
                      className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-lg hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveLeader(currentGroupId)}
                      disabled={!selectedLeaderId}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Override</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Leader Display Badge */
                <div className="flex items-center space-x-2 px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-400">Leader:</span>
                  <span className="font-semibold text-amber-300 truncate">
                    {currentLeader ? currentLeader.fullname : 'No Leader Appointed Yet'}
                  </span>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Roster Members
                </span>
                {groupMembers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-1">No students have joined this group yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {groupMembers.map(m => {
                      const studentId = String(m.std_id || m.stdId);
                      const isL = String(m.std_id || m.stdId) === String(group.leaderId) || m.isLeader;
                      const isMovingThis = movingStudentId === studentId;

                      return (
                        <div
                          key={studentId}
                          className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <div className="flex items-center space-x-2 truncate">
                              <span className="font-mono text-slate-400 text-[11px]">{studentId}</span>
                              <span className="truncate font-medium">{m.fullname}</span>
                              {isL && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/30">
                                  LEADER
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                onClick={() => setMovingStudentId(isMovingThis ? null : studentId)}
                                title="ย้ายไปกลุ่มอื่น"
                                className="px-1.5 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] transition-colors"
                              >
                                ย้ายกลุ่ม
                              </button>
                              <button
                                onClick={() => handleRemoveMember(studentId, m.fullname)}
                                title="นำออกจากกลุ่ม"
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] transition-colors"
                              >
                                <UserMinus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Quick move dropdown inline */}
                          {isMovingThis && (
                            <div className="flex items-center space-x-1.5 pt-1 border-t border-slate-800">
                              <span className="text-[10px] text-slate-400">ย้ายไป:</span>
                              <select
                                defaultValue=""
                                onChange={(e) => handleMoveMember(studentId, e.target.value)}
                                className="flex-1 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-[11px] text-white outline-none"
                              >
                                <option value="" disabled>-- เลือกกลุ่มเป้าหมาย --</option>
                                {groups
                                  .filter(g => (g.groupId || g.id) !== currentGroupId)
                                  .map(g => (
                                    <option key={g.groupId || g.id} value={g.groupId || g.id}>
                                      {g.name} ({(g.memberIds || []).length}/{maxMembers})
                                    </option>
                                  ))}
                              </select>
                              <button
                                onClick={() => setMovingStudentId(null)}
                                className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded hover:text-white"
                              >
                                ปิด
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
