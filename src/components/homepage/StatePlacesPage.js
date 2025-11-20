import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { publicPlacesAPI } from '../../services/api';
import PlaceDetailsModal from './PlaceDetailsModal';
import './StatePlacesPage.css';

const PAGE_SIZE = 50;

const StatePlacesPage = () => {
  const { country: encodedCountry = '', state: encodedState = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const decodedCountry = decodeURIComponent(
    encodedCountry || location.state?.country || ''
  );
  const decodedState = decodeURIComponent(encodedState || location.state?.state || '');

  const [page, setPage] = useState(1);
  const [places, setPlaces] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    overallCount: 0,
  });
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const fetchStatePlaces = useCallback(async (pageToLoad = 1) => {
    setLoadingPlaces(true);
    setError(null);
    try {
      const response = await publicPlacesAPI.getPlacesByCountry(decodedCountry, {
        page: pageToLoad,
        limit: PAGE_SIZE,
      });
      const data = response.data;
      const countryPlaces = Array.isArray(data?.data) ? data.data : [];
      const filteredPlaces = countryPlaces.filter((place) => {
        const placeState = place?.location?.state || '';
        return placeState.trim().toLowerCase() === decodedState.trim().toLowerCase();
      });
      setPlaces(filteredPlaces);
      setPagination({
        page: data?.pagination?.page || pageToLoad,
        totalPages: data?.pagination?.totalPages || 1,
        totalCount: filteredPlaces.length,
        overallCount: data?.pagination?.totalCount || 0,
      });
    } catch (err) {
      setPlaces([]);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load places for this state'
      );
    } finally {
      setLoadingPlaces(false);
    }
  }, [decodedCountry, decodedState]);

  useEffect(() => {
    if (!decodedCountry || !decodedState) {
      return;
    }
    fetchStatePlaces(page);
  }, [decodedCountry, decodedState, page, fetchStatePlaces]);

  const handleBack = () => {
    if (location.key === 'default') {
      navigate('/home');
      return;
    }
    navigate(-1);
  };

  const handlePageChange = (direction) => {
    if (direction === 'prev' && pagination.page > 1) {
      setPage((prev) => prev - 1);
    }
    if (direction === 'next' && pagination.page < pagination.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const headerSubtitle = useMemo(() => {
    if (!places.length) {
      return 'No places available for this state on the selected page.';
    }
    return `${places.length} place${places.length > 1 ? 's' : ''} found for page ${
      pagination.page
    } of ${pagination.totalPages}.`;
  }, [places.length, pagination.page, pagination.totalPages]);

  if (loading || (!loading && !isAuthenticated)) {
    return null;
  }

  if (!decodedCountry || !decodedState) {
    return (
      <div className="state-places-page">
        <div className="state-places-empty">
          <p>Missing country or state information.</p>
          <button type="button" onClick={() => navigate('/home')}>
            Go back to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="state-places-page">
      <header className="state-places-header">
        <button type="button" className="state-back-btn" onClick={handleBack}>
          Back
        </button>
        <div className="state-title-block">
          <h2>{decodedState || 'Places'}</h2>
          {decodedCountry ? (
            <p className="state-country-label">{decodedCountry}</p>
          ) : null}
        </div>
        <div style={{ width: '60px' }} />
      </header>

      <div className="state-places-content">
        {loadingPlaces && (
          <div className="state-places-loading">Loading places...</div>
        )}

        {!loadingPlaces && error && (
          <div className="state-places-error">
            <p>{error}</p>
            <button type="button" onClick={() => fetchStatePlaces(page)}>
              Retry
            </button>
          </div>
        )}

        {!loadingPlaces && !error && places.length === 0 && (
          <div className="state-places-empty">
            <img
              src="https://via.placeholder.com/180x160?text=No+Places"
              alt="No places"
              className="state-empty-image"
            />
            <p>{error || 'No places found for this state'}</p>
          </div>
        )}

        {!loadingPlaces && !error && places.length > 0 && (
          <div className="state-places-grid">
            {places.map((place) => (
              <div
                key={place._id || place.id}
                className="state-place-card"
                onClick={() => {
                  setSelectedPlace(place);
                  setShowDetails(true);
                }}
                role="button"
                tabIndex={0}
                onKeyPress={(event) => {
                  if (event.key === 'Enter') {
                    setSelectedPlace(place);
                    setShowDetails(true);
                  }
                }}
              >
                <div className="state-place-image">
                  <img
                    src={
                      place.images?.[0]?.url ||
                      place.images?.[0] ||
                      place.photo ||
                      place.image ||
                      'https://via.placeholder.com/300x200?text=No+Image'
                    }
                    alt={place.name}
                    onError={(event) => {
                      event.target.src =
                        'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                </div>
                <div className="state-place-info">
                  <h3 className="state-place-name">{place.name}</h3>
                  <p className="state-place-location">
                    {place.address || place.location?.city || place.location?.state || decodedState}
                  </p>
                  {place.rating && (
                    <div className="state-place-rating">
                      <span>★ {parseFloat(place.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="state-places-footer">
        <button
          type="button"
          onClick={() => handlePageChange('prev')}
          disabled={pagination.page === 1 || loadingPlaces}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          type="button"
          onClick={() => handlePageChange('next')}
          disabled={pagination.page === pagination.totalPages || loadingPlaces}
        >
          Next
        </button>
      </footer>

      {showDetails && selectedPlace && (
        <PlaceDetailsModal
          place={selectedPlace}
          onClose={() => {
            setShowDetails(false);
            setSelectedPlace(null);
          }}
        />
      )}
    </div>
  );
};

export default StatePlacesPage;

