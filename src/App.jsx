import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider, useGame } from './context/GameContext';
import Navbar from './components/common/Navbar';
import AlertToast from './components/common/AlertToast';
import TeacherLogin from './components/auth/TeacherLogin';
import StudentLogin from './components/auth/StudentLogin';
import RoomSetupModal from './components/teacher/RoomSetupModal';
import GroupManager from './components/teacher/GroupManager';
import LiveLeaderboard from './components/teacher/LiveLeaderboard';
import LiveTransactionLogs from './components/teacher/LiveTransactionLogs';
import MiningControlModal from './components/teacher/MiningControlModal';
import RoomHistoryList from './components/teacher/RoomHistoryList';
import StockMarketDashboard from './components/teacher/StockMarketDashboard';
import InvestorAuditModal from './components/teacher/InvestorAuditModal';
import GroupSelection from './components/student/GroupSelection';
import WalletPanel from './components/student/WalletPanel';
import TransferModal from './components/student/TransferModal';
import MiningGameModal from './components/student/MiningGameModal';
import BoardApprovalModal from './components/student/BoardApprovalModal';
import StudentTransactionFeed from './components/student/StudentTransactionFeed';
import StartupTrajectoryChart from './components/common/StartupTrajectoryChart';
import MyPortfolioView from './components/student/MyPortfolioView';
import FinalSummaryView from './components/end/FinalSummaryView';
import { Shield, UserCheck, Play, Lock, Zap, Sparkles } from 'lucide-react';

function MainApp() {
  const { currentUser, isTeacher, isStudent } = useAuth();
  const { room, users, startRoomSession, endSession } = useGame();

  // Navigation & Modal states
  const [authRole, setAuthRole] = useState('student'); // 'student' | 'teacher'
  const [isRoomSetupOpen, setIsRoomSetupOpen] = useState(false);
  const [isMiningControlOpen, setIsMiningControlOpen] = useState(false);
  const [isInvestorAuditOpen, setIsInvestorAuditOpen] = useState(false);
  const [transferSenderType, setTransferSenderType] = useState(null); // 'personal' | 'group' | null

  const myUserDoc = users.find(u => String(u.std_id || u.stdId) === String(currentUser?.stdId));
  const hasGroup = Boolean(myUserDoc?.groupId);
  const isRoomEnded = room?.status === 'ended';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <AlertToast />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        
        {/* --- 1. UNAUTHENTICATED / LOGIN SCREEN --- */}
        {!currentUser ? (
          <div className="max-w-xl mx-auto py-8 space-y-8">
            
            {/* Hero Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero-Server Startup Pitch & Venture Ecosystem</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                BizSimulate
              </h1>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Real-time pitch terminal, venture capital deployment, and board approval simulator for classroom learning.
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="flex p-1.5 glass-panel rounded-2xl border border-slate-800">
              <button
                onClick={() => setAuthRole('student')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  authRole === 'student'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Student Investor Login</span>
              </button>

              <button
                onClick={() => setAuthRole('teacher')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  authRole === 'teacher'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Teacher Dashboard</span>
              </button>
            </div>

            {/* Form View */}
            <div className="pt-2">
              {authRole === 'student' ? (
                <StudentLogin />
              ) : (
                <TeacherLogin onOpenCreateModal={() => setIsRoomSetupOpen(true)} />
              )}
            </div>
          </div>

        ) : isRoomEnded ? (

          /* --- 2. END GAME / FROZEN ROOM VIEW --- */
          <FinalSummaryView />

        ) : isTeacher ? (

          /* --- 3. TEACHER DASHBOARD VIEW (SINGLE-SCREEN STOCK MARKET TERMINAL) --- */
          <StockMarketDashboard
            onOpenMiningModal={() => setIsMiningControlOpen(true)}
            onOpenAuditModal={() => setIsInvestorAuditOpen(true)}
          />

        ) : isStudent ? (

          /* --- 4. STUDENT DASHBOARD VIEW --- */
          !hasGroup ? (
            <GroupSelection />
          ) : (
            <div className="space-y-6">
              
              {/* Wallet Balances Panel */}
              <WalletPanel onOpenTransferModal={setTransferSenderType} />

              {/* Trajectory LineChart & Anonymous Student Transaction Feed (Step 5 Chart Parity) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 glass-card rounded-3xl p-5 border border-slate-800 h-96">
                  <StartupTrajectoryChart />
                </div>
                <div className="lg:col-span-5 space-y-6">
                  <StudentTransactionFeed />
                </div>
              </div>

              {/* My Portfolio & Investment Revocation Panel (Step 6) */}
              <MyPortfolioView />

            </div>
          )

        ) : null}

      </main>

      {/* --- MODALS --- */}
      <RoomSetupModal
        isOpen={isRoomSetupOpen}
        onClose={() => setIsRoomSetupOpen(false)}
      />

      <MiningControlModal
        isOpen={isMiningControlOpen}
        onClose={() => setIsMiningControlOpen(false)}
      />

      <InvestorAuditModal
        isOpen={isInvestorAuditOpen}
        onClose={() => setIsInvestorAuditOpen(false)}
      />

      <TransferModal
        isOpen={Boolean(transferSenderType)}
        senderType={transferSenderType}
        onClose={() => setTransferSenderType(null)}
      />

      <MiningGameModal />
      <BoardApprovalModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <MainApp />
      </GameProvider>
    </AuthProvider>
  );
}
