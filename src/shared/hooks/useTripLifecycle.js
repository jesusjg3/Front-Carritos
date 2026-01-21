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

    // Conexión Websocket (Echo)
    useEffect(() => {
        if (token && (isOnline || isPasajero)) {
            const echo = createEcho(token);
            setEchoInstance(echo);
            
            console.log('Echo connected, subscribing to drivers...');

            const channel = echo.private('drivers');

            channel.listen('.NewTripRequest', (event) => {
                const passengersCount = event.passengers_count || event.passenger_count || 1;
                console.log('NewTripRequest received - passengers_count:', passengersCount, 'event:', event);
                setRequestQueue(prev => [...prev, {
                    ...event,
                    origin: event.origin_address || 'Ubicación desconocida',
                    destination: event.destination_address || 'Destino desconocido',
                    distance: event.distance ? `${event.distance} km` : 'Calculando...',
                    passengers_count: passengersCount
                }]);
            })
            .listen('.TripTaken', (event) => setRequestQueue(prev => prev.filter(req => req.id != event.id)))
            .listen('TripTaken', (event) => setRequestQueue(prev => prev.filter(req => req.id != event.id)))
            .listen('.TripRequestExpired', (event) => {
                setRequestQueue(prev => prev.filter(req => req.id != event.id));
            })
            .listen('.TripRequestCancelled', (event) => {
                setRequestQueue(prev => prev.filter(req => req.id != event.id));
            })
            .listen('.TripCancelled', (event) => {
                setRequestQueue(prev => prev.filter(req => req.id != event.id));
            })
            .listen('.RequestCancelled', (event) => {
                setRequestQueue(prev => prev.filter(req => req.id != event.id || req.trip_request_id != event.trip_request_id));
            });

            // Escuchar canal privado del pasajero
            if (isPasajero && user?.id) {
                const passengerChannel = echo.private(`passenger.${user.id}`);
                console.log(`[TRIP] Pasajero escuchando canal: passenger.${user.id}`);
                
                passengerChannel.listen('.TripAccepted', (event) => {
                    console.log('[TRIP] EVENT RECEIVED: TripAccepted', event);
                    if (tripTimeoutRef.current) {
                        clearTimeout(tripTimeoutRef.current);
                        tripTimeoutRef.current = null;
                    }
                    setIsSearching(false);
                    // Asegurar que driver.location existe si el backend lo proporciona
                    const tripData = {
                        ...event.trip,
                        driver: {
                            ...event.trip.driver,
                            location: event.trip.driver?.location || {
                                latitude: event.trip.driver?.latitude,
                                longitude: event.trip.driver?.longitude
                            }
                        }
                    };
                    setActiveTrip(tripData);
                    alert("¡Tu conductor va en camino!");
                })
                .listen('.TripStarted', (event) => {
                    console.log('[TRIP] EVENT RECEIVED: .TripStarted', event);
                    if (tripTimeoutRef.current) {
                        clearTimeout(tripTimeoutRef.current);
                        tripTimeoutRef.current = null;
                    }
                    setIsSearching(false);
                    const tripData = {
                        ...event.trip,
                        driver: {
                            ...event.trip.driver,
                            location: event.trip.driver?.location || {
                                latitude: event.trip.driver?.latitude,
                                longitude: event.trip.driver?.longitude
                            }
                        }
                    };
                    setActiveTrip(tripData);
                })
                .listen('TripStarted', (event) => {
                    console.log('[TRIP] EVENT RECEIVED: TripStarted', event);
                    if (tripTimeoutRef.current) {
                        clearTimeout(tripTimeoutRef.current);
                        tripTimeoutRef.current = null;
                    }
                    const tripData = {
                        ...event.trip,
                        driver: {
                            ...event.trip.driver,
                            location: event.trip.driver?.location || {
                                latitude: event.trip.driver?.latitude,
                                longitude: event.trip.driver?.longitude
                            }
                        }
                    };
                    setActiveTrip(tripData);
                })
                .listen('.TripFinished', (event) => {
                    console.log('[TRIP] EVENT RECEIVED: .TripFinished', event);
                    if (tripTimeoutRef.current) {
                        clearTimeout(tripTimeoutRef.current);
                        tripTimeoutRef.current = null;
                    }
                    resetTripState();
                    alert("¡Has llegado a tu destino!");
                })
                .listen('TripFinished', (event) => {
                    console.log('[TRIP] EVENT RECEIVED: TripFinished', event);
                    if (tripTimeoutRef.current) {
                        clearTimeout(tripTimeoutRef.current);
                        tripTimeoutRef.current = null;
                    }
                    resetTripState();
                    alert("¡Has llegado a tu destino!");
                });
            }

            // Escuchar ubicación del conductor en tiempo real (para el pasajero)
            if (activeTrip?.id && isPasajero) {
                console.log(`[LOCATION] Pasajero escuchando canal: trip.${activeTrip.id}`);
                const tripChannel = echo.private(`trip.${activeTrip.id}`);
                tripChannel.listen('.DriverLocationUpdated', (event) => {
                    console.log('[LOCATION] EVENT RECEIVED: DriverLocationUpdated', event);
                    setActiveTrip(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            driver: {
                                ...prev.driver,
                                location: {
                                    latitude: event.latitude,
                                    longitude: event.longitude,
                                    last_update: event.timestamp
                                }
                            }
                        };
                    });
                });
            }

            return () => {
                echo.disconnect();
                setEchoInstance(null);
                // Limpiar timeout al desconectar
                if (tripTimeoutRef.current) {
                    clearTimeout(tripTimeoutRef.current);
                    tripTimeoutRef.current = null;
                }
            };
        } else {
            // Si no hay token, limpiar timeout
            if (tripTimeoutRef.current) {
                clearTimeout(tripTimeoutRef.current);
                tripTimeoutRef.current = null;
            }
        }
    }, [token, isOnline, user, isPasajero]);

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
                setIsSearching(true);
                
                // Configurar timeout de 1 minuto para testing
                const timeout = setTimeout(() => {
                    console.log('Solicitud expirada');
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
                                    console.log('Solicitud cancelada por usuario');
                                    setRequestAttempt(0);
                                    // El estado ya está reseteado, solo se cierra el modal
                                },
                                style: 'cancel'
                            },
                            {
                                text: 'Reintentar',
                                onPress: () => {
                                    console.log('Reintentando solicitud...');
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
            
            // Si hay una solicitud activa, enviar al backend
            if (lastRequestParams && lastRequestParams.tripId) {
                const response = await fetch(`${API_ROUTES.TRIPS}/${lastRequestParams.tripId}/cancel`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    console.log('Trip cancelled successfully');
                } else {
                    console.log('Error cancelling trip:', response.status);
                }
            }
            
            setIsSearching(false);
            setRequestAttempt(0);
            setLastRequestParams(null);
        } catch (error) {
            console.log('Error in cancelTrip:', error);
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
