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
    const [requestAttempt, setRequestAttempt] = useState(1);
    const tripTimeoutRef = useRef(null);

    // Conexión Websocket (Echo)
    useEffect(() => {
        if (token && (isOnline || isPasajero)) {
            const echo = createEcho(token);
            setEchoInstance(echo);

            console.log('Echo connected, subscribing to drivers...');

            const channel = echo.private('drivers');

            channel.listen('.NewTripRequest', (event) => {
                console.log('EVENT RECEIVED: NewTripRequest', event);
                setRequestQueue(prev => [...prev, {
                    ...event,
                    origin: event.origin_address || 'Ubicación desconocida',
                    destination: event.destination_address || 'Destino desconocido',
                    distance: `${event.distance} km`,
                    passengers_count: event.passengers_count || 1
                }]);
            })
                .listen('.TripTaken', (event) => setRequestQueue(prev => prev.filter(req => req.id != event.id)))
                .listen('TripTaken', (event) => setRequestQueue(prev => prev.filter(req => req.id != event.id)));

            // Escuchar canal privado del pasajero
            if (isPasajero && user?.id) {
                console.log(`Subscribing to private channel: passenger.${user.id}`);
                const passengerChannel = echo.private(`passenger.${user.id}`);

                passengerChannel.listen('.TripAccepted', (event) => {
                    console.log('EVENT RECEIVED: TripAccepted', event);
                    // Limpiar el timeout de reintentos
                    if (tripTimeoutRef.current) {
                        clearTimeout(tripTimeoutRef.current);
                        tripTimeoutRef.current = null;
                    }
                    setIsSearching(false);
                    setActiveTrip(event.trip);
                    alert("¡Tu conductor va en camino!");
                })
                    .listen('.TripStarted', (event) => {
                        console.log('EVENT RECEIVED: .TripStarted', event);
                        // Limpiar el timeout de reintentos
                        if (tripTimeoutRef.current) {
                            clearTimeout(tripTimeoutRef.current);
                            tripTimeoutRef.current = null;
                        }
                        setIsSearching(false);
                        setActiveTrip(event.trip);
                    })
                    .listen('TripStarted', (event) => {
                        if (tripTimeoutRef.current) {
                            clearTimeout(tripTimeoutRef.current);
                            tripTimeoutRef.current = null;
                        }
                        setActiveTrip(event.trip);
                    })
                    .listen('.TripFinished', (event) => {
                        console.log('EVENT RECEIVED: .TripFinished', event);
                        // Limpiar el timeout de reintentos
                        if (tripTimeoutRef.current) {
                            clearTimeout(tripTimeoutRef.current);
                            tripTimeoutRef.current = null;
                        }
                        resetTripState();
                        alert("¡Has llegado a tu destino!");
                    })
                    .listen('TripFinished', (event) => {
                        if (tripTimeoutRef.current) {
                            clearTimeout(tripTimeoutRef.current);
                            tripTimeoutRef.current = null;
                        }
                        resetTripState();
                        alert("¡Has llegado a tu destino!");
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
        setRequestAttempt(1);
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

                    // Usar Alert.alert para que tenga callback
                    Alert.alert(
                        'Solicitud Expirada',
                        '¿Deseas intentar nuevamente?',
                        [
                            {
                                text: 'OK',
                                onPress: () => {
                                    // Hacer nueva solicitud cuando el usuario presiona OK
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
                return false;
            }
        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor.");
            return false;
        }
    };


    const cancelTrip = () => {
        if (tripTimeoutRef.current) {
            clearTimeout(tripTimeoutRef.current);
            tripTimeoutRef.current = null;
        }
        setIsSearching(false);
        setLastRequestParams(null);
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
