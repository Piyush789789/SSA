import apiClient from './apiClient';

export const authApi = {
  login: async (email, password, role) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
      role: role.toUpperCase(),
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};
