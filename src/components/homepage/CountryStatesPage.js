import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { publicPlacesAPI } from '../../services/api';
import './CountryStatesPage.css';

const CountryStatesPage = () => {
  const { country: encodedCountry = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const decodedCountry = decodeURIComponent(
    encodedCountry || location.state?.country || ''
  );

  const [states, setStates] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingStates, setLoadingStates] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const fetchStates = useCallback(async () => {
    if (!decodedCountry) {
      return;
    }
    setLoadingStates(true);
    setError(null);
    try {
      const response = await publicPlacesAPI.getStatesByCountry(decodedCountry);
      const data = Array.isArray(response?.data) 
        ? response.data 
        : response?.data?.data || [];
      setStates(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load states');
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  }, [decodedCountry]);

  useEffect(() => {
    if (decodedCountry) {
      fetchStates();
    }
  }, [decodedCountry, fetchStates]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchStates();
    } finally {
      setRefreshing(false);
    }
  }, [fetchStates]);

  const filteredStates = useMemo(() => {
    if (!search.trim()) {
      return states;
    }
    const query = search.trim().toLowerCase();
    return states.filter((state) => state.state?.toLowerCase().includes(query));
  }, [search, states]);

  const getStateImage = (stateItem) => {
    // First, try to use image from backend if available
    if (stateItem?.image) {
      return stateItem.image;
    }
    
    // Fallback to hardcoded mapping if backend doesn't provide image
    const stateName = stateItem?.state || '';
    const stateImages = {
      'Andhra Pradesh': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Arunachal Pradesh': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Assam': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Bihar': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400',
      'Chhattisgarh': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Goa': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Gujarat': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73a6e?w=400',
      'Haryana': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400',
      'Himachal Pradesh': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Jharkhand': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Karnataka': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      'Kerala': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Madhya Pradesh': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73a6e?w=400',
      'Maharashtra': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400',
      'Manipur': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Meghalaya': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Mizoram': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Nagaland': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Odisha': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Punjab': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400',
      'Rajasthan': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73a6e?w=400',
      'Sikkim': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Tamil Nadu': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Telangana': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      'Tripura': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Uttar Pradesh': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400',
      'Uttarakhand': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'West Bengal': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Andaman and Nicobar Islands': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Andaman & Nicobar Islands': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Chandigarh': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400',
      'Delhi': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400',
      'Jammu and Kashmir': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Jammu & Kashmir': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Ladakh': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Lakshadweep': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Puducherry': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
    };
    
    // Try exact match
    if (stateImages[stateName]) {
      return stateImages[stateName];
    }
    
    // Try case-insensitive match
    const matchingKey = Object.keys(stateImages).find(
      key => key.toLowerCase() === stateName?.toLowerCase()
    );
    
    if (matchingKey) {
      return stateImages[matchingKey];
    }
    
    // Final fallback with variety
    const hash = stateName?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    const defaultImages = [
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400',
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73a6e?w=400',
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400',
    ];
    return defaultImages[hash % defaultImages.length];
  };

  const handleBack = () => {
    if (location.key === 'default') {
      navigate('/home');
      return;
    }
    navigate(-1);
  };

  const handleStateClick = (stateItem) => {
    if (!stateItem || !decodedCountry) return;
    navigate(
      `/home/state/${encodeURIComponent(decodedCountry)}/${encodeURIComponent(stateItem.state)}`,
      {
        state: {
          country: decodedCountry,
          state: stateItem.state,
          stateMeta: stateItem,
        },
      }
    );
  };

  const StateCard = ({ item }) => {
    const [imageError, setImageError] = useState(false);
    
    return (
      <div
        className="country-state-card"
        onClick={() => handleStateClick(item)}
        role="button"
        tabIndex={0}
        onKeyPress={(event) => {
          if (event.key === 'Enter') {
            handleStateClick(item);
          }
        }}
      >
        <div className="country-state-image-container">
          {!imageError ? (
            <img
              src={getStateImage(item)}
              alt={item.state}
              className="country-state-image"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="country-state-image country-state-image-placeholder">
              <span>{item.state?.charAt(0)?.toUpperCase() || '?'}</span>
            </div>
          )}
        </div>
        <div className="country-state-info">
          <h4 className="country-state-name">{item.state}</h4>
          <p className="country-state-location">{decodedCountry}</p>
        </div>
      </div>
    );
  };

  if (loading || (!loading && !isAuthenticated)) {
    return null;
  }

  if (!decodedCountry) {
    return (
      <div className="country-states-page">
        <header className="country-states-header">
          <button type="button" className="country-states-back-btn" onClick={handleBack}>
            Back
          </button>
          <h2>States</h2>
          <div style={{ width: '60px' }} />
        </header>
        <div className="country-states-empty">
          <p>Missing country information.</p>
          <button type="button" onClick={() => navigate('/home')}>
            Go back to Explore
          </button>
        </div>
      </div>
    );
  }

  const listEmptyComponent = () => {
    if (loadingStates) return null;
    return (
      <div className="country-states-empty">
        <p>{error || 'No states available'}</p>
      </div>
    );
  };

  return (
    <div className="country-states-page">
      <header className="country-states-header">
        <button type="button" className="country-states-back-btn" onClick={handleBack}>
          Back
        </button>
        <div className="country-states-title-block">
          <h2>{decodedCountry}</h2>
        </div>
        <div style={{ width: '60px' }} />
      </header>

      <div className="country-states-search-wrapper">
        <input
          type="text"
          placeholder="Search state"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="country-states-search-input"
        />
      </div>

      {loadingStates && !refreshing ? (
        <div className="country-states-loading">
          <div className="spinner"></div>
          <p>Loading states...</p>
        </div>
      ) : filteredStates.length === 0 ? (
        listEmptyComponent()
      ) : (
        <div className="country-states-grid">
          {filteredStates.map((state) => (
            <StateCard key={state.normalized || state.state} item={state} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CountryStatesPage;

