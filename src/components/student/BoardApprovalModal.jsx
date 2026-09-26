import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import { ShieldCheck, XCircle, CheckCircle2, AlertTriangle, Users, DollarSign } from 'lucide-react';

export default function BoardApprovalModal() {
  const { transactions = [], users = [], groups = [], approvePendingTransaction, rejectPendingTransaction } = useGame() || {};
  const { currentUser } = useAuth() || {};
  const [loading, setLoading] = useState(false);

  if (!currentUser) return null;

  const studentId = String(currentUser?.stdId || '');
  const myUserDoc = (users || []).find(u => String(u?.std_id || u?.stdId) === studentId);
  const myGroupId = myUserDoc?.groupId;

  if (!myGroupId) return null;

  // Find active pending board transactions targeting this group
  const pendingTx = (transactions || []).find(tx => (
    tx?.status === 'pending' && 
    tx?.senderGroupId === myGroupId && 
    Array.isArray(tx?.signatures) && 
    !tx.signatures.includes(studentId)
  ));

  if (!pendingTx) return null;

  const targetGroup = groups.find(g => (g.groupId || g.id) === pendingTx.receiverGroupId);
  const targetName = targetGroup?.name || pendingTx.receiverGroupName || pendingTx.receiverGroupId;

  const signaturesCount = pendingTx.signatures.length;
  const requiredCount = pendingTx.requiredSignatures || 1;

  const handleApprove = async () => {
    setLoading(true);
    try {
      const isCompleted = await approvePendingTransaction(pendingTx.id);
      if (isCompleted) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await rejectPendingTransaction(pendingTx.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 lg:p-8 space-y-6 border border-amber-500/50 shadow-2xl glow-amber animate-pulse-subtle">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400 mb-1">
            <Users className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">รอการอนุมัติจากกลุ่ม</h2>
          <p className="text-xs text-slate-300">
            CEO ได้เสนอการลงทุนจากทุนของกลุ่ม สมาชิกในกลุ่มทุกคนต้องลงนามอนุมัติเพื่อดำเนินรายการ
          </p>
        </div>

        {/* Investment Details Card */}
        <div className="glass-card p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">สตาร์ทอัปเป้าหมาย:</span>
            <span className="font-bold text-amber-300 text-sm">{targetName}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">จำนวนเงินลงทุน:</span>
            <span className="font-mono font-extrabold text-emerald-400 text-lg">${pendingTx.amount.toLocaleString()}</span>
          </div>

          {pendingTx.note && (
            <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="font-semibold text-slate-300 block">วัตถุประสงค์ / หมายเหตุ:</span>
              <span>"{pendingTx.note}"</span>
            </div>
          )}

          {/* Board Signatures Progress */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">การลงนามอนุมัติของกรรมการกลุ่ม:</span>
              <span className="font-mono text-amber-400">
                {signaturesCount} / {requiredCount} อนุมัติแล้ว
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((signaturesCount / requiredCount) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleReject}
            disabled={loading}
            className="py-3 px-4 bg-rose-950/80 hover:bg-rose-600 border border-rose-500/40 text-rose-200 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2"
          >
            <XCircle className="w-4 h-4" />
            <span>ปฏิเสธและยกเลิก</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={loading}
            className="py-3 px-4 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'กำลังอนุมัติ...' : 'อนุมัติการลงทุน'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
