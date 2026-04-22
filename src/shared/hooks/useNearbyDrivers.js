import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_ROUTES } from '../../Config/Routes';
import { createEcho } from '../../core/services/echo';

/**
 * Hook para obtener conductores cercanos en tiempo real
 * Solo para usuarios pasajeros
 */
export const useNearbyDrivers = (user, token, currentLocation, isActive = true) => {
    const [nearbyDrivers, setNearbyDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const pollInterval = useRef(null);

    useEffect(() => {
        if (!user || user.role !== 'pasajero' || !token || !currentLocation || !isActive) {
            // Limpiar si no cumple condiciones
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
                pollInterval.current = null;
            }
            setNearbyDrivers([]);
            return;
        }

        // Obtener conductores inicialmente
        fetchNearbyDrivers();

        // Crear conexión para escuchar el radar global
        const echo = createEcho(token);
        const channel = echo.channel('drivers.live'); // Canal público

        channel.listen('.DriverGlobalLocationUpdated', (event) => {
            setNearbyDrivers(prev => {
                const driverExists = prev.find(d => d.id === event.driver_id);
                if (driverExists) {
                    return prev.map(d => 
                        d.id === event.driver_id 
                            ? { ...d, lat: event.latitude, lng: event.longitude } 
                            : d
                    );
                }
                // Si preferimos agregarlo porque entró a la zona:
                return [...prev, {
                    id: event.driver_id,
                    lat: event.latitude,
                    lng: event.longitude,
                    name: "Conductor " + event.driver_id
                }];
            });
        });

        // Solo necesitamos limpiar los caídos de vez en cuando (cada 30s en lugar de 3s)
        pollInterval.current = setInterval(() => {
            fetchNearbyDrivers();
        }, 30000);

        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
                pollInterval.current = null;
            }
            if (echo) echo.disconnect();
        };
    }, [user, token, currentLocation, isActive]);

    const fetchNearbyDrivers = async () => {
        if (!currentLocation?.latitude || !currentLocation?.longitude) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(API_ROUTES.NEARBY_DRIVERS, {
                params: {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    radius: 10, // 5 km de radio
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.data && Array.isArray(response.data.drivers)) {
                setNearbyDrivers(response.data.drivers);
            } else {
                setNearbyDrivers([]);
            }
        } catch (err) {
            console.error('Error al obtener conductores cercanos:', err.response?.data || err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        nearbyDrivers,
        loading,
        error,
        refresh: fetchNearbyDrivers,
    };
};
