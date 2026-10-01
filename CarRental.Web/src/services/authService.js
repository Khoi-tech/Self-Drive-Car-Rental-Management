import api from './api';

const authService = {
  login: async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    if (data?.token) {
      localStorage.setItem('velora_token', data.token);
      localStorage.setItem('velora_user', JSON.stringify(data.user));
    }
    return data;
  },

  register: async (userData) => {
    const data = await api.post('/auth/register', userData);
    if (data?.token) {
      localStorage.setItem('velora_token', data.token);
      localStorage.setItem('velora_user', JSON.stringify(data.user));
    }
    return data;
  },

  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('velora_token');
    localStorage.removeItem('velora_user');
  },

  getSavedUser: () => {
    const userStr = localStorage.getItem('velora_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem('velora_token');
  }
};

export default authService;
