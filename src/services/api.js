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
    
    // Skip adding token for public endpoints
    const publicEndpoints = [
      '/schedule/places/getNearest',
      '/schedule/places/search',
      '/schedule/places/countries'
    ];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url.includes(endpoint));
    
    if (!isPublicEndpoint) {
      const storedUser = localStorage.getItem('user');
      const userToken = localStorage.getItem('userToken');
      let token = null;

      if (storedUser && userToken) {
        token = userToken;
      } else {
        token = localStorage.getItem('token');
      }

      if (token && token.split('.').length === 3) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Token added to request');
      } else {
        console.log('❌ No valid token found');
      }
    } else {
      console.log('🌍 Public endpoint - skipping auth token');
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
  googleLogin: (googleToken) => api.post('/user/google-login', { googleToken }),
  getProfile: () => api.get('/admin/profile'),
  refreshToken: (data) => api.post('/admin/refresh-token', data),
};



// Places API endpoints (Admin)
export const placesAPI = {
  getAllPlaces: () => api.get('/admin/places-list'),
  getPlaceById: (id) => api.get(`/admin/places/${id}`),
  createPlace: (data) => api.post('/admin/add-place', data),
  updatePlace: (id, data) => api.put(`/admin/edit-place/${id}`, data),
  deletePlace: (id) => api.delete(`/admin/places/${id}`),
};

// Public Places API endpoints
export const publicPlacesAPI = {
  getNearestPlaces: (params) => api.get('/schedule/places/getNearest', { params }),
  searchPlaces: (params) => api.get('/schedule/places/search', { params }),
  getPlaceDetails: (placeId) => api.get(`/schedule/places/${placeId}`),
  getCountries: () => api.get('/schedule/places/countries'),
  getStatesByCountry: (country) =>
    api.get(`/schedule/places/countries/${encodeURIComponent(country)}/states`),
  getPlacesByCountry: (country, params) =>
    api.get(`/schedule/places/countries/${encodeURIComponent(country)}/places`, { params }),
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

// Schedule API endpoints
export const scheduleAPI = {
  createSchedule: (formData) => {
    const token = localStorage.getItem('token');
    return fetch(`${api.defaults.baseURL}/schedule/create`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
  },
  addScheduleDescription: (scheduleId, payload) =>
    api.post(`/schedule/add/descriptions/${scheduleId}`, payload),
  getSchedules: (filter = 'Public', userId = null) => {
    let url = `/schedule/listing/filter?filter=${filter}`;
    if (filter === 'my' && userId) {
      url += `&userId=${userId}&limit=20`;
    }
    return api.get(url);
  },
  getJoinedSchedules: (params) => api.get('/schedule/listing/joined-schedules', { params }),
  getScheduleById: (id) => api.get(`/schedule/${id}`),
};

// Friends & Social API endpoints
export const friendsAPI = {
  getChatMembers: () => api.get('/user/list-chat-members'),
  followUser: (followerId, followingId) => api.post(`/follow/followUser/${followingId}/${followerId}`),
  unfollowUser: (followerId, followingId) => api.post(`/follow/unfollowUser/${followingId}/${followerId}`),
  getFollowers: (userId) => api.get(`/follow/getFollowers/${userId}`),
  getFollowing: (userId) => api.get(`/follow/getFollowing/${userId}`),
};

// Users directory endpoints
export const usersAPI = {
  searchUsers: ({ q = '', page = 1, limit = 40 } = {}) =>
    api.get('/user/getProfile', {
      params: {
        search: q,
        filter: 'users',
        page,
        limit,
      },
    }),
};

export default api;
