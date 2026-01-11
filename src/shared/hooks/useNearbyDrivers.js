import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_ROUTES } from '../../Config/Routes';

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

        // Actualizar cada 8 segundos
        pollInterval.current = setInterval(() => {
            fetchNearbyDrivers();
        }, 8000);

        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
                pollInterval.current = null;
            }
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
                    radius: 5, // 5 km de radio
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.data && Array.isArray(response.data.drivers)) {
                setNearbyDrivers(response.data.drivers);
                console.log(`Conductores cercanos encontrados: ${response.data.drivers.length}`);
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
