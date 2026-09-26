import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { 
  X, 
  ClipboardList, 
  Search, 
  ArrowUpRight, 
  User, 
  Users, 
  Zap, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  XCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function TransactionAuditModal({ isOpen, onClose }) {
  const { transactions = [], users = [], groups = [] } = useGame() || {};
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (!isOpen) return null;

  // Process & unmask 100% of transaction data
  const processedTransactions = transactions.map((tx) => {
    // Unmask Sender Name and Group
    const senderUser = users.find(u => String(u.std_id || u.stdId) === String(tx.senderId));
    const senderGroupObj = groups.find(g => (g.groupId || g.id) === tx.senderGroupId);

    let senderName = tx.senderName || senderUser?.fullname || tx.senderId || 'System';
    let senderGroupName = senderGroupObj?.name || (tx.senderGroupId ? tx.senderGroupId.replace('group_', 'Group ') : '');

    let fullSenderDisplay = senderName;
    if (senderGroupName && !senderName.includes(senderGroupName)) {
      fullSenderDisplay = `${senderName} (${senderGroupName})`;
    }

    const timeStr = tx.timestamp?.seconds
      ? new Date(tx.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : 'Recently';

    return {
      ...tx,
      senderDisplay: fullSenderDisplay,
      senderGroupName,
      receiverName: tx.receiverGroupName || tx.receiverGroupId || 'Group Target',
      timeStr,
      amount: Number(tx.amount || 0)
    };
  });

  // Filter transactions by search term & status
  const filteredTx = processedTransactions.filter((tx) => {
    const matchesSearch = 
      tx.senderDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.note || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-extrabold flex items-center space-x-1 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            <span>COMPLETED</span>
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-extrabold flex items-center space-x-1 shrink-0">
            <Clock className="w-3 h-3 animate-spin" />
            <span>AWAITING BOARD</span>
          </span>
        );
      case 'revoked':
        return (
          <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-[10px] font-extrabold flex items-center space-x-1 shrink-0">
            <RotateCcw className="w-3 h-3" />
            <span>REVOKED</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 bg-red-950 text-red-400 border border-red-800 rounded-full text-[10px] font-extrabold flex items-center space-x-1 shrink-0">
            <XCircle className="w-3 h-3" />
            <span>REJECTED</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-[10px] font-extrabold shrink-0">
            {status || 'COMPLETED'}
          </span>
        );
    }
  };

  const getSenderIcon = (type) => {
    if (type === 'personal') return <User className="w-3.5 h-3.5 text-indigo-400" />;
    if (type === 'group') return <Users className="w-3.5 h-3.5 text-amber-400" />;
    return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[85vh] glass-panel rounded-3xl p-6 flex flex-col space-y-4 border border-indigo-500/40 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">Full Transaction Audit Log</h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold rounded-full">
                  100% UNMASKED DATA
                </span>
              </div>
              <p className="text-xs text-slate-400">Complete real-time audit history of all ecosystem capital transfers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student name, group, or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white outline-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs overflow-x-auto w-full sm:w-auto">
            {['all', 'completed', 'pending', 'revoked'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Data Table */}
        <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950/60 min-h-0">
          {filteredTx.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm font-mono italic">
              No transactions match the selected criteria.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Sender (Unmasked)</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Target Startup</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Note / Rationale</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTx.map((tx) => (
                  <tr key={tx.id || Math.random()} className="hover:bg-slate-900/60 transition-colors font-sans">
                    
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {tx.timeStr}
                    </td>

                    {/* Unmasked Sender */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
                          {getSenderIcon(tx.senderType)}
                        </div>
                        <span className="font-bold text-white text-xs">{tx.senderDisplay}</span>
                      </div>
                    </td>

                    {/* Sender Type */}
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-indigo-300 uppercase">
                        {tx.senderType === 'personal' ? 'Angel Capital' : (tx.senderType === 'group' ? 'Treasury Deal' : 'System')}
                      </span>
                    </td>

                    {/* Target Startup */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 font-bold text-amber-300">
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                        <span>{tx.receiverName}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-400 text-sm whitespace-nowrap">
                      ${tx.amount.toLocaleString()}
                    </td>

                    {/* Note */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                      {tx.note || 'Standard Venture Transfer'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(tx.status)}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400 shrink-0">
          <span>Showing <strong>{filteredTx.length}</strong> of <strong>{transactions.length}</strong> total transactions</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl font-semibold transition-colors"
          >
            Close Audit Log
          </button>
        </div>

      </div>
    </div>
  );
}
