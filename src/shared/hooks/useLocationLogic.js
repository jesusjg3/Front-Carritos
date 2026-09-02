import { useState, useRef, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocationLogic = (user, isPasajero) => {
    const [ubicacion, setUbicacion] = useState(null);
    const [permisoUbicacion, setPermisoUbicacion] = useState(false);
    const watchSubscription = useRef(null);

    // Iniciar/limpiar seguimiento cuando el usuario está activo (Pasajero o Conductor)
    useEffect(() => {
        const isConductor = user && user.role === 'conductor';
        if (user && (isPasajero || isConductor)) {
            startWatchingLocation();
        } else {
            stopWatchingLocation();
        }

        return () => {
            stopWatchingLocation();
        };
    }, [user?.role, isPasajero]);


    const startWatchingLocation = async () => {
        try {
            // Solicitar permisos
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                console.warn('Permiso de ubicación denegado');
                setPermisoUbicacion(false);
                return;
            }

            setPermisoUbicacion(true);

            // Obtener ubicación inicial
            let initialLocation = null;
            try {
                // Usar la última ubicación conocida evita timeouts de Expo en internet o móviles lentos
                initialLocation = await Location.getLastKnownPositionAsync();
            } catch (err) {
                console.warn('Error al obtener última ubicación conocida (pasajero):', err);
            }

            if (!initialLocation) {
                try {
                    initialLocation = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced, // Reducir a Balanced para evitar timeout
                    });
                } catch (err) {
                    console.error('Error en fallback de getCurrentPositionAsync:', err);
                }
            }

            if (initialLocation) {
                applyLocationUpdate(initialLocation);
            }

            // Comenzar seguimiento continuo
            if (watchSubscription.current) {
                try {
                    if (typeof watchSubscription.current.remove === 'function') {
                        watchSubscription.current.remove();
                    }
                } catch (e) {
                    console.warn(e);
                }
            }

            watchSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000,
                    distanceInterval: 8,
                },
                (newLocation) => {
                    // Filtrar lecturas de baja precisión (> 15m) para evitar "teletransportes"
                    if (newLocation.coords.accuracy && newLocation.coords.accuracy > 15) {
                        return;
                    }
                    applyLocationUpdate(newLocation);
                }
            );
        } catch (err) {
            console.error('Error al obtener ubicación:', err);
        }
    };

    const stopWatchingLocation = () => {
        if (watchSubscription.current) {
            try {
                if (typeof watchSubscription.current.remove === 'function') {
                    watchSubscription.current.remove();
                }
            } catch (e) {
                console.warn(e);
            }
            watchSubscription.current = null;
        }
    };

    const applyLocationUpdate = (location) => {
        if (!location?.coords) return;

        const { latitude, longitude } = location.coords;
        setUbicacion({ latitude, longitude });
    };

    // Exponer función manual de refresco (compatible con usos anteriores)
    const obtenerUbicacion = () => startWatchingLocation();

    return {
        ubicacion,
        permisoUbicacion,
        obtenerUbicacion
    };
};
