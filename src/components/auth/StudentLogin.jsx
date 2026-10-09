import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserCheck, KeyRound, Hash, LogIn, AlertCircle } from 'lucide-react';

export default function StudentLogin() {
  const { loginAsStudent } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [stdId, setStdId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!roomCode || roomCode.length !== 6) {
      setError('Please enter a valid 6-digit Room Code.');
      return;
    }
    if (!stdId.trim()) {
      setError('Please enter your Student ID.');
      return;
    }
    if (!pin || pin.length !== 4) {
      setError('Please enter your 4-digit PIN (last 4 digits of Student ID).');
      return;
    }

    setLoading(true);

    try {
      const cleanStdId = stdId.trim();
      const userRef = doc(db, 'rooms', roomCode, 'users', cleanStdId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setError(`Student ID "${cleanStdId}" not found in Room #${roomCode}. Please check your Room Code or contact your teacher.`);
        setLoading(false);
        return;
      }

      const userData = userSnap.data();

      if (String(userData.pin).trim() !== String(pin).trim()) {
        setError('Incorrect PIN. Your PIN is the last 4 digits of your Student ID.');
        setLoading(false);
        return;
      }

      // Successful Auth!
      loginAsStudent(userData, roomCode);
    } catch (err) {
      console.error("Login error:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota exceeded')) {
        setError("โควตา Firebase ประจำวันเต็ม (Quota exceeded) หากต้องการใช้งานต่อทันทีโปรดอัปเกรดเป็น Blaze Plan ใน Firebase Console หรือรอระบบรีเซ็ตโควตารายวัน");
      } else {
        setError(`Login failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 mb-1">
          <UserCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Student Login</h2>
        <p className="text-sm text-slate-400">
          Enter your Room Code, Student ID, and PIN to join the simulation.
        </p>
      </div>

      {error && (
        <div className="flex items-start space-x-2.5 p-3.5 bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-300 text-xs leading-relaxed">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-slate-700/60 space-y-4">
        {/* Room Code */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <Hash className="w-3.5 h-3.5 text-indigo-400" />
            <span>Room Code (6 digits)</span>
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder="e.g. 849201"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl font-mono text-sm tracking-widest text-white placeholder-slate-500 outline-none transition-all"
            required
          />
        </div>

        {/* Student ID */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Student ID (std_id)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 65011234"
            value={stdId}
            onChange={(e) => setStdId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
            required
          />
        </div>

        {/* PIN */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>PIN Code</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Last 4 digits of std_id</span>
          </label>
          <input
            type="password"
            maxLength={4}
            placeholder="e.g. 1234"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl font-mono text-sm tracking-widest text-white placeholder-slate-500 outline-none transition-all"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 pt-3"
        >
          {loading ? (
            <span>Logging in...</span>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Enter Classroom Room</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
