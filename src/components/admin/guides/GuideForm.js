import React, { useState, useEffect, useRef } from 'react';
import { FaSave, FaTimes, FaUpload, FaTags, FaMapMarkerAlt, FaImage } from 'react-icons/fa';
import axios from 'axios';
import './GuideForm.css';

const GuideForm = ({ guide, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    image: '',
    tags: [],
    placeId: '',
    isActive: true
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Place search states
  const [placeSearch, setPlaceSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  const categories = [
    'Beach', 'Adventure', 'Mountains', 'Hiking', 'Trekking',
    'View Points', 'National Parks', 'Wildlife', 'Cultural Sites',
    'Historical Places', 'Waterfalls', 'Lakes', 'Forests',
    'Caves', 'Temples', 'Museums', 'Gardens', 'Rivers'
  ];

  useEffect(() => {
    if (guide) {
      setFormData({
        title: guide.title || '',
        category: guide.category || '',
        description: guide.description || '',
        image: guide.image || '',
        tags: guide.tags || [],
        placeId: guide.placeId || '',
        isActive: guide.isActive !== undefined ? guide.isActive : true
      });
      
      // If editing and has placeId, try to set selectedPlace
      if (guide.placeId && guide.place) {
        setSelectedPlace(guide.place);
        setPlaceSearch(guide.place.name || '');
      }
    }
  }, [guide]);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const addTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return null;

    const formData = new FormData();
    formData.append('mediaFile', selectedFile);

    try {
      setIsUploading(true);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/uploadFile?mediaType=FeaturedGuides`, formData, {
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
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        setError('Please select an image file');
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const clearSelectedPlace = () => {
    setSelectedPlace(null);
    setPlaceSearch('');
    setFormData(prev => ({
      ...prev,
      placeId: ''
    }));
  };

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
    setFormData(prev => ({
      ...prev,
      placeId: place._id || place.id // Handle both _id and id fields for compatibility
    }));
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Validate that either a file is selected or an image URL is provided
      if (!selectedFile && !formData.image) {
        throw new Error('Please select an image file or provide an image URL');
      }

      // Validate that a place is selected
      if (!formData.placeId) {
        throw new Error('Please select a place for this guide');
      }

      // First upload the image if selected
      let imageUrl = formData.image;
      if (selectedFile) {
        imageUrl = await uploadImage();
      }

      if (!imageUrl) {
        throw new Error('Image is required');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const endpoint = guide 
        ? `${process.env.REACT_APP_API_URL}/featured-guides/user/edit/${guide.id}`
        : `${process.env.REACT_APP_API_URL}/featured-guides/user/add`;
      
      const method = guide ? 'PUT' : 'POST';
      
      const response = await axios({
        method,
        url: endpoint,
        data: {
          ...formData,
          image: imageUrl
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status || response.status === 200) {
        setSuccess(true);
        
        if (guide) {
          // If editing, pass the updated guide data back
          const updatedGuide = {
            ...guide,
            ...response.data.data,
            id: guide.id // Ensure we keep the original ID
          };
          
          setTimeout(() => {
            setSuccess(false);
            if (onSuccess) onSuccess(updatedGuide);
          }, 2000);
        } else {
          // If creating new, reset form and call onSuccess
          setFormData({
            title: '',
            category: '',
            description: '',
            image: '',
            tags: [],
            placeId: '',
            isActive: true
          });
          setSelectedFile(null);
          setSelectedPlace(null);
          setPlaceSearch('');
          setSearchResults([]);
          setShowDropdown(false);
          setTimeout(() => {
            setSuccess(false);
            if (onSuccess) onSuccess();
          }, 2000);
        }
      } else {
        throw new Error(response.data.message || 'Failed to save guide');
      }
    } catch (err) {
      let errorMessage = 'An error occurred while saving the guide';
      
      if (err.response) {
        // Handle API validation errors
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
        
        // Handle validation errors array
        if (err.response.data && err.response.data.error && Array.isArray(err.response.data.error)) {
          errorMessage = err.response.data.error.join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="guide-form-container">
      <div className="form-header">
        <h2>{guide ? 'Edit Guide' : 'Create New Guide'}</h2>
        <button 
          className="btn btn-secondary"
          onClick={onCancel}
        >
          <FaTimes /> Cancel
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <p>Guide {guide ? 'updated' : 'created'} successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="guide-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter guide title"
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
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-field">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Write a detailed description of your guide..."
              required
              rows="6"
            />
          </div>
        </div>

        {/* Place Search */}
        <div className="form-section">
          <h3>Associated Place</h3>
          <div className="form-field">
            <label>Search Place *</label>
            <div className="place-search-container" ref={dropdownRef}>
              <input
                type="text"
                value={placeSearch}
                onChange={handlePlaceSearch}
                placeholder="Search for a place..."
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
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
          </div>
        </div>

        {/* Image */}
        <div className="form-section">
          <h3>Guide Image</h3>
          <div className="form-field">
            <label>Featured Image *</label>
            <div className="image-upload-container">
              <label 
                className={`file-upload-label ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  required={!formData.image}
                />
                <div className="upload-content">
                  {selectedFile ? (
                    <>
                      <FaImage className="upload-icon" />
                      <span className="selected-file-name">{selectedFile.name}</span>
                    </>
                  ) : formData.image ? (
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
            {(selectedFile || formData.image) && (
              <div className="image-preview">
                <img 
                  src={selectedFile ? URL.createObjectURL(selectedFile) : formData.image} 
                  alt="Preview" 
                />
                {selectedFile && (
                  <button
                    type="button"
                    onClick={removeSelectedFile}
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
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                disabled={selectedFile}
              />
            </div>
            
            {/* Upload Status */}
            {isUploading && (
              <div className="upload-status uploading">
                <FaUpload /> Uploading image...
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="form-section">
          <h3>Tags</h3>
          <div className="tags-container">
            <div className="tag-input-group">
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                placeholder="Add a tag"
                className="tag-input"
              />
              <button 
                type="button" 
                onClick={addTag}
                className="btn btn-add-tag"
              >
                <FaTags /> Add
              </button>
            </div>
            
            <div className="tags-list">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => removeTag(tag)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="form-section">
          <h3>Settings</h3>
          <div className="form-field checkbox-field">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              Publish guide immediately
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || isUploading}
          >
            {isUploading ? (
              <>
                <FaUpload />
                Uploading Image...
              </>
            ) : loading ? (
              <>
                <FaSave />
                Saving...
              </>
            ) : (
              <>
                <FaSave />
                {guide ? 'Update Guide' : 'Create Guide'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GuideForm;
