import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { scheduleAPI, publicPlacesAPI } from '../../services/api';
import LocationPickerModal from './LocationPickerModal';
import './ScheduleForm.css';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const createLocation = () => ({
  latitude: '',
  longitude: '',
  address: '',
});

const createDay = (index = 0) => ({
  id: index + 1,
  description: '',
  fromLocation: createLocation(),
  toLocation: createLocation(),
});

const formatAPIDate = (date) => date.toISOString().split('T')[0];

const formatDisplayDate = (date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatCoordsAsText = (latitude, longitude) =>
  `${Number.parseFloat(latitude).toFixed(5)}, ${Number.parseFloat(longitude).toFixed(5)}`;

const reverseGeocode = async (latitude, longitude) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      return '';
    }
    const data = await response.json();
    return data?.display_name || '';
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return '';
  }
};

const ScheduleForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    tripName: '',
    travelMode: 'Bike',
    visible: 'Public',
    fromDate: '',
    toDate: '',
    bannerImage: null,
  });
  const [days, setDays] = useState([createDay()]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fromLocation, setFromLocation] = useState({
    latitude: '',
    longitude: '',
    address: '',
  });
  const [toLocation, setToLocation] = useState({
    latitude: '',
    longitude: '',
    address: '',
  });
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [fromSearchLoading, setFromSearchLoading] = useState(false);
  const [toSearchLoading, setToSearchLoading] = useState(false);
  const [locationPicker, setLocationPicker] = useState({
    open: false,
    target: null,
    initial: null,
  });

  useLockBodyScroll(true);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        bannerImage: file,
      }));
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return objectUrl;
      });
    }
  };

  const calculateNumberOfDays = () => {
    if (!formData.fromDate || !formData.toDate) return 0;
    const start = new Date(formData.fromDate);
    const end = new Date(formData.toDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const addDay = () => {
    setDays((prev) => [...prev, createDay(prev.length)]);
  };

  const removeDay = (id) => {
    setDays((prev) => {
      if (prev.length === 1) return prev;
      const filtered = prev.filter((day) => day.id !== id);
      return filtered.map((day, index) => ({ ...day, id: index + 1 }));
    });
  };

  const handleDayChange = (id, key, value) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === id
          ? {
              ...day,
              [key]: value,
            }
          : day
      )
    );
  };

  const extractPlaceDetails = (place = {}) => {
    const latitude =
      place?.location?.latitude ??
      place?.latitude ??
      place?.lat ??
      null;
    const longitude =
      place?.location?.longitude ??
      place?.longitude ??
      place?.lng ??
      null;
    const name = place?.name || place?.title || '';
    const address =
      place?.location?.address ||
      place?.address ||
      place?.formattedAddress ||
      place?.description ||
      name;
    return { latitude, longitude, name, address };
  };

  const searchPlaces = async (query, setter, setLoading) => {
    try {
      setLoading(true);
      const trimmed = query.trim();
      const { data } = await publicPlacesAPI.searchPlaces({
        searchPlaceName: trimmed,
        page: 1,
        limit: 8,
      });
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.places)
          ? data.places
          : Array.isArray(data?.suggestions)
            ? data.suggestions
            : [];
      setter(list);
    } catch (err) {
      console.error('Place search failed:', err);
      setter([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!fromQuery || fromQuery.trim().length < 2) {
        setFromSuggestions([]); 
        return; 
      }
    const handle = setTimeout(() => {
      searchPlaces(fromQuery, setFromSuggestions, setFromSearchLoading);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromQuery]);

  useEffect(() => {
    if (!toQuery || toQuery.trim().length < 2) {
        setToSuggestions([]); 
        return; 
      }
    const handle = setTimeout(() => {
      searchPlaces(toQuery, setToSuggestions, setToSearchLoading);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toQuery]);

  useEffect(() => {
    if (!days.length) {
      return;
    }

    const firstDay = days[0];
    if (
      firstDay?.fromLocation?.latitude &&
      firstDay?.fromLocation?.longitude
    ) {
      const nextFrom = {
        latitude: firstDay.fromLocation.latitude,
        longitude: firstDay.fromLocation.longitude,
        address:
          firstDay.fromLocation.address ||
          formatCoordsAsText(
            firstDay.fromLocation.latitude,
            firstDay.fromLocation.longitude
          ),
      };
      setFromLocation((prev) => {
        if (
          prev.latitude === nextFrom.latitude &&
          prev.longitude === nextFrom.longitude
        ) {
          return prev;
        }
        return nextFrom;
      });
      setFromQuery((prev) => (prev ? prev : nextFrom.address));
    }

    const lastDay = days[days.length - 1];
    if (
      lastDay?.toLocation?.latitude &&
      lastDay?.toLocation?.longitude
    ) {
      const nextTo = {
        latitude: lastDay.toLocation.latitude,
        longitude: lastDay.toLocation.longitude,
        address:
          lastDay.toLocation.address ||
          formatCoordsAsText(
            lastDay.toLocation.latitude,
            lastDay.toLocation.longitude
          ),
      };
      setToLocation((prev) => {
        if (
          prev.latitude === nextTo.latitude &&
          prev.longitude === nextTo.longitude
        ) {
          return prev;
        }
        return nextTo;
      });
      setToQuery((prev) => (prev ? prev : nextTo.address));
    }
  }, [days]);

  const applyTripLocation = (type, latitude, longitude, label) => {
    const addressText = label || formatCoordsAsText(latitude, longitude);
    if (type === 'from') {
      setFromLocation({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        address: addressText,
      });
      setFromQuery(addressText);
      setFromSuggestions([]);
    } else if (type === 'to') {
      setToLocation({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        address: addressText,
      });
      setToQuery(addressText);
      setToSuggestions([]);
    }
  };

  const handleFromSuggestionSelect = (place) => {
    const { latitude, longitude, address, name } = extractPlaceDetails(place);
    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      return;
    }
    applyTripLocation('from', Number(latitude), Number(longitude), address || name);
  };

  const handleToSuggestionSelect = (place) => {
    const { latitude, longitude, address, name } = extractPlaceDetails(place);
    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      return;
    }
    applyTripLocation('to', Number(latitude), Number(longitude), address || name);
  };

  const openDayLocationPicker = (day, segment) => {
    const source = segment === 'from' ? day.fromLocation : day.toLocation;
    const initial =
      source.latitude && source.longitude
        ? {
            latitude: Number.parseFloat(source.latitude),
            longitude: Number.parseFloat(source.longitude),
          }
        : null;
    setLocationPicker({
      open: true,
      target: { type: 'day', dayId: day.id, segment },
      initial,
    });
  };

  const openTripLocationPicker = (type) => {
    const source = type === 'from' ? fromLocation : toLocation;
    const initial =
      source.latitude && source.longitude
        ? {
            latitude: Number.parseFloat(source.latitude),
            longitude: Number.parseFloat(source.longitude),
          }
        : null;
    setLocationPicker({
      open: true,
      target: { type },
      initial,
    });
  };

  const closeLocationPicker = () => {
    setLocationPicker({
      open: false,
      target: null,
      initial: null,
    });
  };

  const handleLocationSave = async (coords) => {
    if (!coords || !locationPicker.target) {
      closeLocationPicker();
      return;
    }

    if (locationPicker.target.type === 'day') {
      const address =
        (await reverseGeocode(coords.latitude, coords.longitude)) ||
        formatCoordsAsText(coords.latitude, coords.longitude);
      setDays((prev) =>
        prev.map((day) => {
          if (day.id !== locationPicker.target.dayId) {
            return day;
          }
          const key =
            locationPicker.target.segment === 'to' ? 'toLocation' : 'fromLocation';
          return {
            ...day,
            [key]: {
              latitude: coords.latitude.toFixed(6),
              longitude: coords.longitude.toFixed(6),
              address,
            },
          };
        })
      );
      closeLocationPicker();
      return;
    }

    const address =
      (await reverseGeocode(coords.latitude, coords.longitude)) ||
      formatCoordsAsText(coords.latitude, coords.longitude);
    applyTripLocation(locationPicker.target.type, coords.latitude, coords.longitude, address);
    closeLocationPicker();
  };

  const validateForm = () => {
    if (!formData.tripName || formData.tripName.trim().length < 3) {
      return 'Trip name is required and must be at least 3 characters';
    }
    if (!formData.bannerImage) {
      return 'Banner image is required';
    }
    if (!formData.fromDate || !formData.toDate) {
      return 'Start and end dates are required';
    }
    const start = new Date(formData.fromDate);
    const end = new Date(formData.toDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Invalid date selection';
    }
    if (end < start) {
      return 'End date must be after start date';
    }
    if (!days.length) {
      return 'At least one day is required';
    }
    const missingDay = days.find(
      (day) =>
        !day.description.trim() ||
        !day.fromLocation.latitude ||
        !day.fromLocation.longitude ||
        !day.toLocation.latitude ||
        !day.toLocation.longitude
    );
    if (missingDay) {
      return `Please complete all fields for Day ${missingDay.id}`;
    }
    if (!fromLocation.latitude || !fromLocation.longitude) {
      return 'Please select a "From" location';
    }
    if (!toLocation.latitude || !toLocation.longitude) {
      return 'Please select a "To" location';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const startDate = new Date(formData.fromDate);
      const endDate = new Date(formData.toDate);
      const numberOfDays = calculateNumberOfDays();
      const requestBody = {
        tripName: formData.tripName.trim(),
        travelMode: formData.travelMode,
        visible: formData.visible,
        location: {
          from: {
            latitude: Number.parseFloat(fromLocation.latitude),
            longitude: Number.parseFloat(fromLocation.longitude),
          },
          to: {
            latitude: Number.parseFloat(toLocation.latitude),
            longitude: Number.parseFloat(toLocation.longitude),
          },
        },
        dates: {
          from: formatAPIDate(startDate),
          end: formatAPIDate(endDate),
        },
        numberOfDays,
      };

      const formDataToSend = new FormData();
      formDataToSend.append('tripName', requestBody.tripName);
      formDataToSend.append('travelMode', requestBody.travelMode);
      formDataToSend.append('visible', requestBody.visible);
      formDataToSend.append(
        'location[from][latitude]',
        requestBody.location.from.latitude.toString()
      );
      formDataToSend.append(
        'location[from][longitude]',
        requestBody.location.from.longitude.toString()
      );
      formDataToSend.append(
        'location[to][latitude]',
        requestBody.location.to.latitude.toString()
      );
      formDataToSend.append(
        'location[to][longitude]',
        requestBody.location.to.longitude.toString()
      );
      formDataToSend.append('dates[from]', requestBody.dates.from);
      formDataToSend.append('dates[end]', requestBody.dates.end);
      formDataToSend.append('numberOfDays', requestBody.numberOfDays.toString());
      formDataToSend.append('bannerImage', formData.bannerImage);

      const response = await scheduleAPI.createSchedule(formDataToSend);
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(responseText || 'Invalid server response');
      }

      if (!response.ok) {
        const message = Array.isArray(data?.errors)
          ? data.errors.map((err) => err.msg).join('\n')
          : data?.message || 'Failed to create schedule';
        throw new Error(message);
      }

      const scheduleId = data?.schedule?._id || data?.id;
      if (!scheduleId) {
        throw new Error('Schedule ID missing in response');
      }

      for (let i = 0; i < days.length; i += 1) {
        const day = days[i];
        const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);

        const descriptionPayload = {
          Description: day.description.trim(),
          date: formatDisplayDate(currentDate),
          location: {
            from: {
              latitude: Number.parseFloat(day.fromLocation.latitude),
              longitude: Number.parseFloat(day.fromLocation.longitude),
            },
            to: {
              latitude: Number.parseFloat(day.toLocation.latitude),
              longitude: Number.parseFloat(day.toLocation.longitude),
            },
          },
        };

        await scheduleAPI.addScheduleDescription(scheduleId, descriptionPayload);
      }

      setFormData({
        tripName: '',
        travelMode: 'Bike',
        visible: 'Public',
        fromDate: '',
        toDate: '',
        bannerImage: null,
      });
      setDays([createDay()]);
      setPreviewUrl('');
      setFromLocation({ latitude: '', longitude: '', address: '' });
      setToLocation({ latitude: '', longitude: '', address: '' });
      setFromQuery('');
      setToQuery('');
      setFromSuggestions([]);
      setToSuggestions([]);
      setSuccess('Schedule created successfully!');
      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="schedule-form-overlay" onClick={onClose}>
      <div className="schedule-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-form-header">
          <h2>Create Schedule</h2>
          <button className="schedule-form-close" onClick={onClose}>×</button>
        </div>

        <form id="scheduleForm" onSubmit={handleSubmit} className="schedule-form">
          {error && <div className="schedule-form-error">{error}</div>}
          {success && <div className="schedule-form-success">{success}</div>}

          <div className="schedule-form-group">
            <label>Trip Name *</label>
            <input
              type="text"
              name="tripName"
              value={formData.tripName}
              onChange={handleInputChange}
              placeholder="Enter trip name"
              required
            />
          </div>

          <div className="schedule-form-group">
            <label>Banner Image *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            {previewUrl && (
              <div className="schedule-form-preview">
                <img 
                  src={previewUrl} 
                  alt="Preview"
                />
              </div>
            )}
          </div>

          <div className="schedule-form-row">
            <div className="schedule-form-group">
              <label>Start Date *</label>
              <input
                type="date"
                name="fromDate"
                value={formData.fromDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="schedule-form-group">
              <label>End Date *</label>
              <input
                type="date"
                name="toDate"
                value={formData.toDate}
                onChange={handleInputChange}
                min={formData.fromDate || ''}
                required
              />
            </div>
          </div>

          <div className="schedule-form-row">
            <div className="schedule-form-group">
              <label>Travel Mode *</label>
              <select
                name="travelMode"
                value={formData.travelMode}
                onChange={handleInputChange}
                required
              >
                <option value="Bike">Bike</option>
                <option value="Car">Car</option>
                <option value="Bus">Bus</option>
                <option value="Train">Train</option>
                <option value="Flight">Flight</option>
              </select>
            </div>

            <div className="schedule-form-group">
              <label>Visibility *</label>
              <select
                name="visible"
                value={formData.visible}
                onChange={handleInputChange}
                required
              >
                <option value="Public">Public</option>
                <option value="Private">Private</option>
              </select>
            </div>
          </div>

        

          <div className="schedule-days">
            <div className="schedule-days-header">
              <div>
                <h3>Trip Plan</h3>
                <p>Create per-day descriptions and coordinates.</p>
              </div>
              <button 
                type="button" 
                className="schedule-add-day"
                onClick={addDay}
              >
                + Add Day
              </button>
                    </div>
            {days.map((day, index) => (
              <div className="schedule-day-card" key={day.id}>
                <div className="schedule-day-header">
                  <span className="schedule-day-title">Day {index + 1}</span>
                  {days.length > 1 && (
                    <button
                      type="button"
                      className="schedule-remove-day"
                      onClick={() => removeDay(day.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="schedule-form-group">
                  <label>Description *</label>
                  <textarea
                    rows="3"
                    value={day.description}
                    onChange={(event) =>
                      handleDayChange(day.id, 'description', event.target.value)
                    }
                    placeholder="Describe the plan for this day"
                    required
                  />
                </div>
                <div className="schedule-day-locations">
                  <div className="schedule-day-location">
                    <div className="schedule-day-location-info">
                      <span className="schedule-day-location-label">From Location*</span>
                      <p className="schedule-day-location-address">
                        {day.fromLocation.address || 'Select a starting point'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="schedule-location-btn"
                      onClick={() => openDayLocationPicker(day, 'from')}
                    >
                      {day.fromLocation.latitude ? 'Change Location' : 'Select Location'}
                    </button>
                  </div>
                  <div className="schedule-day-location">
                    <div className="schedule-day-location-info">
                      <span className="schedule-day-location-label">To Location *</span>
                      <p className="schedule-day-location-address">
                        {day.toLocation.address || 'Select a destination'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="schedule-location-btn"
                      onClick={() => openDayLocationPicker(day, 'to')}
                    >
                      {day.toLocation.latitude ? 'Change Location' : 'Select Location'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </form>

        <div className="schedule-form-footer">
          <button 
            type="button" 
            onClick={onClose}
            className="schedule-form-cancel"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="scheduleForm"
            className="schedule-form-submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Schedule'}
          </button>
        </div>
      </div>
    </div>
  );

  const locationPickerTitle = (() => {
    if (locationPicker.target?.type === 'day') {
      return `Select location for Day ${locationPicker.target.dayId}`;
    }
    if (locationPicker.target?.type === 'from') {
      return 'Select from location';
    }
    if (locationPicker.target?.type === 'to') {
      return 'Select to location';
    }
    return 'Select location';
  })();

  const modalWithPicker = (
    <>
      {modalContent}
      <LocationPickerModal
        isOpen={locationPicker.open}
        title={locationPickerTitle}
        initialLocation={locationPicker.initial}
        onClose={closeLocationPicker}
        onSave={handleLocationSave}
      />
    </>
  );

  // Render modal using portal to center it on the window
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalWithPicker, document.body);
  }
  
  // Fallback for SSR or when document.body is not available
  return modalWithPicker;
};

export default ScheduleForm;

