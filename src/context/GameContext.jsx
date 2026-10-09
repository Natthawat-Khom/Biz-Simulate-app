import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  runTransaction,
  serverTimestamp,
  getDoc,
  getDocs,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const GameContext = createContext();

export function GameProvider({ children }) {
  const { roomId, currentUser, updateUserSession } = useAuth();

  // Firestore Real-time Synced States
  const [room, setRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Helper toast alert
  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  // Centralized Firebase Error Handler
  const handleFirebaseError = (err, fallbackMsg) => {
    console.error("Firebase operation notice:", err);
    if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota exceeded')) {
      showToast("โควตา Firebase รายวันเต็ม (Quota exceeded) หากต้องการใช้งานต่อทันทีโปรดอัปเกรดเป็น Blaze Plan ใน Firebase Console หรือรอรีเซ็ต", 'error');
    } else {
      showToast(fallbackMsg || err.message, 'error');
    }
  };

  // --- 1. SINGLE PRESENCE UPDATE (ON ROOM ENTRY ONLY) ---
  // Avoid repeated interval polling to protect Firestore daily read/write quota
  useEffect(() => {
    if (!roomId || !currentUser?.stdId || currentUser?.role === 'teacher') return;

    const studentId = String(currentUser.stdId);
    const userRef = doc(db, 'rooms', roomId, 'users', studentId);

    // Update presence once when mounting/entering room
    updateDoc(userRef, { lastActive: serverTimestamp() }).catch(() => {
      // Ignore initial presence error
    });
  }, [roomId, currentUser?.stdId, currentUser?.role]);

  // --- 2. REAL-TIME FIRESTORE LISTENERS ---
  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setUsers([]);
      setGroups([]);
      setTransactions([]);
      return;
    }

    setLoading(true);

    // Subscribe to Room document
    const roomRef = doc(db, 'rooms', roomId);
    const unsubRoom = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoom({ id: snapshot.id, ...snapshot.data() });
      } else {
        setRoom(null);
      }
      setLoading(false);
    }, (err) => {
      console.warn("Firestore Room subscription notice:", err.message);
      setLoading(false);
    });

    // Subscribe to Users subcollection
    const usersRef = collection(db, 'rooms', roomId, 'users');
    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      const userList = [];
      snapshot.forEach(docSnap => {
        userList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsers(userList);

      // Keep active user session in sync with Firestore user document
      if (currentUser?.stdId) {
        const myDoc = userList.find(u => String(u.std_id || u.stdId) === String(currentUser.stdId));
        if (myDoc) {
          updateUserSession({
            groupId: myDoc.groupId || null,
            isLeader: Boolean(myDoc.isLeader),
            personalBalance: myDoc.personalBalance || 0
          });
        }
      }
    });

    // Subscribe to Groups subcollection
    const groupsRef = collection(db, 'rooms', roomId, 'groups');
    const unsubGroups = onSnapshot(groupsRef, (snapshot) => {
      const groupList = [];
      snapshot.forEach(docSnap => {
        groupList.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort naturally by groupId (e.g. group_1, group_2, ... group_10)
      groupList.sort((a, b) => {
        const numA = parseInt(String(a.groupId || a.id).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.groupId || b.id).replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });
      setGroups(groupList);
    });

    // Subscribe to Transactions subcollection
    const txRef = collection(db, 'rooms', roomId, 'transactions');
    const unsubTx = onSnapshot(txRef, (snapshot) => {
      const txList = [];
      snapshot.forEach(docSnap => {
        txList.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort newest first
      txList.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setTransactions(txList);
    });

    return () => {
      unsubRoom();
      unsubUsers();
      unsubGroups();
      unsubTx();
    };
  }, [roomId, currentUser?.stdId]);

  // --- ACTIONS ---

  /**
   * Teacher creates room with initial settings and student roster
   */
  const createRoomWithRoster = async (newRoomId, settings, studentRoster) => {
    try {
      const roomRef = doc(db, 'rooms', newRoomId);

      // 1. Create Room document
      await setDoc(roomRef, {
        roomId: newRoomId,
        activityName: settings.activityName || `Startup Ecosystem #${newRoomId}`,
        status: 'setup', // setup -> active -> mining -> ended
        createdAt: serverTimestamp(),
        settings: {
          softCapTarget: Number(settings.softCapTarget) || 5000,
          startingPersonalBalance: Number(settings.startingPersonalBalance) || 1000,
          startingGroupBalance: Number(settings.startingGroupBalance) || 2000,
          maxGroupMembers: Number(settings.maxGroupMembers) || 5,
          numGroups: Number(settings.numGroups) || 4,
        },
        miningState: {
          active: false,
          winners: []
        }
      });

      // 2. Auto-generate Groups
      const numGroups = Number(settings.numGroups) || 4;
      const initialGroupBal = Number(settings.startingGroupBalance) || 2000;
      for (let i = 1; i <= numGroups; i++) {
        const groupId = `group_${i}`;
        const groupRef = doc(db, 'rooms', newRoomId, 'groups', groupId);
        await setDoc(groupRef, {
          groupId,
          name: `Group ${i}`,
          leaderId: null,
          groupBalance: initialGroupBal,
          treasuryCapital: initialGroupBal,
          raisedCapital: 0,
          memberIds: []
        });
      }

      // 3. Batch insert Students
      for (const student of studentRoster) {
        const userRef = doc(db, 'rooms', newRoomId, 'users', String(student.std_id));
        await setDoc(userRef, {
          stdId: String(student.std_id),
          std_id: String(student.std_id),
          fullname: student.fullname,
          pin: student.pin,
          role: 'student',
          groupId: null,
          isLeader: false,
          personalBalance: Number(settings.startingPersonalBalance) || 1000,
          initialPersonalBalance: Number(settings.startingPersonalBalance) || 1000,
          lastActive: serverTimestamp(),
          miningTaps: 0
        });
      }

      showToast(`Startup Ecosystem #${newRoomId} launched with ${studentRoster.length} student investors!`, 'success');
      return true;
    } catch (err) {
      console.error("Error creating room:", err);
      showToast(`Failed to launch room: ${err.message}`, 'error');
      throw err;
    }
  };

  /**
   * Start Room Session
   */
  const startRoomSession = async () => {
    if (!roomId) return;
    try {
      await updateDoc(doc(db, 'rooms', roomId), { status: 'active' });
      showToast("Simulation Pitch Session Opened! Venture Capital trading active.", 'success');
    } catch (err) {
      showToast(`Failed to start session: ${err.message}`, 'error');
    }
  };

  /**
   * Student joins a group
   */
  const joinGroup = async (targetGroupId) => {
    if (!roomId || !currentUser?.stdId) return;

    try {
      const studentId = String(currentUser.stdId);
      const groupRef = doc(db, 'rooms', roomId, 'groups', targetGroupId);
      const userRef = doc(db, 'rooms', roomId, 'users', studentId);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) throw new Error("Group does not exist!");

        const groupData = groupDoc.data();
        const maxMembers = room?.settings?.maxGroupMembers || 5;
        const currentMembers = groupData.memberIds || [];

        if (currentMembers.length >= maxMembers) {
          throw new Error(`Group is full! Maximum ${maxMembers} members allowed.`);
        }

        if (currentMembers.includes(studentId)) {
          throw new Error("You are already in this group!");
        }

        const prevGroupId = userDoc.exists() ? userDoc.data().groupId : null;
        let prevGroupDoc = null;
        if (prevGroupId && prevGroupId !== targetGroupId) {
          const prevGroupRef = doc(db, 'rooms', roomId, 'groups', prevGroupId);
          prevGroupDoc = await transaction.get(prevGroupRef);
        }

        // Clean up old group if student switched
        if (prevGroupDoc && prevGroupDoc.exists()) {
          const prevData = prevGroupDoc.data();
          const updatedPrevMembers = (prevData.memberIds || []).filter(id => String(id) !== studentId);
          const prevLeaderId = String(prevData.leaderId) === studentId
            ? (updatedPrevMembers.length > 0 ? updatedPrevMembers[0] : null)
            : prevData.leaderId;

          transaction.update(prevGroupDoc.ref, {
            memberIds: updatedPrevMembers,
            leaderId: prevLeaderId
          });
        }

        // Determine if student is the first to join -> becomes Leader (CEO)
        const isFirst = currentMembers.length === 0;
        const newLeaderId = isFirst ? studentId : (groupData.leaderId || null);

        // Update Group document
        transaction.update(groupRef, {
          memberIds: [...currentMembers, studentId],
          leaderId: newLeaderId
        });

        // Update Student document
        transaction.update(userRef, {
          groupId: targetGroupId,
          isLeader: isFirst,
          lastActive: serverTimestamp()
        });
      });

      showToast(`Joined ${targetGroupId.replace('group_', 'Group ')} successfully!`, 'success');
    } catch (err) {
      handleFirebaseError(err);
    }
  };

  /**
   * Teacher overrides group leader assignment
   */
  const overrideGroupLeader = async (groupId, newLeaderId) => {
    if (!roomId) return;
    try {
      const groupRef = doc(db, 'rooms', roomId, 'groups', groupId);

      await runTransaction(db, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) return;

        const currentMembers = groupDoc.data().memberIds || [];
        
        for (const mId of currentMembers) {
          const uRef = doc(db, 'rooms', roomId, 'users', String(mId));
          transaction.update(uRef, { isLeader: (String(mId) === String(newLeaderId)) });
        }

        transaction.update(groupRef, { leaderId: String(newLeaderId) });
      });

      showToast("Group CEO/Leader reassigned successfully!", 'success');
    } catch (err) {
      showToast(`Failed to update leader: ${err.message}`, 'error');
    }
  };

  /**
   * Execute Investment Transaction with Portfolio Diversification (70% Max Rule)
   * & Board Approval Consensus for Group Treasury
   */
  const transferTokens = async ({ senderType, targetGroupId, amount, note }) => {
    if (!roomId || !currentUser?.stdId) return;

    if (room?.status === 'ended') {
      showToast("Pitching session ended. All investment trading is frozen!", 'error');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast("Please enter a valid positive investment amount.", 'error');
      return;
    }

    const studentId = String(currentUser.stdId);
    const myUser = users.find(u => String(u.std_id || u.stdId) === studentId);
    const myGroupId = myUser?.groupId;

    if (!myGroupId) {
      showToast("You must join a group before investing capital.", 'error');
      return;
    }

    // STRICT RULE 1: Self-Transfer Block
    if (myGroupId === targetGroupId) {
      showToast("STRICT BLOCK: You cannot invest tokens in your own group!", 'error');
      return;
    }

    const txCollectionRef = collection(db, 'rooms', roomId, 'transactions');
    const targetGroupObj = groups.find(g => g.id === targetGroupId || g.groupId === targetGroupId);
    const targetGroupName = targetGroupObj?.name || targetGroupId;

    try {
      if (senderType === 'personal') {
        // --- PERSONAL CAPITAL INVESTMENT ---
        const senderUserRef = doc(db, 'rooms', roomId, 'users', studentId);

        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(senderUserRef);
          if (!userDoc.exists()) throw new Error("Sender user document not found.");

          const currentBal = Number(userDoc.data().personalBalance || 0);
          const initialCap = Number(userDoc.data().initialPersonalBalance) || Number(room?.settings?.startingPersonalBalance) || 1000;

          // STRICT RULE 2: Portfolio Diversification (Max 70% into a single startup)
          const maxSingleLimit = Math.floor(initialCap * 0.7);
          if (numAmount > maxSingleLimit) {
            throw new Error(`PORTFOLIO DIVERSIFICATION RULE: A single investment cannot exceed 70% ($${maxSingleLimit}) of your total capital ($${initialCap})! You must diversify across at least 2 startups.`);
          }

          if (currentBal < numAmount) {
            throw new Error(`Insufficient personal capital! Current balance is $${currentBal}.`);
          }

          const targetGroupRef = doc(db, 'rooms', roomId, 'groups', targetGroupId);
          const targetDoc = await transaction.get(targetGroupRef);
          if (!targetDoc.exists()) throw new Error("Target startup group not found.");

          const targetBal = Number(targetDoc.data().groupBalance || 0);
          const targetRaised = Number(targetDoc.data().raisedCapital || 0);

          // Deduct from Personal Capital, Credit to Target Group Raised Capital
          transaction.update(senderUserRef, { personalBalance: currentBal - numAmount, lastActive: serverTimestamp() });
          transaction.update(targetGroupRef, { 
            groupBalance: targetBal + numAmount,
            raisedCapital: targetRaised + numAmount
          });

          // Record Completed Transaction
          const newTxRef = doc(txCollectionRef);
          transaction.set(newTxRef, {
            senderType: 'personal',
            senderId: studentId,
            senderName: myUser?.fullname || studentId,
            senderGroupId: myGroupId,
            receiverGroupId: targetGroupId,
            receiverGroupName: targetGroupName,
            amount: numAmount,
            status: 'completed',
            signatures: [studentId],
            requiredSignatures: 1,
            type: 'investment',
            note: note || `Angel Seed Investment from ${myUser?.fullname}`,
            timestamp: serverTimestamp()
          });
        });

        showToast(`Invested $${numAmount} in ${targetGroupName}!`, 'success');

      } else if (senderType === 'group') {
        // --- GROUP TREASURY INVESTMENT (Board Consensus Required) ---
        if (!myUser?.isLeader) {
          showToast("ONLY the Group CEO/Leader is authorized to initiate Group Treasury transfers!", 'error');
          return;
        }

        const myGroupObj = groups.find(g => (g.groupId || g.id) === myGroupId);
        const memberCount = myGroupObj?.memberIds?.length || 1;

        const startingGBal = Number(room?.settings?.startingGroupBalance) || 2000;
        const maxSingleLimit = Math.floor(startingGBal * 0.7);

        if (numAmount > maxSingleLimit) {
          showToast(`PORTFOLIO DIVERSIFICATION RULE: Single Treasury investment cannot exceed 70% ($${maxSingleLimit}) of Treasury capital! You must diversify across startups.`, 'error');
          return;
        }

        const currentTreasuryBal = Number(myGroupObj?.treasuryCapital ?? myGroupObj?.groupBalance ?? 0);
        if (currentTreasuryBal < numAmount) {
          showToast(`Insufficient Group Treasury balance! Current treasury balance is $${currentTreasuryBal}.`, 'error');
          return;
        }

        // If group has only 1 member, auto-complete; otherwise create 'pending' board consensus transaction!
        const isSolo = memberCount <= 1;

        if (isSolo) {
          const senderGroupRef = doc(db, 'rooms', roomId, 'groups', myGroupId);
          const targetGroupRef = doc(db, 'rooms', roomId, 'groups', targetGroupId);

          await runTransaction(db, async (transaction) => {
            const senderDoc = await transaction.get(senderGroupRef);
            const targetDoc = await transaction.get(targetGroupRef);

            const currentGBal = Number(senderDoc.data().groupBalance || 0);
            const currentTreasury = Number(senderDoc.data().treasuryCapital ?? currentGBal);
            const targetBal = Number(targetDoc.data().groupBalance || 0);
            const targetRaised = Number(targetDoc.data().raisedCapital || 0);

            if (currentTreasury < numAmount) {
              throw new Error(`Insufficient Group Treasury balance! Current balance is $${currentTreasury}.`);
            }

            transaction.update(senderGroupRef, { 
              groupBalance: currentGBal - numAmount,
              treasuryCapital: currentTreasury - numAmount
            });
            transaction.update(targetGroupRef, { 
              groupBalance: targetBal + numAmount,
              raisedCapital: targetRaised + numAmount
            });

            const newTxRef = doc(txCollectionRef);
            transaction.set(newTxRef, {
              senderType: 'group',
              senderId: myGroupId,
              senderName: `${myGroupObj.name} Treasury`,
              senderGroupId: myGroupId,
              receiverGroupId: targetGroupId,
              receiverGroupName: targetGroupName,
              amount: numAmount,
              status: 'completed',
              signatures: [studentId],
              requiredSignatures: 1,
              type: 'investment',
              note: note || `Group Treasury Venture Round`,
              timestamp: serverTimestamp()
            });
          });

          showToast(`Treasury invested $${numAmount} in ${targetGroupName}!`, 'success');

        } else {
          // Create Pending Transaction requiring 100% Board Signatures!
          const newTxRef = doc(txCollectionRef);
          await setDoc(newTxRef, {
            senderType: 'group',
            senderId: myGroupId,
            senderName: `${myGroupObj.name} Treasury`,
            senderGroupId: myGroupId,
            receiverGroupId: targetGroupId,
            receiverGroupName: targetGroupName,
            amount: numAmount,
            status: 'pending',
            signatures: [studentId], // Leader auto-signs
            requiredSignatures: memberCount,
            type: 'investment',
            note: note || `Treasury Investment (Awaiting Board Consensus)`,
            timestamp: serverTimestamp()
          });

          showToast(`Initiated $${numAmount} Treasury Investment in ${targetGroupName}. Awaiting 100% Board Member Approval!`, 'info');
        }
      }
    } catch (err) {
      handleFirebaseError(err);
    }
  };

  /**
   * Board Member Approves Pending Transaction (Atomic Signature + Auto Execution)
   */
  const approvePendingTransaction = async (txId) => {
    if (!roomId || !currentUser?.stdId) return false;

    const studentId = String(currentUser.stdId);
    const txRef = doc(db, 'rooms', roomId, 'transactions', txId);

    try {
      let isCompleted = false;

      await runTransaction(db, async (transaction) => {
        const txDoc = await transaction.get(txRef);
        if (!txDoc.exists()) throw new Error("Transaction document not found.");

        const txData = txDoc.data();
        if (txData.status !== 'pending') throw new Error("Transaction is no longer pending.");

        const currentSigs = Array.isArray(txData.signatures) ? txData.signatures : [];
        if (currentSigs.includes(studentId)) {
          throw new Error("You have already signed this transaction.");
        }

        const updatedSigs = [...currentSigs, studentId];
        const reqSigs = Number(txData.requiredSignatures) || 1;

        if (updatedSigs.length >= reqSigs) {
          // 100% Consensus Reached! Execute Transfer Atomics!
          const senderGroupRef = doc(db, 'rooms', roomId, 'groups', txData.senderGroupId);
          const targetGroupRef = doc(db, 'rooms', roomId, 'groups', txData.receiverGroupId);

          const senderDoc = await transaction.get(senderGroupRef);
          const targetDoc = await transaction.get(targetGroupRef);

          if (!senderDoc.exists() || !targetDoc.exists()) throw new Error("Group documents not found.");

          const senderGBal = Number(senderDoc.data().groupBalance || 0);
          const senderTreasury = Number(senderDoc.data().treasuryCapital ?? senderGBal);
          const targetGBal = Number(targetDoc.data().groupBalance || 0);
          const targetRaised = Number(targetDoc.data().raisedCapital || 0);

          if (senderTreasury < txData.amount) {
            transaction.update(txRef, { status: 'rejected', note: 'Failed: Insufficient Treasury Funds' });
            throw new Error("Transaction failed due to insufficient Treasury balance.");
          }

          // Execute Balance Transfers & Mark Completed
          transaction.update(senderGroupRef, { 
            groupBalance: senderGBal - txData.amount,
            treasuryCapital: senderTreasury - txData.amount
          });
          transaction.update(targetGroupRef, { 
            groupBalance: targetGBal + txData.amount,
            raisedCapital: targetRaised + txData.amount
          });
          transaction.update(txRef, {
            signatures: updatedSigs,
            status: 'completed'
          });

          isCompleted = true;
        } else {
          // Just update signatures array
          transaction.update(txRef, { signatures: updatedSigs });
        }
      });

      if (isCompleted) {
        showToast("🎉 100% Board Approval Reached! Venture investment executed successfully!", 'success');
      } else {
        showToast("Board Signature Recorded! Awaiting remaining board approvals.", 'info');
      }

      return isCompleted;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  /**
   * Board Member Rejects Pending Transaction
   */
  const rejectPendingTransaction = async (txId) => {
    if (!roomId) return;
    try {
      const txRef = doc(db, 'rooms', roomId, 'transactions', txId);
      await updateDoc(txRef, { status: 'rejected' });
      showToast("Transaction rejected and cancelled by board member.", 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  /**
   * Teacher starts Mining Mini-Game
   */
  const startMiningEvent = async () => {
    if (!roomId) return;
    try {
      const roomRef = doc(db, 'rooms', roomId);
      
      for (const u of users) {
        const uRef = doc(db, 'rooms', roomId, 'users', String(u.std_id || u.stdId));
        await updateDoc(uRef, { miningTaps: 0 });
      }

      await updateDoc(roomRef, {
        status: 'mining',
        miningState: {
          active: true,
          winners: []
        }
      });

      showToast("⚡ MINING SPEED RACE STARTED! Tap to 50 for bonus VC rewards!", 'success');
    } catch (err) {
      showToast(`Failed to start mini-game: ${err.message}`, 'error');
    }
  };

  /**
   * Teacher stops or returns room to active status from mining
   */
  const stopMiningEvent = async () => {
    if (!roomId) return;
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'active',
        'miningState.active': false
      });
      showToast("Mining event closed.", 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  /**
   * Student taps in Mining mini-game
   */
  const recordMiningTap = async () => {
    if (!roomId || !currentUser?.stdId || room?.status !== 'mining') return;

    const studentId = String(currentUser.stdId);
    const userRef = doc(db, 'rooms', roomId, 'users', studentId);
    const roomRef = doc(db, 'rooms', roomId);

    try {
      let newlyCompletedRank = null;
      let winnerReward = 0;

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const roomDoc = await transaction.get(roomRef);

        if (!userDoc.exists() || !roomDoc.exists()) return;

        const currentTaps = Number(userDoc.data().miningTaps || 0);
        const roomData = roomDoc.data();
        const currentWinners = roomData.miningState?.winners || [];

        const alreadyWon = currentWinners.some(w => String(w.stdId) === studentId);
        if (alreadyWon) return;

        const newTaps = currentTaps + 1;
        transaction.update(userRef, { miningTaps: newTaps, lastActive: serverTimestamp() });

        if (newTaps >= 50 && currentWinners.length < 3) {
          newlyCompletedRank = currentWinners.length + 1;
          winnerReward = newlyCompletedRank === 1 ? 500 : (newlyCompletedRank === 2 ? 300 : 100);

          const myUser = users.find(u => String(u.std_id || u.stdId) === studentId);
          const winnerObj = {
            stdId: studentId,
            fullname: myUser?.fullname || studentId,
            groupId: myUser?.groupId || 'group_1',
            rank: newlyCompletedRank,
            reward: winnerReward,
            timestamp: new Date().toISOString()
          };

          const updatedWinners = [...currentWinners, winnerObj];
          transaction.update(roomRef, {
            'miningState.winners': updatedWinners
          });

          const currentPersonalBal = Number(userDoc.data().personalBalance || 0);
          transaction.update(userRef, {
            personalBalance: currentPersonalBal + winnerReward
          });

          const txCollectionRef = collection(db, 'rooms', roomId, 'transactions');
          const newTxRef = doc(txCollectionRef);
          transaction.set(newTxRef, {
            senderType: 'system',
            senderId: 'SYSTEM_MINING',
            senderName: '⚡ Mining Bonus Round',
            senderGroupId: 'SYSTEM',
            receiverGroupId: myUser?.groupId || 'group_1',
            receiverGroupName: `${(myUser?.groupId || 'group_1').replace('group_', 'Group ')}`,
            amount: winnerReward,
            status: 'completed',
            signatures: [studentId],
            requiredSignatures: 1,
            type: 'mining_reward',
            note: `🏆 Rank ${newlyCompletedRank} Mining Reward won by ${myUser?.fullname}`,
            timestamp: serverTimestamp()
          });
        }
      });

      if (newlyCompletedRank) {
        showToast(`🏆 BOOM! You finished Rank #${newlyCompletedRank} and won +$${winnerReward}!`, 'success');
      }
    } catch (err) {
      console.error("Tap record error:", err);
    }
  };

  /**
   * Teacher dynamically updates room settings
   */
  const updateRoomSettings = async (newSettings) => {
    if (!roomId) return;
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const targetNumGroups = Number(newSettings.numGroups);
      const newStartingGroupBalance = Number(newSettings.startingGroupBalance);
      const newStartingPersonalBalance = Number(newSettings.startingPersonalBalance);
      const maxMembers = Number(newSettings.maxGroupMembers);

      const oldStartingPersonal = Number(room?.settings?.startingPersonalBalance) || 1000;
      const oldStartingGroup = Number(room?.settings?.startingGroupBalance) || 2000;
      const diffPersonal = newStartingPersonalBalance - oldStartingPersonal;
      const diffGroup = newStartingGroupBalance - oldStartingGroup;

      // 1. Fetch current groups and users in Firestore
      const [groupsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'rooms', roomId, 'groups')),
        getDocs(collection(db, 'rooms', roomId, 'users'))
      ]);

      const existingGroups = [];
      groupsSnap.forEach(d => existingGroups.push({ id: d.id, ref: d.ref, ...d.data() }));

      const existingUsers = [];
      usersSnap.forEach(d => existingUsers.push({ id: d.id, ref: d.ref, ...d.data() }));

      // Helper for batched writes respecting Firestore 500-op limit
      let currentBatch = writeBatch(db);
      let opCount = 0;

      const commitIfFull = async () => {
        if (opCount >= 400) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      };

      // 2. Update room settings doc
      currentBatch.update(roomRef, {
        'settings.softCapTarget': Number(newSettings.softCapTarget),
        'settings.startingPersonalBalance': newStartingPersonalBalance,
        'settings.startingGroupBalance': newStartingGroupBalance,
        'settings.maxGroupMembers': maxMembers,
        'settings.numGroups': targetNumGroups,
      });
      opCount++;

      // 3. Update all existing student member balances
      const hasTransactions = transactions && transactions.length > 0;
      for (const u of existingUsers) {
        if (u.role !== 'teacher') {
          let newPersonalBal;
          if (!hasTransactions) {
            newPersonalBal = newStartingPersonalBalance;
          } else {
            newPersonalBal = Math.max(0, (Number(u.personalBalance) || 0) + diffPersonal);
          }

          currentBatch.update(u.ref, {
            personalBalance: newPersonalBal,
            initialPersonalBalance: newStartingPersonalBalance
          });
          opCount++;
          await commitIfFull();
        }
      }

      // 4. Update all existing startup groups treasury and total balance
      for (const g of existingGroups) {
        let newTreasury;
        const currentTreasury = Number(g.treasuryCapital ?? g.groupBalance ?? oldStartingGroup);
        const currentRaised = Number(g.raisedCapital || 0);

        if (!hasTransactions) {
          newTreasury = newStartingGroupBalance;
        } else {
          newTreasury = Math.max(0, currentTreasury + diffGroup);
        }
        const newGroupBal = newTreasury + currentRaised;

        currentBatch.update(g.ref, {
          treasuryCapital: newTreasury,
          groupBalance: newGroupBal
        });
        opCount++;
        await commitIfFull();
      }

      // 5. If targetNumGroups is specified and valid, synchronize groups collection
      if (targetNumGroups && targetNumGroups >= 1) {
        const existingIndices = existingGroups.map(g => {
          const num = parseInt(String(g.groupId || g.id).replace(/\D/g, ''), 10);
          return isNaN(num) ? 0 : num;
        });
        const maxExisting = existingIndices.length > 0 ? Math.max(...existingIndices) : 0;

        // If increasing groups: create new group documents
        if (targetNumGroups > maxExisting) {
          for (let i = maxExisting + 1; i <= targetNumGroups; i++) {
            const newGroupId = `group_${i}`;
            const newGroupRef = doc(db, 'rooms', roomId, 'groups', newGroupId);
            currentBatch.set(newGroupRef, {
              groupId: newGroupId,
              name: `Group ${i}`,
              leaderId: null,
              groupBalance: newStartingGroupBalance,
              treasuryCapital: newStartingGroupBalance,
              raisedCapital: 0,
              memberIds: []
            });
            opCount++;
            await commitIfFull();
          }
        } else if (targetNumGroups < existingGroups.length) {
          // If decreasing groups: remove empty groups beyond targetNumGroups
          for (const g of existingGroups) {
            const num = parseInt(String(g.groupId || g.id).replace(/\D/g, ''), 10);
            if (num > targetNumGroups) {
              const members = g.memberIds || [];
              for (const mId of members) {
                const uRef = doc(db, 'rooms', roomId, 'users', String(mId));
                currentBatch.update(uRef, { groupId: null, isLeader: false });
                opCount++;
                await commitIfFull();
              }
              currentBatch.delete(g.ref);
              opCount++;
              await commitIfFull();
            }
          }
        }
      }

      if (opCount > 0) {
        await currentBatch.commit();
      }

      showToast(`อัปเดตการตั้งค่าสำเร็จ! ปรับเงินทุนนักเรียนเป็น $${newStartingPersonalBalance} และเงินคลังกลุ่มเป็น $${newStartingGroupBalance} ให้ทุกคนเรียบร้อยแล้ว`, 'success');
    } catch (err) {
      console.error("Update settings error:", err);
      handleFirebaseError(err, `Failed to update settings: ${err.message}`);
      throw err;
    }
  };

  /**
   * Teacher Resets Room Simulation (Deletes transactions, resets balances, and removes students from all groups)
   */
  const resetRoomData = async () => {
    if (!roomId) return;
    try {
      const batch = writeBatch(db);

      // 1. Delete all documents in transactions subcollection
      const txSnap = await getDocs(collection(db, 'rooms', roomId, 'transactions'));
      txSnap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      // 2. Reset student balances AND remove from groups
      const startingPersonal = Number(room?.settings?.startingPersonalBalance) || 1000;
      users.forEach((u) => {
        const uRef = doc(db, 'rooms', roomId, 'users', String(u.std_id || u.stdId));
        batch.update(uRef, {
          personalBalance: startingPersonal,
          initialPersonalBalance: startingPersonal,
          groupId: null,
          isLeader: false,
          miningTaps: 0
        });
      });

      // 3. Reset group balances AND empty memberIds & leader
      const startingGroup = Number(room?.settings?.startingGroupBalance) || 2000;
      groups.forEach((g) => {
        const gRef = doc(db, 'rooms', roomId, 'groups', g.groupId || g.id);
        batch.update(gRef, {
          groupBalance: startingGroup,
          treasuryCapital: startingGroup,
          raisedCapital: 0,
          memberIds: [],
          leaderId: null
        });
      });

      await batch.commit();
      showToast("รีเซ็ตห้องเรียนสำเร็จ! ล้างข้อมูลธุรกรรม คืนยอดเงิน และนำนักศึกษาออกจากทุกกลุ่มเรียบร้อยแล้ว", 'success');
    } catch (err) {
      console.error("Reset room error:", err);
      showToast(`Failed to reset room: ${err.message}`, 'error');
      throw err;
    }
  };

  /**
   * Teacher moves student to another group (or unassigned if targetGroupId is empty/null)
   */
  const moveStudentToGroup = async (studentId, targetGroupId) => {
    if (!roomId) return;
    if (currentUser?.role !== 'teacher') {
      showToast("เฉพาะอาจารย์เท่านั้นที่มีสิทธิ์ย้ายกลุ่มนักศึกษา!", 'error');
      return;
    }

    try {
      const stdIdStr = String(studentId);
      const userRef = doc(db, 'rooms', roomId, 'users', stdIdStr);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("ไม่พบข้อมูลนักศึกษา");

        const userData = userDoc.data();
        const currentGroupId = userData.groupId;

        if (currentGroupId === targetGroupId) return;

        // If currently in a group, remove from old group
        if (currentGroupId) {
          const oldGroupRef = doc(db, 'rooms', roomId, 'groups', currentGroupId);
          const oldGroupDoc = await transaction.get(oldGroupRef);
          if (oldGroupDoc.exists()) {
            const oldData = oldGroupDoc.data();
            const updatedMembers = (oldData.memberIds || []).filter(id => String(id) !== stdIdStr);
            let updatedLeaderId = oldData.leaderId;

            // If user was leader, assign new leader if anyone left
            if (String(oldData.leaderId) === stdIdStr) {
              updatedLeaderId = updatedMembers.length > 0 ? updatedMembers[0] : null;
              if (updatedLeaderId) {
                const newLeaderUserRef = doc(db, 'rooms', roomId, 'users', String(updatedLeaderId));
                transaction.update(newLeaderUserRef, { isLeader: true });
              }
            }

            transaction.update(oldGroupRef, {
              memberIds: updatedMembers,
              leaderId: updatedLeaderId
            });
          }
        }

        // If targetGroupId provided, add to new group
        if (targetGroupId) {
          const targetGroupRef = doc(db, 'rooms', roomId, 'groups', targetGroupId);
          const targetGroupDoc = await transaction.get(targetGroupRef);
          if (!targetGroupDoc.exists()) throw new Error("ไม่พบข้อมูลกลุ่มเป้าหมาย");

          const targetData = targetGroupDoc.data();
          const targetMembers = targetData.memberIds || [];
          const maxMembers = room?.settings?.maxGroupMembers || 5;

          if (targetMembers.length >= maxMembers) {
            throw new Error(`กลุ่มนี้มีสมาชิกเต็มแล้ว (${maxMembers} คน)`);
          }

          const isFirstMember = targetMembers.length === 0;
          const newTargetMembers = [...targetMembers.filter(id => String(id) !== stdIdStr), stdIdStr];
          const targetLeaderId = isFirstMember ? stdIdStr : (targetData.leaderId || stdIdStr);

          transaction.update(targetGroupRef, {
            memberIds: newTargetMembers,
            leaderId: targetLeaderId
          });

          transaction.update(userRef, {
            groupId: targetGroupId,
            isLeader: isFirstMember
          });
        } else {
          // Unassigned
          transaction.update(userRef, {
            groupId: null,
            isLeader: false
          });
        }
      });

      showToast(`ย้ายกลุ่มนักศึกษาสำเร็จ!`, 'success');
    } catch (err) {
      console.error("Move student error:", err);
      showToast(`ย้ายกลุ่มไม่สำเร็จ: ${err.message}`, 'error');
      throw err;
    }
  };

  /**
   * Teacher removes student from current group (Unassigns to no group)
   */
  const removeStudentFromGroup = async (studentId) => {
    return moveStudentToGroup(studentId, null);
  };

  /**
   * Teacher deletes student completely from the room simulation
   */
  const deleteStudentFromRoom = async (studentId) => {
    if (!roomId) return;
    if (currentUser?.role !== 'teacher') {
      showToast("เฉพาะอาจารย์เท่านั้นที่มีสิทธิ์ลบนักศึกษาออกจากห้อง!", 'error');
      return;
    }

    try {
      const stdIdStr = String(studentId);
      const userRef = doc(db, 'rooms', roomId, 'users', stdIdStr);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const currentGroupId = userData.groupId;

        // If student belongs to a group, remove from group roster
        if (currentGroupId) {
          const groupRef = doc(db, 'rooms', roomId, 'groups', currentGroupId);
          const groupDoc = await transaction.get(groupRef);
          if (groupDoc.exists()) {
            const groupData = groupDoc.data();
            const updatedMembers = (groupData.memberIds || []).filter(id => String(id) !== stdIdStr);
            let updatedLeaderId = groupData.leaderId;

            if (String(groupData.leaderId) === stdIdStr) {
              updatedLeaderId = updatedMembers.length > 0 ? updatedMembers[0] : null;
              if (updatedLeaderId) {
                const newLeaderUserRef = doc(db, 'rooms', roomId, 'users', String(updatedLeaderId));
                transaction.update(newLeaderUserRef, { isLeader: true });
              }
            }

            transaction.update(groupRef, {
              memberIds: updatedMembers,
              leaderId: updatedLeaderId
            });
          }
        }

        // Delete user document
        transaction.delete(userRef);
      });

      showToast(`ลบนักศึกษา (${studentId}) ออกจากห้องเรียนสำเร็จ!`, 'success');
    } catch (err) {
      console.error("Delete student error:", err);
      showToast(`ลบนักศึกษาไม่สำเร็จ: ${err.message}`, 'error');
      throw err;
    }
  };

  /**
   * Student/Group Revokes Outbound Investment Transaction
   */
  const revokeInvestment = async (txId) => {
    if (!roomId || !currentUser?.stdId) return;
    try {
      const txRef = doc(db, 'rooms', roomId, 'transactions', txId);

      await runTransaction(db, async (transaction) => {
        const txDoc = await transaction.get(txRef);
        if (!txDoc.exists()) throw new Error("Transaction document not found.");

        const txData = txDoc.data();
        if (txData.status !== 'completed') {
          throw new Error("Only completed investments can be revoked.");
        }

        const amount = Number(txData.amount || 0);

        // Deduct from receiver startup group
        const targetGroupRef = doc(db, 'rooms', roomId, 'groups', txData.receiverGroupId);
        const targetDoc = await transaction.get(targetGroupRef);
        if (targetDoc.exists()) {
          const currentGroupBal = Number(targetDoc.data().groupBalance || 0);
          const currentRaised = Number(targetDoc.data().raisedCapital || 0);
          transaction.update(targetGroupRef, {
            groupBalance: Math.max(0, currentGroupBal - amount),
            raisedCapital: Math.max(0, currentRaised - amount)
          });
        }

        // Refund back to sender
        if (txData.senderType === 'personal') {
          const senderUserRef = doc(db, 'rooms', roomId, 'users', String(txData.senderId));
          const userDoc = await transaction.get(senderUserRef);
          if (userDoc.exists()) {
            const currentPersonal = Number(userDoc.data().personalBalance || 0);
            transaction.update(senderUserRef, { personalBalance: currentPersonal + amount });
          }
        } else if (txData.senderType === 'group') {
          const senderGroupRef = doc(db, 'rooms', roomId, 'groups', txData.senderGroupId);
          const groupDoc = await transaction.get(senderGroupRef);
          if (groupDoc.exists()) {
            const currentGroupBal = Number(groupDoc.data().groupBalance || 0);
            const currentTreasury = Number(groupDoc.data().treasuryCapital || 0);
            transaction.update(senderGroupRef, {
              groupBalance: currentGroupBal + amount,
              treasuryCapital: currentTreasury + amount
            });
          }
        }

        // Mark transaction revoked
        transaction.update(txRef, {
          status: 'revoked',
          revokedAt: serverTimestamp()
        });
      });

      showToast(`Investment revoked successfully! Funds refunded to wallet.`, 'success');
    } catch (err) {
      console.error("Revoke error:", err);
      showToast(`Failed to revoke investment: ${err.message}`, 'error');
      throw err;
    }
  };

  /**
   * Teacher ends room session (Freeze room)
   */
  const endSession = async () => {
    if (!roomId) return;
    try {
      await updateDoc(doc(db, 'rooms', roomId), { status: 'ended' });
      showToast("Pitching session completed and frozen! Final podium displayed.", 'info');
    } catch (err) {
      showToast(`Failed to end session: ${err.message}`, 'error');
    }
  };

  return (
    <GameContext.Provider
      value={{
        room,
        users,
        groups,
        transactions,
        loading,
        toast,
        showToast,
        createRoomWithRoster,
        startRoomSession,
        joinGroup,
        overrideGroupLeader,
        transferTokens,
        approvePendingTransaction,
        rejectPendingTransaction,
        startMiningEvent,
        stopMiningEvent,
        recordMiningTap,
        endSession,
        updateRoomSettings,
        resetRoomData,
        revokeInvestment,
        moveStudentToGroup,
        removeStudentFromGroup,
        deleteStudentFromRoom,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
