# Walkthrough & Deployment Guide - `Biz-Simulate-app`

We have fully built, styled, and configured the **Gamified Business Simulation Web App** (`Biz-Simulate-app`) using a Zero-Server Architecture with React, Vite, Tailwind CSS v4, and Firebase Firestore/Auth/Analytics (connected to Firebase Project `biz-simulate-app`).

---

## 🚀 Accomplished Features

### 1. Session & Auth Management
- **Teacher Room Creation:** Generates a random 6-digit Room Code (e.g. `849201`).
- **Robust Excel Roster Importer (`excelParser.js`):**
  - Parses `.xlsx`, `.xls` (including HTML table format exported by university systems).
  - Matches `std_id` and `fullname` across English & Thai column variants.
  - Automatically generates 4-digit PINs (`std_id.slice(-4)`).
- **Student Auth:** Students log in with Room Code + `std_id` + generated 4-digit PIN.

### 2. Group Management & Leader Assignment
- Auto-generates named groups ("Group 1", "Group 2", etc.).
- Students pick and join groups with real-time member slot indicators (`2/5 members`).
- **Auto-Leader:** First student to join a group is automatically appointed `Group Leader`.
- **Teacher Leader Override:** Instructor can reassign the Group Leader for any group directly from the dashboard.

### 3. Wallet & Transaction System
- **Dynamic Allocation:** Instructor sets initial Group Wallet ($) and Personal Wallet ($) balances during room creation.
- **Group Wallet:** Managed and transferred **ONLY** by the `Group Leader`.
- **Personal Wallet:** Managed and transferred by individual students.
- **Strict Rule Enforcement:**
  - **Self-Transfer Block:** Target group dropdown dynamically filters out the student's own group, strictly preventing self-group transfers.
  - **Insufficient Funds Guard:** Form validation and Firestore atomic `runTransaction` prevent transferring more than available balance.

### 4. Mining Mini-Game (Tap/Clicker Race)
- Teacher triggers **"Start Mining Event"**, switching student screens to an interactive Clicker Overlay.
- Real-time tap counter (0 to 50 taps) with floating particle click animations (`+1 TAP!`).
- Atomic rank registration: First 3 students to hit 50 taps automatically claim 1st (+$500), 2nd (+$300), and 3rd (+$100) rewards credited to their wallets, accompanied by confetti celebrations!

### 5. Real-time Dashboard & End Game Freeze
- **Live Leaderboard:** Real-time group rankings with total revenues, progress bars, and stats.
- **Live Audit Feed:** Streams all room transactions in real time with sender, recipient, amount, and timestamp.
- **End Game Freeze:** Teacher clicks **"End Session"** to lock room status to `ended`, strictly disabling all transaction inputs and displaying the Final Winners Podium celebration.

---

## 🛠 Project Structure & Created Source Files

- [`src/config/firebase.js`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/config/firebase.js): Firebase App, Firestore, and Auth configuration.
- [`src/utils/excelParser.js`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/utils/excelParser.js): HTML-table & Excel parser for university `.xls` exports.
- [`src/utils/roomCodeGenerator.js`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/utils/roomCodeGenerator.js): 6-digit room code and PIN generator.
- [`src/context/AuthContext.jsx`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/context/AuthContext.jsx): User and room session context.
- [`src/context/GameContext.jsx`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/context/GameContext.jsx): Firestore real-time `onSnapshot` stream & atomic `runTransaction` handler.
- [`src/components/teacher/RoomSetupModal.jsx`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/components/teacher/RoomSetupModal.jsx): Room configuration modal.
- [`src/components/teacher/ExcelImporter.jsx`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/components/teacher/ExcelImporter.jsx): Drag & drop student roster upload.
- [`src/components/teacher/GroupManager.jsx`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/components/teacher/GroupManager.jsx): Group roster display & leader override.
- [`src/components/teacher/LiveLeaderboard.jsx`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/components/teacher/LiveLeaderboard.jsx): Dynamic revenue ranking.
- [`src/components/teacher/LiveTransactionLogs.jsx`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/components/teacher/LiveTransactionLogs.jsx): Real-time transaction audit log.
- [`src/components/teacher/MiningControlModal.jsx`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/components/teacher/MiningControlModal.jsx): Mini-game race monitor.
- [`src/components/student/GroupSelection.jsx`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/components/student/GroupSelection.jsx): Slot-based group picker.
- [`src/components/student/WalletPanel.jsx`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/components/student/WalletPanel.jsx): Wallet balances & leader permissions.
- [`src/components/student/TransferModal.jsx`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/components/student/TransferModal.jsx): Token transfer modal.
- [`src/components/student/MiningGameModal.jsx`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/components/student/MiningGameModal.jsx): Clicker mini-game overlay.
- [`src/components/end/FinalSummaryView.jsx`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/src/components/end/FinalSummaryView.jsx): Final frozen podium.
- [`vercel.json`](file:///c:/Users/UBRU/Desktop/Biz-Simulate-App/vercel.json): Vercel SPA rewrite configuration.

---

## ⚡ Step-by-Step Vercel Deployment Guide

### 1. Push Repository to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Gamified Business Simulation Web App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Biz-Simulate-app.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Click **Import Project** and select your GitHub repository `Biz-Simulate-app`.
3. Framework Preset: **Vite** (auto-detected).

### 3. Add Environment Variables on Vercel
In Vercel **Project Settings -> Environment Variables**, add the following keys from your Firebase Console:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 4. Deploy!
Click **Deploy**. Vercel will automatically build the app with Vite and deploy it to a live production URL (e.g. `https://biz-simulate-app.vercel.app`).

---

## ✅ Verification Results

- **Production Build:** `npm run build` completed successfully without any compilation errors.
- **Preview Server:** Currently active on local port `5173`.
