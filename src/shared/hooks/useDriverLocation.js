import { useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_ROUTES } from '../../Config/Routes';

/**
 * Sincroniza la ubicación del conductor usando la ubicación que ya obtiene
 * useLocationLogic. Mantener un segundo watcher GPS duplicaba el trabajo en
 * Android y provocaba renders innecesarios en InicioScreen.
 */
export const useDriverLocation = (user, token, isOnline, currentLocation) => {
    const lastSentAt = useRef(0);
    const sendingLocation = useRef(false);
    const wasOnline = useRef(false);
    const lastToken = useRef(token);

    if (token) lastToken.current = token;

    const setDriverOffline = useCallback(async () => {
        if (!lastToken.current) return;

        try {
            await axios.post(
                API_ROUTES.SET_DRIVER_OFFLINE,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${lastToken.current}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
        } catch (error) {
            console.error('Error setting driver offline:', error);
        }
    }, []);

    const sendLocationToServer = useCallback(async (latitude, longitude) => {
        if (!token || sendingLocation.current) return;

        // La ubicación local puede cambiar cada 5 s, pero el backend solo
        // necesita una sincronización como máximo cada 10 s.
        const now = Date.now();
        if (now - lastSentAt.current < 10000) return;
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
                },
            );
        } catch (error) {
            console.error('Error al enviar ubicación al servidor:', error.response?.data || error.message);
        } finally {
            sendingLocation.current = false;
        }
    }, [token]);

    useEffect(() => {
        const isConductor = user?.role === 'conductor';
        const canSync = isConductor && Boolean(token) && isOnline;

        if (!canSync) {
            lastSentAt.current = 0;
            if (wasOnline.current) {
                wasOnline.current = false;
                setDriverOffline();
            }
            return;
        }

        wasOnline.current = true;
        if (currentLocation) {
            sendLocationToServer(currentLocation.latitude, currentLocation.longitude);
        }
    }, [currentLocation?.latitude, currentLocation?.longitude, isOnline, sendLocationToServer, setDriverOffline, token, user?.role]);

    useEffect(() => () => {
        if (wasOnline.current) {
            wasOnline.current = false;
            setDriverOffline();
        }
    }, [setDriverOffline]);

    return {
        // Se conserva la salida para compatibilidad, pero ya no es estado
        // propio: una actualización GPS no fuerza otro render adicional.
        location: currentLocation,
        locationError: null,
    };
};
