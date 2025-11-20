import React from 'react';
import PlaceDetailsModal from './PlaceDetailsModal';
import './SearchResults.css';

const SearchResults = ({ 
  searchQuery, 
  searchResults, 
  allResults, 
  loading, 
  currentPage, 
  totalPages, 
  onPageChange,
  onPlaceClick,
  selectedPlace,
  showDetails,
  onCloseDetails
}) => {
  const RESULTS_PER_PAGE = 9;

  if (loading) {
    return (
      <div className="search-results-wrapper">
        <div className="search-loading">
          <div className="spinner"></div>
          <p>Searching...</p>
        </div>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="search-results-wrapper">
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No places found</h3>
          <p>No places found for "{searchQuery}"</p>
          <p className="no-results-suggestion">Try a different search term</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results-wrapper">
      <div className="search-results-header">
        <h2>Search Results</h2>
        <p className="results-count">{searchResults.length} {searchResults.length === 1 ? 'place' : 'places'} found</p>
      </div>

      <div className="search-results-grid">
        {searchResults.map((place) => (
          <div
            key={place._id || place.id}
            className="search-result-card"
            onClick={() => onPlaceClick(place)}
          >
            <div className="result-image-container">
              {(place.images && place.images[0]?.url) || place.image || place.photo ? (
                <img
                  src={place.images?.[0]?.url || place.image || place.photo}
                  alt={place.name}
                  className="result-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
              ) : (
                <div className="result-image-placeholder">
                  <span>No Image</span>
                </div>
              )}
              {place.rating && (
                <div className="result-rating">
                  <span>★ {parseFloat(place.rating).toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="result-card-content">
              <h4 className="result-name">{place.name || 'Unknown Place'}</h4>
              <p className="result-location">
                {place.location?.address || place.location?.state || 'No address'}
              </p>
              {place.distanceInKilometer && (
                <div className="result-distance">
                  {parseFloat(place.distanceInKilometer).toFixed(1)} km away
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="search-pagination">
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {showDetails && selectedPlace && (
        <PlaceDetailsModal
          place={selectedPlace}
          onClose={onCloseDetails}
        />
      )}
    </div>
  );
};

export default SearchResults;

