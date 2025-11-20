import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaTimes, FaSave, FaTrash, FaPlus, FaMapMarkerAlt, FaClock, FaMoneyBillWave, FaMountain, FaCar, FaLightbulb, FaUpload, FaImage } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import axios from 'axios';
import './EditPlace.css';
import { COUNTRIES } from '../../../constants/countries';

const EditPlace = ({ place, onSave, onCancel, onDelete }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Image upload states
  const [selectedFiles, setSelectedFiles] = useState({});
  const [isUploading, setIsUploading] = useState({});
  const [isDragOver, setIsDragOver] = useState({});

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
    verified: true,
    topSearch: false
  });

  // Initialize form data when place prop changes
  useEffect(() => {
    if (place) {
      setFormData({
        name: place.name || '',
        description: place.description || '',
        category: place.category || '',
        subcategory: place.subcategory || '',
        googlePlaceId: place.googlePlaceId || '',
        location: {
          latitude: place.location?.latitude || '',
          longitude: place.location?.longitude || '',
          address: place.location?.address || '',
          city: place.location?.city || '',
          state: place.location?.state || '',
          country: place.location?.country || 'India'
        },
        images: place.images?.length ? place.images : [{ url: '', alt: '' }],
        rating: place.rating || 4.0,
        reviewCount: place.reviewCount || 0,
        priceRange: place.priceRange || 'Free',
        entryFee: place.entryFee || { amount: 0, currency: 'INR' },
        openingHours: place.openingHours || {
          monday: '24/7',
          tuesday: '24/7',
          wednesday: '24/7',
          thursday: '24/7',
          friday: '24/7',
          saturday: '24/7',
          sunday: '24/7'
        },
        bestTimeToVisit: place.bestTimeToVisit || 'All year round',
        difficulty: place.difficulty || 'Easy',
        amenities: place.amenities || [],
        activities: place.activities || [],
        transportation: place.transportation || [],
        nearbyPlaces: place.nearbyPlaces || [],
        tips: place.tips || [],
        isActive: place.isActive !== undefined ? place.isActive : true,
        featured: place.featured || false,
        tags: place.tags || [],
        verified: place.verified !== undefined ? place.verified : true,
        topSearch: place.topSearch || false
      });
    }
  }, [place]);

  // Handle form field changes
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

  // Handle image field changes
  const handleImageChange = (index, field, value) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages[index] = { ...newImages[index], [field]: value };
      return { ...prev, images: newImages };
    });
  };

  // Add new image field
  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, { url: '', alt: '' }]
    }));
  };

  // Remove image field
  const removeImageField = (index) => {
    if (formData.images.length > 1) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  // Handle array field changes (amenities, activities, tags, tips)
  const handleArrayFieldChange = (fieldName, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[fieldName]];
      newArray[index] = value;
      return { ...prev, [fieldName]: newArray };
    });
  };

  // Add new item to array field
  const addArrayFieldItem = (fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName], '']
    }));
  };

  // Remove item from array field
  const removeArrayFieldItem = (fieldName, index) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index)
    }));
  };

  // Handle transportation field changes
  const handleTransportationChange = (index, field, value) => {
    setFormData(prev => {
      const newTransportation = [...prev.transportation];
      newTransportation[index] = { ...newTransportation[index], [field]: value };
      return { ...prev, transportation: newTransportation };
    });
  };

  // Add new transportation item
  const addTransportationItem = () => {
    setFormData(prev => ({
      ...prev,
      transportation: [...prev.transportation, { mode: 'Car', description: '' }]
    }));
  };

  // Remove transportation item
  const removeTransportationItem = (index) => {
    setFormData(prev => ({
      ...prev,
      transportation: prev.transportation.filter((_, i) => i !== index)
    }));
  };

  // Handle nearby places field changes
  const handleNearbyPlaceChange = (index, field, value) => {
    setFormData(prev => {
      const newNearbyPlaces = [...prev.nearbyPlaces];
      newNearbyPlaces[index] = { ...newNearbyPlaces[index], [field]: value };
      return { ...prev, nearbyPlaces: newNearbyPlaces };
    });
  };

  // Add new nearby place
  const addNearbyPlace = () => {
    setFormData(prev => ({
      ...prev,
      nearbyPlaces: [...prev.nearbyPlaces, { name: '', distance: 0, type: '' }]
    }));
  };

  // Remove nearby place
  const removeNearbyPlace = (index) => {
    setFormData(prev => ({
      ...prev,
      nearbyPlaces: prev.nearbyPlaces.filter((_, i) => i !== index)
    }));
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Check authentication
      if (!isAuthenticated || !user) {
        throw new Error('Authentication required');
      }

      // Validate required fields
      if (!formData.name || !formData.description || !formData.category || !formData.googlePlaceId) {
        throw new Error('Please fill in all required fields');
      }

      if (!formData.location.latitude || !formData.location.longitude || 
          !formData.location.address || !formData.location.city || !formData.location.state) {
        throw new Error('Please fill in all location fields');
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

      // Validate images
      if (!updatedImages.length || !updatedImages[0].url) {
        throw new Error('At least one image URL is required');
      }

      // Filter out empty array items
      const cleanedFormData = {
        ...formData,
        amenities: formData.amenities.filter(item => item.trim() !== ''),
        activities: formData.activities.filter(item => item.trim() !== ''),
        tags: formData.tags.filter(item => item.trim() !== ''),
        tips: formData.tips.filter(item => item.trim() !== ''),
        transportation: formData.transportation.filter(item => item.mode && item.description.trim() !== ''),
        nearbyPlaces: formData.nearbyPlaces.filter(item => item.name.trim() !== ''),
        images: updatedImages.filter(item => item.url.trim() !== '')
      };

      console.log('Submitting form data:', cleanedFormData);

      // Make API call to update place
      const response = await api.put(`/admin/edit-place/${place._id}`, cleanedFormData);

      if (response.data && response.data.status) {
        setSuccessMessage('Place updated successfully!');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage('');
        }, 3000);

        // Call the onSave callback to refresh the places list
        if (onSave) {
          onSave(response.data.place);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to update place');
      }
    } catch (err) {
      console.error('Update error:', err);

      // Handle authentication errors
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          logout();
        }, 2000);
        return;
      }

      setError(err.message || 'An error occurred while updating the place');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/admin/places/${place._id}`);
      
      if (onDelete) {
        onDelete(place._id);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete place');
    } finally {
      setLoading(false);
    }
  };

  if (!place) {
    return <div className="edit-place-error">No place data provided</div>;
  }

  return (
    <div className="edit-place-container">
      <div className="edit-place-header">
        <h2>Edit Place: {place.name}</h2>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            <FaTimes /> Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={loading}
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <p>{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-place-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3><FaMountain /> Basic Information</h3>
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
              <label>Subcategory</label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                placeholder="Enter subcategory"
              />
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
          <h3><FaMapMarkerAlt /> Location Details</h3>
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

        {/* Rating and Reviews */}
        <div className="form-section">
          <h3>Rating & Reviews</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Rating</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                placeholder="4.0"
              />
            </div>

            <div className="form-field">
              <label>Review Count</label>
              <input
                type="number"
                min="0"
                name="reviewCount"
                value={formData.reviewCount}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="form-section">
          <h3><FaMoneyBillWave /> Pricing</h3>
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
                min="0"
                name="entryFee.amount"
                value={formData.entryFee.amount}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="form-section">
          <h3><FaClock /> Opening Hours</h3>
          <div className="hours-grid">
            {Object.entries(formData.openingHours).map(([day, hours]) => (
              <div key={day} className="hour-field">
                <label>{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                <input
                  type="text"
                  name={`openingHours.${day}`}
                  value={hours}
                  onChange={handleChange}
                  placeholder="24/7"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Additional Details */}
        <div className="form-section">
          <h3>Additional Details</h3>
          <div className="form-grid">
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
        </div>

        {/* Amenities */}
        <div className="form-section">
          <h3>Amenities</h3>
          <div className="array-field-container">
            {formData.amenities.map((amenity, index) => (
              <div key={index} className="array-field-item">
                <input
                  type="text"
                  value={amenity}
                  onChange={(e) => handleArrayFieldChange('amenities', index, e.target.value)}
                  placeholder="Enter amenity"
                />
                <button
                  type="button"
                  className="btn btn-remove"
                  onClick={() => removeArrayFieldItem('amenities', index)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-add"
              onClick={() => addArrayFieldItem('amenities')}
            >
              <FaPlus /> Add Amenity
            </button>
          </div>
        </div>

        {/* Activities */}
        <div className="form-section">
          <h3>Activities</h3>
          <div className="array-field-container">
            {formData.activities.map((activity, index) => (
              <div key={index} className="array-field-item">
                <input
                  type="text"
                  value={activity}
                  onChange={(e) => handleArrayFieldChange('activities', index, e.target.value)}
                  placeholder="Enter activity"
                />
                <button
                  type="button"
                  className="btn btn-remove"
                  onClick={() => removeArrayFieldItem('activities', index)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-add"
              onClick={() => addArrayFieldItem('activities')}
            >
              <FaPlus /> Add Activity
            </button>
          </div>
        </div>

        {/* Transportation */}
        <div className="form-section">
          <h3><FaCar /> Transportation</h3>
          <div className="transportation-container">
            {formData.transportation.map((transport, index) => (
              <div key={index} className="transportation-item">
                <div className="transportation-inputs">
                  <select
                    value={transport.mode}
                    onChange={(e) => handleTransportationChange(index, 'mode', e.target.value)}
                  >
                    {['Car', 'Bus', 'Train', 'Flight', 'Bike', 'Walking', 'Boat'].map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={transport.description}
                    onChange={(e) => handleTransportationChange(index, 'description', e.target.value)}
                    placeholder="Transportation description"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-remove"
                  onClick={() => removeTransportationItem(index)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-add"
              onClick={addTransportationItem}
            >
              <FaPlus /> Add Transportation
            </button>
          </div>
        </div>

        {/* Nearby Places */}
        <div className="form-section">
          <h3>Nearby Places</h3>
          <div className="nearby-places-container">
            {formData.nearbyPlaces.map((nearbyPlace, index) => (
              <div key={index} className="nearby-place-item">
                <div className="nearby-place-inputs">
                  <input
                    type="text"
                    value={nearbyPlace.name}
                    onChange={(e) => handleNearbyPlaceChange(index, 'name', e.target.value)}
                    placeholder="Place name"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={nearbyPlace.distance}
                    onChange={(e) => handleNearbyPlaceChange(index, 'distance', parseFloat(e.target.value))}
                    placeholder="Distance (km)"
                  />
                  <input
                    type="text"
                    value={nearbyPlace.type}
                    onChange={(e) => handleNearbyPlaceChange(index, 'type', e.target.value)}
                    placeholder="Place type"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-remove"
                  onClick={() => removeNearbyPlace(index)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-add"
              onClick={addNearbyPlace}
            >
              <FaPlus /> Add Nearby Place
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="form-section">
          <h3><FaLightbulb /> Tips</h3>
          <div className="array-field-container">
            {formData.tips.map((tip, index) => (
              <div key={index} className="array-field-item">
                <textarea
                  value={tip}
                  onChange={(e) => handleArrayFieldChange('tips', index, e.target.value)}
                  placeholder="Enter travel tip"
                  rows="2"
                />
                <button
                  type="button"
                  className="btn btn-remove"
                  onClick={() => removeArrayFieldItem('tips', index)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-add"
              onClick={() => addArrayFieldItem('tips')}
            >
              <FaPlus /> Add Tip
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="form-section">
          <h3>Tags</h3>
          <div className="array-field-container">
            {formData.tags.map((tag, index) => (
              <div key={index} className="array-field-item">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => handleArrayFieldChange('tags', index, e.target.value)}
                  placeholder="Enter tag"
                />
                <button
                  type="button"
                  className="btn btn-remove"
                  onClick={() => removeArrayFieldItem('tags', index)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-add"
              onClick={() => addArrayFieldItem('tags')}
            >
              <FaPlus /> Add Tag
            </button>
          </div>
        </div>

        {/* Status Settings */}
        <div className="form-section">
          <h3>Status Settings</h3>
          <div className="status-grid">
            <div className="form-field checkbox-field">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                Active
              </label>
            </div>

            <div className="form-field checkbox-field">
              <label>
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                />
                Featured
              </label>
            </div>

            <div className="form-field checkbox-field">
              <label>
                <input
                  type="checkbox"
                  name="verified"
                  checked={formData.verified}
                  onChange={handleChange}
                />
                Verified
              </label>
            </div>

            <div className="form-field checkbox-field">
              <label>
                <input
                  type="checkbox"
                  name="topSearch"
                  checked={formData.topSearch}
                  onChange={handleChange}
                />
                Top Search
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            <FaSave /> {loading ? 'Updating...' : 'Update Place'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPlace;
