import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { X, Send, ShieldAlert, ArrowRight, DollarSign, MessageSquare, PieChart } from 'lucide-react';

export default function TransferModal({ isOpen, onClose, senderType }) {
  const { groups = [], users = [], room, transferTokens } = useGame() || {};
  const { currentUser } = useAuth() || {};

  const [targetGroupId, setTargetGroupId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !currentUser) return null;

  const studentId = String(currentUser?.stdId || '');
  const myUserDoc = users.find(u => String(u?.std_id || u?.stdId) === studentId);
  const myGroupId = myUserDoc?.groupId;

  // Filter out student's own group: Cannot transfer to own group!
  const availableTargetGroups = (groups || []).filter(g => (g?.groupId || g?.id) !== myGroupId);

  const myGroupObj = groups.find(g => (g?.groupId || g?.id) === myGroupId);
  const maxAvailable = senderType === 'personal'
    ? (myUserDoc?.personalBalance || 0)
    : (myGroupObj?.groupBalance || 0);

  const initialCap = senderType === 'personal'
    ? (myUserDoc?.initialPersonalBalance || room?.settings?.startingPersonalBalance || 1000)
    : (room?.settings?.startingGroupBalance || 2000);

  const maxSingleInvestment = Math.floor(initialCap * 0.7);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetGroupId) {
      alert("Please select a target startup group!");
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert("Please enter a valid investment amount.");
      return;
    }

    if (numAmount > maxAvailable) {
      alert(`Insufficient balance! Maximum available capital is $${maxAvailable}.`);
      return;
    }

    if (numAmount > maxSingleInvestment) {
      alert(`PORTFOLIO DIVERSIFICATION RULE:\nYou cannot invest more than 70% ($${maxSingleInvestment}) of your total capital ($${initialCap}) in a single startup!\n\nYou must split your capital across at least 2 startups.`);
      return;
    }

    setLoading(true);

    try {
      await transferTokens({
        senderType,
        targetGroupId,
        amount: numAmount,
        note
      });
      onClose();
      setAmount('');
      setNote('');
      setTargetGroupId('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 lg:p-8 space-y-6 border border-indigo-500/30 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                ลงทุน{senderType === 'personal' ? 'ทุนส่วนตัว' : 'ทุนกลุ่ม'}
              </h2>
              <p className="text-xs text-slate-400">โอนเงินทุนสนับสนุนทีมสตาร์ทอัปที่มีศักยภาพ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Diversification Alert Banner */}
        <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-xs text-amber-200 flex items-start space-x-2.5">
          <PieChart className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="block font-semibold">กฎกระจายความเสี่ยงพอร์ตการลงทุน (70% Max Rule):</strong>
            <span>ห้ามลงทุนเกิน 70% (สูงสุด <strong>${maxSingleInvestment}</strong>) ในกลุ่มเดียว ต้องกระจายพอร์ตอย่างน้อย 2 สตาร์ทอัป</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Target Group Select (Blind Target Selection - Step 5 Requirement) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">เลือกร้านค้า/กลุ่มเป้าหมายที่ต้องการลงทุน</label>
            <select
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-white outline-none"
              required
            >
              <option value="">-- เลือกกลุ่มเป้าหมาย --</option>
              {availableTargetGroups.map(g => (
                <option key={g.groupId || g.id} value={g.groupId || g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>จำนวนเงินลงทุน ($)</span>
              </label>
              <span className="text-[11px] text-slate-400">เงินทุนคงเหลือ: ${maxAvailable.toLocaleString()}</span>
            </div>
            <input
              type="number"
              min={1}
              max={Math.min(maxAvailable, maxSingleInvestment)}
              placeholder={`จำกัดการลงทุนต่อกลุ่มสูงสุด: $${maxSingleInvestment}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl font-mono text-sm text-white outline-none"
              required
            />
            <span className="text-[10px] text-slate-500 block">ลงทุนได้สูงสุดไม่เกิน: ${maxSingleInvestment}</span>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>บันทึกเหตุผลการลงทุน (ไม่บังคับ)</span>
            </label>
            <input
              type="text"
              placeholder="เช่น ลงทุนรอบ Seed Round สำหรับพัฒนาสินค้า"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading || !targetGroupId || !amount || Number(amount) > maxAvailable || Number(amount) > maxSingleInvestment}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>{loading ? 'กำลังดำเนินการ...' : 'ยืนยันการลงทุน'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
