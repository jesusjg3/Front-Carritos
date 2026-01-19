import { useState, useRef, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocationLogic = (user, isPasajero, activeTrip) => {
    const [ubicacion, setUbicacion] = useState(null);
    const [permisoUbicacion, setPermisoUbicacion] = useState(false);
    const webViewRef = useRef(null);
    const watchSubscription = useRef(null);
    const hasCenteredRef = useRef(false);

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
    }, [user, isPasajero]);

    // Efecto para dibujar ruta cuando el viaje comienza (estado 4)
    useEffect(() => {
        if (webViewRef.current) {
            if (activeTrip && activeTrip.state_id == 4) {
                const originLat = activeTrip.origin_lat || activeTrip.origin?.lat;
                const originLng = activeTrip.origin_lng || activeTrip.origin?.lng;
                const destLat = activeTrip.destination_lat || activeTrip.destination?.lat;
                const destLng = activeTrip.destination_lng || activeTrip.destination?.lng;

                if (originLat && originLng && destLat && destLng) {
                    console.log('Dibujando ruta en mapa:', { originLat, originLng, destLat, destLng });
                    webViewRef.current.injectJavaScript(`
                        if (typeof drawRoute === 'function') {
                            drawRoute(${originLat}, ${originLng}, ${destLat}, ${destLng});
                        }
                        if (typeof centerMap === 'function') {
                            // Centrar en punto medio o destino
                            centerMap(${destLat}, ${destLng});
                        }
                    `);
                }
            } else {
                // Limpiar ruta si no estamos en viaje en curso (estado 4)
                webViewRef.current.injectJavaScript(`
                    if (typeof clearRoute === 'function') {
                        clearRoute();
                    }
                `);
            }
        }
    }, [activeTrip]);

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
            const initialLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            applyLocationUpdate(initialLocation, true);

            // Comenzar seguimiento continuo
            if (watchSubscription.current) {
                watchSubscription.current.remove();
            }

            watchSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 3000, // cada 3s
                    distanceInterval: 1, // cada 1 metro
                },
                (newLocation) => applyLocationUpdate(newLocation)
            );
        } catch (err) {
            console.error('Error al obtener ubicación:', err);
        }
    };

    const stopWatchingLocation = () => {
        if (watchSubscription.current) {
            watchSubscription.current.remove();
            watchSubscription.current = null;
        }
    };

    const applyLocationUpdate = (location, shouldCenter = false) => {
        if (!location?.coords) return;

        const { latitude, longitude } = location.coords;
        setUbicacion({ latitude, longitude });

        const centerNow = shouldCenter || !hasCenteredRef.current;
        if (centerNow) {
            hasCenteredRef.current = true;
        }

        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
                if (typeof placeUserMarker === 'function') {
                    placeUserMarker(${latitude}, ${longitude}, null, ${user?.role === 'conductor'});
                }
                ${centerNow ? 'if (typeof centerMap === "function") { centerMap(' + latitude + ', ' + longitude + '); }' : ''}
            `);
        }
    };

    // Exponer función manual de refresco (compatible con usos anteriores)
    const obtenerUbicacion = () => startWatchingLocation();

    return {
        ubicacion,
        permisoUbicacion,
        webViewRef,
        obtenerUbicacion
    };
};
