/**
 * Geofence utility functions for GPS-based time tracking
 * Uses Haversine formula for distance calculation
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeofenceLocation extends Coordinates {
  radiusMeters: number;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 *
 * @param point1 - First coordinate
 * @param point2 - Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371000; // Earth's radius in meters

  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLat = toRadians(point2.latitude - point1.latitude);
  const deltaLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if a point is within a geofence radius
 *
 * @param point - Point to check
 * @param geofence - Geofence location with radius
 * @returns true if point is within geofence, false otherwise
 */
export function isWithinGeofence(
  point: Coordinates,
  geofence: GeofenceLocation
): boolean {
  const distance = calculateDistance(point, geofence);
  return distance <= geofence.radiusMeters;
}

/**
 * Find the nearest geofence location to a point
 *
 * @param point - Point to check
 * @param geofences - Array of geofence locations
 * @returns Nearest geofence with distance, or null if array is empty
 */
export function findNearestGeofence(
  point: Coordinates,
  geofences: GeofenceLocation[]
): { geofence: GeofenceLocation; distance: number } | null {
  if (geofences.length === 0) return null;

  let nearest = geofences[0];
  let minDistance = calculateDistance(point, nearest);

  for (let i = 1; i < geofences.length; i++) {
    const distance = calculateDistance(point, geofences[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = geofences[i];
    }
  }

  return {
    geofence: nearest,
    distance: minDistance,
  };
}

/**
 * Check if a point is within ANY of the provided geofences
 *
 * @param point - Point to check
 * @param geofences - Array of geofence locations
 * @returns true if point is within any geofence, false otherwise
 */
export function isWithinAnyGeofence(
  point: Coordinates,
  geofences: GeofenceLocation[]
): boolean {
  return geofences.some((geofence) => isWithinGeofence(point, geofence));
}

/**
 * Validate GPS coordinates
 *
 * @param coords - Coordinates to validate
 * @returns true if coordinates are valid, false otherwise
 */
export function areValidCoordinates(coords: Coordinates): boolean {
  return (
    typeof coords.latitude === "number" &&
    typeof coords.longitude === "number" &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

/**
 * Format distance for display
 *
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "150 m" or "1.2 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
