import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('biz_sim_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [roomId, setRoomId] = useState(() => {
    return localStorage.getItem('biz_sim_room_id') || null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('biz_sim_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('biz_sim_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (roomId) {
      localStorage.setItem('biz_sim_room_id', roomId);
    } else {
      localStorage.removeItem('biz_sim_room_id');
    }
  }, [roomId]);

  const loginAsTeacher = (code) => {
    const userObj = {
      role: 'teacher',
      fullname: 'Ajarn Natthawat',
      stdId: 'TEACHER_ADMIN',
    };
    setCurrentUser(userObj);
    setRoomId(code);
  };

  const loginAsStudent = (studentData, code) => {
    setCurrentUser({
      role: 'student',
      stdId: studentData.std_id || studentData.stdId,
      fullname: studentData.fullname,
      groupId: studentData.groupId || null,
      isLeader: studentData.isLeader || false,
    });
    setRoomId(code);
  };

  const logout = () => {
    setCurrentUser(null);
    setRoomId(null);
    localStorage.removeItem('biz_sim_user');
    localStorage.removeItem('biz_sim_room_id');
  };

  const updateUserSession = (partialUser) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...partialUser
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        roomId,
        loginAsTeacher,
        loginAsStudent,
        logout,
        updateUserSession,
        isTeacher: currentUser?.role === 'teacher',
        isStudent: currentUser?.role === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
