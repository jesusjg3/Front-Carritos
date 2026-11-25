import { GEOLOCATION_CONSTANTS } from "../constants/dashboardConstants";

/**
 * Calcula la distancia ortodrómica en kilómetros entre dos coordenadas geográficas
 * utilizando la fórmula de Haversine.
 */
export function calculateDistanceBetweenCoordinates(
  startLatitude,
  startLongitude,
  targetLatitude,
  targetLongitude,
) {
  const earthRadiusKilometers = GEOLOCATION_CONSTANTS.EARTH_RADIUS_KM;
  const latitudeDeltaRadians =
    ((targetLatitude - startLatitude) * Math.PI) / 180;
  const longitudeDeltaRadians =
    ((targetLongitude - startLongitude) * Math.PI) / 180;

  const haversineComponent =
    Math.sin(latitudeDeltaRadians / 2) * Math.sin(latitudeDeltaRadians / 2) +
    Math.cos((startLatitude * Math.PI) / 180) *
      Math.cos((targetLatitude * Math.PI) / 180) *
      Math.sin(longitudeDeltaRadians / 2) *
      Math.sin(longitudeDeltaRadians / 2);

  const angularDistanceRadians =
    2 *
    Math.atan2(
      Math.sqrt(haversineComponent),
      Math.sqrt(1 - haversineComponent),
    );

  const calculatedDistanceKilometers =
    earthRadiusKilometers * angularDistanceRadians;

  return parseFloat(calculatedDistanceKilometers.toFixed(2));
}

/**
 * Determina el nombre del hito o edificio más cercano a la ubicación del usuario
 * si se encuentra dentro del umbral de proximidad especificado.
 */
export function resolveNearestOriginAddress(
  currentLatitude,
  currentLongitude,
  destinationsList,
  thresholdKilometers = GEOLOCATION_CONSTANTS.NEARBY_DESTINATION_THRESHOLD_KM,
) {
  const defaultOriginName = "Mi Ubicación Actual";
  if (!destinationsList || destinationsList.length === 0) {
    return defaultOriginName;
  }

  let minimumDistanceKilometers = Infinity;
  let nearestDestinationItem = null;

  destinationsList.forEach((destinationCandidate) => {
    const candidateDistanceKilometers = calculateDistanceBetweenCoordinates(
      currentLatitude,
      currentLongitude,
      destinationCandidate.latitude,
      destinationCandidate.longitude,
    );

    if (candidateDistanceKilometers < minimumDistanceKilometers) {
      minimumDistanceKilometers = candidateDistanceKilometers;
      nearestDestinationItem = destinationCandidate;
    }
  });

  if (
    nearestDestinationItem &&
    minimumDistanceKilometers <= thresholdKilometers
  ) {
    const landmarkName =
      nearestDestinationItem.nombre || nearestDestinationItem.name;
    return `Cerca de ${landmarkName}`;
  }

  return defaultOriginName;
}

/**
 * Valida si las coordenadas proporcionadas se encuentran dentro del perímetro
 * autorizado del campus universitario.
 */
export function validateCampusGeofence(currentLatitude, currentLongitude) {
  const campusCenterLatitude = parseFloat(
    process.env.EXPO_PUBLIC_CAMPUS_CENTER_LAT,
  );
  const campusCenterLongitude = parseFloat(
    process.env.EXPO_PUBLIC_CAMPUS_CENTER_LNG,
  );
  const campusRadiusKilometers = parseFloat(
    process.env.EXPO_PUBLIC_CAMPUS_RADIUS_KM,
  );

  if (
    isNaN(campusCenterLatitude) ||
    isNaN(campusCenterLongitude) ||
    isNaN(campusRadiusKilometers)
  ) {
    // Si no están configuradas las variables de entorno, no bloquear al usuario
    return { isWithinZone: true, allowedRadiusKilometers: 0 };
  }

  const distanceFromCenterKilometers = calculateDistanceBetweenCoordinates(
    currentLatitude,
    currentLongitude,
    campusCenterLatitude,
    campusCenterLongitude,
  );

  return {
    isWithinZone: distanceFromCenterKilometers <= campusRadiusKilometers,
    allowedRadiusKilometers: campusRadiusKilometers,
    distanceFromCenterKilometers,
  };
}
