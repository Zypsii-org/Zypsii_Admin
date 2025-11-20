import { base_url } from '../utils/base_url';

export const getAddressFromCoordinates = async (location) => {
  try {
    if (!location) return 'Unknown location';
    
    // If location already has an address or name, use it
    if (location.address) return location.address;
    if (location.name) return location.name;
    if (typeof location === 'string') return location;

    // If we have coordinates, fetch the address from our backend
    if (location.latitude && location.longitude) {
      const response = await fetch(
        `${base_url}/api/places/reverse-geocode?lat=${location.latitude}&lng=${location.longitude}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      if (data && data.address) {
        return data.address;
      }
    }

    // Fallback to coordinates if we can't get an address
    if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }

    return 'Unknown location';
  } catch (error) {
    console.error('Error getting address:', error);
    // If we have coordinates, return them as fallback
    if (location && location.latitude && location.longitude) {
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }
    return 'Unknown location';
  }
};

export const getFormattedAddress = (location) => {
  if (!location) return 'Unknown location';
  if (typeof location === 'string') return location;
  if (location.name) return location.name;
  if (location.address) return location.address;
  if (location.latitude && location.longitude) {
    return getAddressFromCoordinates(location);
  }
  return 'Unknown location';
}; 