import api from './api';

const additionalDriverService = {
  getMyDrivers: async () => {
    return await api.get('/additional-drivers/my-drivers');
  },

  createDriver: async (driverData) => {
    return await api.post('/additional-drivers', driverData);
  },

  updateDriver: async (id, driverData) => {
    return await api.put(`/additional-drivers/${id}`, driverData);
  },

  deleteDriver: async (id) => {
    return await api.delete(`/additional-drivers/${id}`);
  }
};

export default additionalDriverService;
