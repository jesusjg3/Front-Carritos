import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_ROUTES } from "../../Config/Routes";
import { createEcho } from "../../core/services/echo";

const RADAR_RADIUS_KM = 10;

const distanceInKm = (from, to) => {
  if (!from || !to) return Infinity;

  const earthRadiusKm = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
  const latitudeOne = (from.latitude * Math.PI) / 180;
  const latitudeTwo = (to.latitude * Math.PI) / 180;
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latitudeOne) * Math.cos(latitudeTwo) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(value)));
};

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
    if (!user || user.role !== "pasajero" || !token || !isActive) {
      setNearbyDrivers([]);
      return;
    }

    // Esta suscripción no debe reiniciarse cada vez que cambia el GPS.
    const echo = createEcho(token);
    const channel = echo.private("drivers.live");

    channel.listen(".DriverGlobalLocationUpdated", (event) => {
      setNearbyDrivers((prev) => {
        const driverId = Number(event.driver_id);
        const latitude = Number(event.latitude);
        const longitude = Number(event.longitude);
        const current = latestLocation.current;
        const isWithinRadar = distanceInKm(current, { latitude, longitude }) <= RADAR_RADIUS_KM;

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          event.vehicle_status === 'maintenance' ||
          event.is_in_event === true ||
          event.is_available === false ||
          !isWithinRadar
        ) {
          return prev.filter((d) => d.id !== driverId);
        }

        const driverExists = prev.find((d) => d.id === driverId);
        if (driverExists) {
          return prev.map((d) =>
            d.id === driverId
              ? {
                  ...d,
                  lat: latitude,
                  lng: longitude,
                  name: event.name || d.name,
                  vehicle: event.vehicle || d.vehicle,
                  last_update: Date.now(),
                }
              : d,
          );
        }
        // Si preferimos agregarlo porque entró a la zona:
        return [
          ...prev,
          {
            id: driverId,
            lat: latitude,
            lng: longitude,
            name: event.name || "Conductor " + driverId,
            vehicle: event.vehicle || null,
            last_update: Date.now(),
          },
        ];
      });
    });

    channel.listen(".DriverOffline", (event) => {
      // Eliminar al conductor del radar inmediatamente cuando se desconecta
      setNearbyDrivers((prev) => prev.filter((d) => d.id !== event.driver_id));
    });

    return () => {
      if (echo) echo.disconnect();
    };
  }, [user, token, isActive]);

  const fetchNearbyDrivers = useCallback(async () => {
    const location = latestLocation.current;
    if (!location?.latitude || !location?.longitude || !token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(API_ROUTES.NEARBY_DRIVERS, {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius: 10,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data && Array.isArray(response.data.drivers)) {
        const mappedDrivers = response.data.drivers.map((d) => ({
          ...d,
          last_update: d.updated_at
            ? new Date(d.updated_at).getTime()
            : Date.now(),
        }));
        setNearbyDrivers((previousDrivers) => {
          const unchanged =
            previousDrivers.length === mappedDrivers.length &&
            mappedDrivers.every((driver) => {
              const previous = previousDrivers.find((item) => item.id === driver.id);
              return previous &&
                previous.latitude === driver.latitude &&
                previous.longitude === driver.longitude &&
                previous.lat === driver.lat &&
                previous.lng === driver.lng &&
                previous.last_update === driver.last_update;
            });

          return unchanged ? previousDrivers : mappedDrivers;
        });
      } else {
        setNearbyDrivers((previousDrivers) => previousDrivers.length ? [] : previousDrivers);
      }
    } catch (err) {
      console.error(
        "Error al obtener conductores cercanos:",
        err.response?.data || err.message,
      );
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const hasLocation = Boolean(
    currentLocation?.latitude && currentLocation?.longitude,
  );

  useEffect(() => {
    if (!user || user.role !== "pasajero" || !token || !isActive || !hasLocation) {
      return;
    }

    fetchNearbyDrivers();
    const refreshInterval = setInterval(fetchNearbyDrivers, 30000);

    return () => clearInterval(refreshInterval);
  }, [user, token, isActive, hasLocation, fetchNearbyDrivers]);

  // Limpieza local independiente del currentLocation para que no se reinicie el intervalo
  useEffect(() => {
    if (!isActive) return;

    const cleanupInterval = setInterval(() => {
      setNearbyDrivers((prev) => {
        const next = prev.filter((d) => {
          // Si no tiene last_update (vino del fetch inicial), lo conservamos momentaneamente
          const lastUpdate = d.last_update || Date.now();
          // Aumentamos a 10 minutos (600000ms) para que no desaparezca si minimiza la app
          return Date.now() - lastUpdate < 600000;
        });
        return next.length === prev.length ? prev : next;
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
