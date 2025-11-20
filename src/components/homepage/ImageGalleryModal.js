import React, { useState, useEffect, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import './ImageGalleryModal.css';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const ImageGalleryModal = ({ images, currentIndex = 0, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  const handlePrevious = useCallback(() => {
    if (!images || images.length === 0) return;
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images]);

  const handleNext = useCallback(() => {
    if (!images || images.length === 0) return;
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  }, [handlePrevious, handleNext, onClose]);

  useEffect(() => {
    if (!images || images.length === 0) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, images]);

  useLockBodyScroll(Boolean(images && images.length > 0));

  if (!images || images.length === 0) return null;

  const currentImage = images[activeIndex];
  const imageUrl = typeof currentImage === 'string' ? currentImage : (currentImage?.url || currentImage?.src);

  return (
    <div className="image-gallery-overlay" onClick={onClose}>
      <div className="image-gallery-modal" onClick={(e) => e.stopPropagation()}>
        <button className="image-gallery-close" onClick={onClose}>
          <FaTimes />
        </button>
        
        {images.length > 1 && (
          <button className="image-gallery-nav image-gallery-prev" onClick={handlePrevious}>
            <FaChevronLeft />
          </button>
        )}

        <div className="image-gallery-content">
          <img 
            src={imageUrl} 
            alt={`Gallery image ${activeIndex + 1}`}
            className="image-gallery-main"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
            }}
          />
          
          {images.length > 1 && (
            <div className="image-gallery-info">
              <span>{activeIndex + 1} / {images.length}</span>
            </div>
          )}
        </div>

        {images.length > 1 && (
          <button className="image-gallery-nav image-gallery-next" onClick={handleNext}>
            <FaChevronRight />
          </button>
        )}

        {images.length > 1 && (
          <div className="image-gallery-thumbnails">
            {images.map((img, idx) => {
              const thumbUrl = typeof img === 'string' ? img : (img?.url || img?.src);
              return (
                <div
                  key={idx}
                  className={`image-gallery-thumb ${idx === activeIndex ? 'active' : ''}`}
                  onClick={() => setActiveIndex(idx)}
                >
                  <img 
                    src={thumbUrl} 
                    alt={`Thumbnail ${idx + 1}`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGalleryModal;

