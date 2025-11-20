import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicPlacesAPI } from '../../services/api';
import PlaceDetailsModal from './PlaceDetailsModal';
import './ExploreSection.css';
import './PlacesSection.css';

const PAGE_SIZE = 12;

const ExploreSection = ({ searchQuery = '' }) => {
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [countriesError, setCountriesError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [countrySearch, setCountrySearch] = useState('');

  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const [stateSummary, setStateSummary] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesError, setStatesError] = useState(null);
  const stateCacheRef = useRef(new Map());

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const navigate = useNavigate();
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const selectedStateNormalized = selectedState?.toLowerCase() || null;
  const activeRegionLabel =
    selectedState || selectedCountry?.country || 'Select a country';

  const getCountryImage = (countryName) => {
    // Comprehensive mapping of country names to image URLs
    const countryImages = {
      'India': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400',
      'Kazakhstan': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Indonesia': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'United States': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
      'United Kingdom': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
      'France': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
      'Japan': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400',
      'Australia': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Canada': 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=400',
      'Germany': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400',
      'Italy': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400',
      'Spain': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400',
      'China': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400',
      'Brazil': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400',
      'Mexico': 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=400',
      'Russia': 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=400',
      'South Korea': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      'Thailand': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400',
      'Vietnam': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400',
      'Philippines': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
      'Malaysia': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400',
      'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400',
      'New Zealand': 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400',
      'South Africa': 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400',
      'Egypt': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73a6e?w=400',
      'Turkey': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400',
      'Greece': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Portugal': 'https://images.unsplash.com/photo-1555881403-671736d5ad2c?w=400',
      'Netherlands': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400',
      'Belgium': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400',
      'Switzerland': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Austria': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400',
      'Sweden': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Norway': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Denmark': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
      'Finland': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Poland': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400',
      'Czech Republic': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400',
      'Hungary': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400',
      'Romania': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400',
      'Ireland': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
      'Iceland': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Argentina': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400',
      'Chile': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Peru': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Colombia': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400',
      'UAE': 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=400',
      'United Arab Emirates': 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=400',
      'Saudi Arabia': 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=400',
      'Israel': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73a6e?w=400',
      'Jordan': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73a6e?w=400',
      'Morocco': 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=400',
      'Tunisia': 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=400',
      'Kenya': 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400',
      'Tanzania': 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400',
      'Mauritius': 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400',
      'Maldives': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Sri Lanka': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
      'Nepal': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Bhutan': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Bangladesh': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400',
      'Pakistan': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400',
      'Myanmar': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400',
      'Cambodia': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400',
      'Laos': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400',
      'Mongolia': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'Taiwan': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400',
      'Hong Kong': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400',
      'Macau': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400',
    };
    return countryImages[countryName] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400';
  };

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      setCountriesError(null);

      try {
        const response = await publicPlacesAPI.getCountries();
        const countryList = response.data?.data || [];

        setCountries(countryList);

        if (!selectedCountry && countryList.length > 0) {
          setSelectedCountry(countryList[0]);
        }
      } catch (error) {
        setCountriesError(
          error.response?.data?.message ||
            error.message ||
            'Failed to load countries'
        );
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCountry?.country) {
      setPlaces([]);
    setSelectedState(null);
      setStateSummary([]);
      return;
    }

    setSelectedState(null);

    const loadCountryData = async () => {
      await fetchPlacesByCountry(selectedCountry.country, 1);
      await fetchStateSummary(selectedCountry.country);
    };

    loadCountryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry?.country]);

  const fetchPlacesByCountry = async (countryName, page = 1) => {
    if (!countryName) return;

    setLoadingPlaces(true);
    setPlacesError(null);

    try {
      const response = await publicPlacesAPI.getPlacesByCountry(countryName, {
        page,
        limit: PAGE_SIZE,
      });

      const data = response.data;
      setPlaces(Array.isArray(data?.data) ? data.data : []);
      setPagination({
        page: data?.pagination?.page || page,
        totalPages: data?.pagination?.totalPages || 1,
        totalCount: data?.pagination?.totalCount || 0,
      });
    } catch (error) {
      setPlaces([]);
      setPagination({ page: 1, totalPages: 1, totalCount: 0 });
      setPlacesError(
        error.response?.data?.message ||
          error.message ||
          'Failed to load places'
      );
    } finally {
      setLoadingPlaces(false);
    }
  };

  const fetchStateSummary = async (countryName) => {
    if (!countryName) return;

    const cacheKey = countryName.toLowerCase();
    if (stateCacheRef.current.has(cacheKey)) {
      setStateSummary(stateCacheRef.current.get(cacheKey));
      return;
    }

    setStatesLoading(true);
    setStatesError(null);

    try {
      const response = await publicPlacesAPI.getStatesByCountry(countryName);
      const summary = Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setStateSummary(summary);
      stateCacheRef.current.set(cacheKey, summary);
    } catch (error) {
      setStateSummary([]);
      setStatesError(
        error.response?.data?.message ||
          error.message ||
          'Failed to load states for this country'
      );
    } finally {
      setStatesLoading(false);
    }
  };

  const filteredCountries = useMemo(() => {
    const searchTerm = countrySearch.trim().toLowerCase();
    if (!searchTerm) return countries;
    return countries.filter((country) =>
      country.country?.toLowerCase().includes(searchTerm)
    );
  }, [countries, countrySearch]);

  const currentStateMeta = useMemo(() => {
    if (!selectedStateNormalized) return null;
    return (
      stateSummary.find(
        (state) => state.normalized === selectedStateNormalized
      ) || null
    );
  }, [stateSummary, selectedStateNormalized]);

  const filteredPlaces = useMemo(() => {
    let basePlaces = places;

    if (selectedStateNormalized) {
      basePlaces = basePlaces.filter(
        (place) =>
          place?.location?.state?.toLowerCase() === selectedStateNormalized
      );
    }

    if (!normalizedSearch) return basePlaces;

    if (
      selectedCountry?.country?.toLowerCase().includes(normalizedSearch) ||
      (selectedStateNormalized &&
        selectedStateNormalized.includes(normalizedSearch))
    ) {
      return basePlaces;
    }

    return basePlaces.filter((place) => {
      const name = place.name?.toLowerCase() || '';
      const city = place.location?.city?.toLowerCase() || '';
      const state = place.location?.state?.toLowerCase() || '';

      return (
        name.includes(normalizedSearch) ||
        city.includes(normalizedSearch) ||
        state.includes(normalizedSearch)
      );
    });
  }, [places, normalizedSearch, selectedCountry, selectedStateNormalized]);

  const handleCountrySelect = (country) => {
    if (!country) return;
    // Navigate to country states page
    navigate(`/home/country/${encodeURIComponent(country.country)}`, {
      state: {
        country: country.country,
      },
    });
  };

  const handlePageChange = (nextPage) => {
    if (
      !selectedCountry ||
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
      loadingPlaces
    ) {
      return;
    }
    fetchPlacesByCountry(selectedCountry.country, nextPage);
  };

  const CountryCard = ({ item }) => {
    const [imageError, setImageError] = useState(false);
    const isActive = item.country === selectedCountry?.country;
    
    return (
      <div
        className={`country-card ${isActive ? 'active' : ''}`}
        onClick={() => handleCountrySelect(item)}
        role="button"
        tabIndex={0}
        onKeyPress={(event) => {
          if (event.key === 'Enter') {
            handleCountrySelect(item);
          }
        }}
      >
        <div className="country-image-container">
          {!imageError ? (
            <img
              src={getCountryImage(item.country)}
              alt={item.country}
              className="country-image"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="country-image country-image-placeholder">
              <span>{item.country?.charAt(0)?.toUpperCase() || '?'}</span>
            </div>
          )}
        </div>
        <div className="country-info">
          <h4 className="country-name">{item.country}</h4>
        </div>
      </div>
    );
  };

  const renderCountryList = () => {
    if (loadingCountries) {
      return (
        <div className="explore-loading">
          <div className="spinner"></div>
          <p>Loading countries...</p>
        </div>
      );
    }

    if (countriesError) {
      return <div className="explore-error">{countriesError}</div>;
    }

    if (filteredCountries.length === 0) {
      return (
        <div className="country-empty-state">
          No countries matched your search
        </div>
      );
    }

    return (
      <div className="country-list-horizontal">
        {filteredCountries.map((country) => (
          <CountryCard key={country.normalizedCountry || country.country} item={country} />
        ))}
      </div>
    );
  };

  const handleStateNavigation = (stateItem) => {
    if (!stateItem || !selectedCountry?.country) return;

    navigate(
      `/home/state/${encodeURIComponent(selectedCountry.country)}/${encodeURIComponent(
        stateItem.state
      )}`,
      {
        state: {
          country: selectedCountry.country,
          state: stateItem.state,
          stateMeta: stateItem,
        },
      }
    );
  };

  const renderStateList = () => {
    if (!selectedCountry) {
      return (
        <div className="state-empty">
          Select a country to view its states.
        </div>
      );
    }

    if (statesLoading) {
      return <div className="state-empty">Loading states...</div>;
    }

    if (statesError) {
      return <div className="state-empty state-error">{statesError}</div>;
    }

    if (!stateSummary.length) {
      return (
        <div className="state-empty">
          No states available for this country yet.
        </div>
      );
    }

    return stateSummary.map((state) => {
      const isActive = state.normalized === selectedStateNormalized;
      return (
        <button
          type="button"
          key={state.normalized}
          className={`state-chip ${isActive ? 'active' : ''}`}
          onClick={() => handleStateNavigation(state)}
        >
          <span>{state.state}</span>
          <small>{state.count} places</small>
        </button>
      );
    });
  };

  const renderPlaces = () => {
    if (!selectedCountry) {
      return (
        <div className="explore-empty-state">
          Choose a country to explore available places
        </div>
      );
    }

    if (loadingPlaces) {
      return <div className="explore-loading">Loading places...</div>;
    }

    if (placesError) {
      return <div className="explore-error">{placesError}</div>;
    }

    if (filteredPlaces.length === 0) {
      return (
        <div className="explore-empty-state">
          {selectedState
            ? `No places found for ${selectedState}`
            : 'No places found for this country'}
        </div>
      );
    }

    return (
      <>
        <div className="explore-grid">
          {filteredPlaces.map((place) => (
            <div
              key={place._id || place.id}
              className="place-card"
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
              <div className="place-image-container">
                <img
                  src={
                    place.images?.[0]?.url ||
                    place.images?.[0] ||
                    'https://via.placeholder.com/300x200?text=No+Image'
                  }
                  alt={place.name}
                  className="place-image"
                  onError={(event) => {
                    event.target.src =
                      'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
                {place.rating && (
                  <div className="place-rating">
                    <span>★ {parseFloat(place.rating).toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="place-card-content">
                <h3 className="place-name">{place.name}</h3>
                <p className="place-location">
                  {place.location?.city || place.location?.state || 'Unknown'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {pagination.totalPages > 1 && (
          <div className="explore-pagination">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loadingPlaces}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={
                pagination.page === pagination.totalPages || loadingPlaces
              }
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <section className="explore-section">
      <div className="explore-countries-panel">
        <div className="explore-countries-header">
          <h3>Explore by Country</h3>
        </div>
        <div className="country-search-wrapper">
          <input
            type="text"
            placeholder="Search country"
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            className="country-search-input"
          />
        </div>
        {renderCountryList()}
      </div>

      <div className="explore-places-panel">
        <div className="explore-places-header">
          <div>
            <h3>{activeRegionLabel}</h3>
           
          </div>
        </div>

     

        {renderPlaces()}
      </div>

      {showDetails && selectedPlace && (
        <PlaceDetailsModal
          place={selectedPlace}
          onClose={() => {
            setShowDetails(false);
            setSelectedPlace(null);
          }}
        />
      )}
    </section>
  );
};

export default ExploreSection;

