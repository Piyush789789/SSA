import apiClient from './apiClient';

export const adminApi = {
  getDashboard: async () => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  getStudents: async () => {
    const response = await apiClient.get('/admin/students');
    return response.data;
  },

  getTeachers: async () => {
    const response = await apiClient.get('/admin/teachers');
    return response.data;
  },

  getClasses: async () => {
    const response = await apiClient.get('/admin/classes');
    return response.data;
  },

  getTodayAttendance: async () => {
    const response = await apiClient.get('/admin/attendance/today');
    return response.data;
  },

  getTodayFees: async () => {
    const response = await apiClient.get('/admin/fees/today');
    return response.data;
  },
};
