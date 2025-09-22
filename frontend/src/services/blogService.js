import axiosInstance from './axiosInstance';

const API_BASE = '/blogs';
const COMMENTS_BASE = '/blog-comments';

class BlogService {
  async list(params = {}) {
    const { data } = await axiosInstance.get(`${API_BASE}`, { params });
    return data;
  }

  async get(idOrSlug) {
    const { data } = await axiosInstance.get(`${API_BASE}/${idOrSlug}`);
    return data;
  }

  async create(payload) {
    const { data } = await axiosInstance.post(`${API_BASE}`, payload);
    return data;
  }

  async update(id, payload) {
    const { data } = await axiosInstance.put(`${API_BASE}/${id}`, payload);
    return data;
  }

  async publish(id, publish) {
    const { data } = await axiosInstance.post(`${API_BASE}/${id}/publish`, { publish });
    return data;
  }

  async feature(id) {
    const { data } = await axiosInstance.post(`${API_BASE}/${id}/feature`);
    return data;
  }

  async addView(id) {
    const { data } = await axiosInstance.post(`${API_BASE}/${id}/views`);
    return data;
  }

  async setLike(id, like) {
    const { data } = await axiosInstance.post(`${API_BASE}/${id}/like`, { like });
    return data;
  }

  // Comments
  async listComments(blogId, params = {}) {
    const { data } = await axiosInstance.get(`${COMMENTS_BASE}/${blogId}`, { params });
    return data;
  }

  async createComment(payload) {
    const { data } = await axiosInstance.post(`${COMMENTS_BASE}`, payload);
    return data;
  }

  async updateComment(id, payload) {
    const { data } = await axiosInstance.put(`${COMMENTS_BASE}/${id}`, payload);
    return data;
  }

  async deleteComment(id, hard = false) {
    const { data } = await axiosInstance.delete(`${COMMENTS_BASE}/${id}`, { params: { hard } });
    return data;
  }

  async likeComment(id, like) {
    const { data } = await axiosInstance.post(`${COMMENTS_BASE}/${id}/like`, { like });
    return data;
  }
}

export default new BlogService();
