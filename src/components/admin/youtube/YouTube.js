import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaTrash, FaPlay, FaEye, FaTimes, FaEdit, FaList, FaYoutube, FaUpload, FaImage, FaChevronLeft, FaMapMarkerAlt, FaCalendar } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { youtubeAPI } from '../../../services/api';
import YouTubePagination from './YouTubePagination';
import DeleteConfirmModal from './DeleteConfirmModal';
import ToggleStatusModal from './ToggleStatusModal';
import axios from 'axios';
import './YouTube.css';

const YouTube = () => {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const isMountedRef = useRef(true);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list', 'form', 'detail', or 'edit'
  const [editingVideo, setEditingVideo] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    offset: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState({
    search: '',
    isActive: 'all'
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    placeId: '',
    isActive: false,
    createdBy: null
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [authError, setAuthError] = useState(null);

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Toggle status modal states
  const [toggleStatusModalOpen, setToggleStatusModalOpen] = useState(false);
  const [videoToToggle, setVideoToToggle] = useState(null);
  const [toggleStatusLoading, setToggleStatusLoading] = useState(null);
  
  // Form confirmation states
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  
  // Place search states
  const [placeSearch, setPlaceSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('🔐 User authenticated, fetching videos...');
      console.log('🌐 API Base URL:', process.env.REACT_APP_API_URL);
      fetchVideos();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchVideos();
    }
  }, [pagination.currentPage]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [filters.search, filters.isActive]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Debug modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed - showEditConfirmation:', showEditConfirmation);
    console.log('🔍 Modal state changed - pendingFormData:', pendingFormData);
  }, [showEditConfirmation, pendingFormData]);

  const fetchVideos = async (isSearch = false) => {
    if (!isAuthenticated) return;
    
    if (isSearch) {
      setSearchLoading(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        search: filters.search || undefined,
        isActive: filters.isActive !== 'all' ? filters.isActive : undefined
      };
      
      console.log('🔍 Fetching YouTube videos with params:', params);
      console.log('🔗 API endpoint:', '/youtube-video-list/all');
      
      const response = await youtubeAPI.getAllVideos(params);
      
      if (isMountedRef.current && response.data.success) {
        console.log('✅ YouTube API response:', response.data);
        const { videos, currentPage, totalPages, totalVideos, videosPerPage } = response.data.data;
        setVideos(videos || []);
        setPagination(prev => ({
          ...prev,
          currentPage: currentPage || 1,
          totalPages: totalPages || 1,
          totalCount: totalVideos || 0,
          limit: videosPerPage || 10,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1
        }));
      } else {
        console.log('⚠️ YouTube API response without success:', response.data);
        setError('API response format unexpected. Please check the response structure.');
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error fetching videos:', err);
        console.error('Error details:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          config: err.config,
          url: err.config?.url,
          baseURL: err.config?.baseURL
        });
        
        if (err.response?.status === 404) {
          setError('YouTube API endpoint not found. Please check the API configuration.');
        } else if (err.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response?.status === 500) {
          setError('Server error. Please try again later.');
        } else if (err.code === 'ECONNREFUSED') {
          setError('Cannot connect to the server. Please check if the backend is running.');
        } else if (err.code === 'NETWORK_ERROR') {
          setError('Network error. Please check your internet connection.');
        } else {
          setError(`Failed to fetch videos: ${err.message}`);
        }
      }
    } finally {
      if (isMountedRef.current) {
        if (isSearch) {
          setSearchLoading(false);
        } else {
          setLoading(false);
        }
      }
    }
  };

  const handleCreateVideo = () => {
    setActiveView('form');
    setEditingVideo(null);
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      placeId: '',
      isActive: false,
      createdBy: null
    });
    
    // Reset place search
    setPlaceSearch('');
    setSelectedPlace(null);
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleEditVideo = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title || '',
      description: video.description || '',
      videoUrl: video.videoUrl || '',
      placeId: video.placeId?._id || video.placeId || '',
      isActive: video.isActive !== undefined ? video.isActive : false,
      createdBy: video.createdBy || null
    });
    
    // Initialize place search for editing
    if (video.placeId) {
      if (typeof video.placeId === 'object' && video.placeId.name) {
        setSelectedPlace(video.placeId);
        setPlaceSearch(video.placeId.name);
      } else {
        // If placeId is just an ID, we'll need to fetch the place details
        setPlaceSearch('');
        setSelectedPlace(null);
      }
    } else {
      setPlaceSearch('');
      setSelectedPlace(null);
    }
    
    setActiveView('form');
  };

  const handleViewVideo = (video) => {
    setSelectedVideo(video);
    setActiveView('detail');
  };

  const handleBackToList = () => {
    setActiveView('list');
    setEditingVideo(null);
    setSelectedVideo(null);
    setError(null);
    setSuccess(false);
    
    // Reset confirmation modal states
    setShowEditConfirmation(false);
    setPendingFormData(null);
    
    // Reset delete modal states
    setDeleteModalOpen(false);
    setVideoToDelete(null);
    setIsDeleting(false);
    
    // Reset toggle status modal states
    setToggleStatusModalOpen(false);
    setVideoToToggle(null);
    setToggleStatusLoading(null);
    
    // Reset place search
    setPlaceSearch('');
    setSelectedPlace(null);
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleDeleteVideo = (video) => {
    console.log('🗑️ Delete button clicked for video:', video.title, 'ID:', video._id);
    setVideoToDelete(video);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      console.log('🗑️ Deleting video:', videoToDelete._id);
      console.log('🔗 API endpoint: /youtube-video/delete/' + videoToDelete._id);
      
      const response = await youtubeAPI.deleteVideo(videoToDelete._id);
      console.log('✅ Delete response:', response.data);
      
      if (response.data.success) {
        setSuccess(true);
        setSuccessMessage(response.data.message || 'Video deleted successfully!');
        setDeleteModalOpen(false);
        setVideoToDelete(null);
        fetchVideos(); // Refresh the list
        
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to delete video');
      }
    } catch (err) {
      console.error('Error deleting video:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      if (err.response?.status === 404) {
        setError('Video not found. It may have been already deleted.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to delete video. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle status functions
  const openToggleStatusModal = (video) => {
    console.log('🔄 Toggle status button clicked for video:', video.title, 'ID:', video._id);
    setVideoToToggle(video);
    setToggleStatusModalOpen(true);
  };

  const closeToggleStatusModal = () => {
    setToggleStatusModalOpen(false);
    setVideoToToggle(null);
  };

  const confirmToggleStatus = async () => {
    if (!videoToToggle) return;

    try {
      setToggleStatusLoading(videoToToggle._id);
      setError(null);
      
      console.log('🔄 Toggling status for video:', videoToToggle._id);
      console.log('🔗 API endpoint: /youtube-video/activate-inactive/' + videoToToggle._id);
      
      const response = await youtubeAPI.toggleStatus(videoToToggle._id);
      console.log('✅ Toggle status response:', response.data);
      
      if (response.data.success) {
        // Update local state
        const newStatus = !videoToToggle.isActive;
        setVideos(prev => prev.map(video => 
          video._id === videoToToggle._id 
            ? { ...video, isActive: newStatus }
            : video
        ));
        
        // If we're in detail view and updating the current video, update selectedVideo too
        if (selectedVideo && selectedVideo._id === videoToToggle._id) {
          setSelectedVideo(prev => ({ ...prev, isActive: newStatus }));
        }
        
        // Close modal and show success message
        closeToggleStatusModal();
        setSuccessMessage(`Video ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to update video status');
      }
    } catch (error) {
      console.error('Error updating video status:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      let errorMessage = 'Failed to update video status';
      
      if (error.response) {
        // Handle API error responses
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        // Handle specific HTTP status codes
        if (error.response.status === 404) {
          errorMessage = 'Video not found';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid request';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error occurred while updating video status';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setToggleStatusLoading(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 Form submission started');
    console.log('📋 Form data:', formData);
    console.log('✏️ Editing video:', editingVideo);
    
    // Basic validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    
    if (!formData.videoUrl.trim()) {
      setError('Video URL is required');
      return;
    }
    
    if (!formData.placeId.trim()) {
      setError('Place ID is required');
      return;
    }
    
    console.log('✅ Validation passed');
    
    // For editing, show confirmation dialog
    if (editingVideo) {
      console.log('🔄 Showing edit confirmation for:', editingVideo.title);
      console.log('🆔 Video ID:', editingVideo._id);
      const formDataCopy = { ...formData };
      console.log('📋 Setting pending form data:', formDataCopy);
      setPendingFormData(formDataCopy);
      setShowEditConfirmation(true);
      console.log('✅ Edit confirmation modal should now be visible');
      console.log('🔍 Current showEditConfirmation state:', showEditConfirmation);
      
      // TEMPORARY: For testing, proceed directly without modal
      console.log('🧪 TEMPORARY: Bypassing modal for testing...');
      setTimeout(() => {
        console.log('🧪 TEMPORARY: Calling submitFormData directly...');
        submitFormData(formDataCopy);
      }, 100);
      
      return;
    }
    
    // For creating, proceed directly
    console.log('🆕 Creating new video');
    await submitFormData(formData);
  };

  const submitFormData = async (data) => {
    console.log('🚀 submitFormData called with:', data);
    console.log('📝 Current editingVideo:', editingVideo);
    
    try {
      setError(null);
      setFormSubmitting(true);
      
      if (editingVideo) {
        console.log('🔄 Updating video:', editingVideo._id, 'with data:', data);
        console.log('🔗 API endpoint: /youtube-video/update/' + editingVideo._id);
        
        const response = await youtubeAPI.updateVideo(editingVideo._id, data);
        console.log('✅ Update response:', response.data);
        
        if (response.data.success) {
          setSuccess(true);
          setSuccessMessage('Video updated successfully!');
          
          // Clear the confirmation modal state immediately
          setShowEditConfirmation(false);
          setPendingFormData(null);
          
          // Refresh the videos list to show updated data
          setTimeout(() => {
            setSuccess(false);
            setSuccessMessage('');
            handleBackToList();
            fetchVideos(); // Refresh the list
          }, 2000);
        } else {
          setError(response.data.message || 'Failed to update video');
          // Clear confirmation modal on error too
          setShowEditConfirmation(false);
          setPendingFormData(null);
        }
      } else {
        console.log('🆕 Creating new video with data:', data);
        console.log('🔗 API endpoint: /youtube-video/add');
        console.log('📋 Request payload:', {
          title: data.title,
          description: data.description,
          videoUrl: data.videoUrl,
          placeId: data.placeId,
          isActive: data.isActive
        });
        
        const response = await youtubeAPI.createVideo(data);
        console.log('✅ Create response:', response.data);
        
        if (response.data.success) {
          setSuccess(true);
          setSuccessMessage('Video created successfully!');
          
          setTimeout(() => {
            setSuccess(false);
            setSuccessMessage('');
            handleBackToList();
            fetchVideos(); // Refresh the list
          }, 2000);
        } else {
          setError(response.data.message || 'Failed to create video');
        }
      }
    } catch (err) {
      console.error('Error saving video:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: err.config
      });
      
      // Clear confirmation modal on any error
      setShowEditConfirmation(false);
      setPendingFormData(null);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 400) {
        setError('Invalid data provided. Please check your input.');
      } else if (err.response?.status === 404) {
        setError('Video not found. It may have been deleted.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'ECONNREFUSED') {
        setError('Cannot connect to the server. Please check if the backend is running.');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(`Failed to save video: ${err.message}`);
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    // Extract video ID from various YouTube URL formats
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    
    if (videoId && videoId[1]) {
      return `https://www.youtube.com/embed/${videoId[1]}`;
    }
    
    return url; // Return original URL if parsing fails
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return '';
    
    // Extract video ID from various YouTube URL formats
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    
    return videoId ? videoId[1] : '';
  };

  // Place search functionality
  const searchPlaces = async (searchText) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/schedule/places/search?searchPlaceName=${encodeURIComponent(searchText)}`);
      
      if (response.data.status && response.data.data) {
        setSearchResults(response.data.data);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setError('Failed to search places');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlaceSearch = (e) => {
    const searchText = e.target.value;
    setPlaceSearch(searchText);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debouncing
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(searchText);
    }, 300);
  };

  const selectPlace = (place) => {
    console.log('Selected place:', place);
    setSelectedPlace(place);
    setPlaceSearch(place.name);
    const placeId = place._id || place.id;
    console.log('Setting placeId to:', placeId);
    setFormData(prev => ({
      ...prev,
      placeId: placeId
    }));
    setShowDropdown(false);
  };

  const clearSelectedPlace = () => {
    setSelectedPlace(null);
    setPlaceSearch('');
    setFormData(prev => ({
      ...prev,
      placeId: ''
    }));
  };

  if (authLoading) {
    return (
      <div className="youtube-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="youtube-container">
        <div className="auth-error">Please log in to access this page.</div>
      </div>
    );
  }

  if (activeView === 'form') {
    return (
      <div className="youtube-container">
        <div className="youtube-header">
          <button onClick={handleBackToList} className="back-button">
            <FaChevronLeft /> Back to Videos
          </button>
          <h2>{editingVideo ? 'Edit Video' : 'Create New Video'}</h2>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleFormSubmit} className="youtube-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter video title"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="videoUrl">Video URL *</label>
              <input
                type="url"
                id="videoUrl"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                required
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              placeholder="Enter video description"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="placeId">Associated Place *</label>
            <div className="place-search-container" ref={dropdownRef}>
              <input
                type="text"
                value={placeSearch}
                onChange={handlePlaceSearch}
                placeholder="Search for a place..."
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                required
              />
              
              {isSearching && (
                <div className="search-loading">
                  <div className="spinner-small"></div>
                </div>
              )}

              {showDropdown && searchResults.length > 0 && (
                <div className="place-dropdown">
                  {searchResults.map((place) => (
                    <div
                      key={place.id || place._id}
                      className="place-dropdown-item"
                      onClick={() => selectPlace(place)}
                    >
                      <div className="place-name">{place.name}</div>
                      <div className="place-location">
                        {place.location?.city}, {place.location?.state}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedPlace && (
                <div className="selected-place">
                  <div className="selected-place-header">
                    <div>
                      <div className="selected-place-name">{selectedPlace.name}</div>
                      <div className="selected-place-location">
                        {selectedPlace.location?.city}, {selectedPlace.location?.state}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelectedPlace}
                      className="btn btn-clear-place"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
            <small className="form-help-text">
              Search and select a place to associate with this video
            </small>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              Active
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleBackToList} className="cancel-button">
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button" 
              disabled={formSubmitting}
              onClick={() => {
                console.log('🔘 Update/Create button clicked');
                console.log('📋 Current form data:', formData);
                console.log('✏️ Editing video:', editingVideo);
              }}
            >
              {formSubmitting ? (
                <>
                  <span className="loading-spinner-small"></span>
                  {editingVideo ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingVideo ? 'Update Video' : 'Create Video'
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (activeView === 'detail') {
    return (
      <div className="youtube-container">
        <div className="youtube-header">
          <button onClick={handleBackToList} className="back-button">
            <FaChevronLeft /> Back to Videos
          </button>
          <h2>Video Details</h2>
        </div>

        {selectedVideo && (
          <div className="video-detail">
            <div className="video-header">
              <h3>{selectedVideo.title}</h3>
              <div className="video-actions">
                <button 
                  onClick={() => handleEditVideo(selectedVideo)} 
                  className="action-button edit-button"
                  disabled={toggleStatusLoading === selectedVideo._id}
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  onClick={() => openToggleStatusModal(selectedVideo)}
                  className="action-button toggle-button"
                  disabled={toggleStatusLoading === selectedVideo._id}
                >
                  {toggleStatusLoading === selectedVideo._id ? (
                    <>
                      <div className="spinner-small"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      {selectedVideo.isActive ? 'Deactivate' : 'Activate'}
                    </>
                  )}
                </button>
                <button 
                  onClick={() => handleDeleteVideo(selectedVideo)} 
                  className="action-button delete-button"
                  disabled={toggleStatusLoading === selectedVideo._id}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
            
            <div className="video-content">
              <div className="video-embed-detail">
                {selectedVideo.videoUrl ? (
                  <iframe
                    src={getYouTubeEmbedUrl(selectedVideo.videoUrl)}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <div className="video-placeholder-detail">
                    <FaYoutube />
                    <p>No video URL available</p>
                  </div>
                )}
              </div>
              
              <div className="video-info">
                <div className="info-row">
                  <strong>Video URL:</strong> 
                  <a href={selectedVideo.videoUrl} target="_blank" rel="noopener noreferrer" className="video-link">
                    {selectedVideo.videoUrl}
                  </a>
                </div>
                <div className="info-row">
                  <strong>Video ID:</strong> {getYouTubeVideoId(selectedVideo.videoUrl) || 'N/A'}
                </div>
                <div className="info-row">
                  <strong>Place:</strong> {selectedVideo.placeId?.name || 'N/A'}
                </div>
                {selectedVideo.placeId?.location && (
                  <div className="info-row">
                    <strong>Location:</strong>
                    <div className="location-details">
                      <p><strong>Address:</strong> {selectedVideo.placeId.location.address}</p>
                      <p><strong>City:</strong> {selectedVideo.placeId.location.city}</p>
                      <p><strong>State:</strong> {selectedVideo.placeId.location.state}</p>
                      <p><strong>Country:</strong> {selectedVideo.placeId.location.country}</p>
                      <p><strong>Coordinates:</strong> {selectedVideo.placeId.location.latitude}, {selectedVideo.placeId.location.longitude}</p>
                    </div>
                  </div>
                )}
                <div className="info-row">
                  <strong>Status:</strong> 
                  <span className={`status ${selectedVideo.isActive ? 'active' : 'inactive'}`}>
                    {selectedVideo.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Created By:</strong> {selectedVideo.createdBy?.email || 'N/A'}
                </div>
                <div className="info-row">
                  <strong>Created At:</strong> {new Date(selectedVideo.createdAt).toLocaleDateString()}
                </div>
                <div className="info-row">
                  <strong>Updated At:</strong> {new Date(selectedVideo.updatedAt).toLocaleDateString()}
                </div>
                {selectedVideo.description && (
                  <div className="info-row">
                    <strong>Description:</strong>
                    <p>{selectedVideo.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="youtube-container">
      <div className="youtube-header">
        <h2>YouTube Videos Management</h2>
        <p>Manage and organize your YouTube video content</p>
        <div className="header-actions">
          <button onClick={handleCreateVideo} className="create-button">
            <FaPlus /> Add New Video
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button 
            onClick={() => {
              console.log('🧪 Testing API connection...');
              fetchVideos(true);
            }} 
            className="retry-button"
            style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '12px' }}
          >
            Retry
          </button>
        </div>
      )}
      {success && <div className="success-message">{successMessage}</div>}

      <div className="youtube-content">
        {loading ? (
          <div className="loading-spinner">Loading videos...</div>
        ) : videos.length === 0 ? (
          <div className="no-videos">
            <FaYoutube />
            <h3>No videos found</h3>
            <p>Start by adding your first YouTube video.</p>
            <button onClick={handleCreateVideo} className="create-button">
              <FaPlus /> Add Video
            </button>
          </div>
        ) : (
          <div className="videos-grid">
            {videos.map((video) => (
              <div 
                key={video._id} 
                className={`video-card ${!video.isActive ? 'inactive' : ''} ${isDeleting === video._id ? 'deleting' : ''} ${toggleStatusLoading === video._id ? 'updating' : ''}`}
                onClick={() => handleViewVideo(video)}
                style={{ cursor: (isDeleting === video._id || toggleStatusLoading === video._id) ? 'not-allowed' : 'pointer' }}
              >
                <div className="video-embed">
                  {video.videoUrl ? (
                    <iframe
                      src={getYouTubeEmbedUrl(video.videoUrl)}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  ) : (
                    <div className="video-placeholder">
                      <FaYoutube />
                      <p>No video URL</p>
                    </div>
                  )}
                  <div className="video-status">
                    <span className={`status ${video.isActive ? 'active' : 'inactive'}`}>
                      {video.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="video-info">
                  <h4 className="video-title">{video.title}</h4>
                  
                  <div className="video-place">
                    <FaMapMarkerAlt />
                    <span>{video.placeId?.name || 'N/A'}</span>
                  </div>
                  
                  <div className="video-meta">
                    <div className="video-date">
                      <FaCalendar />
                      <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="video-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditVideo(video);
                      }} 
                      className="action-button edit-button"
                      title="Edit Video"
                      disabled={toggleStatusLoading === video._id}
                    >
                      <FaEdit /> Edit
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openToggleStatusModal(video);
                      }} 
                      className="action-button toggle-button"
                      title={video.isActive ? 'Deactivate Video' : 'Activate Video'}
                      disabled={toggleStatusLoading === video._id}
                    >
                      {toggleStatusLoading === video._id ? (
                        <>
                          <div className="spinner-small"></div>
                          Updating...
                        </>
                      ) : (
                        video.isActive ? 'Deactivate' : 'Activate'
                      )}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🗑️ Delete button clicked for video:', video.title, 'ID:', video._id);
                        handleDeleteVideo(video);
                      }} 
                      className="action-button delete-button"
                      title="Delete Video"
                      disabled={toggleStatusLoading === video._id}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        <YouTubePagination 
          pagination={pagination}
          onPageChange={handlePageChange}
          show={videos.length > 0}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        videoTitle={videoToDelete?.title || ''}
        loading={isDeleting}
      />

      {/* Edit Confirmation Modal */}
      {showEditConfirmation && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="modal" style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              borderBottom: '1px solid #eee',
              paddingBottom: '12px'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>Confirm Update</h3>
              <button onClick={() => {
                console.log('❌ Modal closed by user');
                setShowEditConfirmation(false);
                setPendingFormData(null);
              }} className="close-button" style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px',
                color: '#666'
              }}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body" style={{ marginBottom: '24px' }}>
              <p style={{ marginBottom: '12px', color: '#333' }}>Are you sure you want to update <strong>"{editingVideo?.title}"</strong>?</p>
              <p style={{ marginBottom: '16px', color: '#666' }}>This will modify the existing video information.</p>
              {pendingFormData && (
                <div style={{marginTop: '10px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '13px', border: '1px solid #e9ecef'}}>
                  <strong style={{ color: '#495057' }}>Form Data Preview:</strong><br/>
                  <span style={{ color: '#6c757d' }}>Title:</span> {pendingFormData.title}<br/>
                  <span style={{ color: '#6c757d' }}>Place ID:</span> {pendingFormData.placeId}<br/>
                  <span style={{ color: '#6c757d' }}>Active:</span> {pendingFormData.isActive ? 'Yes' : 'No'}
                </div>
              )}
            </div>
            <div className="modal-actions" style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              borderTop: '1px solid #eee',
              paddingTop: '16px'
            }}>
              <button onClick={() => {
                console.log('❌ Update cancelled by user');
                setShowEditConfirmation(false);
                setPendingFormData(null);
              }} className="cancel-button" style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                color: '#666',
                fontWeight: '500'
              }}>
                Cancel
              </button>
              <button 
                onClick={() => {
                  console.log('🔄 Confirmation confirmed, calling submitFormData with:', pendingFormData);
                  console.log('📋 Pending form data exists:', !!pendingFormData);
                  console.log('📋 Pending form data content:', pendingFormData);
                  setShowEditConfirmation(false);
                  if (pendingFormData) {
                    console.log('🚀 About to call submitFormData...');
                    submitFormData(pendingFormData);
                  } else {
                    console.error('❌ No pending form data found!');
                    setError('Form data is missing. Please try again.');
                  }
                }} 
                className="submit-button" style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#e406f0',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                Update Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Status Modal */}
      <ToggleStatusModal
        isOpen={toggleStatusModalOpen}
        onClose={closeToggleStatusModal}
        onConfirm={confirmToggleStatus}
        videoTitle={videoToToggle?.title || ''}
        currentStatus={videoToToggle?.isActive || false}
        loading={toggleStatusLoading !== null}
      />
    </div>
  );
};

export default YouTube;
