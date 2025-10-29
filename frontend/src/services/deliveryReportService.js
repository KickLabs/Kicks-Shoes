import axiosInstance from './axiosInstance';

const deliveryReportService = {
  // Get all reports with filters
  getAllReports: async (params = {}) => {
    const response = await axiosInstance.get('/delivery-reports', { params });
    return response.data;
  },

  // Get report by ID
  getReportById: async (id) => {
    const response = await axiosInstance.get(`/delivery-reports/${id}`);
    return response.data;
  },

  // Get statistics
  getStats: async () => {
    const response = await axiosInstance.get('/delivery-reports/stats');
    return response.data;
  },

  // Update report status
  updateStatus: async (id, data) => {
    const response = await axiosInstance.patch(`/delivery-reports/${id}/status`, data);
    return response.data;
  },

  // Update priority
  updatePriority: async (id, priority) => {
    const response = await axiosInstance.patch(`/delivery-reports/${id}/priority`, { priority });
    return response.data;
  },

  // Resolve report
  resolveReport: async (id, data) => {
    const response = await axiosInstance.post(`/delivery-reports/${id}/resolve`, data);
    return response.data;
  },

  // Reject report
  rejectReport: async (id, data) => {
    const response = await axiosInstance.post(`/delivery-reports/${id}/reject`, data);
    return response.data;
  },
};

export default deliveryReportService;

