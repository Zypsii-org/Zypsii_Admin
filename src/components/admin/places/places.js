import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FaPlus, FaTrash, FaMapMarkerAlt, FaTimes, FaEdit, FaList, FaChevronLeft, FaUpload, FaImage } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import axios from 'axios';
import PlacesGrid from './PlacesGrid';
import FiltersSection from './FiltersSection';
import Pagination from './Pagination';
import NoResultsSection from './NoResultsSection';
import EditPlace from './EditPlace';
import DeleteConfirmModal from './DeleteConfirmModal';
import { COUNTRIES } from '../../../constants/countries';
import './places.css';

const Places = () => {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const isMountedRef = useRef(true);
  const searchTimeoutRef = useRef(null);
  const previousFiltersRef = useRef(null);

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [searchPending, setSearchPending] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list', 'form', 'detail', or 'edit'
  const [editingPlace, setEditingPlace] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
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
    category: 'all',
    isActive: 'all', // 'all', 'true', 'false'
    featured: 'all'  // 'all', 'true', 'false'
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    googlePlaceId: '',
    location: {
      latitude: '',
      longitude: '',
      address: '',
      city: '',
      state: '',
      country: 'India'
    },
    images: [{ url: '', alt: '' }],
    rating: 4.0,
    reviewCount: 0,
    priceRange: 'Free',
    entryFee: { amount: 0, currency: 'INR' },
    openingHours: {
      monday: '24/7',
      tuesday: '24/7',
      wednesday: '24/7',
      thursday: '24/7',
      friday: '24/7',
      saturday: '24/7',
      sunday: '24/7'
    },
    bestTimeToVisit: 'All year round',
    difficulty: 'Easy',
    amenities: [],
    activities: [],
    transportation: [],
    nearbyPlaces: [],
    tips: [],
    isActive: true,
    featured: false,
    tags: [],
    createdBy: null,
    verified: true,
    topSearch: false
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [authError, setAuthError] = useState(null);
  
  // Image upload states
  const [selectedFiles, setSelectedFiles] = useState({});
  const [isUploading, setIsUploading] = useState({});
  const [isDragOver, setIsDragOver] = useState({});

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [placeToDelete, setPlaceToDelete] = useState(null);
  
  // Lazy loading states
  const [isLazyLoading, setIsLazyLoading] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Memoized data to prevent unnecessary re-renders
  const memoizedPlaces = useMemo(() => places, [places]);
  const memoizedPagination = useMemo(() => pagination, [pagination]);
  const memoizedFilters = useMemo(() => filters, [filters]);

  // Handle authentication errors
  const handleAuthError = useCallback((error) => {
    if (error.response?.status === 401) {
      setAuthError('Your session has expired. Please log in again.');
      setTimeout(() => {
        logout();
      }, 2000);
      return true;
    }
    return false;
  }, [logout]);

  // Direct fetch function to avoid dependency issues
  const fetchPlacesDirect = useCallback(async (page = 1, isLazyLoad = false) => {
    try {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      // Add a small delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!isLazyLoad) {
        setLoading(true);
        setIsLazyLoading(false);
      } else {
        setIsLazyLoading(true);
        setLoading(false);
      }
      setFilterLoading(false); // Clear filter loading when fetch starts
      setError(null);
      setAuthError(null);

      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        throw new Error('Authentication required');
      }

      // Calculate offset based on page
      const limit = pagination.limit;
      const offset = (page - 1) * limit;

      // Build query parameters
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      // Get current filters from state (not from closure)
      const currentFilters = {
        search: filters.search,
        category: filters.category,
        isActive: filters.isActive,
        featured: filters.featured
      };

      // Add filters if they're not 'all'
      if (currentFilters.search && currentFilters.search.trim()) {
        queryParams.append('search', currentFilters.search.trim());
      }
      if (currentFilters.category !== 'all') {
        queryParams.append('category', currentFilters.category);
      }
      if (currentFilters.isActive !== 'all') {
        queryParams.append('isActive', currentFilters.isActive);
      }
      if (currentFilters.featured !== 'all') {
        queryParams.append('featured', currentFilters.featured);
      }

      // Get token manually to ensure it's available
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate token format
      if (typeof token !== 'string' || token.length < 10) {
        throw new Error('Invalid token format');
      }

      // Try using the API service first
      let response;
      try {
        response = await api.get(`/admin/places-list?${queryParams}`);
      } catch (apiError) {
        // Fallback: use axios directly with explicit headers
        const token = localStorage.getItem('token');
        response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/places-list?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.data.success) {
        // Check if component is still mounted before setting state
        if (!isMountedRef.current) {
          return;
        }

        // Rapid state update for better UX
        if (isLazyLoad && page > 1) {
          // For lazy loading, append new places to existing ones
          setPlaces(prev => [...prev, ...(response.data.data.places || [])]);
        } else {
          // For regular loading, replace all places
          setPlaces(response.data.data.places || []);
        }
        
        // Mark that initial load is complete
        setHasInitialLoad(true);
        
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalPages: response.data.data.pagination.totalPages,
          totalCount: response.data.data.pagination.totalCount,
          offset: response.data.data.pagination.offset,
          hasNextPage: response.data.data.pagination.hasNextPage,
          hasPrevPage: response.data.data.pagination.hasPrevPage
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch places');
      }
    } catch (error) {
      console.error('Error fetching places:', error);

      // Check if component is still mounted before setting state
      if (!isMountedRef.current) {
        return;
      }

      // Handle authentication errors
      if (handleAuthError(error)) {
        return;
      }

      setError(error.message || 'Failed to fetch places');
      // For demo purposes, set some sample data
      setPlaces([
        {
          _id: 1,
          name: 'Central Park Restaurant',
          category: 'Restaurant',
          location: { city: 'New York', state: 'NY' },
          rating: 4.5,
          isActive: true,
          description: 'A beautiful restaurant in the heart of Central Park',
          priceRange: 'Moderate',
          difficulty: 'Easy'
        },
        {
          _id: 2,
          name: 'Downtown Coffee Shop',
          category: 'Cafe',
          location: { city: 'Los Angeles', state: 'CA' },
          rating: 4.2,
          isActive: true,
          description: 'Cozy coffee shop with great atmosphere',
          priceRange: 'Budget',
          difficulty: 'Easy'
        },
        {
          _id: 3,
          name: 'Mountain View Hotel',
          category: 'Hotel',
          location: { city: 'Denver', state: 'CO' },
          rating: 4.7,
          isActive: false,
          description: 'Luxury hotel with mountain views',
          priceRange: 'Expensive',
          difficulty: 'Easy'
        }
      ]);
    } finally {
      // Only set loading to false if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
        setIsLazyLoading(false);
      }
    }
  }, [isAuthenticated, user, pagination.limit, filters.search, filters.category, filters.isActive, filters.featured, handleAuthError]);

  // Optimized API call with rapid response handling
  const fetchPlaces = useCallback(async (page = 1, isLazyLoad = false) => {
    try {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      if (!isLazyLoad) {
        setLoading(true);
        setIsLazyLoading(false);
      } else {
        setIsLazyLoading(true);
        setLoading(false);
      }
      setFilterLoading(false); // Clear filter loading when fetch starts
      setError(null);
      setAuthError(null);

      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        throw new Error('Authentication required');
      }

      // Calculate offset based on page
      const limit = pagination.limit;
      const offset = (page - 1) * limit;

      // Build query parameters
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      // Add search parameter - this is the key fix for search functionality
      if (filters.search && filters.search.trim()) {
        queryParams.append('search', filters.search.trim());
      }
      
      // Add other filters if they're not 'all'
      if (filters.category && filters.category !== 'all') {
        queryParams.append('category', filters.category);
      }
      if (filters.isActive !== 'all') {
        queryParams.append('isActive', filters.isActive);
      }
      if (filters.featured !== 'all') {
        queryParams.append('featured', filters.featured);
      }

      // Get token manually to ensure it's available
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate token format
      if (typeof token !== 'string' || token.length < 10) {
        throw new Error('Invalid token format');
      }

      // Try using the API service first
      let response;
      try {
        response = await api.get(`/admin/places-list?${queryParams}`);
      } catch (apiError) {
        // Fallback: use axios directly with explicit headers
        const token = localStorage.getItem('token');
        response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/places-list?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.data.success) {
        // Check if component is still mounted before setting state
        if (!isMountedRef.current) {
          return;
        }

        // Rapid state update for better UX
        if (isLazyLoad && page > 1) {
          // For lazy loading, append new places to existing ones
          setPlaces(prev => [...prev, ...(response.data.data.places || [])]);
        } else {
          // For regular loading, replace all places
          setPlaces(response.data.data.places || []);
        }
        
        // Mark that initial load is complete
        setHasInitialLoad(true);
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalPages: response.data.data.pagination.totalPages,
          totalCount: response.data.data.pagination.totalCount,
          offset: response.data.data.pagination.offset,
          hasNextPage: response.data.data.pagination.hasNextPage,
          hasPrevPage: response.data.data.pagination.hasPrevPage
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch places');
      }
    } catch (error) {
      console.error('Error fetching places:', error);

      // Check if component is still mounted before setting state
      if (!isMountedRef.current) {
        return;
      }

      // Handle authentication errors
      if (handleAuthError(error)) {
        return;
      }

      setError(error.message || 'Failed to fetch places');
      // For demo purposes, set some sample data
      setPlaces([
        {
          _id: 1,
          name: 'Central Park Restaurant',
          category: 'Restaurant',
          location: { city: 'New York', state: 'NY' },
          rating: 4.5,
          isActive: true,
          description: 'A beautiful restaurant in the heart of Central Park',
          priceRange: 'Moderate',
          difficulty: 'Easy'
        },
        {
          _id: 2,
          name: 'Downtown Coffee Shop',
          category: 'Cafe',
          location: { city: 'Los Angeles', state: 'CA' },
          rating: 4.2,
          isActive: true,
          description: 'Cozy coffee shop with great atmosphere',
          priceRange: 'Budget',
          difficulty: 'Easy'
        },
        {
          _id: 3,
          name: 'Mountain View Hotel',
          category: 'Hotel',
          location: { city: 'Denver', state: 'CO' },
          rating: 4.7,
          isActive: false,
          description: 'Luxury hotel with mountain views',
          priceRange: 'Expensive',
          difficulty: 'Easy'
        }
      ]);
    } finally {
      // Only set loading to false if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
        setIsLazyLoading(false);
      }
    }
  }, [isAuthenticated, user, pagination.limit, filters, handleAuthError]);

  // Component mount effect - ensure initial data fetch
  useEffect(() => {
    // Wait for authentication to complete
    if (authLoading) {
      return;
    }

    // Initialize the previous filters ref with current filters
    if (!previousFiltersRef.current) {
      previousFiltersRef.current = JSON.stringify(filters);
    }

    // If we already have places and initial load is complete, don't fetch
    if (places.length > 0 && hasInitialLoad) {
      return;
    }

    // If authenticated and on list view, fetch data
    if (isAuthenticated && activeView === 'list') {
      fetchPlacesDirect(1);
    }
  }, [authLoading, isAuthenticated, activeView, places.length, hasInitialLoad, fetchPlacesDirect, filters]);

  // Effect for pagination changes - immediate fetch
  useEffect(() => {
    if (isAuthenticated && activeView === 'list' && !loading && pagination.currentPage > 1) {
      fetchPlacesDirect(pagination.currentPage);
    }
  }, [pagination.currentPage, isAuthenticated, activeView, loading, fetchPlacesDirect]);

  // Separate effect for filters to prevent unnecessary re-renders
  useEffect(() => {
    // Wait for authentication to complete
    if (authLoading) {
      return;
    }

    // Only proceed if authenticated and on list view
    if (!isAuthenticated || activeView !== 'list' || loading) {
      return;
    }

    // Check if filters have actually changed
    const currentFilters = JSON.stringify(filters);
    const previousFilters = previousFiltersRef.current;

    // Skip if this is the first render or filters haven't changed
    if (!previousFilters || currentFilters === previousFilters) {
      // Update the ref for next comparison
      previousFiltersRef.current = currentFilters;
      return;
    }

    // Update the ref for next comparison
    previousFiltersRef.current = currentFilters;

    // Clear any existing search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set search pending state for all filter changes
    setSearchPending(true);
    setFilterLoading(false);

    // Add delay for all filter changes to prevent too many requests
    searchTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        // Clear pending state and set loading
        setSearchPending(false);
        setFilterLoading(true);
        // Reset to first page when filters change
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        // Fetch with new filters after delay
        fetchPlacesDirect(1);
      }
    }, 1500); // Increased delay to 1.5 seconds to prevent rate limiting
  }, [filters.search, filters.category, filters.isActive, filters.featured, authLoading, isAuthenticated, activeView, loading, fetchPlacesDirect, filters]);

  // Lazy loading function for loading more places
  const loadMorePlaces = useCallback(async () => {
    if (!pagination.hasNextPage || isLazyLoading || loading) {
      return;
    }
    
    const nextPage = pagination.currentPage + 1;
    await fetchPlaces(nextPage, true);
  }, [pagination.hasNextPage, pagination.currentPage, isLazyLoading, loading, fetchPlaces]);


  // Cleanup effect to prevent API calls when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clear search timeout on unmount
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Memoized callbacks to prevent unnecessary re-renders
  const handleFilterChange = useCallback((filterName, value) => {

    // Always update the filter value
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterName]: value
      };
      return newFilters;
    });
    // Page reset is now handled in the useEffect for better UX
  }, []); // Remove filters dependency to prevent infinite loops

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'all',
      isActive: 'all',
      featured: 'all'
    });
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: newValue
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: newValue }));
    }
  };

  const handleImageChange = (index, field, value) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages[index] = { ...newImages[index], [field]: value };
      return { ...prev, images: newImages };
    });
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, { url: '', alt: '' }]
    }));
  };

  const removeImageField = (index) => {
    if (formData.images.length > 1) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  // Image upload functions
  const handleFileChange = (index, file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFiles(prev => ({
        ...prev,
        [index]: file
      }));
      setError(null);
    } else {
      setError('Please select an image file');
    }
  };

  const uploadImage = async (index) => {
    const file = selectedFiles[index];
    if (!file) return null;

    const formData = new FormData();
    formData.append('mediaFile', file);

    try {
      setIsUploading(prev => ({ ...prev, [index]: true }));
              const response = await axios.post(`${process.env.REACT_APP_API_URL}/uploadFile?mediaType=places`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status && response.data.urls && response.data.urls.length > 0) {
        console.log('Uploaded image URL:', response.data.urls[0]);
        return response.data.urls[0];
      }
      throw new Error('No URL returned from upload');
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setIsUploading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setIsDragOver(prev => ({ ...prev, [index]: true }));
  };

  const handleDragLeave = (e, index) => {
    e.preventDefault();
    setIsDragOver(prev => ({ ...prev, [index]: false }));
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    setIsDragOver(prev => ({ ...prev, [index]: false }));
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileChange(index, file);
      } else {
        setError('Please select an image file');
      }
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setAuthError(null);

    try {
      // Check authentication
      if (!isAuthenticated || !user) {
        throw new Error('Authentication required');
      }

      // Upload images first if there are selected files
      const updatedImages = [...formData.images];
      for (let i = 0; i < updatedImages.length; i++) {
        if (selectedFiles[i]) {
          const uploadedUrl = await uploadImage(i);
          if (uploadedUrl) {
            updatedImages[i] = { ...updatedImages[i], url: uploadedUrl };
          } else {
            throw new Error(`Failed to upload image ${i + 1}`);
          }
        }
      }

      // Update form data with uploaded image URLs
      const formDataWithImages = {
        ...formData,
        images: updatedImages
      };

      // Debug: Log the form data being sent
      console.log('Submitting form data:', formDataWithImages);
      console.log('Editing place:', editingPlace);

      let savePlaceData;
      
      // Add new place only (editing is handled by EditPlace component)
      savePlaceData = await api.post('/admin/add-place', formDataWithImages);


      // Check if the API call was successful
      if (savePlaceData.data && savePlaceData.data.status) {
        console.log('Place saved successfully:', savePlaceData.data);
        setSuccessMessage('Place added successfully!');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage('');
        }, 3000);

        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          subcategory: '',
          placeId: '',
          location: {
            latitude: '',
            longitude: '',
            address: '',
            city: '',
            state: '',
            country: 'India'
          },
          images: [{ url: '', alt: '' }],
          rating: 4.0,
          reviewCount: 0,
          priceRange: 'Free',
          entryFee: { amount: 0, currency: 'INR' },
          openingHours: {
            monday: '24/7',
            tuesday: '24/7',
            wednesday: '24/7',
            thursday: '24/7',
            friday: '24/7',
            saturday: '24/7',
            sunday: '24/7'
          },
          bestTimeToVisit: 'All year round',
          difficulty: 'Easy',
          amenities: [],
          activities: [],
          transportation: [],
          nearbyPlaces: [],
          tips: [],
          isActive: true,
          featured: false,
          tags: [],
          createdBy: null,
          verified: true,
          topSearch: false
        });

        // Switch back to list view
        setActiveView('list');
        
        // Refresh the places list
        fetchPlacesDirect(1);
      } else if (savePlaceData.status === 200 || savePlaceData.status === 201) {
        // Handle successful HTTP responses that might not have the expected data structure
        console.log('Place operation successful (HTTP success):', savePlaceData);
        setSuccessMessage('Place added successfully!');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage('');
        }, 3000);

        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          subcategory: '',
          placeId: '',
          location: {
            latitude: '',
            longitude: '',
            address: '',
            city: '',
            state: '',
            country: 'India'
          },
          images: [{ url: '', alt: '' }],
          rating: 4.0,
          reviewCount: 0,
          priceRange: 'Free',
          entryFee: { amount: 0, currency: 'INR' },
          openingHours: {
            monday: '24/7',
            tuesday: '24/7',
            wednesday: '24/7',
            thursday: '24/7',
            friday: '24/7',
            saturday: '24/7',
            sunday: '24/7'
          },
          bestTimeToVisit: 'All year round',
          difficulty: 'Easy',
          amenities: [],
          activities: [],
          transportation: [],
          nearbyPlaces: [],
          tips: [],
          isActive: true,
          featured: false,
          tags: [],
          createdBy: null,
          verified: true,
          topSearch: false
        });

        setActiveView('list');
        fetchPlacesDirect(1);
      } else {
        throw new Error(savePlaceData.data?.message || 'Failed to save place data');
      }
    } catch (err) {
      console.error('Submit error:', err);

      // Handle authentication errors
      if (handleAuthError(err)) {
        return;
      }

      setError(err.message || 'An error occurred while submitting the form');
    }
  };

  // Memoized callbacks to prevent unnecessary re-renders
  const handlePlaceClick = useCallback((place) => {
    setSelectedPlace(place);
    setActiveView('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedPlace(null);
    setActiveView('list');
  }, []);

  const handleEdit = useCallback((place) => {
    setEditingPlace(place);
    setActiveView('edit');
  }, []);

  const handleDelete = useCallback(async (placeId) => {
    try {
      // Check authentication
      if (!isAuthenticated || !user) {
        throw new Error('Authentication required');
      }

      await api.delete(`/admin/delete-place/${placeId}`);

      // Remove from local state
      setPlaces(prev => prev.filter(place => place._id !== placeId));
      setSuccess('Place deleted successfully');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error deleting place:', error);

      // Handle authentication errors
      if (handleAuthError(error)) {
        return;
      }

      setError('Failed to delete place');
    }
  }, [isAuthenticated, user, handleAuthError]);

  const openDeleteModal = useCallback((place) => {
    setPlaceToDelete(place);
    setDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setPlaceToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (placeToDelete) {
      await handleDelete(placeToDelete._id);
      closeDeleteModal();
      
      // If we're in edit view, switch back to list view
      if (activeView === 'edit') {
        setEditingPlace(null);
        setActiveView('list');
      }
    }
  }, [placeToDelete, handleDelete, closeDeleteModal, activeView]);

  const toggleStatus = useCallback(async (placeId, currentStatus) => {
    try {
      // Check authentication
      if (!isAuthenticated || !user) {
        throw new Error('Authentication required');
      }

      await api.patch(`/admin/places/${placeId}/status`, {
        isActive: !currentStatus
      });

      // Update local state
      setPlaces(prev => prev.map(place =>
        place._id === placeId
          ? { ...place, isActive: !currentStatus }
          : place
      ));
    } catch (error) {
      console.error('Error updating place status:', error);

      // Handle authentication errors
      if (handleAuthError(error)) {
        return;
      }

      setError('Failed to update place status');
    }
  }, [isAuthenticated, user, handleAuthError]);


  // Callback functions for EditPlace component
  const handleEditSave = useCallback((updatedPlace) => {
    // Update the place in the local state
    setPlaces(prev => prev.map(place => 
      place._id === updatedPlace._id ? updatedPlace : place
    ));
    
    // Clear editing state and switch back to list view
    setEditingPlace(null);
    setActiveView('list');
    
    // Show success message
    setSuccessMessage('Place updated successfully!');
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSuccessMessage('');
    }, 3000);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingPlace(null);
    setActiveView('list');
  }, []);



  const renderPlacesList = () => {
    // Show loading if authentication is still loading
    if (authLoading) {
      return (
        <div className="auth-loading">
          <div className="spinner"></div>
          <p>Checking authentication...</p>
        </div>
      );
    }

    // Show error if not authenticated
    if (!isAuthenticated) {
      return (
        <div className="error-message">
          <p>Please log in to access places.</p>
        </div>
      );
    }

    // Show loading if places are being fetched initially
    if (loading && places.length === 0) {
      return (
        <div className="auth-loading">
          <div className="spinner"></div>
          <p>Loading places...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-message">
          <p>{error}</p>
        </div>
      );
    }

    return (
      <>
        {/* Filters Section */}
        <FiltersSection
          filters={memoizedFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          filterLoading={filterLoading}
          searchPending={searchPending}
        />

        {/* Places Grid or No Results Message */}
        {!memoizedPlaces.length ? (
          <NoResultsSection
            filters={memoizedFilters}
            onClearFilters={clearFilters}
            onAddFirstPlace={() => setActiveView('form')}
          />
        ) : (
          <>
            {searchPending ? (
              <div className="cards-pending">
                <div className="pending-indicator">
                  <div className="pending-dot-large"></div>
                </div>
                <p>Search pending... (1.5 second delay to prevent rate limiting)</p>
              </div>
            ) : filterLoading ? (
              <div className="cards-loading">
                <div className="spinner"></div>
                <p>Updating places...</p>
              </div>
            ) : (
              <PlacesGrid
                places={memoizedPlaces}
                onCardClick={handlePlaceClick}
                onEdit={handleEdit}
                onDelete={openDeleteModal}
                onToggleStatus={toggleStatus}
              />
            )}
          </>
        )}

        {/* Pagination and Load More */}
        {memoizedPlaces.length > 0 && (
          <div className="pagination-container">
            {/* Traditional Pagination */}
            <Pagination
              pagination={memoizedPagination}
              onPageChange={handlePageChange}
              show={memoizedPagination.totalPages > 1}
            />
            
            {/* Load More Button for Lazy Loading */}
            {memoizedPagination.hasNextPage && (
              <div className="load-more-container">
                <button
                  className="btn btn-load-more"
                  onClick={loadMorePlaces}
                  disabled={isLazyLoading}
                >
                  {isLazyLoading ? (
                    <>
                      <div className="spinner-small"></div>
                      Loading more places...
                    </>
                  ) : (
                    <>
                      Load More Places ({memoizedPagination.totalCount - memoizedPlaces.length} remaining)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  const renderPlaceForm = () => {
    return (
      <div className="place-form-container">
        <div className="form-header">
          <h2>{editingPlace ? 'Edit Place' : 'Add New Place'}</h2>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setActiveView('list');
              setEditingPlace(null);
            }}
          >
            <FaTimes /> Back to List
          </button>
        </div>

        <form onSubmit={handleSubmit} className="place-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-grid">
              <div className="form-field">
                <label>Place Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter place name"
                  required
                />
              </div>

              <div className="form-field">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {[
                    'Beach', 'Adventure', 'Mountains', 'Hiking', 'Trekking',
                    'View Points', 'National Parks', 'Wildlife', 'Cultural Sites',
                    'Historical Places', 'Waterfalls', 'Lakes', 'Forests',
                    'Caves', 'Temples', 'Museums', 'Gardens', 'Rivers'
                  ].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Google Place ID *</label>
                <input
                  type="text"
                  name="googlePlaceId"
                  value={formData.googlePlaceId}
                  onChange={handleChange}
                  placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this amazing place..."
                required
                rows="4"
              />
            </div>
          </div>

          {/* Location Details */}
          <div className="form-section">
            <h3>Location Details</h3>
            <div className="form-grid">
              <div className="form-field">
                <label>Latitude *</label>
                <input
                  type="number"
                  step="any"
                  name="location.latitude"
                  value={formData.location.latitude}
                  onChange={handleChange}
                  placeholder="e.g. 9.9252"
                  required
                />
              </div>

              <div className="form-field">
                <label>Longitude *</label>
                <input
                  type="number"
                  step="any"
                  name="location.longitude"
                  value={formData.location.longitude}
                  onChange={handleChange}
                  placeholder="e.g. 78.1198"
                  required
                />
              </div>

              <div className="form-field">
                <label>City *</label>
                <input
                  type="text"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  placeholder="Enter city name"
                  required
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Address *</label>
                <input
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  placeholder="Enter full address"
                  required
                />
              </div>

              <div className="form-field">
                <label>State *</label>
                <input
                  type="text"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  placeholder="Enter state name"
                  required
                />
              </div>

              <div className="form-field">
                <label>Country *</label>
                <select
                  name="location.country"
                  value={formData.location.country}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Select country
                  </option>
                  {formData.location.country &&
                    !COUNTRIES.includes(formData.location.country) && (
                      <option value={formData.location.country}>
                        {formData.location.country}
                      </option>
                    )}
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="form-section">
            <h3>Images</h3>
            <div className="images-container">
              {formData.images.map((image, index) => (
                <div key={index} className="image-field">
                  <div className="image-inputs">
                    <div className="form-field">
                      <label>Image Upload *</label>
                      <div className="image-upload-container">
                        <label 
                          className={`file-upload-label ${isDragOver[index] ? 'drag-over' : ''}`}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={(e) => handleDragLeave(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(index, e.target.files[0])}
                            className="file-input"
                          />
                          <div className="upload-content">
                            {selectedFiles[index] ? (
                              <>
                                <FaImage className="upload-icon" />
                                <span className="selected-file-name">{selectedFiles[index].name}</span>
                              </>
                            ) : image.url ? (
                              <>
                                <FaImage className="upload-icon" />
                                <span>Change Image</span>
                              </>
                            ) : (
                              <>
                                <FaUpload className="upload-icon" />
                                <span>Choose an image or drag & drop</span>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                      
                      {/* Image Preview */}
                      {(selectedFiles[index] || image.url) && (
                        <div className="image-preview">
                          <img 
                            src={selectedFiles[index] ? URL.createObjectURL(selectedFiles[index]) : image.url} 
                            alt="Preview" 
                          />
                          {selectedFiles[index] && (
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(index)}
                              className="btn btn-remove-image"
                            >
                              Remove File
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Fallback URL Input */}
                      <div className="form-field" style={{ marginTop: '16px' }}>
                        <label>Or provide image URL</label>
                        <input
                          type="url"
                          value={image.url}
                          onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          disabled={selectedFiles[index]}
                        />
                      </div>
                      
                      {/* Upload Status */}
                      {isUploading[index] && (
                        <div className="upload-status uploading">
                          <FaUpload /> Uploading image...
                        </div>
                      )}
                    </div>
                    
                    <div className="form-field">
                      <label>Alt Text</label>
                      <input
                        type="text"
                        value={image.alt}
                        onChange={(e) => handleImageChange(index, 'alt', e.target.value)}
                        placeholder="Describe the image"
                      />
                    </div>
                  </div>
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-remove"
                      onClick={() => removeImageField(index)}
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="btn btn-add"
                onClick={addImageField}
              >
                <FaPlus /> Add Another Image
              </button>
            </div>
          </div>

          {/* Additional Details */}
          <div className="form-section">
            <h3>Additional Details</h3>
            <div className="form-grid">
              <div className="form-field">
                <label>Price Range</label>
                <select
                  name="priceRange"
                  value={formData.priceRange}
                  onChange={handleChange}
                >
                  {['Free', 'Budget', 'Moderate', 'Expensive'].map(price => (
                    <option key={price} value={price}>{price}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Entry Fee (INR)</label>
                <input
                  type="number"
                  name="entryFee.amount"
                  value={formData.entryFee.amount}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              <div className="form-field">
                <label>Difficulty Level</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                >
                  {['Easy', 'Moderate', 'Difficult', 'Expert'].map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label>Best Time to Visit</label>
              <input
                type="text"
                name="bestTimeToVisit"
                value={formData.bestTimeToVisit}
                onChange={handleChange}
                placeholder="e.g. October to March"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingPlace ? 'Update Place' : 'Add Place'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderPlaceDetail = () => {
    if (!selectedPlace) return null;

    return (
      <div className="place-detail-container">
        <div className="detail-header">
          <button
            className="btn btn-secondary"
            onClick={handleBackToList}
          >
            <FaChevronLeft /> Back to List
          </button>

          <div className="detail-actions">
            <button
              className="btn btn-edit"
              onClick={() => {
                setEditingPlace(selectedPlace);
                setActiveView('edit');
              }}
            >
              <FaEdit /> Edit Place
            </button>
            <button
              className="btn btn-delete"
              onClick={() => openDeleteModal(selectedPlace)}
            >
              <FaTrash /> Delete
            </button>
          </div>
        </div>

        <div className="detail-content">
          {/* Basic Information */}
          <div className="detail-section">
            <div className="detail-title">
              <h1>{selectedPlace.name}</h1>
              <div className="detail-status">
                <span className={`status-badge ${selectedPlace.isActive ? 'active' : 'inactive'}`}>
                  {selectedPlace.isActive ? 'Active' : 'Inactive'}
                </span>
                {selectedPlace.featured && (
                  <span className="status-badge featured">Featured</span>
                )}
                {selectedPlace.topSearch && (
                  <span className="status-badge top-search">Top Search</span>
                )}
              </div>
            </div>

            <div className="detail-meta">
              <div className="meta-item">
                <FaMapMarkerAlt />
                <span>{selectedPlace.category}</span>
              </div>
              <div className="meta-item">
                <span className="rating">★ {selectedPlace.rating || 0}</span>
              </div>
              <div className="meta-item">
                <span className="price-range">{selectedPlace.priceRange || 'Not specified'}</span>
              </div>
              <div className="meta-item">
                <span className="difficulty">{selectedPlace.difficulty || 'Not specified'}</span>
              </div>
            </div>

            <div className="detail-description">
              <p>{selectedPlace.description || 'No description available.'}</p>
            </div>
          </div>

          {/* Location Information */}
          <div className="detail-section">
            <h3>📍 Location Details</h3>
            <div className="location-grid">
              <div className="location-item">
                <strong>Address:</strong>
                <span>{selectedPlace.location?.address || 'Not specified'}</span>
              </div>
              <div className="location-item">
                <strong>City:</strong>
                <span>{selectedPlace.location?.city || 'Not specified'}</span>
              </div>
              <div className="location-item">
                <strong>State:</strong>
                <span>{selectedPlace.location?.state || 'Not specified'}</span>
              </div>
              <div className="location-item">
                <strong>Country:</strong>
                <span>{selectedPlace.location?.country || 'Not specified'}</span>
              </div>
              <div className="location-item">
                <strong>Coordinates:</strong>
                <span>
                  {selectedPlace.location?.latitude && selectedPlace.location?.longitude
                    ? `${selectedPlace.location.latitude}, ${selectedPlace.location.longitude}`
                    : 'Not specified'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="detail-section">
            <h3>ℹ️ Additional Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <strong>Entry Fee:</strong>
                <span>
                  {selectedPlace.entryFee?.amount > 0
                    ? `₹${selectedPlace.entryFee.amount} ${selectedPlace.entryFee?.currency || 'INR'}`
                    : 'Free'
                  }
                </span>
              </div>
              <div className="detail-item">
                <strong>Best Time to Visit:</strong>
                <span>{selectedPlace.bestTimeToVisit || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <strong>Review Count:</strong>
                <span>{selectedPlace.reviewCount || 0} reviews</span>
              </div>
              <div className="detail-item">
                <strong>Google Place ID:</strong>
                <span>{selectedPlace.placeId || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Images */}
          {selectedPlace.images && selectedPlace.images.length > 0 ? (
            <div className="detail-section">
              <h3>📸 Images ({selectedPlace.images.length})</h3>
              <div className="images-grid">
                {selectedPlace.images.map((image, index) => (
                  <div key={index} className="image-item">
                    <img
                      src={image.url}
                      alt={image.alt || `Image ${index + 1}`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="image-placeholder" style={{ display: 'none' }}>
                      <FaImage />
                      <span>Image not available</span>
                    </div>
                    {image.alt && <p className="image-caption">{image.alt}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="detail-section">
              <h3>📸 Images</h3>
              <div className="no-images">
                <FaImage />
                <p>No images available for this place</p>
              </div>
            </div>
          )}

          {/* Opening Hours */}
          <div className="detail-section">
            <h3>🕒 Opening Hours</h3>
            {selectedPlace.openingHours && Object.keys(selectedPlace.openingHours).length > 0 ? (
              <div className="hours-grid">
                {Object.entries(selectedPlace.openingHours).map(([day, hours]) => (
                  <div key={day} className="hour-item">
                    <strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong>
                    <span>{hours || 'Closed'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-hours">
                <p>No opening hours information available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="places-container">
      <div className="places-header">
        <h1>Places Management</h1>
        <p>Manage your travel destinations and attractions</p>
      </div>

      {/* Navigation Tabs */}
      <div className="places-nav">
        <button
          className={`nav-tab ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => setActiveView('list')}
        >
          <FaList /> View Places
        </button>
        <button
          className={`nav-tab ${activeView === 'form' ? 'active' : ''}`}
          onClick={() => setActiveView('form')}
        >
          <FaPlus /> Add New Place
        </button>
        {editingPlace && (
          <button
            className={`nav-tab ${activeView === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveView('edit')}
          >
            <FaEdit /> Edit Place
          </button>
        )}
      </div>

      {/* Success Message - Shown at top level for all views */}
      {success && successMessage && (
        <div className="alert alert-success">
          <p>{successMessage}</p>
        </div>
      )}

      {/* Error Message - Shown at top level for all views */}
      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      {/* Authentication Error Alert */}
      {authError && (
        <div className="alert alert-auth-error">
          <p>{authError}</p>
        </div>
      )}

      {/* Content */}
      {activeView === 'list' ? renderPlacesList() : 
       activeView === 'form' ? renderPlaceForm() : 
       activeView === 'edit' ? (
         <EditPlace
           place={editingPlace}
           onSave={handleEditSave}
           onCancel={handleEditCancel}
           onDelete={openDeleteModal}
         />
       ) : 
       renderPlaceDetail()}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        placeName={placeToDelete?.name || ''}
      />
    </div>
  );
};

export default Places;

