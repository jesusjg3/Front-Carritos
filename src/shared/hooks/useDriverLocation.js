import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import axios from 'axios';
import { API_ROUTES } from '../../Config/Routes';

/**
 * Hook para gestionar la ubicación del conductor en tiempo real
 * Actualiza la ubicación periódicamente cuando el conductor está online
 */
export const useDriverLocation = (user, token, isOnline) => {
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const watchSubscription = useRef(null);
    const updateInterval = useRef(null);

    useEffect(() => {
        if (!user || user.role !== 'conductor' || !token || !isOnline) {
            // Si no es conductor o está offline, limpiar
            stopLocationTracking();
            return;
        }

        startLocationTracking();

        return () => {
            stopLocationTracking();
        };
    }, [user, token, isOnline]);

    const startLocationTracking = async () => {
        try {
            // Solicitar permisos de ubicación
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setLocationError('Permiso de ubicación denegado');
                console.error('Permiso de ubicación denegado');
                return;
            }

            // Obtener ubicación inicial
            const initialLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = initialLocation.coords;
            setLocation({ latitude, longitude });
            await sendLocationToServer(latitude, longitude);

            // Configurar seguimiento de ubicación en tiempo real
            watchSubscription.current = await Location.watchPositionAsync(
                {
                    // Configuración equilibrada
                    accuracy: Location.Accuracy.High,
                    timeInterval: 3000, // Enviar cada 3 segundos (máximo)
                    distanceInterval: 3, // Solo si se movió 3 metros
                },
                async (newLocation) => {
                    const { latitude, longitude } = newLocation.coords;
                    setLocation({ latitude, longitude });
                    // Enviar al servidor SOLO de forma reactiva al movimiento
                    await sendLocationToServer(latitude, longitude);
                }
            );

        } catch (error) {
            console.error('Error al iniciar seguimiento de ubicación:', error);
            setLocationError(error.message);
        }
    };

    const setDriverOffline = async () => {
        if (!token) return;
        try {
            await axios.post(
                API_ROUTES.SET_DRIVER_OFFLINE,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        } catch (error) {
            console.error('Error setting driver offline:', error);
        }
    };

    const stopLocationTracking = () => {
        if (watchSubscription.current) {
            watchSubscription.current.remove();
            watchSubscription.current = null;
        }

        setLocation(null);
        // Notificar al servidor que estamos offline
        setDriverOffline();
    };

    const sendLocationToServer = async (latitude, longitude) => {
        if (!token) return;

        try {
            await axios.post(
                API_ROUTES.UPDATE_DRIVER_LOCATION,
                { latitude, longitude },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        } catch (error) {
            console.error('Error al enviar ubicación al servidor:', error.response?.data || error.message);
        }
    };

    return {
        location,
        locationError,
    };
};
