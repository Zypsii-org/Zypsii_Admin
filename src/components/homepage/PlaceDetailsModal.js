import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { publicPlacesAPI } from '../../services/api';
import ImageGalleryModal from './ImageGalleryModal';
import './PlaceDetailsModal.css';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const PlaceDetailsModal = ({ place, onClose, onBack, showBackButton = false }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(place || null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useLockBodyScroll(Boolean(place));

  useEffect(() => {
    const fetchDetails = async () => {
      if (!place?._id && !place?.id && !place?.placeId) return;
      const id = place._id || place.id || place.placeId;
      try {
        setLoading(true);
        const res = await publicPlacesAPI.getPlaceDetails(id);
        const data = res?.data?.data || res?.data || res;
        if (data) setDetails(data);
      } catch (e) {
        // Keep existing place data if fetch fails
      } finally {
        setLoading(false);
      }
    };
    // If passed object seems minimal, try fetching full details
    if (place && !place.description && (place._id || place.id || place.placeId)) {
      fetchDetails();
    }
  }, [place]);

  if (!place) return null;

  const name = details?.name || details?.title || 'Place Details';
  const image = details?.images?.[0]?.url || details?.image || details?.photo || details?.bannerImage;
  const description = details?.description || details?.details?.description;
  const address = details?.location?.address || details?.address || details?.formattedAddress;
  const city = details?.city || details?.location?.city;
  const state = details?.state || details?.location?.state;
  const country = details?.country || details?.location?.country;
  const rating = details?.rating;
  const distance = details?.distanceInKilometer;
  const latitude = details?.location?.latitude || details?.latitude || details?.lat;
  const longitude = details?.location?.longitude || details?.longitude || details?.lng;
  const tags = details?.tags || details?.categories || [];
  const images = details?.images || (image ? [{ url: image }] : []);

  const modalContent = (
    <div className="place-details-overlay" onClick={onClose}>
      <div className="place-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="place-details-header">
          {showBackButton && onBack && (
            <button className="place-details-back" onClick={onBack}>
              ← Back
            </button>
          )}
          <h2>{name}</h2>
          <button className="place-details-close" onClick={onClose}>×</button>
        </div>

        <div className="place-details-content">
          {loading ? (
            <div className="place-details-loading">
              <div className="spinner"></div>
              <p>Loading place details...</p>
            </div>
          ) : (
            <>
              {image && (
                <div 
                  className="place-details-banner"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setGalleryIndex(0);
                    setShowGallery(true);
                  }}
                >
                  <img 
                    src={image} 
                    alt={name}
                    onError={(e) => { 
                      if (e.target) {
                        e.target.style.display = 'none'; 
                      }
                    }}
                  />
                  {images.length > 1 && (
                    <div className="place-image-badge">
                      {images.length} images
                    </div>
                  )}
                </div>
              )}

              <div className="place-details-sections">
                {(rating || distance) && (
                  <div className="place-details-meta">
                    {rating && (
                      <div className="place-meta-item">
                        <span className="meta-label">⭐ Rating:</span>
                        <span className="meta-value">{parseFloat(rating).toFixed(1)}</span>
                      </div>
                    )}
                    {distance && (
                      <div className="place-meta-item">
                        <span className="meta-label">📍 Distance:</span>
                        <span className="meta-value">{parseFloat(distance).toFixed(1)} km</span>
                      </div>
                    )}
                  </div>
                )}

                {address && (
                  <div className="place-details-row">
                    <span className="place-details-label">📍 Address:</span>
                    <div className="place-details-value">
                      {address}
                      {city && `, ${city}`}
                      {state && `, ${state}`}
                      {country && `, ${country}`}
                    </div>
                  </div>
                )}

                {(latitude && longitude) && (
                  <div className="place-details-row">
                    <span className="place-details-label">🗺️ Coordinates:</span>
                    <div className="place-details-value">
                      {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </div>
                  </div>
                )}

                {description && (
                  <div className="place-details-section">
                    <h3>About</h3>
                    <p className="place-description">{description}</p>
                  </div>
                )}

                {Array.isArray(tags) && tags.length > 0 && (
                  <div className="place-details-section">
                    <h3>Tags & Categories</h3>
                    <div className="place-tags">
                      {tags.map((tag, idx) => (
                        <span key={idx} className="place-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(images) && images.length > 1 && (
                  <div className="place-details-section">
                    <h3>More Images</h3>
                    <div className="place-images-grid">
                      {images.slice(1, 5).map((img, idx) => (
                        <div 
                          key={idx} 
                          className="place-image-item"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setGalleryIndex(idx + 1);
                            setShowGallery(true);
                          }}
                        >
                          <img 
                            src={img.url || img} 
                            alt={`${name} - Image ${idx + 2}`}
                            onError={(e) => { 
                              if (e.target) {
                                e.target.style.display = 'none'; 
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="place-details-footer">
          <button className="place-details-secondary" onClick={onClose}>Close</button>
        </div>
      </div>

      {showGallery && (
        <ImageGalleryModal
          images={images.map(img => img.url || img)}
          currentIndex={galleryIndex}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default PlaceDetailsModal;

