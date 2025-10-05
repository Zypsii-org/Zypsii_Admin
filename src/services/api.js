import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'https://zypsii.com/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('📡 REQUEST INTERCEPTOR');
    console.log('🌐 URL:', config.url);
    console.log('📋 Method:', config.method);
    console.log('📦 Data:', config.data);
    console.log('🔑 Headers:', config.headers);
    
    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request');
    } else {
      console.log('❌ No valid token found');
    }
    return config;
  },
  (error) => {
    console.error('💥 Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {

    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/admin/login', credentials),
  getProfile: () => api.get('/admin/profile'),
  refreshToken: (data) => api.post('/admin/refresh-token', data),
};



// Places API endpoints
export const placesAPI = {
  getAllPlaces: () => api.get('/admin/places-list'),
  getPlaceById: (id) => api.get(`/admin/places/${id}`),
  createPlace: (data) => api.post('/admin/add-place', data),
  updatePlace: (id, data) => api.put(`/admin/edit-place/${id}`, data),
  deletePlace: (id) => api.delete(`/admin/places/${id}`),
};

// YouTube API endpoints
export const youtubeAPI = {
  getAllVideos: (params) => api.get('/youtube-video-list/all', { params }),
  getVideoById: (id) => api.get(`/youtube-video/${id}`),
  createVideo: (data) => api.post('/youtube-video/add', data),
  updateVideo: (id, data) => api.put(`/youtube-video/update/${id}`, data),
  deleteVideo: (id) => api.delete(`/youtube-video/delete/${id}`),
  toggleStatus: (id) => api.put(`/youtube-video/activate-inactive/${id}`),
};

export default api;
