/**
 * Google Maps & Places Configuration for EarthenKnot
 * 
 * Instructions:
 * 1. Open Google Cloud Console: https://console.cloud.google.com/google/maps-apis/credentials
 * 2. Ensure the following APIs are enabled for your project:
 *    - Places API (or Places API New)
 *    - Maps JavaScript API
 *    - Geocoding API
 * 3. Create an API Key and restrict it to your website domain (HTTP referrers) for security.
 * 4. Replace 'YOUR_GOOGLE_MAPS_API_KEY' below with your actual API Key.
 * 
 * Note: If this key is left as placeholder or empty, the checkout page
 * automatically uses an instant geocoding fallback so address auto-suggestions
 * and map pin confirmation still function seamlessly!
 */

window.GOOGLE_MAPS_CONFIG = {
  // Replace with your Google Maps API Key:
  apiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
  
  // Restrict autocomplete results to India (ISO country code 'in')
  countryRestriction: ['in'],
  
  // Default map center (Geographic center of India: Lat 20.5937, Lng 78.9629)
  defaultCenter: {
    lat: 20.5937,
    lng: 78.9629
  },
  
  // Default zoom level
  defaultZoom: 5,
  
  // Zoom level when an address or pin is confirmed
  focusedZoom: 16
};
