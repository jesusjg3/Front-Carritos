import { useState, useRef, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocationLogic = (user, isPasajero, activeTrip) => {
    const [ubicacion, setUbicacion] = useState(null);
    const [permisoUbicacion, setPermisoUbicacion] = useState(false);
    const webViewRef = useRef(null);

    useEffect(() => {
        if (user && isPasajero) {
            obtenerUbicacion();
        }
    }, [user, isPasajero]);

    // Efecto para dibujar ruta cuando el viaje comienza (estado 4)
    useEffect(() => {
        if (activeTrip && activeTrip.state_id == 4 && webViewRef.current) {
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
        }
    }, [activeTrip]);

    const obtenerUbicacion = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                console.warn('Permiso de ubicación denegado');
                setPermisoUbicacion(false);
                return;
            }

            setPermisoUbicacion(true);

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = location.coords;
            setUbicacion({ latitude, longitude });

            console.log('Ubicación del usuario:', { latitude, longitude });

            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                    if (window.map) {
                        window.map.setView([${latitude}, ${longitude}], 15);
                        L.marker([${latitude}, ${longitude}])
                            .bindPopup('Tu ubicación')
                            .addTo(window.map)
                            .openPopup();
                    }
                `);
            }
        } catch (err) {
            console.error('Error al obtener ubicación:', err);
        }
    };

    return {
        ubicacion,
        permisoUbicacion,
        webViewRef,
        obtenerUbicacion
    };
};
