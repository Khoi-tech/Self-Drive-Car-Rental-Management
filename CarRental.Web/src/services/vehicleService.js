import api from './api';

const vehicleService = {
  /**
   * Get all vehicles with optional search and status filter
   * @param {string} search - Search by make, model, or license plate
   * @param {string} status - Filter by vehicle status
   */
  getAllVehicles: async (search = '', status = '') => {
    try {
      const params = {};
      if (search) params.search = search;
      // Make sure we only send the status if it's a valid filter (not 'all' or empty)
      if (status && status !== 'all') params.status = status;
      
      const response = await api.get('/vehicles', { params });
      return response; // Assuming backend returns array or { data: [...] }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  /**
   * Create a new vehicle
   * @param {object} vehicleData - The vehicle data object
   */
  createVehicle: async (vehicleData) => {
    try {
      const response = await api.post('/vehicles', vehicleData);
      return response;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  },

  /**
   * Get a single vehicle by ID
   * @param {string} id - The vehicle UUID
   */
  getVehicleById: async (id) => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  },

  /**
   * Update a vehicle
   * @param {string} id - The vehicle UUID
   * @param {object} vehicleData - The updated vehicle data
   */
  updateVehicle: async (id, vehicleData) => {
    try {
      const response = await api.put(`/vehicles/${id}`, vehicleData);
      return response;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  /**
   * Update vehicle status
   * @param {string} id - The vehicle UUID
   * @param {string} status - The new status value
   */
  updateVehicleStatus: async (id, status) => {
    try {
      const response = await api.patch(`/vehicles/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      throw error;
    }
  },

  /**
   * Deactivate (soft delete) a vehicle
   * @param {string} id - The vehicle UUID
   */
  deleteVehicle: async (id) => {
    try {
      const response = await api.delete(`/vehicles/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  },
};

export default vehicleService;
