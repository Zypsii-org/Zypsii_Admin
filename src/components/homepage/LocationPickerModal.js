import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import './LocationPickerModal.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const LocationPickerModal = ({
  isOpen,
  title = 'Select Location',
  initialLocation,
  onClose,
  onSave,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const parsedInitial = useMemo(() => {
    if (!initialLocation) return null;
    const latitude =
      typeof initialLocation.lat === 'number'
        ? initialLocation.lat
        : Number(initialLocation.latitude);
    const longitude =
      typeof initialLocation.lng === 'number'
        ? initialLocation.lng
        : Number(initialLocation.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { lat: latitude, lng: longitude };
    }
    return null;
  }, [initialLocation]);

  const [selectedLocation, setSelectedLocation] = useState(parsedInitial);

  useEffect(() => {
    if (!isOpen) return undefined;

    const center = parsedInitial || defaultCenter;
    const zoom = parsedInitial ? 10 : 4;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const clickHandler = (event) => {
      if (event?.latlng) {
        setSelectedLocation({
          lat: event.latlng.lat,
          lng: event.latlng.lng,
        });
      }
    };

    map.on('click', clickHandler);

    if (parsedInitial) {
      markerRef.current = L.marker(parsedInitial).addTo(map);
    }

    return () => {
      map.off('click', clickHandler);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [isOpen, parsedInitial]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!selectedLocation) {
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    if (!markerRef.current) {
      markerRef.current = L.marker(selectedLocation).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(selectedLocation);
    }
    mapRef.current.setView(selectedLocation, Math.max(mapRef.current.getZoom(), 10));
  }, [selectedLocation]);

  useEffect(() => {
    if (isOpen) {
      setSelectedLocation(parsedInitial);
    }
  }, [isOpen, parsedInitial]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (selectedLocation && onSave) {
      onSave({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      });
    }
  };

  return (
    <div className="location-picker-overlay" onClick={onClose}>
      <div className="location-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="location-picker-header">
          <div>
            <h3>{title}</h3>
            <p>Tap anywhere on the map to drop a marker.</p>
          </div>
          <button className="location-picker-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="location-picker-map">
          <div ref={mapContainerRef} className="location-picker-map-inner" />
        </div>

        <div className="location-picker-coords">
          <div>
            <span>Latitude</span>
            <strong>
              {selectedLocation ? selectedLocation.lat.toFixed(6) : '--'}
            </strong>
          </div>
          <div>
            <span>Longitude</span>
            <strong>
              {selectedLocation ? selectedLocation.lng.toFixed(6) : '--'}
            </strong>
          </div>
        </div>

        <div className="location-picker-actions">
          <button className="location-picker-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="location-picker-confirm"
            onClick={handleSave}
            disabled={!selectedLocation}
          >
            Save Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;

