import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { LogOut, Shield, UserCheck, Award, Zap, Coins } from 'lucide-react';

export default function Navbar() {
  const { currentUser, roomId, logout, isTeacher, isStudent } = useAuth();
  const { room, users, groups } = useGame();

  if (!currentUser) return null;

  const myUserDoc = users.find(u => String(u.std_id || u.stdId) === String(currentUser?.stdId));
  const myGroup = groups.find(g => g.groupId === myUserDoc?.groupId || g.id === myUserDoc?.groupId);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Room Code */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25">
            <Zap className="w-5 h-5 text-white animate-pulse-subtle" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              BizSimulate
            </h1>
            {roomId && (
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span>Room Code:</span>
                <span className="font-mono font-semibold px-2 py-0.5 bg-indigo-950/80 border border-indigo-500/30 rounded-md text-indigo-300">
                  {roomId}
                </span>
                {room?.status && (
                  <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${
                    room.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    room.status === 'mining' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' :
                    room.status === 'ended' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    'bg-slate-700/50 text-slate-300 border border-slate-600'
                  }`}>
                    {room.status}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center space-x-4">
          
          {/* User Details Pill */}
          <div className="hidden sm:flex items-center space-x-3 px-3.5 py-1.5 glass-card rounded-full text-xs">
            <div className="flex items-center space-x-1.5">
              {isTeacher ? (
                <Shield className="w-4 h-4 text-amber-400" />
              ) : (
                <UserCheck className="w-4 h-4 text-indigo-400" />
              )}
              <span className="font-medium text-slate-200">{currentUser.fullname}</span>
            </div>

            {isStudent && (
              <>
                <div className="h-3 w-px bg-slate-700" />
                <div className="flex items-center space-x-1 text-slate-300">
                  <span className="text-slate-400">Group:</span>
                  <span className="font-semibold text-indigo-300">
                    {myGroup ? myGroup.name : 'Unassigned'}
                  </span>
                  {myUserDoc?.isLeader && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <Award className="w-3 h-3 mr-0.5" /> LEADER
                    </span>
                  )}
                </div>

                <div className="h-3 w-px bg-slate-700" />
                <div className="flex items-center space-x-1 text-emerald-400 font-mono font-semibold">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span>${myUserDoc?.personalBalance ?? 0}</span>
                </div>
              </>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            title="Leave Session"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Exit</span>
          </button>
        </div>

      </div>
    </header>
  );
}
