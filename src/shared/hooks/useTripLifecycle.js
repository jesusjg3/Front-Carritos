import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { createEcho } from "../../core/services/echo";
import { API_ROUTES } from "../../Config/Routes";
import { useAppContext } from "../contexts/AppContext";
import { DRIVER_REQUEST_DISPLAY_MS } from "../../core/constants/timing";

export const useTripLifecycle = (user, token, isOnline, isPasajero) => {
  const { showAlert } = useAppContext();
  const [requestQueue, setRequestQueue] = useState([]);
  const [echoInstance, setEchoInstance] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);
  const activeTripIdRef = useRef(null);
  
  useEffect(() => {
    activeTripIdRef.current = activeTrip?.id;
  }, [activeTrip?.id]);
  const [lastRequestParams, setLastRequestParams] = useState(null);
  const lastRequestParamsRef = useRef(null);

  useEffect(() => {
    lastRequestParamsRef.current = lastRequestParams;
  }, [lastRequestParams]);
  const [requestAttempt, setRequestAttempt] = useState(0);
  const tripTimeoutRef = useRef(null);
  const [tripToRate, setTripToRate] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const incomingRequest = incomingRequests[0] || null;
  const requestTimersRef = useRef(new Map());

  const appendIncomingRequest = (event) => {
    setIncomingRequests((prev) => {
      const eventKey = `${event.trip_id || event.trip?.id || "trip"}:${event.passenger?.id || event.passenger_id || "passenger"}`;
      const alreadyQueued = prev.some((item) =>
        `${item.trip_id || item.trip?.id || "trip"}:${item.passenger?.id || item.passenger_id || "passenger"}` === eventKey,
      );
      return alreadyQueued ? prev : [...prev, event];
    });
  };

  // Recuperar viaje activo al cargar (State Recovery)
  useEffect(() => {
    const fetchCurrentTrip = async () => {
      if (!user || !token) return;
      try {
        const response = await fetch(`${API_ROUTES.TRIPS}/current`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.trip) {
            setActiveTrip(data.trip);
            // Si el pasajero recupera su viaje y está en REQUESTED, mostramos "Buscando"
            if (data.trip.state?.name === 'SOLICITADO' && isPasajero) {
                setIsSearching(true);
            }
          }
        }
      } catch (error) {
        console.error("Error recovering current trip:", error);
      }
    };

    fetchCurrentTrip();
  }, [user?.id, token, isPasajero]);

  // Helper para normalizar la estructura del viaje y asegurar coordenadas accesibles
  const normalizeTripData = (trip, extraDriverData = {}) => {
    if (!trip || !trip.driver) return trip;

    // Prioridad: 1. Datos explícitos extra, 2. Coordenadas planas, 3. Objeto location
    const lat = parseFloat(
      extraDriverData.latitude ||
        trip.driver.latitude ||
        trip.driver.location?.latitude ||
        0,
    );
    const lng = parseFloat(
      extraDriverData.longitude ||
        trip.driver.longitude ||
        trip.driver.location?.longitude ||
        0,
    );

    return {
      ...trip,
      driver: {
        ...trip.driver,
        ...extraDriverData,
        location: {
          ...(trip.driver.location || {}),
          latitude: lat,
          longitude: lng,
          last_update: extraDriverData.timestamp || new Date().toISOString(),
        },
        // Propiedades raíz normalizadas para la UI
        latitude: lat,
        longitude: lng,
      },
    };
  };

  // 1. Conexión Websocket Global (Echo) - NO DEPENDE DE activeTrip.id
  useEffect(() => {
    // Los conductores reciben solicitudes globales solo cuando están en línea.
    // El pasajero debe mantener Echo conectado aunque isOnline sea falso para
    // poder recibir la aceptación en su canal privado.
    if (token && (isPasajero || isOnline)) {
      const echo = createEcho(token);
      setEchoInstance(echo);

      if (!isPasajero && isOnline) {
        const channel = echo.private("drivers");
        channel
        .listen(".NewTripRequest", (event) => {
          const passengersCount =
            event.passengers_count || event.passenger_count || 1;
          const requestId = event.id;
          setRequestQueue((prev) => {
            if (requestId && prev.some((request) => request.id === requestId)) return prev;
            return [
              ...prev,
              {
                ...event,
                expiresAt: Date.now() + DRIVER_REQUEST_DISPLAY_MS,
                origin: event.origin_address || "Ubicación desconocida",
                destination: event.destination_address || "Destino desconocido",
                distance: event.distance
                  ? `${event.distance} km`
                  : "Calculando...",
                passengers_count: passengersCount,
              },
            ];
          });

          if (requestId && !requestTimersRef.current.has(requestId)) {
            const timer = setTimeout(() => {
              setRequestQueue((prev) => prev.filter((request) => request.id !== requestId));
              requestTimersRef.current.delete(requestId);
            }, DRIVER_REQUEST_DISPLAY_MS);
            requestTimersRef.current.set(requestId, timer);
          }
        })
        .listen(".TripTaken", (event) =>
          setRequestQueue((prev) => prev.filter((req) => req.id != event.id)),
        )
        .listen(".TripCancelled", (event) => {
          setRequestQueue((prev) => prev.filter((req) => req.id != event.id));
          setActiveTrip((prev) => {
            if (prev && prev.id == event.id) {
              showAlert(
                "Viaje Cancelado",
                "El viaje ha sido cancelado.",
                "warning",
              );
              setIsSearching(false);
              return null;
            }
            return prev;
          });
        });
      }

      if (user?.id) {
        // Passenger specific channel
        if (isPasajero) {
          const passengerChannel = echo.private(`passenger.${user.id}`);
          
          const handleTripUpdate = (event, statusMsg) => {
            if (tripTimeoutRef.current) {
              clearTimeout(tripTimeoutRef.current);
              tripTimeoutRef.current = null;
            }
            setIsSearching(false);
            setActiveTrip((prev) => normalizeTripData(event.trip));
            if (statusMsg === "TripAccepted")
              showAlert("¡Conductor en camino!", "¡Tu conductor va en camino!", "success");
          };

          passengerChannel
            .listen(".TripAccepted", (e) => handleTripUpdate(e, "TripAccepted"))
            .listen(".TripStarted", (e) => handleTripUpdate(e, "TripStarted"))
            .listen(".TripLocationUpdated", (event) => {
              setActiveTrip((prev) => normalizeTripData(prev, event));
            })
            .listen(".TripCancelled", (event) => {
              if (!activeTripIdRef.current) return;
              const incomingId = event.trip?.id || event.id;
              if (incomingId && activeTripIdRef.current !== incomingId) return;

              if (tripTimeoutRef.current) {
                clearTimeout(tripTimeoutRef.current);
                tripTimeoutRef.current = null;
              }
              setActiveTrip(null);
              setIsSearching(false);
              setTripToRate(null);
              setRequestAttempt(0);
              const motivo = event.reason || event.trip?.cancel_reason || "El viaje ha sido cancelado por el conductor.";
              showAlert("Viaje Cancelado", motivo, "info");
            })
            .listen(".PassengerCancelledTrip", (event) => {
              if (tripTimeoutRef.current) {
                clearTimeout(tripTimeoutRef.current);
                tripTimeoutRef.current = null;
              }
              setActiveTrip(null);
              setTripToRate(null);
              
              if (event.reason === 'auto_retry' && lastRequestParamsRef.current) {
                // Auto-retry silently
                requestTrip(
                  lastRequestParamsRef.current.ubicacion,
                  lastRequestParamsRef.current.destinoSeleccionado,
                  lastRequestParamsRef.current.distance,
                  lastRequestParamsRef.current.passengersCount,
                  lastRequestParamsRef.current.customOriginName
                );
              } else {
                setIsSearching(false);
                setRequestAttempt(0);
                showAlert("Viaje Cancelado", "El conductor ha cancelado tu solicitud.", "info");
              }
            })
            .listen(".PassengerBoarded", (event) => {
              setActiveTrip((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  passengers: prev.passengers?.map(p => 
                    p.id === event.passenger_id ? { ...p, status: 'boarded' } : p
                  )
                };
              });
            })
            .listen(".PassengerDroppedOff", (event) => {
              if (tripTimeoutRef.current) {
                clearTimeout(tripTimeoutRef.current);
                tripTimeoutRef.current = null;
              }
              setActiveTrip(null);
              setIsSearching(false);
              setRequestAttempt(0);
              showAlert("¡Destino alcanzado!", "¡Has llegado a tu destino!", "success", {
                onConfirm: () => setTripToRate(event.trip)
              });
            })
            .listen(".TripFinished", (event) => {
              if (!activeTripIdRef.current) return;
              const incomingId = event.trip?.id || event.id;
              if (incomingId && activeTripIdRef.current !== incomingId) return;

              if (tripTimeoutRef.current) {
                clearTimeout(tripTimeoutRef.current);
                tripTimeoutRef.current = null;
              }
              setActiveTrip(null);
              setIsSearching(false);
              setRequestAttempt(0);
              showAlert("¡Destino alcanzado!", "¡Has llegado a tu destino!", "success", {
                onConfirm: () => setTripToRate(event.trip)
              });
            });
        }
        
        // Driver specific channel for carpooling updates
        if (!isPasajero) {
          const driverChannel = echo.private(`driver.${user.id}`);
          
          driverChannel
            .listen(".PassengerJoinRequested", (event) => {
              appendIncomingRequest(event);
            })
            .listen(".PassengerCancelledTrip", (event) => {
              setActiveTrip((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  passengers: prev.passengers?.map(p => 
                    p.id === event.passenger_id ? { ...p, status: 'cancelled' } : p
                  )
                };
              });
            })
            .listen(".PassengerBoarded", (event) => {
              setActiveTrip((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  passengers: prev.passengers?.map(p => 
                    p.id === event.passenger_id ? { ...p, status: 'boarded' } : p
                  )
                };
              });
            })
            .listen(".PassengerDroppedOff", (event) => {
              setActiveTrip((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  passengers: prev.passengers?.map(p => 
                    p.id === event.passenger_id ? { ...p, status: 'dropped_off' } : p
                  )
                };
              });
            });
        }
      }

      return () => {
        echo.disconnect();
        setEchoInstance(null);
        requestTimersRef.current.forEach((timer) => clearTimeout(timer));
        requestTimersRef.current.clear();
        if (tripTimeoutRef.current) {
          clearTimeout(tripTimeoutRef.current);
          tripTimeoutRef.current = null;
        }
      };
    } else {
      requestTimersRef.current.forEach((timer) => clearTimeout(timer));
      requestTimersRef.current.clear();
      if (tripTimeoutRef.current) {
        clearTimeout(tripTimeoutRef.current);
        tripTimeoutRef.current = null;
      }
    }
  }, [token, isOnline, user?.id, isPasajero]); // ¡Independiente de activeTrip!

  // 2. Suscripciones Dinámicas para un Viaje Activo (Ubicación en Tiempo Real)
  useEffect(() => {
    if (!echoInstance || !activeTrip?.id) return;

    const tripChannelName = `trip.${activeTrip.id}`;
    const channel = echoInstance.private(tripChannelName);

    const isDriverOfThisTrip = activeTrip.driver_id === user?.id || activeTrip.driver?.id === user?.id;

    // Solo necesitamos escuchar actualizaciones si NO somos el conductor de este viaje
    // (incluso si nuestra cuenta global es de tipo "conductor", podemos pedir un viaje como pasajero)
    if (!isDriverOfThisTrip) {
      channel.listen(".TripLocationUpdated", (event) => {
        setActiveTrip((prev) => normalizeTripData(prev, event));
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
      const response = await fetch(
        `${API_ROUTES.TRIPS}/${currentRequest.id}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );
      const data = await response.json();

      if (response.ok) {
        setRequestQueue((prev) =>
          prev.filter((request) => request.id !== currentRequest.id),
        );
        setActiveTrip(data);
      } else {
        if (response.status === 409)
          showAlert(
            "Viaje No Disponible",
            "Este viaje ya fue tomado por otro conductor.",
            "error",
          );
        else
          showAlert(
            "Error",
            "Error al aceptar el viaje: " + (data.error || "Desconocido"),
            "error",
          );
        setRequestQueue((prev) =>
          prev.filter((request) => request.id !== currentRequest.id),
        );
      }
    } catch (error) {
      console.error(error);
      showAlert(
        "Error de Conexión",
        "Error de conexión al aceptar el viaje.",
        "error",
      );
    }
  };

  const handleAcceptPassenger = async () => {
    if (!activeTrip || !incomingRequest) return;
    const passengerId = incomingRequest.passenger?.id || incomingRequest.passenger_id;

    try {
      const response = await fetch(
        `${API_ROUTES.TRIPS}/${activeTrip.id}/accept-passenger`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ passenger_id: passengerId })
        }
      );
      const data = await response.json();

      if (response.ok) {
        setActiveTrip(data);
        setIncomingRequests((prev) => prev.slice(1));
        showAlert("Pasajero Aceptado", "El pasajero ha sido añadido a tu ruta.", "success");
      } else {
        showAlert("Error", "No se pudo aceptar al pasajero: " + (data.error || "Desconocido"), "error");
        setIncomingRequests((prev) => prev.slice(1));
      }
    } catch (error) {
      console.error("Error accepting passenger:", error);
      showAlert("Error", "Hubo un problema al procesar la solicitud.", "error");
      setIncomingRequests((prev) => prev.slice(1));
    }
  };

  const handleRejectRequest = (requestToReject) => {
    setRequestQueue((prev) => {
      if (!requestToReject?.id) return prev.slice(1);
      return prev.filter((request) => request.id !== requestToReject.id);
    });
  };

  const rejectPassenger = async (notify = true) => {
    if (!activeTrip || incomingRequests.length === 0) return;
    const incomingRequest = incomingRequests[0];
    const passengerId = incomingRequest.passenger?.id || incomingRequest.passenger_id;
    if (!passengerId) {
      setIncomingRequests((prev) => prev.slice(1));
      return;
    }
    try {
      const response = await fetch(
        `${API_ROUTES.TRIPS}/${activeTrip.id}/reject-passenger/${passengerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setActiveTrip(data);
        setIncomingRequests((prev) => prev.slice(1));
        if (notify) showAlert("Solicitud Rechazada", "Se ha notificado al pasajero.", "info");
      } else {
        if (notify) showAlert("Error", "Error al rechazar: " + (data.error || "Desconocido"), "error");
        setIncomingRequests((prev) => prev.slice(1));
      }
    } catch (error) {
      console.error("Error rejecting passenger:", error);
      if (notify) showAlert("Error", "Hubo un problema al procesar la solicitud.", "error");
      setIncomingRequests((prev) => prev.slice(1));
    }
  };

  const handleRejectPassenger = () => rejectPassenger(true);
  const handleExpirePassenger = () => rejectPassenger(false);

  const handleStartTrip = async () => {
    if (!activeTrip) return;
    try {
      const response = await fetch(
        `${API_ROUTES.TRIPS}/${activeTrip.id}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      if (response.ok) {
        setActiveTrip(data);
        showAlert("Viaje Iniciado", "¡Viaje iniciado!", "info");
      } else {
        showAlert(
          "Error",
          "Error al iniciar: " + (data.error || "Desconocido"),
          "error",
        );
      }
    } catch (error) {
      console.error(error);
      showAlert("Error de Conexión", "Error de conexión.", "error");
    }
  };

  const handleFinishTrip = async () => {
    if (!activeTrip) return;
    try {
      const response = await fetch(
        `${API_ROUTES.TRIPS}/${activeTrip.id}/finish`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      if (response.ok) {
        const finishedTrip = activeTrip;
        resetTripState();
        showAlert(
          "¡Viaje Completado!",
          "¡Viaje finalizado con éxito!",
          "success",
          {
            onConfirm: () => setTripToRate(finishedTrip)
          }
        );
      } else {
        showAlert(
          "Error",
          "Error al finalizar: " + (data.error || "Desconocido"),
          "error",
        );
      }
    } catch (error) {
      console.error(error);
      showAlert("Error de Conexión", "Error de conexión.", "error");
    }
  };

  const handleBoardPassenger = async (passengerId) => {
    if (!activeTrip) return;
    try {
      const response = await fetch(
        `${API_ROUTES.TRIPS}/${activeTrip.id}/board/${passengerId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      if (response.ok) {
        setActiveTrip(data);
        showAlert(
          "Pasajero a bordo",
          "El pasajero ha subido al vehículo.",
          "success",
        );
      } else {
        showAlert(
          "Error",
          "Error al subir pasajero: " + (data.error || "Desconocido"),
          "error",
        );
      }
    } catch (error) {
      console.error(error);
      showAlert("Error de Conexión", "Error de conexión.", "error");
    }
  };

  const handleDropOffPassenger = async (passengerId) => {
    try {
      const response = await fetch(
        `${API_ROUTES.TRIPS}/${activeTrip.id}/dropoff/${passengerId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al bajar pasajero");
      }

      const data = await response.json();
      setActiveTrip(data);
      showAlert("Éxito", "Pasajero bajado con éxito", "success");
    } catch (error) {
      console.error("Error bajando pasajero:", error);
      showAlert("Error", error.message, "error");
    }
  };

  const handleCancelPassenger = async (passengerId) => {
    try {
      const response = await fetch(
        `${API_ROUTES.TRIPS}/${activeTrip.id}/cancel-passenger/${passengerId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al cancelar pasajero");
      }

      const data = await response.json();
      setActiveTrip(data);
      showAlert("Éxito", "Pasajero cancelado", "success");
    } catch (error) {
      console.error("Error cancelando pasajero:", error);
      showAlert("Error", error.message, "error");
    }
  };

  const requestTrip = async (
    ubicacion,
    destinoSeleccionado,
    distance,
    passengersCount = 1,
    customOriginName = null
  ) => {
    try {
      // Incrementar contador de intentos
      setRequestAttempt((prev) => prev + 1);

      // Guardar parámetros para reintentos
      setLastRequestParams({
        ubicacion,
        destinoSeleccionado,
        distance,
        passengersCount,
        customOriginName
      });

      let originAddress = customOriginName || "Mi Ubicación Actual";
      
      if (originAddress === "Mi Ubicación Actual") {
        try {
          const [geocode] = await Location.reverseGeocodeAsync({
            latitude: ubicacion.latitude,
            longitude: ubicacion.longitude
          });
          if (geocode) {
            const parts = [];
            if (geocode.street) {
               parts.push(`${geocode.street} ${geocode.streetNumber || ''}`.trim());
            } else if (geocode.name) {
               parts.push(geocode.name);
            }
            if (geocode.city) parts.push(geocode.city);
            
            if (parts.length > 0) {
              originAddress = parts.join(', ');
            }
          }
        } catch (err) {
          console.warn("Error al obtener dirección del pasajero:", err);
        }
      }

      const payload = {
        origin_lat: ubicacion.latitude,
        origin_lng: ubicacion.longitude,
        origin_address: originAddress,
        destination_lat: destinoSeleccionado.latitude,
        destination_lng: destinoSeleccionado.longitude,
        destination_address:
          destinoSeleccionado.name ||
          destinoSeleccionado.nombre ||
          destinoSeleccionado.address ||
          "Destino Desconocido",
        distance: distance,
        passengers_count: passengersCount,
      };

      const response = await fetch(`${API_ROUTES.TRIPS}/request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        setIsSearching(false);
        showAlert(
          "Límite de solicitudes",
          "Estás haciendo demasiadas solicitudes muy rápido. Por favor, espera un minuto e inténtalo de nuevo.",
          "error"
        );
        return;
      }

      const data = await response.json();

      if (response.ok) {
        // UPDATE: Guardar ID del viaje para poder cancelarlo
        setLastRequestParams((prev) => ({ ...prev, tripId: data.id }));

        setIsSearching(true);

        // Configurar timeout de 1 minuto para testing
        const timeout = setTimeout(
          () => {
            // Resetear estado para mostrar mapa
            setIsSearching(false);

            // NOTIFICAR AL BACKEND QUE EXPIRÓ LA BÚSQUEDA
            // Cancelamos la petición en el servidor silenciosamente para que
            // desaparezca de la pantalla de los conductores.
            fetch(`${API_ROUTES.TRIPS}/${data.id}/cancel`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }).catch((e) =>
              console.log("Silently failed to cancel expired trip:", e),
            );

            // Usar el custom showAlert para que tenga callback con dos opciones
            showAlert(
              "Solicitud Expirada",
              "¿Deseas intentar nuevamente?",
              "warning",
              {
                confirmText: "Reintentar",
                cancelText: "No",
                onConfirm: () => {
                  requestTrip(
                    ubicacion,
                    destinoSeleccionado,
                    distance,
                    passengersCount,
                  );
                },
                onCancel: () => {
                  setRequestAttempt(0);
                },
              },
            );
          },
          1 * 60 * 1000,
        ); // 1 minuto

        tripTimeoutRef.current = timeout;
        return true;
      } else {
        showAlert(
          "Error al solicitar",
          "Error al solicitar viaje: " + (data.message || "Desconocido"),
          "error",
        );
        setRequestAttempt(0);
        return false;
      }
    } catch (error) {
      console.error(error);
      showAlert(
        "Error de Conexión",
        "No se pudo conectar con el servidor.",
        "error",
      );
      setRequestAttempt(0);
      return false;
    }
  };

  const cancelTrip = async (reason = null) => {
    try {
      if (tripTimeoutRef.current) {
        clearTimeout(tripTimeoutRef.current);
        tripTimeoutRef.current = null;
      }

      const tripIdToCancel =
        (activeTrip && activeTrip.id) ||
        (lastRequestParams && lastRequestParams.tripId);

      // Si hay una solicitud activa, enviar al backend
      if (tripIdToCancel) {
        const payload = reason ? JSON.stringify({ reason }) : undefined;
        const response = await fetch(
          `${API_ROUTES.TRIPS}/${tripIdToCancel}/cancel`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: payload,
          },
        );

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
    handleAcceptPassenger,
    handleRejectRequest,
    handleRejectPassenger,
    handleExpirePassenger,
    handleStartTrip,
    handleFinishTrip,
    handleBoardPassenger,
    handleDropOffPassenger,
    handleCancelPassenger,
    requestTrip,
    cancelTrip,
    incomingRequest,
    setIncomingRequests,
  };
};
