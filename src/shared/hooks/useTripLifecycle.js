import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { createEcho } from '../../core/services/echo';
import { API_ROUTES } from '../../Config/Routes';

export const useTripLifecycle = (user, token, isOnline, isPasajero) => {
    const [requestQueue, setRequestQueue] = useState([]);
    const [echoInstance, setEchoInstance] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTrip, setActiveTrip] = useState(null);
    const [lastRequestParams, setLastRequestParams] = useState(null);
    const [requestAttempt, setRequestAttempt] = useState(0);
    const tripTimeoutRef = useRef(null);
    const [tripToRate, setTripToRate] = useState(null);

    // Helper para normalizar la estructura del viaje y asegurar coordenadas accesibles
    const normalizeTripData = (trip, extraDriverData = {}) => {
        if (!trip || !trip.driver) return trip;

        // Prioridad: 1. Datos explícitos extra, 2. Coordenadas planas, 3. Objeto location
        const lat = parseFloat(extraDriverData.latitude || trip.driver.latitude || trip.driver.location?.latitude || 0);
        const lng = parseFloat(extraDriverData.longitude || trip.driver.longitude || trip.driver.location?.longitude || 0);

        return {
            ...trip,
            driver: {
                ...trip.driver,
                ...extraDriverData,
                location: {
                    ...(trip.driver.location || {}),
                    latitude: lat,
                    longitude: lng,
                    last_update: extraDriverData.timestamp || new Date().toISOString()
                },
                // Propiedades raíz normalizadas para la UI
                latitude: lat,
                longitude: lng
            }
        };
    };

    // 1. Conexión Websocket Global (Echo) - NO DEPENDE DE activeTrip.id
    useEffect(() => {
        if (token && (isOnline || isPasajero)) {
            const echo = createEcho(token);
            setEchoInstance(echo);
            
            const channel = echo.private('drivers');
            channel.listen('.NewTripRequest', (event) => {
                const passengersCount = event.passengers_count || event.passenger_count || 1;
                setRequestQueue(prev => [...prev, {
                    ...event,
                    origin: event.origin_address || 'Ubicación desconocida',
                    destination: event.destination_address || 'Destino desconocido',
                    distance: event.distance ? `${event.distance} km` : 'Calculando...',
                    passengers_count: passengersCount
                }]);
            })
            .listen('.TripTaken', (event) => setRequestQueue(prev => prev.filter(req => req.id != event.id)))
            .listen('.TripRequestExpired', (event) => setRequestQueue(prev => prev.filter(req => req.id != event.id)))
            .listen('.TripRequestCancelled', (event) => setRequestQueue(prev => prev.filter(req => req.id != event.id)))
            .listen('.TripCancelled', (event) => {
                setRequestQueue(prev => prev.filter(req => req.id != event.id));
                setActiveTrip(prev => {
                    if (prev && prev.id == event.id) {
                        alert("El viaje ha sido cancelado.");
                        setIsSearching(false);
                        return null;
                    }
                    return prev;
                });
            })
            .listen('.RequestCancelled', (event) => setRequestQueue(prev => prev.filter(req => req.id != event.id)));

            if (isPasajero && user?.id) {
                const passengerChannel = echo.private(`passenger.${user.id}`);

                const handleTripUpdate = (event, statusMsg) => {
                    if (tripTimeoutRef.current) {
                        clearTimeout(tripTimeoutRef.current);
                        tripTimeoutRef.current = null;
                    }
                    setIsSearching(false);
                    // IMPORTANTE: Aseguramos el updater asíncrono preventivo
                    setActiveTrip(prev => normalizeTripData(event.trip));
                    if (statusMsg === 'TripAccepted') alert("¡Tu conductor va en camino!");
                };

                passengerChannel.listen('.TripAccepted', (e) => handleTripUpdate(e, 'TripAccepted'))
                    .listen('.TripStarted', (e) => handleTripUpdate(e, 'TripStarted'))
                    .listen('TripStarted', (e) => handleTripUpdate(e, 'TripStarted')) 
                    .listen('.TripCancelled', (event) => {
                        if (tripTimeoutRef.current) {
                            clearTimeout(tripTimeoutRef.current);
                            tripTimeoutRef.current = null;
                        }
                        setActiveTrip(null);
                        setIsSearching(false);
                        setRequestAttempt(0);
                        alert("El viaje ha sido cancelado.");
                    })
                    .listen('.TripFinished', (event) => {
                        if (tripTimeoutRef.current) {
                            clearTimeout(tripTimeoutRef.current);
                            tripTimeoutRef.current = null;
                        }
                        setTripToRate(event.trip);
                        // Inline reset
                        setActiveTrip(null);
                        setIsSearching(false);
                        setRequestAttempt(0);
                        alert("¡Has llegado a tu destino!");
                    });
            }

            return () => {
                echo.disconnect();
                setEchoInstance(null);
                if (tripTimeoutRef.current) {
                    clearTimeout(tripTimeoutRef.current);
                    tripTimeoutRef.current = null;
                }
            };
        } else {
            if (tripTimeoutRef.current) {
                clearTimeout(tripTimeoutRef.current);
                tripTimeoutRef.current = null;
            }
        }
    }, [token, isOnline, user, isPasajero]); // ¡Independiente de activeTrip!

    // 2. Suscripciones Dinámicas para un Viaje Activo (Ubicación en Tiempo Real)
    useEffect(() => {
        if (!echoInstance || !activeTrip?.id) return;

        const tripChannelName = `trip.${activeTrip.id}`;
        const channel = echoInstance.private(tripChannelName);

        if (isPasajero) {
            channel.listen('.TripLocationUpdated', (event) => {
                setActiveTrip(prev => normalizeTripData(prev, event));
            });
        } else {
            channel.listen('.DriverLocationUpdated', (event) => {
                setActiveTrip(prev => normalizeTripData(prev, event));
            });
        }

        return () => {
            // Cuando cambie el ID del viaje (o se acabe), en lugar de reiniciar todo Echo, 
            // solo salimos de la sala de escucha de este viaje específico.
            echoInstance.leave(tripChannelName);
        };
    }, [echoInstance, activeTrip?.id, isPasajero]);

    // Limpiar timeout cuando el componente se desmonta
    useEffect(() => {
        return () => {
            if (tripTimeoutRef.current) {
                clearTimeout(tripTimeoutRef.current);
                tripTimeoutRef.current = null;
            }
        };
    }, []);

    const resetTripState = () => {
        setActiveTrip(null);
        setIsSearching(false);
        setRequestAttempt(0);
        if (tripTimeoutRef.current) {
            clearTimeout(tripTimeoutRef.current);
            tripTimeoutRef.current = null;
        }
    };

    // --- ACCIONES DE API ---

    const handleAcceptRequest = async (currentRequest) => {
        if (!currentRequest) return;
        try {
            const response = await fetch(`${API_ROUTES.TRIPS}/${currentRequest.id}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();

            if (response.ok) {
                setRequestQueue(prev => prev.slice(1));
                setActiveTrip(data);
            } else {
                if (response.status === 409) alert("Este viaje ya fue tomado por otro conductor.");
                else alert("Error al aceptar el viaje: " + (data.error || "Desconocido"));
                setRequestQueue(prev => prev.slice(1));
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al aceptar el viaje.");
        }
    };

    const handleRejectRequest = () => {
        setRequestQueue(prev => prev.slice(1));
    };

    const handleStartTrip = async () => {
        if (!activeTrip) return;
        try {
            const response = await fetch(`${API_ROUTES.TRIPS}/${activeTrip.id}/start`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (response.ok) {
                setActiveTrip(data);
                alert("¡Viaje iniciado!");
            } else {
                alert("Error al iniciar: " + (data.error || "Desconocido"));
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        }
    };

    const handleFinishTrip = async () => {
        if (!activeTrip) return;
        try {
            const response = await fetch(`${API_ROUTES.TRIPS}/${activeTrip.id}/finish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (response.ok) {
                resetTripState();
                alert("¡Viaje finalizado con éxito!");
            } else {
                alert("Error al finalizar: " + (data.error || "Desconocido"));
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        }
    };

    const requestTrip = async (ubicacion, destinoSeleccionado, distance, passengersCount = 1) => {
        try {
            // Incrementar contador de intentos
            setRequestAttempt(prev => prev + 1);

            // Guardar parámetros para reintentos
            setLastRequestParams({ ubicacion, destinoSeleccionado, distance, passengersCount });

            const payload = {
                origin_lat: ubicacion.latitude,
                origin_lng: ubicacion.longitude,
                origin_address: 'Mi Ubicación Actual',
                destination_lat: destinoSeleccionado.latitude,
                destination_lng: destinoSeleccionado.longitude,
                destination_address: destinoSeleccionado.address || destinoSeleccionado.nombre,
                distance: distance,
                passengers_count: passengersCount
            };

            const response = await fetch(`${API_ROUTES.TRIPS}/request`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // UPDATE: Guardar ID del viaje para poder cancelarlo
                setLastRequestParams(prev => ({ ...prev, tripId: data.id }));

                setIsSearching(true);

                // Configurar timeout de 1 minuto para testing
                const timeout = setTimeout(() => {
                    // Resetear estado para mostrar mapa
                    setIsSearching(false);

                    // Usar Alert.alert para que tenga callback con dos opciones
                    Alert.alert(
                        'Solicitud Expirada',
                        '¿Deseas intentar nuevamente?',
                        [
                            {
                                text: 'No',
                                onPress: () => {
                                    setRequestAttempt(0);
                                    // El estado ya está reseteado, solo se cierra el modal
                                },
                                style: 'cancel'
                            },
                            {
                                text: 'Reintentar',
                                onPress: () => {
                                    // Hacer nueva solicitud cuando el usuario presiona Reintentar
                                    requestTrip(ubicacion, destinoSeleccionado, distance, passengersCount);
                                }
                            }
                        ]
                    );
                }, 1 * 60 * 1000); // 1 minuto

                tripTimeoutRef.current = timeout;
                return true;
            } else {
                alert("Error al solicitar viaje: " + (data.message || "Desconocido"));
                setRequestAttempt(0);
                return false;
            }
        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor.");
            setRequestAttempt(0);
            return false;
        }
    };


    const cancelTrip = async () => {
        try {
            if (tripTimeoutRef.current) {
                clearTimeout(tripTimeoutRef.current);
                tripTimeoutRef.current = null;
            }

            const tripIdToCancel = (activeTrip && activeTrip.id) || (lastRequestParams && lastRequestParams.tripId);

            // Si hay una solicitud activa, enviar al backend
            if (tripIdToCancel) {
                const response = await fetch(`${API_ROUTES.TRIPS}/${tripIdToCancel}/cancel`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    // Opcionalmente podrías añadir lógica si es exitoso
                } else {
                    console.error("Error al cancelar el viaje en el servidor.");
                }
            }

            setActiveTrip(null);
            setIsSearching(false);
            setRequestAttempt(0);
            setLastRequestParams(null);
        } catch (error) {
            console.error("Error al cancelar:", error);
            setActiveTrip(null);
            setIsSearching(false);
            setRequestAttempt(0);
            setLastRequestParams(null);
        }
    };

    return {
        requestQueue,
        activeTrip,
        isSearching,
        requestAttempt,
        tripToRate,
        setTripToRate,
        setIsSearching,
        setActiveTrip,
        setRequestQueue,
        handleAcceptRequest,
        handleRejectRequest,
        handleStartTrip,
        handleFinishTrip,
        requestTrip,
        cancelTrip
    };
};

