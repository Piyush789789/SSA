import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initialTeachersData } from '@/data/teacherData';

const AuthContext = createContext();

export const DEFAULT_TEACHER_USER = {
  role: 'teacher',
  teacherId: 'TCH-2026-001',
  name: 'Anjali Singh',
  email: 'anjali.singh@teacher.example',
  phone: '+91 98765 43210',
  qualification: 'M.Sc Mathematics, B.Ed',
  experience: '8 years',
  joiningDate: '2018-06-15',
  assignedClasses: ['5-B', '6-A'],
  subjects: ['Mathematics', 'Science'],
  avatar: 'AS',
};

export const DEFAULT_STUDENT_USER = {
  role: 'student',
  studentId: 'STU-2026-0503',
  id: 103,
  name: 'Rohit Verma',
  email: 'rohit.v@student.example',
  className: '5-B',
  section: 'B',
  rollNumber: 3,
  avatar: 'RV',
  classTeacher: 'Anjali Singh',
  bloodGroup: 'B+',
  dob: 'Mar 15, 2015',
  parent: {
    name: 'Sanjay Verma',
    relation: 'Father',
    phone: '+91 98765 12345',
    email: 'sanjay.verma@example.com',
  },
  feeSummary: {
    total: 10700,
    paid: 7700,
    pending: 3000,
  },
  attendanceStats: {
    totalDays: 24,
    present: 22,
    absent: 2,
    late: 0,
    rate: 92,
  },
};

export const DEFAULT_PARENT_USER = {
  role: 'parent',
  parentId: 'PRN-2026-001',
  name: 'Rajesh Verma',
  email: 'parent075.stu20260081@alfalah.edu',
  phone: '+91 98765 43210',
  avatar: 'YV',
  linkedChildren: [
    {
      studentId: 'STU-2026-0824',
      id: 101,
      name: 'Yash Verma',
      className: '8-A',
      section: 'A',
      rollNumber: 24,
      avatar: 'YV',
      classTeacher: 'Javed Akhtar',
      bloodGroup: 'B+',
      dob: 'Jun 12, 2012',
      attendanceStats: {
        totalDays: 120,
        present: 110,
        absent: 10,
        rate: 92,
      },
      feeSummary: {
        total: 10700,
        paid: 7700,
        pending: 3000,
      },
      academicStats: {
        average: 84.6,
        testsCount: 6,
      },
    },
    {
      studentId: 'STU-2026-0512',
      id: 102,
      name: 'Ananya Verma',
      className: '5-B',
      section: 'B',
      rollNumber: 12,
      avatar: 'AV',
      classTeacher: 'Anjali Singh',
      bloodGroup: 'O+',
      dob: 'Apr 08, 2015',
      attendanceStats: {
        totalDays: 115,
        present: 108,
        absent: 7,
        rate: 94,
      },
      feeSummary: {
        total: 9800,
        paid: 7800,
        pending: 2000,
      },
      academicStats: {
        average: 91.2,
        testsCount: 6,
      },
    },
  ],
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ssa_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_TEACHER_USER;
  });

  const [selectedChildId, setSelectedChildId] = useState('STU-2026-0824');

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ssa_auth_user', JSON.stringify(currentUser));
      if (currentUser.role === 'parent' && currentUser.linkedChildren?.length > 0) {
        if (!selectedChildId || !currentUser.linkedChildren.some((c) => c.studentId === selectedChildId)) {
          setSelectedChildId(currentUser.linkedChildren[0].studentId);
        }
      }
    } else {
      localStorage.removeItem('ssa_auth_user');
    }
  }, [currentUser]);

  const selectedChild = useMemo(() => {
    if (currentUser?.role === 'parent' && currentUser?.linkedChildren) {
      return (
        currentUser.linkedChildren.find((c) => c.studentId === selectedChildId) ||
        currentUser.linkedChildren[0]
      );
    }
    return null;
  }, [currentUser, selectedChildId]);

  const switchChild = (childId) => {
    setSelectedChildId(childId);
  };

  const login = (role, id = null) => {
    if (role === 'teacher') {
      const teacher = initialTeachersData.find((t) => t.teacherId === (id || 'TCH-2026-001')) || DEFAULT_TEACHER_USER;
      setCurrentUser({
        ...teacher,
        role: 'teacher',
      });
    } else if (role === 'student') {
      setCurrentUser(DEFAULT_STUDENT_USER);
    } else if (role === 'parent') {
      setCurrentUser(DEFAULT_PARENT_USER);
      setSelectedChildId('STU-2026-0824');
    } else {
      setCurrentUser(DEFAULT_ADMIN_USER);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ssa_auth_user');
  };

  const updateTeacherProfile = (updatedFields) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...updatedFields,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        selectedChild,
        selectedChildId,
        switchChild,
        login,
        logout,
        updateTeacherProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
