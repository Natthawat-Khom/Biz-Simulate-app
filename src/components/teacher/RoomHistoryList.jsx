import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { History, Play, CheckCircle2, Clock, Lock, Sparkles, Hash } from 'lucide-react';

export default function RoomHistoryList() {
  const { loginAsTeacher } = useAuth();
  const [roomsList, setRoomsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setRoomsList(list);
        setLoading(false);
      }, (err) => {
        console.warn("Room history query warning:", err.message);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up room history listener:", err);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="text-center py-6 text-slate-400 text-xs animate-pulse">
        Loading room history...
      </div>
    );
  }

  if (roomsList.length === 0) {
    return (
      <div className="text-center py-8 glass-panel rounded-2xl border border-slate-800 text-slate-500 text-xs">
        No previous simulation rooms found. Click "Create Simulation Room" above to launch your first session.
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Simulation Room History</h3>
            <p className="text-xs text-slate-400">Previous and active classroom rooms in Firestore</p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
          {roomsList.length} Rooms
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
        {roomsList.map((rm) => {
          const createdDateStr = rm.createdAt?.seconds 
            ? new Date(rm.createdAt.seconds * 1000).toLocaleString()
            : 'Recently created';

          return (
            <div
              key={rm.id || rm.roomId}
              className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-indigo-300 px-2 py-0.5 bg-indigo-950 border border-indigo-500/30 rounded-md">
                      #{rm.roomId || rm.id}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                      rm.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      rm.status === 'mining' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                      rm.status === 'ended' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {rm.status || 'setup'}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white truncate">
                  {rm.activityName || `Activity Room #${rm.roomId || rm.id}`}
                </h4>

                <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{createdDateStr}</span>
                </div>
              </div>

              <button
                onClick={() => loginAsTeacher(rm.roomId || rm.id)}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Enter / Monitor Room</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
