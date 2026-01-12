import { useState, useEffect, useRef } from 'react';
import { createEcho } from '../../core/services/echo';
import { API_ROUTES } from '../../Config/Routes';

export const useTripLifecycle = (user, token, isOnline, isPasajero) => {
    const [requestQueue, setRequestQueue] = useState([]);
    const [echoInstance, setEchoInstance] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTrip, setActiveTrip] = useState(null);
    const [requestAttempt, setRequestAttempt] = useState(1);
    const [lastRequestParams, setLastRequestParams] = useState(null);
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
            };
        }
    }, [token, isOnline, user, isPasajero]);

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
                setRequestAttempt(data.request_attempt || 1);
                
                // Configurar timeout de 5 minutos
                const timeout = setTimeout(() => {
                    console.log('Solicitud expirada, generando nueva automáticamente');
                    // Reintentar automáticamente con los mismos parámetros
                    requestTrip(ubicacion, destinoSeleccionado, distance, passengersCount);
                }, 5 * 60 * 1000); // 5 minutos
                
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


    return {
        requestQueue,
        activeTrip,
        isSearching,
        setIsSearching,
        setActiveTrip,
        setRequestQueue,
        requestAttempt,
        handleAcceptRequest,
        handleRejectRequest,
        handleStartTrip,
        handleFinishTrip,
        requestTrip
    };
};
