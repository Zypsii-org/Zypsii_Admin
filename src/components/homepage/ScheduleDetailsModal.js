import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { scheduleAPI } from '../../services/api';
import PlaceDetailsModal from './PlaceDetailsModal';
import ImageGalleryModal from './ImageGalleryModal';
import './ScheduleDetailsModal.css';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const ScheduleDetailsModal = ({ schedule, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(schedule || null);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useLockBodyScroll(Boolean(schedule));

  useEffect(() => {
    const fetchDetails = async () => {
      if (!schedule?._id && !schedule?.id) return;
      const id = schedule._id || schedule.id;
      try {
        setLoading(true);
        const res = await scheduleAPI.getScheduleById(id);
        const data = res?.data?.data || res?.data || res;
        if (data) setDetails(data);
      } catch (e) {
        // keep minimal
      } finally {
        setLoading(false);
      }
    };
    // If passed object seems partial, try fetching
    if (!schedule?.planDescription && (schedule?._id || schedule?.id)) {
      fetchDetails();
    }
  }, [schedule]);

  if (!schedule) return null;

  const title = details?.tripName || details?.title || 'Schedule Details';
  const banner = details?.bannerImage || details?.imageUrl;
  const fromDate = details?.Dates?.from || details?.dates?.from;
  const endDate = details?.Dates?.end || details?.dates?.end;
  const visibility = details?.visible || details?.visibility;
  const travelMode = details?.travelMode;
  const numberOfDays = details?.numberOfDays;
  const fromLocationDetail = details?.locationDetails?.[0];
  const toLocationDetail = details?.locationDetails?.[1];
  const fromLocation = fromLocationDetail?.address || details?.location?.from?.address;
  const toLocation = toLocationDetail?.address || details?.location?.to?.address;
  const plans = details?.planDescription || details?.days || [];
  
  // Check if location details have place information
  const hasFromPlace = fromLocationDetail?._id || fromLocationDetail?.placeId || fromLocationDetail?.id;
  const hasToPlace = toLocationDetail?._id || toLocationDetail?.placeId || toLocationDetail?.id;
  
  const handlePlaceClick = (placeDetail) => {
    if (placeDetail && (placeDetail._id || placeDetail.placeId || placeDetail.id)) {
      setSelectedPlace(placeDetail);
      setShowPlaceModal(true);
    }
  };
  
  const handleBackToSchedule = () => {
    setShowPlaceModal(false);
    setSelectedPlace(null);
  };
  
  // Get all images for gallery
  const allImages = [];
  if (banner) allImages.push(banner);

  const modalContent = (
    <div className="schedule-details-overlay" onClick={onClose}>
      <div className="schedule-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="details-header">
          <h2>{title}</h2>
          <button className="details-close" onClick={onClose}>×</button>
        </div>

        <div className="details-content">
          {banner && (
            <div 
              className="details-banner"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setGalleryIndex(0);
                setShowGallery(true);
              }}
            >
              <img 
                src={banner} 
                alt={title}
                onError={(e) => { 
                  if (e.target) {
                    e.target.style.display = 'none'; 
                  }
                }}
              />
            </div>
          )}

          {loading ? (
            <div className="details-loading">
              <div className="spinner" />
              <p>Loading schedule...</p>
            </div>
          ) : (
            <div className="details-sections">
              <div className="details-row"><span>Dates:</span><strong>{fromDate ? new Date(fromDate).toLocaleDateString() : 'N/A'} - {endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}</strong></div>
              {travelMode && (<div className="details-row"><span>Mode:</span><strong>{travelMode}</strong></div>)}
              {visibility && (<div className="details-row"><span>Visibility:</span><strong>{visibility}</strong></div>)}
              {numberOfDays && (<div className="details-row"><span>Days:</span><strong>{numberOfDays}</strong></div>)}
              {(fromLocation || toLocation) && (
                <div className="details-locations">
                  {fromLocation && (
                    <div 
                      className={hasFromPlace ? 'clickable-location' : ''}
                      onClick={hasFromPlace ? () => handlePlaceClick(fromLocationDetail) : undefined}
                    >
                      <span>From:</span>
                      <p>{fromLocation}</p>
                      {hasFromPlace && <span className="location-link-indicator">→ View Details</span>}
                    </div>
                  )}
                  {toLocation && (
                    <div 
                      className={hasToPlace ? 'clickable-location' : ''}
                      onClick={hasToPlace ? () => handlePlaceClick(toLocationDetail) : undefined}
                    >
                      <span>To:</span>
                      <p>{toLocation}</p>
                      {hasToPlace && <span className="location-link-indicator">→ View Details</span>}
                    </div>
                  )}
                </div>
              )}

              {Array.isArray(plans) && plans.length > 0 && (
                <div className="details-plan">
                  <h3>Plan</h3>
                  <ul>
                    {plans.map((d, idx) => (
                      <li key={idx}>
                        <div className="plan-day">
                          <div className="plan-day-title">Day {idx + 1}{d?.date ? ` • ${d.date}` : ''}</div>
                          {d?.Description && <div className="plan-desc">{d.Description}</div>}
                          {d?.location && (
                            <div className="plan-locs">
                              <div><span>From:</span> {d.location.from?.latitude}, {d.location.from?.longitude}</div>
                              <div><span>To:</span> {d.location.to?.latitude}, {d.location.to?.longitude}</div>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="details-footer">
          <button className="details-secondary" onClick={onClose}>Close</button>
        </div>
      </div>

      {showPlaceModal && selectedPlace && (
        <PlaceDetailsModal
          place={selectedPlace}
          onClose={handleBackToSchedule}
          onBack={handleBackToSchedule}
          showBackButton={true}
        />
      )}

      {showGallery && allImages.length > 0 && (
        <ImageGalleryModal
          images={allImages}
          currentIndex={galleryIndex}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );

  // Render modal using portal to center it on the window
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }
  
  // Fallback for SSR or when document.body is not available
  return modalContent;
};

export default ScheduleDetailsModal;


