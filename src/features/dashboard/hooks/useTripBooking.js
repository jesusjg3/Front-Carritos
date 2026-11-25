import { useState, useCallback } from "react";
import { Alert } from "react-native";
import {
  calculateDistanceBetweenCoordinates,
  resolveNearestOriginAddress,
  validateCampusGeofence,
} from "../utils/geoUtils";
import { GEOFENCE_TEXTS } from "../constants/dashboardConstants";

/**
 * Hook para orquestar la preparación, validación de geocerca y envío de una solicitud de viaje.
 */
export function useTripBooking({
  ubicacion,
  destinos,
  requestTrip,
  showAlert,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState(null);

  const confirmRequestTrip = useCallback(
    async (passengersCount) => {
      if (!destinoSeleccionado || !ubicacion) {
        showAlert(
          GEOFENCE_TEXTS.LOCATION_REQUIRED_TITLE,
          GEOFENCE_TEXTS.LOCATION_REQUIRED_MESSAGE,
          "warning",
        );
        return;
      }

      const geofenceResult = validateCampusGeofence(
        ubicacion.latitude,
        ubicacion.longitude,
      );

      if (!geofenceResult.isWithinZone) {
        Alert.alert(
          GEOFENCE_TEXTS.OUT_OF_ZONE_TITLE,
          `${GEOFENCE_TEXTS.OUT_OF_ZONE_MESSAGE} (${geofenceResult.allowedRadiusKilometers} km).`,
        );
        return;
      }

      let routeDistanceKilometers = calculateDistanceBetweenCoordinates(
        ubicacion.latitude,
        ubicacion.longitude,
        destinoSeleccionado.latitude,
        destinoSeleccionado.longitude,
      );
      if (isNaN(routeDistanceKilometers)) {
        routeDistanceKilometers = 0.0;
      }

      const originAddressName = resolveNearestOriginAddress(
        ubicacion.latitude,
        ubicacion.longitude,
        destinos,
      );

      // Ocultar modal primero para que las alertas globales sean visibles
      setModalVisible(false);

      await requestTrip(
        ubicacion,
        destinoSeleccionado,
        routeDistanceKilometers,
        passengersCount,
        originAddressName,
      );
    },
    [ubicacion, destinoSeleccionado, destinos, requestTrip, showAlert],
  );

  return {
    modalVisible,
    setModalVisible,
    destinoSeleccionado,
    setDestinoSeleccionado,
    confirmRequestTrip,
  };
}
