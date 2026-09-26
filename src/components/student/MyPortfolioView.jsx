import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { PieChart, RotateCcw, CheckCircle2, AlertCircle, DollarSign, History } from 'lucide-react';

export default function MyPortfolioView() {
  const { transactions = [], users = [], groups = [], room, revokeInvestment } = useGame() || {};
  const { currentUser } = useAuth() || {};
  const [loadingTxId, setLoadingTxId] = useState(null);

  if (!currentUser) return null;

  const studentId = String(currentUser?.stdId || '');
  const myUserDoc = (users || []).find(u => String(u?.std_id || u?.stdId) === studentId);
  const myGroupId = myUserDoc?.groupId;

  // Filter completed outbound investments made by student or their group
  const myOutboundInvestments = (transactions || []).filter(tx => (
    tx?.status === 'completed' &&
    ((tx?.senderId && String(tx.senderId) === studentId) || (myGroupId && tx?.senderGroupId === myGroupId))
  ));

  const handleRevoke = async (txId, targetName, amount) => {
    if (room?.status === 'ended') {
      alert("Session has ended. Investments cannot be revoked.");
      return;
    }

    if (!window.confirm(`Are you sure you want to REVOKE your $${amount} investment in ${targetName}?\n\nThe funds will be refunded back to your wallet immediately.`)) {
      return;
    }

    setLoadingTxId(txId);
    try {
      await revokeInvestment(txId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTxId(null);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">พอร์ตการลงทุนของฉัน</h3>
            <p className="text-xs text-slate-400">จัดการและถอนเงินลงทุนออกจากสตาร์ทอัป</p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
          {myOutboundInvestments.length} รายการ
        </span>
      </div>

      {myOutboundInvestments.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm italic glass-panel rounded-2xl border border-slate-800">
          คุณยังไม่ได้จัดสรรเงินลงทุน ลงทุนในสตาร์ทอัปเพื่อสร้างพอร์ตการลงทุนของคุณ!
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {myOutboundInvestments.map((tx) => {
            const timeStr = tx.timestamp?.seconds
              ? new Date(tx.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'เมื่อเร็วๆ นี้';

            const isRevoking = loadingTxId === tx.id;

            return (
              <div
                key={tx.id || tx.id}
                className="flex items-center justify-between p-3.5 glass-panel rounded-xl border border-slate-800 hover:border-slate-700/80 transition-all text-xs"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm truncate">{tx.receiverGroupName}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-indigo-300">
                        {tx.senderType === 'personal' ? 'ทุนส่วนตัว' : 'ทุนกลุ่ม'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {tx.note || 'การลงทุนสตาร์ทอัป'} • <span className="font-mono">{timeStr}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0 pl-3">
                  <span className="text-base font-mono font-bold text-emerald-400">
                    ${tx.amount.toLocaleString()}
                  </span>

                  <button
                    onClick={() => handleRevoke(tx.id, tx.receiverGroupName, tx.amount)}
                    disabled={isRevoking || room?.status === 'ended'}
                    className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRevoking ? 'animate-spin' : ''}`} />
                    <span>{isRevoking ? 'กำลังถอนทุน...' : 'ถอนทุน'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
