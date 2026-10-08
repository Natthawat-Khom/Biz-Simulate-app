import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { X, Settings, RefreshCw, AlertTriangle, Target, DollarSign, Users, Hash, Check } from 'lucide-react';

export default function RoomSettingsModal({ isOpen, onClose }) {
  const { room, updateRoomSettings, resetRoomData } = useGame();

  const currentSettings = room?.settings || {};

  const [softCapTarget, setSoftCapTarget] = useState(5000);
  const [startingPersonalBalance, setStartingPersonalBalance] = useState(1000);
  const [startingGroupBalance, setStartingGroupBalance] = useState(2000);
  const [maxGroupMembers, setMaxGroupMembers] = useState(5);
  const [numGroups, setNumGroups] = useState(4);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Sync state whenever modal is opened or room settings change
  useEffect(() => {
    if (isOpen && room?.settings) {
      setSoftCapTarget(room.settings.softCapTarget ?? 5000);
      setStartingPersonalBalance(room.settings.startingPersonalBalance ?? 1000);
      setStartingGroupBalance(room.settings.startingGroupBalance ?? 2000);
      setMaxGroupMembers(room.settings.maxGroupMembers ?? 5);
      setNumGroups(room.settings.numGroups ?? 4);
    }
  }, [isOpen, room?.settings]);

  if (!isOpen) return null;

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateRoomSettings({
        softCapTarget: Number(softCapTarget),
        startingPersonalBalance: Number(startingPersonalBalance),
        startingGroupBalance: Number(startingGroupBalance),
        maxGroupMembers: Number(maxGroupMembers),
        numGroups: Number(numGroups),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetRoom = async () => {
    const confirmMessage = "🚨 คำเตือนสำคัญ (CRITICAL RESET)!\n\nคุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตห้องจำลองนี้?\n\nการดำเนินการนี้จะ:\n1. ลบประวัติและรายการธุรกรรมทั้งหมด\n2. รีเซ็ตเงินระดมทุนของสตาร์ทอัพเป็น $0\n3. คืนเงินส่วนตัวและเงินคลังกลุ่มเป็นค่าเริ่มต้น\n4. นำนักศึกษาออกจากกลุ่มทั้งหมด (ให้เลือกกลุ่มใหม่)";
    
    if (!window.confirm(confirmMessage)) return;

    setResetting(true);
    try {
      await resetRoomData();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 lg:p-8 space-y-6 border border-indigo-500/40 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Dynamic Room Settings</h2>
              <p className="text-xs text-slate-400">Update parameters live or restart ecosystem simulation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Soft Cap Goal Target */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Soft Cap Goal Target ($)</span>
              </label>
              <input
                type="number"
                min={500}
                step={500}
                value={softCapTarget}
                onChange={(e) => setSoftCapTarget(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-amber-500/40 text-amber-300 font-mono font-bold rounded-xl text-sm outline-none"
                required
              />
            </div>

            {/* Starting Group Treasury */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Starting Startup Treasury ($)</span>
              </label>
              <input
                type="number"
                min={0}
                value={startingGroupBalance}
                onChange={(e) => setStartingGroupBalance(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 font-mono text-white rounded-xl text-sm outline-none"
                required
              />
            </div>

            {/* Starting Student Capital */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Starting Student Capital ($)</span>
              </label>
              <input
                type="number"
                min={0}
                value={startingPersonalBalance}
                onChange={(e) => setStartingPersonalBalance(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 font-mono text-white rounded-xl text-sm outline-none"
                required
              />
            </div>

            {/* Max Group Members */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Max Capacity Per Group</span>
              </label>
              <select
                value={maxGroupMembers}
                onChange={(e) => setMaxGroupMembers(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 text-white rounded-xl text-sm outline-none"
              >
                <option value={1}>1 Member / Group</option>
                <option value={2}>2 Members / Group</option>
                <option value={3}>3 Members / Group</option>
                <option value={4}>4 Members / Group</option>
                <option value={5}>5 Members / Group</option>
                <option value={6}>6 Members / Group</option>
                <option value={7}>7 Members / Group</option>
                <option value={8}>8 Members / Group</option>
                <option value={9}>9 Members / Group</option>
                <option value={10}>10 Members / Group</option>
              </select>
            </div>

            {/* Number of Groups */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                <span>Total Startup Groups</span>
              </label>
              <input
                type="number"
                min={2}
                max={12}
                value={numGroups}
                onChange={(e) => setNumGroups(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 text-white rounded-xl text-sm outline-none"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            
            {/* Red Reset Room Button */}
            <button
              type="button"
              onClick={handleResetRoom}
              disabled={resetting || saving}
              className="px-4 py-2.5 bg-rose-950/80 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Resetting...' : 'Reset Room Data'}</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || resetting}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
}
