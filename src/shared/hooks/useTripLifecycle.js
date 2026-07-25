import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { createEcho } from "../../core/services/echo";
import { API_ROUTES } from "../../Config/Routes";
import { useAppContext } from "../contexts/AppContext";

export const useTripLifecycle = (user, token, isOnline, isPasajero) => {
  const { showAlert } = useAppContext();
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
    if (token && (isOnline || isPasajero)) {
      const echo = createEcho(token);
      setEchoInstance(echo);

      const channel = echo.private("drivers");
      channel
        .listen(".NewTripRequest", (event) => {
          const passengersCount =
            event.passengers_count || event.passenger_count || 1;
          setRequestQueue((prev) => [
            ...prev,
            {
              ...event,
              origin: event.origin_address || "Ubicación desconocida",
              destination: event.destination_address || "Destino desconocido",
              distance: event.distance
                ? `${event.distance} km`
                : "Calculando...",
              passengers_count: passengersCount,
            },
          ]);
        })
        .listen(".TripTaken", (event) =>
          setRequestQueue((prev) => prev.filter((req) => req.id != event.id)),
        )
        .listen(".TripRequestExpired", (event) =>
          setRequestQueue((prev) => prev.filter((req) => req.id != event.id)),
        )
        .listen(".TripRequestCancelled", (event) =>
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
        })
        .listen(".RequestCancelled", (event) =>
          setRequestQueue((prev) => prev.filter((req) => req.id != event.id)),
        );

      if (isPasajero && user?.id) {
        const passengerChannel = echo.private(`passenger.${user.id}`);

        const handleTripUpdate = (event, statusMsg) => {
          if (tripTimeoutRef.current) {
            clearTimeout(tripTimeoutRef.current);
            tripTimeoutRef.current = null;
          }
          setIsSearching(false);
          // IMPORTANTE: Aseguramos el updater asíncrono preventivo
          setActiveTrip((prev) => normalizeTripData(event.trip));
          if (statusMsg === "TripAccepted")
            showAlert(
              "¡Conductor en camino!",
              "¡Tu conductor va en camino!",
              "success",
            );
        };

        passengerChannel
          .listen(".TripAccepted", (e) => handleTripUpdate(e, "TripAccepted"))
          .listen(".TripStarted", (e) => handleTripUpdate(e, "TripStarted"))
          .listen("TripStarted", (e) => handleTripUpdate(e, "TripStarted"))
          .listen(".TripCancelled", (event) => {
            if (tripTimeoutRef.current) {
              clearTimeout(tripTimeoutRef.current);
              tripTimeoutRef.current = null;
            }
            setActiveTrip(null);
            setIsSearching(false);
            setRequestAttempt(0);
            showAlert(
              "Viaje Cancelado",
              "El viaje ha sido cancelado.",
              "warning",
            );
          })
          .listen(".TripFinished", (event) => {
            if (tripTimeoutRef.current) {
              clearTimeout(tripTimeoutRef.current);
              tripTimeoutRef.current = null;
            }
            setTripToRate(event.trip);
            // Inline reset
            setActiveTrip(null);
            setIsSearching(false);
            setRequestAttempt(0);
            showAlert(
              "¡Destino alcanzado!",
              "¡Has llegado a tu destino!",
              "success",
            );
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
      channel.listen(".TripLocationUpdated", (event) => {
        setActiveTrip((prev) => normalizeTripData(prev, event));
      });
    } else {
      channel.listen(".DriverLocationUpdated", (event) => {
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
        setRequestQueue((prev) => prev.slice(1));
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
        setRequestQueue((prev) => prev.slice(1));
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

  const handleRejectRequest = () => {
    setRequestQueue((prev) => prev.slice(1));
  };

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
        setTripToRate(finishedTrip);
        showAlert(
          "¡Viaje Completado!",
          "¡Viaje finalizado con éxito!",
          "success",
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
    if (!activeTrip) return;
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
      const data = await response.json();
      if (response.ok) {
        setActiveTrip(data);
        showAlert(
          "Pasajero bajó",
          "El pasajero ha llegado a su destino.",
          "info",
        );
      } else {
        showAlert(
          "Error",
          "Error al bajar pasajero: " + (data.error || "Desconocido"),
          "error",
        );
      }
    } catch (error) {
      console.error(error);
      showAlert("Error de Conexión", "Error de conexión.", "error");
    }
  };

  const requestTrip = async (
    ubicacion,
    destinoSeleccionado,
    distance,
    passengersCount = 1,
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
      });

      const payload = {
        origin_lat: ubicacion.latitude,
        origin_lng: ubicacion.longitude,
        origin_address: "Mi Ubicación Actual",
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
          1 * 60 * 2000,
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

  const cancelTrip = async () => {
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
        const response = await fetch(
          `${API_ROUTES.TRIPS}/${tripIdToCancel}/cancel`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
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
    handleRejectRequest,
    handleStartTrip,
    handleFinishTrip,
    handleBoardPassenger,
    handleDropOffPassenger,
    requestTrip,
    cancelTrip,
  };
};
