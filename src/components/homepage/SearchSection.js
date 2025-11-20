import React, { useState, useEffect, useRef } from 'react';
import SearchResults from './SearchResults';
import './SearchSection.css';

const SearchSection = React.memo(({ searchQuery: propSearchQuery, showHeader = true }) => {
  const [searchQuery, setSearchQuery] = useState(propSearchQuery || '');
  const [searchResults, setSearchResults] = useState([]);
  const [allResults, setAllResults] = useState([]); // Store all results
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  
  const RESULTS_PER_PAGE = 9; // 3 rows x 3 cards = 9 results

  // Sync with prop search query
  useEffect(() => {
    if (propSearchQuery !== undefined) {
      setSearchQuery(propSearchQuery);
    }
  }, [propSearchQuery]);

  const fetchSearchResults = async (text) => {
    if (text.trim() === '') {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    
    try {
      // Use the same API endpoint as the phone app
      const url = `https://zypsii.com/api/schedule/places/search?searchPlaceName=${encodeURIComponent(text)}&page=1&limit=20`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      // Handle different response structures
      if (result && result.data) {
        // If data is an array of suggestions, flatten it
        let placesArray = [];
        
        if (Array.isArray(result.data)) {
          placesArray = result.data;
        } else if (Array.isArray(result.data.suggestions)) {
          placesArray = result.data.suggestions.flatMap(suggestion => suggestion.places || []);
        } else if (result.data.places) {
          placesArray = result.data.places;
        } else if (result.data.data) {
          placesArray = Array.isArray(result.data.data) ? result.data.data : [];
        }
        
        // Store all results and calculate pagination
        setAllResults(placesArray);
        const totalResults = placesArray.length;
        const calculatedPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
        setTotalPages(calculatedPages);
        setCurrentPage(1); // Reset to page 1 on new search
        
        // Show only results for current page
        const startIndex = 0;
        const endIndex = startIndex + RESULTS_PER_PAGE;
        const paginatedResults = placesArray.slice(startIndex, endIndex);
        
        setSearchResults(paginatedResults);
      } else if (Array.isArray(result)) {
        setSearchResults(result);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    if (searchQuery.trim() !== '') {
      const newTimeout = setTimeout(() => {
        fetchSearchResults(searchQuery);
      }, 500);
      setSearchTimeout(newTimeout);
    } else {
      setSearchResults([]);
      setAllResults([]);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
    setShowDetails(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    // Calculate which results to show for this page
    const startIndex = (page - 1) * RESULTS_PER_PAGE;
    const endIndex = startIndex + RESULTS_PER_PAGE;
    const paginatedResults = allResults.slice(startIndex, endIndex);
    
    setSearchResults(paginatedResults);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="search-section">
      <div className="container">
        {/* Show header only when showHeader is true and there's no search query */}
        {showHeader && !searchQuery && (
          <div className="search-header">
            <h2>Search Places & Destinations</h2>
            <p>Find amazing places to explore</p>
          </div>
        )}

        {/* Show results component when there's a search query */}
        {searchQuery && (
          <SearchResults
            searchQuery={searchQuery}
            searchResults={searchResults}
            allResults={allResults}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onPlaceClick={handlePlaceClick}
            selectedPlace={selectedPlace}
            showDetails={showDetails}
            onCloseDetails={() => {
              setShowDetails(false);
              setSelectedPlace(null);
            }}
          />
        )}
      </div>
    </section>
  );
}, (prevProps, nextProps) => {
  // Only re-render if searchQuery or showHeader changes
  return prevProps.searchQuery === nextProps.searchQuery && 
         prevProps.showHeader === nextProps.showHeader;
});

SearchSection.displayName = 'SearchSection';

export default SearchSection;
