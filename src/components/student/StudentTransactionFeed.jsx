import React from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowUpRight, ShieldCheck, History } from 'lucide-react';

export default function StudentTransactionFeed() {
  const { transactions = [], users = [] } = useGame() || {};
  const { currentUser } = useAuth() || {};

  if (!currentUser) {
    return (
      <div className="glass-card rounded-3xl p-6 border border-slate-800 text-xs text-slate-400">
        Loading transaction stream...
      </div>
    );
  }

  const studentId = String(currentUser?.stdId || '');
  const myUserDoc = (users || []).find(u => String(u?.std_id || u?.stdId) === studentId);
  const myGroupId = myUserDoc?.groupId;

  // Step 2 Filter Logic: Filter stream safely to show ONLY transactions related to student or their group
  const myFilteredTx = (transactions || []).filter(tx => {
    if (!currentUser || !tx) return false;
    const isRelated = (
      (tx.senderId && String(tx.senderId) === studentId) ||
      (myGroupId && tx.senderGroupId === myGroupId) ||
      (myGroupId && tx.receiverGroupId === myGroupId)
    );
    return isRelated;
  });

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">ประวัติการลงทุน</h3>
            <p className="text-xs text-slate-400">รายการลงทุนของคุณและกลุ่มย้อนหลัง</p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
          {myFilteredTx.length} รายการ
        </span>
      </div>

      {myFilteredTx.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm italic glass-panel rounded-2xl border border-slate-800">
          ยังไม่มีประวัติการลงทุน จัดสรรทุนส่วนตัวหรือทุนกลุ่มเพื่อสร้างพอร์ตการลงทุน!
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {myFilteredTx.map((tx) => {
            const timeStr = tx.timestamp?.seconds 
              ? new Date(tx.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'เพิ่งเกิดขึ้น';

            const isPending = tx.status === 'pending';

            const maskedSender = tx.senderType === 'personal'
              ? 'ทุนส่วนตัว'
              : (tx.senderType === 'group' ? 'ทุนของกลุ่ม' : 'ระบบโบนัส');

            const maskedSubtitle = isPending
              ? 'รอการอนุมัติจากกลุ่ม'
              : (tx.senderType === 'personal' ? 'ลงทุนทุนส่วนตัว' : 'ลงทุนทุนกลุ่ม');

            return (
              <div
                key={tx.id || tx.id}
                className="flex items-center justify-between p-3 glass-panel rounded-xl border border-slate-800 hover:border-slate-700/80 transition-all text-xs"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-300 truncate">{maskedSender}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-bold text-indigo-300 shrink-0">{tx.receiverGroupName}</span>
                      {isPending && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                          รอการอนุมัติจากกลุ่ม
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {maskedSubtitle}
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
