/**
 * @fileoverview Shipper Application Service
 * @created 2025-10-22
 * @file shipperApplicationService.js
 */

import axiosInstance from './axiosInstance';

const shipperApplicationService = {
  /**
   * Create a new shipper application
   * @param {Object} applicationData - Application data
   * @returns {Promise}
   */
  createApplication: async (applicationData) => {
    const response = await axiosInstance.post('/shipper-applications', applicationData);
    return response.data;
  },

  /**
   * Get current user's applications
   * @returns {Promise}
   */
  getMyApplications: async () => {
    const response = await axiosInstance.get('/shipper-applications/my-applications');
    return response.data;
  },

  /**
   * Get all shipper applications (Shop/Admin)
   * @param {Object} params - Query parameters (status, page, limit)
   * @returns {Promise}
   */
  getAllApplications: async (params = {}) => {
    const response = await axiosInstance.get('/shipper-applications', { params });
    return response.data;
  },

  /**
   * Get application by ID
   * @param {string} id - Application ID
   * @returns {Promise}
   */
  getApplicationById: async (id) => {
    const response = await axiosInstance.get(`/shipper-applications/${id}`);
    return response.data;
  },

  /**
   * Approve shipper application (Shop/Admin)
   * @param {string} id - Application ID
   * @param {string} reviewNote - Review note
   * @returns {Promise}
   */
  approveApplication: async (id, reviewNote = '') => {
    const response = await axiosInstance.post(`/shipper-applications/${id}/approve`, {
      reviewNote,
    });
    return response.data;
  },

  /**
   * Reject shipper application (Shop/Admin)
   * @param {string} id - Application ID
   * @param {string} reviewNote - Review note
   * @returns {Promise}
   */
  rejectApplication: async (id, reviewNote) => {
    const response = await axiosInstance.post(`/shipper-applications/${id}/reject`, {
      reviewNote,
    });
    return response.data;
  },

  /**
   * Get application statistics (Shop/Admin)
   * @returns {Promise}
   */
  getApplicationStats: async () => {
    const response = await axiosInstance.get('/shipper-applications/stats');
    return response.data;
  },
};

export default shipperApplicationService;

