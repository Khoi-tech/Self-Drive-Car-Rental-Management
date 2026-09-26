import api from './api';

const contractTemplateService = {
  /**
   * Get all contract templates with optional search, type, and isActive filter
   */
  getAll: async (params = {}) => {
    return await api.get('/contract-templates', { params });
  },

  /**
   * Get a single template by ID
   */
  getById: async (id) => {
    return await api.get(`/contract-templates/${id}`);
  },

  /**
   * Create a new contract template
   */
  create: async (data) => {
    return await api.post('/contract-templates', data);
  },

  /**
   * Update an existing contract template
   */
  update: async (id, data) => {
    return await api.put(`/contract-templates/${id}`, data);
  },

  /**
   * Update status (active/inactive) of a contract template
   */
  updateStatus: async (id, isActive) => {
    return await api.patch(`/contract-templates/${id}/status`, { isActive });
  },

  /**
   * Delete a contract template
   */
  delete: async (id) => {
    return await api.delete(`/contract-templates/${id}`);
  }
};

export default contractTemplateService;
