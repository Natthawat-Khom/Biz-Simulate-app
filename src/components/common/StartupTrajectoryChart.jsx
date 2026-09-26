import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

const COLOR_PALETTE = [
  '#6366f1', // Indigo (Group 1)
  '#10b981', // Emerald (Group 2)
  '#f59e0b', // Amber (Group 3)
  '#ec4899', // Pink (Group 4)
  '#8b5cf6', // Violet (Group 5)
  '#06b6d4', // Cyan (Group 6)
  '#f97316', // Orange (Group 7)
  '#84cc16'  // Lime (Group 8)
];

export default function StartupTrajectoryChart() {
  const { groups, transactions } = useGame();

  // Construct Zero-Baseline ($0 Start) Time-Series Data from Raised Capital Transactions
  const chartData = useMemo(() => {
    if (groups.length === 0) return [];

    // T-0 Baseline: Every startup starts at $0 Raised Capital!
    const initialPoint = { time: '00:00' };
    groups.forEach(g => {
      initialPoint[g.name] = 0;
    });

    const points = [initialPoint];

    // Filter completed investment transactions and sort chronologically
    const completedTx = transactions
      .filter(tx => tx.status === 'completed' || !tx.status)
      .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));

    // Accumulate raised capital per group starting from $0
    const runningRaisedCapital = {};
    groups.forEach(g => {
      runningRaisedCapital[g.groupId || g.id] = 0;
      runningRaisedCapital[g.name] = 0;
    });

    completedTx.forEach((tx) => {
      if (tx.receiverGroupId && runningRaisedCapital[tx.receiverGroupId] !== undefined) {
        runningRaisedCapital[tx.receiverGroupId] += Number(tx.amount || 0);

        const groupObj = groups.find(g => (g.groupId || g.id) === tx.receiverGroupId);
        if (groupObj) {
          runningRaisedCapital[groupObj.name] = runningRaisedCapital[tx.receiverGroupId];
        }

        const timeStr = tx.timestamp?.seconds 
          ? new Date(tx.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : `Point ${points.length}`;

        const pointObj = { time: timeStr };
        groups.forEach(g => {
          pointObj[g.name] = runningRaisedCapital[g.name] || runningRaisedCapital[g.groupId || g.id] || 0;
        });

        points.push(pointObj);
      }
    });

    return points;
  }, [groups, transactions]);

  return (
    <div className="w-full h-full flex flex-col justify-between min-h-0">
      
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Startup Funding Trajectory (Raised Capital starting at $0)</h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          <span>LIVE ZERO-BASELINE</span>
        </span>
      </div>

      {/* Zero-Baseline Recharts LineChart */}
      <div className="flex-1 w-full pt-3 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val}`} domain={[0, 'auto']} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                borderColor: 'rgba(255,255,255,0.1)', 
                borderRadius: '12px',
                fontSize: '12px'
              }}
              itemStyle={{ padding: '2px 0' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
            {groups.map((g, idx) => (
              <Line
                key={g.groupId || g.id}
                type="monotone"
                dataKey={g.name}
                stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
