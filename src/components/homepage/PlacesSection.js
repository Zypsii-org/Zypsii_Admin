import React, { useState, useEffect } from 'react';
import { publicPlacesAPI } from '../../services/api';
import { SearchInput } from '../common';
import GoogleLoginButton from '../auth/GoogleLoginButton';
import PlaceDetailsModal from './PlaceDetailsModal';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './PlacesSection.css';

const getGridColumnCount = () => {
  if (typeof window === 'undefined') {
    return 1;
  }

  if (window.innerWidth <= 640) {
    return 1;
  }

  if (window.innerWidth <= 1024) {
    return 2;
  }

  return 3;
};

const PlacesSection = React.memo(({ searchQuery: propSearchQuery, showHeader = true }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchQuery, setSearchQuery] = useState(propSearchQuery || '');
  const [currentImageIndex, setCurrentImageIndex] = useState({}); // Track image index for each place
  const [gridColumns, setGridColumns] = useState(getGridColumnCount);
  
  const RESULTS_PER_PAGE = 12; // Results per page from API

  // Sync with prop search query
  useEffect(() => {
    if (propSearchQuery !== undefined) {
      setSearchQuery(propSearchQuery);
    }
  }, [propSearchQuery]);

  useEffect(() => {
    const handleResize = () => {
      setGridColumns(getGridColumnCount());
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const categories = [
    'Beach', 'Adventure', 'Mountains', 'Hiking', 'Trekking',
    'View Points', 'National Parks', 'Wildlife', 'Cultural Sites',
    'Historical Places', 'Waterfalls', 'Lakes', 'Forests',
    'Caves', 'Temples', 'Museums', 'Gardens', 'Rivers'
  ];

  useEffect(() => {
    // Reset to page 1 when tab or search changes
    setCurrentPage(1);
    fetchPlaces(1);
  }, [activeTab, searchQuery]);

  // Fetch places when page changes (but not when it's reset to 1 by tab/search change)
  useEffect(() => {
    // Only fetch if page is greater than 1 to avoid double fetch when resetting to page 1
    if (currentPage > 1) {
      fetchPlaces(currentPage);
    }
  }, [currentPage]);

  const fetchPlaces = async (page = 1) => {
    try {
      setLoading(true);
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        console.log('User not logged in');
        setPlaces([]);
        setTotalPages(1);
        setTotalCount(0);
        return;
      }
      
      // Build URL based on active tab with pagination
      let url = '';
      
      if (searchQuery.trim() !== '') {
        // Search by name
        url = `https://zypsii.com/api/schedule/places/search?searchPlaceName=${encodeURIComponent(searchQuery)}&page=${page}&limit=${RESULTS_PER_PAGE}`;
      } else if (activeTab === 'all') {
        // Use getNearest without filters for all places
        url = `https://zypsii.com/api/schedule/places/getNearest?page=${page}&limit=${RESULTS_PER_PAGE}`;
      } else {
        // Specific category filter
        url = `https://zypsii.com/api/schedule/places/getNearest?type=${encodeURIComponent(activeTab)}&keyword=${encodeURIComponent(activeTab)}&page=${page}&limit=${RESULTS_PER_PAGE}`;
      }

      console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const result = await response.json();
      
      console.log('API Response:', result);
      console.log('Active Tab:', activeTab);
      
      // Handle different response structures
      let placesArray = [];
      
      if (result && result.data) {
        placesArray = Array.isArray(result.data) ? result.data : [];
      } else if (result && result.places) {
        placesArray = Array.isArray(result.places) ? result.places : [];
      } else if (Array.isArray(result)) {
        placesArray = result;
      }
      
      console.log('Final places array:', placesArray);
      console.log('Number of places:', placesArray.length);
      
      // Update places
      setPlaces(placesArray);
      
      // Update pagination info from API response
      if (result && result.pagination) {
        setTotalPages(result.pagination.totalPages || 1);
        setTotalCount(result.pagination.totalCount || placesArray.length);
        setHasNextPage(result.pagination.hasNextPage || false);
        setHasPrevPage(result.pagination.hasPrevPage || false);
      } else {
        // Fallback: calculate pagination from data length
        const calculatedPages = Math.ceil(placesArray.length / RESULTS_PER_PAGE);
        setTotalPages(calculatedPages || 1);
        setTotalCount(placesArray.length);
        setHasNextPage(page < calculatedPages);
        setHasPrevPage(page > 1);
      }
      
      // Reset image indices when places change
      setCurrentImageIndex({});
      
      // Scroll to top when page changes
      if (page > 1) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
      setTotalPages(1);
      setTotalCount(0);
      setCurrentImageIndex({});
    } finally {
      setLoading(false);
    }
  };

  // Check if user is logged in
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const isLoggedIn = token && user;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  // Get images for a place
  const getPlaceImages = (place) => {
    if (place.images && Array.isArray(place.images) && place.images.length > 0) {
      return place.images.map(img => img.url || img);
    }
    if (place.image) {
      return [place.image];
    }
    if (place.photo) {
      return [place.photo];
    }
    return [];
  };

  // Handle image navigation
  const handleImageNav = (placeId, direction, e, images) => {
    e.stopPropagation(); // Prevent card click
    if (images.length === 0) return;

    setCurrentImageIndex(prev => {
      const currentIdx = prev[placeId] || 0;
      let newIdx;
      if (direction === 'next') {
        newIdx = (currentIdx + 1) % images.length;
      } else {
        newIdx = (currentIdx - 1 + images.length) % images.length;
      }
      return { ...prev, [placeId]: newIdx };
    });
  };

  return (
    <section className="places-section">
      <div className="container">
        {/* Tabs */}
        <div className="places-tabs">
          <button
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          {categories.slice(0, 8).map((category) => (
            <button
              key={category}
              className={`tab-button ${activeTab === category ? 'active' : ''}`}
              onClick={() => setActiveTab(category)}
            >
              {category}
            </button>
          ))}
        </div>


        {/* Login Prompt if not logged in */}
        {!isLoggedIn && (
          <div className="places-login-prompt">
            <div className="prompt-icon">🔒</div>
            <h3>Login Required</h3>
            <p>Please login to explore amazing places</p>
            <div className="login-prompt-actions">
              <GoogleLoginButton variant="primary" />
            </div>
          </div>
        )}

        {/* Places Grid */}
        {loading && isLoggedIn ? (
          <div className="places-loading">
            <div className="spinner"></div>
            <p>Loading places...</p>
          </div>
        ) : (
          <div
            className="places-grid"
            style={{
              gridTemplateColumns: `repeat(${Math.min(Math.max(places.length || 1, 1), gridColumns)}, minmax(0, 1fr))`,
            }}
          >
            {places.length > 0 ? (
              places.map((place) => {
                const placeId = place._id || place.id;
                const images = getPlaceImages(place);
                const currentIdx = currentImageIndex[placeId] || 0;
                const currentImage = images[currentIdx];
                const hasMultipleImages = images.length > 1;

                return (
                  <div 
                    key={placeId} 
                    className="place-card"
                    onClick={() => {
                      setSelectedPlace(place);
                      setShowDetails(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="place-image-container">
                      {currentImage ? (
                        <>
                          <img
                            src={currentImage}
                            alt={place.name}
                            className="place-image"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                            }}
                          />
                          {hasMultipleImages && (
                            <>
                              <button
                                className="place-image-nav place-image-nav-prev"
                                onClick={(e) => handleImageNav(placeId, 'prev', e, images)}
                                aria-label="Previous image"
                              >
                                <FaChevronLeft />
                              </button>
                              <button
                                className="place-image-nav place-image-nav-next"
                                onClick={(e) => handleImageNav(placeId, 'next', e, images)}
                                aria-label="Next image"
                              >
                                <FaChevronRight />
                              </button>
                              {images.length <= 5 ? (
                                <div className="place-image-indicators">
                                  {images.map((_, idx) => (
                                    <span
                                      key={idx}
                                      className={`place-image-indicator ${idx === currentIdx ? 'active' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentImageIndex(prev => ({ ...prev, [placeId]: idx }));
                                      }}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="place-image-counter">
                                  {currentIdx + 1} / {images.length}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <div className="place-image-placeholder">
                          <span>No Image</span>
                        </div>
                      )}
                      {place.rating && (
                        <div className="place-rating">
                          <span>★ {parseFloat(place.rating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="place-card-content">
                      <h3 className="place-name">{place.name || 'Unknown Place'}</h3>
                      <p className="place-location">
                        {place.location?.address || place.location?.state || 'No address'}
                      </p>
                      {place.distanceInKilometer && (
                        <div className="place-distance">
                          {parseFloat(place.distanceInKilometer).toFixed(1)} km away
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-places">
                <p>No places found</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {isLoggedIn && !loading && places.length > 0 && totalPages > 1 && (
          <div className="places-pagination">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrevPage || currentPage === 1}
            >
              <FaChevronLeft /> Previous
            </button>
            
            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => {
                const pageNum = i + 1;
                // Show current page, first page, last page, and pages around current
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="pagination-ellipsis">...</span>;
                }
                return null;
              })}
            </div>
            
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage || currentPage === totalPages}
            >
              Next <FaChevronRight />
            </button>
          </div>
        )}
        
        {/* Pagination Info */}
        {isLoggedIn && !loading && places.length > 0 && totalCount > 0 && (
          <div className="pagination-info" style={{ textAlign: 'center', marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
            <p>
              Showing {((currentPage - 1) * RESULTS_PER_PAGE) + 1} to{' '}
              {Math.min(currentPage * RESULTS_PER_PAGE, totalCount)} of{' '}
              {totalCount} places
            </p>
          </div>
        )}
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
}, (prevProps, nextProps) => {
  // Only re-render if searchQuery or showHeader changes
  return prevProps.searchQuery === nextProps.searchQuery && 
         prevProps.showHeader === nextProps.showHeader;
});

PlacesSection.displayName = 'PlacesSection';

export default PlacesSection;
