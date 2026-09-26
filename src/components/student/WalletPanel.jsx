import React from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { Wallet, Crown, Send, ShieldAlert, ArrowUpRight, TrendingUp } from 'lucide-react';

export default function WalletPanel({ onOpenTransferModal }) {
  const { users = [], groups = [], room } = useGame() || {};
  const { currentUser } = useAuth() || {};

  if (!currentUser) return null;

  const studentId = String(currentUser?.stdId || '');
  const myUserDoc = users.find(u => String(u?.std_id || u?.stdId) === studentId);
  const myGroup = groups.find(g => g?.groupId === myUserDoc?.groupId || g?.id === myUserDoc?.groupId);

  const personalBalance = myUserDoc?.personalBalance ?? 0;
  const treasuryCapital = myGroup?.treasuryCapital ?? myGroup?.groupBalance ?? 0;
  const raisedCapital = myGroup?.raisedCapital ?? 0;
  const isLeader = Boolean(myUserDoc?.isLeader);

  const isFrozen = room?.status === 'ended';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      {/* 1. Personal VC Capital Card */}
      <div className="glass-panel rounded-3xl p-5 border border-indigo-500/30 glow-indigo space-y-4 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ทุนส่วนตัว</h3>
                <p className="text-[11px] text-slate-400">เงินลงทุนส่วนตัวสำหรับจัดสรร</p>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase">เงินทุนคงเหลือ</div>
            <div className="text-3xl font-mono font-extrabold text-emerald-400 mt-0.5">
              ${personalBalance.toLocaleString()}
            </div>
          </div>
        </div>

        <button
          onClick={() => onOpenTransferModal('personal')}
          disabled={isFrozen}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>ลงทุนทุนส่วนตัว</span>
        </button>
      </div>

      {/* 2. Group Treasury Capital Card */}
      <div className={`glass-panel rounded-3xl p-5 border transition-all space-y-4 flex flex-col justify-between ${
        isLeader ? 'border-amber-500/40 glow-amber' : 'border-slate-800'
      }`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  ทุนของกลุ่ม ({myGroup ? myGroup.name : ''})
                </h3>
                <p className="text-[11px] text-slate-400">เงินกองกลางสำหรับลงทุนในกลุ่มอื่น</p>
              </div>
            </div>
            {isLeader && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full flex items-center space-x-1">
                <Crown className="w-3 h-3" />
                <span>CEO</span>
              </span>
            )}
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase">ยอดเงินกองกลางคงเหลือ</div>
            <div className="text-3xl font-mono font-extrabold text-amber-300 mt-0.5">
              ${treasuryCapital.toLocaleString()}
            </div>
          </div>
        </div>

        {isLeader ? (
          <button
            onClick={() => onOpenTransferModal('group')}
            disabled={isFrozen}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center space-x-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>ลงทุนทุนกลุ่ม</span>
          </button>
        ) : (
          <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>CEO เป็นผู้เสนอการลงทุน (ต้องรอการอนุมัติจากกลุ่ม 100%)</span>
          </div>
        )}
      </div>

      {/* 3. Startup Raised Capital Card */}
      <div className="glass-panel rounded-3xl p-5 border border-emerald-500/30 glow-emerald space-y-4 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ยอดเงินระดมทุนที่ได้รับ</h3>
                <p className="text-[11px] text-slate-400">เงินระดมทุนสะสมที่ได้รับจากนักลงทุน</p>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase">ยอดระดมทุนรวม</div>
            <div className="text-3xl font-mono font-extrabold text-teal-300 mt-0.5">
              ${raisedCapital.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-200">
          เริ่มต้นที่ $0 แสดงผลเรียลไทม์บนกราฟเส้น Trajectory!
        </div>
      </div>

    </div>
  );
}
