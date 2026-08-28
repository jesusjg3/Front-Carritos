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
    const lastSentAt = useRef(0);
    const sendingLocation = useRef(false);

    const wasOnline = useRef(false);

    useEffect(() => {
        let isCancelled = false;

        if (!user || user.role !== 'conductor' || !token || !isOnline) {
            stopLocationTracking();
            return;
        }

        wasOnline.current = true;
        startLocationTracking(() => isCancelled);

        return () => {
            isCancelled = true;
            stopLocationTracking();
        };
    }, [user, token, isOnline]);

    const startLocationTracking = async (checkCancelled) => {
        try {
            // Solicitar permisos de ubicación
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setLocationError('Permiso de ubicación denegado');
                console.error('Permiso de ubicación denegado');
                return;
            }

            // Obtener ubicación inicial
            let initialLocation = null;
            try {
                // Usar la última ubicación conocida evita timeouts de Expo
                initialLocation = await Location.getLastKnownPositionAsync();
            } catch (err) {
                console.warn('Error al obtener última ubicación conocida (conductor):', err);
            }

            if (checkCancelled && checkCancelled()) return;

            if (!initialLocation) {
                try {
                    initialLocation = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                } catch (err) {
                    console.error('Error fallback getCurrentPositionAsync:', err);
                    setLocationError('Timeout al obtener la ubicación precisa.');
                    return;
                }
            }
            
            if (checkCancelled && checkCancelled()) return;

            if (initialLocation && initialLocation.coords) {
                const { latitude, longitude } = initialLocation.coords;
                setLocation({ latitude, longitude });
                // Enviamos sin detener la ejecución en caso de que la red local sufra de timeout
                sendLocationToServer(latitude, longitude).catch(err => console.error('Error log catch:', err.message));
            }

            // Configurar seguimiento de ubicación en tiempo real
            const sub = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 3000,
                    distanceInterval: 3,
                },
                async (newLocation) => {
                    if (newLocation.coords.accuracy != null && newLocation.coords.accuracy > 50) {
                        return;
                    }
                    const { latitude, longitude } = newLocation.coords;
                    setLocation({ latitude, longitude });
                    await sendLocationToServer(latitude, longitude);
                }
            );

            if (checkCancelled && checkCancelled()) {
                sub.remove();
            } else {
                watchSubscription.current = sub;
            }

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
            try {
                if (typeof watchSubscription.current.remove === 'function') {
                    watchSubscription.current.remove();
                }
            } catch (e) {
                console.warn('Error removing location subscription:', e);
            }
            watchSubscription.current = null;
        }

        setLocation(null);
        lastSentAt.current = 0;
        // Notificar al servidor que estamos offline solo si somos conductores y estábamos online
        if (user && user.role === 'conductor' && wasOnline.current) {
            wasOnline.current = false;
            setDriverOffline();
        }
    };

    const sendLocationToServer = async (latitude, longitude) => {
        if (!token) return;

        // El GPS puede emitir cada 3 s; no necesitamos una petición HTTP por
        // lectura. Se conserva la alta frecuencia local, pero se sincroniza
        // con el backend como máximo cada 10 s y sin peticiones concurrentes.
        const now = Date.now();
        if (sendingLocation.current || now - lastSentAt.current < 10000) return;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        sendingLocation.current = true;
        lastSentAt.current = now;

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
        } finally {
            sendingLocation.current = false;
        }
    };

    return {
        location,
        locationError,
    };
};
