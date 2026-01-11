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
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000, // Actualizar cada 5 segundos
                    distanceInterval: 10, // O cuando se mueva 10 metros
                },
                (newLocation) => {
                    const { latitude, longitude } = newLocation.coords;
                    setLocation({ latitude, longitude });
                    console.log('Nueva ubicación del conductor:', { latitude, longitude });
                }
            );

            // Enviar ubicación al servidor cada 10 segundos
            updateInterval.current = setInterval(async () => {
                const currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                const { latitude, longitude } = currentLocation.coords;
                await sendLocationToServer(latitude, longitude);
            }, 10000);

        } catch (error) {
            console.error('Error al iniciar seguimiento de ubicación:', error);
            setLocationError(error.message);
        }
    };

    const stopLocationTracking = () => {
        if (watchSubscription.current) {
            watchSubscription.current.remove();
            watchSubscription.current = null;
        }
        if (updateInterval.current) {
            clearInterval(updateInterval.current);
            updateInterval.current = null;
        }
        setLocation(null);
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
            console.log('Ubicación enviada al servidor:', { latitude, longitude });
        } catch (error) {
            console.error('Error al enviar ubicación al servidor:', error.response?.data || error.message);
        }
    };

    return {
        location,
        locationError,
    };
};
