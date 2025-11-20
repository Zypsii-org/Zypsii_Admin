import React from 'react';
import { FaSearch } from 'react-icons/fa';
import './SearchInput.css';

const SearchInput = ({ value, onChange, placeholder = "Search...", onSearch }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="modern-search-wrapper">
      <div className="modern-search-container">
        <FaSearch className="modern-search-icon" />
        <input
          type="text"
          className="modern-search-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
};

export default SearchInput;

