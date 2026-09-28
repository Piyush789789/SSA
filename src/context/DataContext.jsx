import React, { createContext, useContext, useState } from 'react';
import { studentsData } from '@/data/studentData';
import { initialTeachersData } from '@/data/teacherData';
import { INITIAL_ATTENDANCE_RECORDS } from '@/data/attendanceData';
import { INITIAL_EXAMS, INITIAL_EXAM_SCHEDULES, INITIAL_MARKS_RECORDS } from '@/data/examsData';
import { INITIAL_NOTICES } from '@/data/noticesData';
import { INITIAL_HOMEWORK } from '@/data/homeworkData';
import { INITIAL_STUDY_MATERIALS } from '@/data/studyMaterialsData';
import { INITIAL_COMMUNICATION_MESSAGES } from '@/data/communicationData';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [students, setStudents] = useState(studentsData);
  const [teachers, setTeachers] = useState(initialTeachersData);
  const [attendanceRecords, setAttendanceRecords] = useState(INITIAL_ATTENDANCE_RECORDS);
  const [homeworkList, setHomeworkList] = useState(INITIAL_HOMEWORK);
  const [exams, setExams] = useState(INITIAL_EXAMS);
  const [schedules, setSchedules] = useState(INITIAL_EXAM_SCHEDULES);
  const [marksRecords, setMarksRecords] = useState(INITIAL_MARKS_RECORDS);
  const [notices, setNotices] = useState(INITIAL_NOTICES);
  const [studyMaterials, setStudyMaterials] = useState(INITIAL_STUDY_MATERIALS);
  const [messages, setMessages] = useState(INITIAL_COMMUNICATION_MESSAGES);

  // Attendance operations
  const saveAttendanceRecords = (newRecords) => {
    setAttendanceRecords((prev) => {
      // Filter out existing records that match date & studentId to avoid duplicate keys
      const newKeys = new Set(newRecords.map((r) => `${r.date}_${r.studentId}`));
      const filteredPrev = prev.filter((r) => !newKeys.has(`${r.date}_${r.studentId}`));
      return [...newRecords, ...filteredPrev];
    });
  };

  // Homework CRUD
  const addHomework = (hwItem) => {
    setHomeworkList((prev) => [hwItem, ...prev]);
  };

  const updateHomework = (hwItem) => {
    setHomeworkList((prev) => prev.map((h) => (h.id === hwItem.id ? hwItem : h)));
  };

  const deleteHomework = (hwId) => {
    setHomeworkList((prev) => prev.filter((h) => h.id !== hwId));
  };

  // Marks Entry
  const saveMarksRecords = (newRecords) => {
    setMarksRecords((prev) => {
      const recordMap = new Map(prev.map((r) => [r.id, r]));
      newRecords.forEach((r) => recordMap.set(r.id, r));
      return Array.from(recordMap.values());
    });
  };

  // Notices
  const addNotice = (noticeItem) => {
    setNotices((prev) => [noticeItem, ...prev]);
  };

  // Study Materials
  const addStudyMaterial = (matItem) => {
    setStudyMaterials((prev) => [matItem, ...prev]);
  };

  const deleteStudyMaterial = (matId) => {
    setStudyMaterials((prev) => prev.filter((m) => m.id !== matId));
  };

  // Messages / Communication
  const sendMessage = (msgItem) => {
    setMessages((prev) => [msgItem, ...prev]);
  };

  return (
    <DataContext.Provider
      value={{
        students,
        teachers,
        attendanceRecords,
        saveAttendanceRecords,
        homeworkList,
        addHomework,
        updateHomework,
        deleteHomework,
        exams,
        schedules,
        marksRecords,
        saveMarksRecords,
        notices,
        addNotice,
        studyMaterials,
        addStudyMaterial,
        deleteStudyMaterial,
        messages,
        sendMessage,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
