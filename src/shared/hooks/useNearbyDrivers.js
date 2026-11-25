import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_ROUTES } from "../../Config/Routes";
import { createEcho } from "../../core/services/echo";
import { DEFAULT_RADAR_RADIUS_KM } from "../../features/dashboard/constants/dashboardConstants";
import { calculateDistanceBetweenCoordinates } from "../../features/dashboard/utils/geoUtils";

const RADAR_RADIUS_KM =
  Number(process.env.EXPO_PUBLIC_RADAR_RADIUS_KM) || DEFAULT_RADAR_RADIUS_KM;

/**
 * Hook para obtener conductores cercanos en tiempo real
 * Solo para usuarios pasajeros
 */
export const useNearbyDrivers = (
  user,
  token,
  currentLocation,
  isActive = true,
) => {
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const latestLocation = useRef(currentLocation);

  useEffect(() => {
    latestLocation.current = currentLocation;
  }, [currentLocation]);

  useEffect(() => {
    if (!user?.id || user.role !== "pasajero" || !token || !isActive) {
      setNearbyDrivers([]);
      return;
    }

    // Esta suscripción no debe reiniciarse cada vez que cambia el GPS.
    const echoInstance = createEcho(token);
    const driversChannel = echoInstance.private("drivers.live");

    driversChannel.listen(".DriverGlobalLocationUpdated", (eventPayload) => {
      setNearbyDrivers((previousDrivers) => {
        const driverId = Number(eventPayload.driver_id);
        const driverLatitude = Number(eventPayload.latitude);
        const driverLongitude = Number(eventPayload.longitude);
        const currentLocationValue = latestLocation.current;

        const isWithinRadar =
          currentLocationValue?.latitude != null &&
          currentLocationValue?.longitude != null
            ? calculateDistanceBetweenCoordinates(
                currentLocationValue.latitude,
                currentLocationValue.longitude,
                driverLatitude,
                driverLongitude,
              ) <= RADAR_RADIUS_KM
            : false;

        if (
          !Number.isFinite(driverLatitude) ||
          !Number.isFinite(driverLongitude) ||
          eventPayload.vehicle_status === "maintenance" ||
          eventPayload.is_in_event === true ||
          eventPayload.is_available === false ||
          !isWithinRadar
        ) {
          return previousDrivers.filter(
            (driverItem) => driverItem.id !== driverId,
          );
        }

        const driverExists = previousDrivers.find(
          (driverItem) => driverItem.id === driverId,
        );
        if (driverExists) {
          return previousDrivers.map((driverItem) =>
            driverItem.id === driverId
              ? {
                  ...driverItem,
                  lat: driverLatitude,
                  lng: driverLongitude,
                  name: eventPayload.name || driverItem.name,
                  vehicle: eventPayload.vehicle || driverItem.vehicle,
                  last_update: Date.now(),
                }
              : driverItem,
          );
        }

        // Si el conductor acaba de ingresar al rango de cobertura del radar
        return [
          ...previousDrivers,
          {
            id: driverId,
            lat: driverLatitude,
            lng: driverLongitude,
            name: eventPayload.name || "Conductor " + driverId,
            vehicle: eventPayload.vehicle || null,
            last_update: Date.now(),
          },
        ];
      });
    });

    driversChannel.listen(".DriverOffline", (eventPayload) => {
      // Eliminar al conductor del radar inmediatamente cuando se desconecta
      setNearbyDrivers((previousDrivers) =>
        previousDrivers.filter(
          (driverItem) => driverItem.id !== eventPayload.driver_id,
        ),
      );
    });

    return () => {
      if (echoInstance) echoInstance.disconnect();
    };
  }, [user?.id, user?.role, token, isActive]);

  const fetchNearbyDrivers = useCallback(async () => {
    const locationCoordinates = latestLocation.current;
    if (
      !locationCoordinates?.latitude ||
      !locationCoordinates?.longitude ||
      !token
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(API_ROUTES.NEARBY_DRIVERS, {
        params: {
          latitude: locationCoordinates.latitude,
          longitude: locationCoordinates.longitude,
          radius: 10,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data && Array.isArray(response.data.drivers)) {
        const mappedDrivers = response.data.drivers.map((driverCandidate) => ({
          ...driverCandidate,
          last_update: driverCandidate.updated_at
            ? new Date(driverCandidate.updated_at).getTime()
            : Date.now(),
        }));

        setNearbyDrivers((previousDrivers) => {
          const unchanged =
            previousDrivers.length === mappedDrivers.length &&
            mappedDrivers.every((driverCandidate) => {
              const previousMatchedDriver = previousDrivers.find(
                (matchedItem) => matchedItem.id === driverCandidate.id,
              );
              return (
                previousMatchedDriver &&
                previousMatchedDriver.latitude === driverCandidate.latitude &&
                previousMatchedDriver.longitude === driverCandidate.longitude &&
                previousMatchedDriver.lat === driverCandidate.lat &&
                previousMatchedDriver.lng === driverCandidate.lng &&
                previousMatchedDriver.last_update ===
                  driverCandidate.last_update
              );
            });

          return unchanged ? previousDrivers : mappedDrivers;
        });
      } else {
        setNearbyDrivers((previousDrivers) =>
          previousDrivers.length ? [] : previousDrivers,
        );
      }
    } catch (errorObject) {
      console.error(
        "Error al obtener conductores cercanos:",
        errorObject.response?.data || errorObject.message,
      );
      setError(errorObject.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const hasLocation = Boolean(
    currentLocation?.latitude && currentLocation?.longitude,
  );

  useEffect(() => {
    if (
      !user?.id ||
      user.role !== "pasajero" ||
      !token ||
      !isActive ||
      !hasLocation
    ) {
      return;
    }

    fetchNearbyDrivers();
    const refreshInterval = setInterval(fetchNearbyDrivers, 30000);

    return () => clearInterval(refreshInterval);
  }, [user?.id, user?.role, token, isActive, hasLocation, fetchNearbyDrivers]);

  // Limpieza local independiente del currentLocation para que no se reinicie el intervalo
  useEffect(() => {
    if (!isActive) return;

    const cleanupInterval = setInterval(() => {
      setNearbyDrivers((previousDrivers) => {
        const nextDrivers = previousDrivers.filter((driverItem) => {
          // Si no tiene last_update (vino del fetch inicial), lo conservamos momentaneamente
          const lastUpdateTimestamp = driverItem.last_update || Date.now();
          // Aumentamos a 10 minutos (600000ms) para que no desaparezca si minimiza la app
          return Date.now() - lastUpdateTimestamp < 600000;
        });
        return nextDrivers.length === previousDrivers.length
          ? previousDrivers
          : nextDrivers;
      });
    }, 15000);

    return () => clearInterval(cleanupInterval);
  }, [isActive]);

  return {
    nearbyDrivers,
    loading,
    error,
    refresh: fetchNearbyDrivers,
  };
};
