import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import { Zap, Trophy, Flame, Sparkles, CheckCircle2, LogOut } from 'lucide-react';

export default function MiningGameModal() {
  const { room, users, recordMiningTap } = useGame() || {};
  const { currentUser } = useAuth() || {};
  const [particles, setParticles] = useState([]);
  const [isDismissed, setIsDismissed] = useState(false);

  const isMining = room?.status === 'mining';

  // Step 2: Auto-dismiss when room status changes from 'mining' back to 'active'
  useEffect(() => {
    if (room?.status !== 'mining') {
      setIsDismissed(true);
    } else {
      setIsDismissed(false);
    }
  }, [room?.status]);

  const studentId = String(currentUser?.stdId || '');
  const myUserDoc = (users || []).find(u => String(u?.std_id || u?.stdId) === studentId);
  const taps = myUserDoc?.miningTaps || 0;

  const winners = room?.miningState?.winners || [];
  const myWin = winners.find(w => String(w.stdId) === studentId);

  // Trigger confetti when student wins
  useEffect(() => {
    if (myWin) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [myWin?.rank]);

  if (!isMining || isDismissed) return null;

  const handleTap = (e) => {
    if (taps >= 50 || myWin) return;

    recordMiningTap();

    // Floating particle click effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newParticle = { id: Date.now() + Math.random(), x, y };
    setParticles(prev => [...prev.slice(-10), newParticle]);
  };

  const pct = Math.min(100, Math.round((taps / 50) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 lg:p-8 text-center space-y-6 border border-amber-500/50 shadow-2xl glow-amber animate-pulse-subtle">
        
        {/* Event Header */}
        <div className="space-y-2">
          <div className="inline-flex p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400 mb-1">
            <Zap className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">⚡ MINING SPEED RACE!</h2>
          <p className="text-xs text-slate-300">
            กดปุ่มให้ครบ <strong>50 ครั้ง</strong> ให้เร็วที่สุด! นักเรียน 3 คนแรกรับโบนัสทันที!
          </p>
        </div>

        {/* Winner Announcement Card */}
        {myWin ? (
          <div className="p-4 glass-card rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 space-y-2">
            <div className="flex items-center justify-center space-x-2 text-amber-400 font-extrabold text-lg">
              <Trophy className="w-6 h-6" />
              <span>คุณชนะอันดับที่ #{myWin.rank}!</span>
            </div>
            <div className="text-xs text-slate-300">
              รางวัล: <strong className="text-emerald-400 font-mono text-sm">+${myWin.reward} โบนัส</strong> เติมเข้ากระเป๋าส่วนตัวของคุณเรียบร้อยแล้ว!
            </div>
          </div>
        ) : (
          /* Tap Counter & Progress Bar */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400 flex items-center space-x-1">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>จำนวนการกด</span>
              </span>
              <span className="font-mono text-base font-bold text-amber-300">
                {taps} / 50
              </span>
            </div>

            <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-indigo-400 rounded-full transition-all duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Big Interactive Tap Button */}
        <div className="py-2">
          <button
            onClick={handleTap}
            disabled={taps >= 50 || Boolean(myWin)}
            className={`relative w-44 h-44 mx-auto rounded-full font-extrabold text-xl shadow-2xl transition-transform active:scale-95 flex flex-col items-center justify-center space-y-2 border-4 ${
              taps >= 50 || myWin ?
              'bg-slate-800 border-slate-700 text-slate-500 cursor-default' :
              'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 border-amber-300 text-slate-950 glow-amber hover:brightness-110 cursor-pointer'
            }`}
          >
            {particles.map(p => (
              <span
                key={p.id}
                className="absolute pointer-events-none text-xs font-mono font-bold text-amber-200 animate-particle"
                style={{ left: p.x, top: p.y }}
              >
                +1 TAP!
              </span>
            ))}

            {myWin ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                <span className="text-sm">สำเร็จ!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-10 h-10 animate-spin" />
                <span className="text-2xl font-black">กดเลย!</span>
              </>
            )}
          </button>
        </div>

        {/* Winners Ticker */}
        <div className="pt-1 text-xs text-slate-400 space-y-1">
          <span className="font-semibold uppercase text-slate-500">รายชื่อผู้ชนะ (Top 3):</span>
          {winners.length === 0 ? (
            <p className="italic text-slate-500 text-[11px]">ยังไม่มีผู้ชนะ ร่วมแข่งกดให้ครบ 50 ครั้งคนแรก!</p>
          ) : (
            <div className="flex justify-center space-x-3">
              {winners.map(w => (
                <span key={w.stdId} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 font-semibold text-[11px]">
                  #{w.rank} {w.fullname} (+${w.reward})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Fallback Return to Dashboard Button (Step 2 Requirement) */}
        <div className="border-t border-slate-800 pt-3">
          <button
            onClick={() => setIsDismissed(true)}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>กลับสู่หน้าหลัก (Return to Dashboard)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
