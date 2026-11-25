import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { createEcho } from "../../core/services/echo";
import { useAppContext } from "../contexts/AppContext";
import { DRIVER_REQUEST_DISPLAY_MS } from "../../core/constants/timing";
import {
  fetchCurrentActiveTrip,
  acceptTripRequest,
  acceptPassengerRequest,
  rejectPassengerRequest,
  startTripRoute,
  finishTripRoute,
  boardPassenger,
  dropOffPassenger,
  cancelPassengerTrip,
  requestNewTrip,
  cancelTrip as cancelTripRequest,
} from "../../features/dashboard/services/tripApiService";

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

  const appendIncomingRequest = (eventPayload) => {
    setIncomingRequests((previousIncomingRequests) => {
      const eventKey = `${eventPayload.trip_id || eventPayload.trip?.id || "trip"}:${eventPayload.passenger?.id || eventPayload.passenger_id || "passenger"}`;
      const alreadyQueued = previousIncomingRequests.some(
        (requestCandidate) =>
          `${requestCandidate.trip_id || requestCandidate.trip?.id || "trip"}:${requestCandidate.passenger?.id || requestCandidate.passenger_id || "passenger"}` ===
          eventKey,
      );
      return alreadyQueued
        ? previousIncomingRequests
        : [...previousIncomingRequests, eventPayload];
    });
  };

  // Recuperar viaje activo al cargar (State Recovery)
  useEffect(() => {
    const fetchCurrentTrip = async () => {
      if (!user || !token) return;
      try {
        const { ok: isSuccessful, data: currentTripData } =
          await fetchCurrentActiveTrip(token);

        if (isSuccessful && currentTripData?.trip) {
          setActiveTrip(currentTripData.trip);
          // Si el pasajero recupera su viaje y está en REQUESTED, mostramos "Buscando"
          if (
            currentTripData.trip.state?.name === "SOLICITADO" &&
            isPasajero
          ) {
            setIsSearching(true);
          }
        }
      } catch (recoveryError) {
        console.error("Error recovering current trip:", recoveryError);
      }
    };

    fetchCurrentTrip();
  }, [user?.id, token, isPasajero]);

  // Helper para normalizar la estructura del viaje y asegurar coordenadas accesibles
  const normalizeTripData = (tripRecord, extraDriverData = {}) => {
    if (!tripRecord || !tripRecord.driver) return tripRecord;

    // Prioridad: 1. Datos explícitos extra, 2. Coordenadas planas, 3. Objeto location
    const normalizedLatitude = parseFloat(
      extraDriverData.latitude ||
        tripRecord.driver.latitude ||
        tripRecord.driver.location?.latitude ||
        0,
    );
    const normalizedLongitude = parseFloat(
      extraDriverData.longitude ||
        tripRecord.driver.longitude ||
        tripRecord.driver.location?.longitude ||
        0,
    );

    return {
      ...tripRecord,
      driver: {
        ...tripRecord.driver,
        ...extraDriverData,
        location: {
          ...(tripRecord.driver.location || {}),
          latitude: normalizedLatitude,
          longitude: normalizedLongitude,
          last_update:
            extraDriverData.timestamp || new Date().toISOString(),
        },
        // Propiedades raíz normalizadas para la UI
        latitude: normalizedLatitude,
        longitude: normalizedLongitude,
      },
    };
  };

  // 1. Conexión Websocket Global (Echo) - NO DEPENDE DE activeTrip.id
  useEffect(() => {
    // Los conductores reciben solicitudes globales solo cuando están en línea.
    // El pasajero debe mantener Echo conectado aunque isOnline sea falso para
    // poder recibir la aceptación en su canal privado.
    if (token && (isPasajero || isOnline)) {
      const echoClient = createEcho(token);
      setEchoInstance(echoClient);

      if (!isPasajero && isOnline) {
        const driversBroadcastChannel = echoClient.private("drivers");
        driversBroadcastChannel
          .listen(".NewTripRequest", (eventPayload) => {
            const passengersCount =
              eventPayload.passengers_count ||
              eventPayload.passenger_count ||
              1;
            const requestId = eventPayload.id;
            setRequestQueue((previousQueue) => {
              if (
                requestId &&
                previousQueue.some(
                  (requestCandidate) => requestCandidate.id === requestId,
                )
              ) {
                return previousQueue;
              }
              return [
                ...previousQueue,
                {
                  ...eventPayload,
                  expiresAt: Date.now() + DRIVER_REQUEST_DISPLAY_MS,
                  origin:
                    eventPayload.origin_address || "Ubicación desconocida",
                  destination:
                    eventPayload.destination_address || "Destino desconocido",
                  distance: eventPayload.distance
                    ? `${eventPayload.distance} km`
                    : "Calculando...",
                  passengers_count: passengersCount,
                },
              ];
            });

            if (requestId && !requestTimersRef.current.has(requestId)) {
              const timerIdentifier = setTimeout(() => {
                setRequestQueue((previousQueue) =>
                  previousQueue.filter(
                    (requestCandidate) => requestCandidate.id !== requestId,
                  ),
                );
                requestTimersRef.current.delete(requestId);
              }, DRIVER_REQUEST_DISPLAY_MS);
              requestTimersRef.current.set(requestId, timerIdentifier);
            }
          })
          .listen(".TripTaken", (eventPayload) =>
            setRequestQueue((previousQueue) =>
              previousQueue.filter(
                (requestCandidate) => requestCandidate.id !== eventPayload.id,
              ),
            ),
          )
          .listen(".TripCancelled", (eventPayload) => {
            setRequestQueue((previousQueue) =>
              previousQueue.filter(
                (requestCandidate) => requestCandidate.id !== eventPayload.id,
              ),
            );
            setActiveTrip((previousActiveTrip) => {
              if (
                previousActiveTrip &&
                previousActiveTrip.id === eventPayload.id
              ) {
                showAlert(
                  "Viaje Cancelado",
                  "El viaje ha sido cancelado.",
                  "warning",
                );
                setIsSearching(false);
                return null;
              }
              return previousActiveTrip;
            });
          });
      }

      if (user?.id) {
        // Canal específico del pasajero
        if (isPasajero) {
          const passengerChannel = echoClient.private(`passenger.${user.id}`);

          const handleTripUpdate = (eventPayload, statusMessage) => {
            if (tripTimeoutRef.current) {
              clearTimeout(tripTimeoutRef.current);
              tripTimeoutRef.current = null;
            }
            setIsSearching(false);
            setActiveTrip(() => normalizeTripData(eventPayload.trip));
            if (statusMessage === "TripAccepted") {
              showAlert(
                "¡Conductor en camino!",
                "¡Tu conductor va en camino!",
                "success",
              );
            }
          };

          passengerChannel
            .listen(".TripAccepted", (eventPayload) =>
              handleTripUpdate(eventPayload, "TripAccepted"),
            )
            .listen(".TripStarted", (eventPayload) =>
              handleTripUpdate(eventPayload, "TripStarted"),
            )
            .listen(".TripLocationUpdated", (eventPayload) => {
              setActiveTrip((previousActiveTrip) =>
                normalizeTripData(previousActiveTrip, eventPayload),
              );
            })
            .listen(".TripCancelled", (eventPayload) => {
              if (!activeTripIdRef.current) return;
              const incomingTripId =
                eventPayload.trip?.id || eventPayload.id;
              if (
                incomingTripId &&
                activeTripIdRef.current !== incomingTripId
              ) {
                return;
              }

              if (tripTimeoutRef.current) {
                clearTimeout(tripTimeoutRef.current);
                tripTimeoutRef.current = null;
              }
              setActiveTrip(null);
              setIsSearching(false);
              setTripToRate(null);
              setRequestAttempt(0);
              const cancelReasonText =
                eventPayload.reason ||
                eventPayload.trip?.cancel_reason ||
                "El viaje ha sido cancelado por el conductor.";
              showAlert("Viaje Cancelado", cancelReasonText, "info");
            })
            .listen(".PassengerCancelledTrip", (eventPayload) => {
              if (tripTimeoutRef.current) {
                clearTimeout(tripTimeoutRef.current);
                tripTimeoutRef.current = null;
              }
              setActiveTrip(null);
              setTripToRate(null);

              if (
                eventPayload.reason === "auto_retry" &&
                lastRequestParamsRef.current
              ) {
                // Auto-retry silencioso
                requestTrip(
                  lastRequestParamsRef.current.ubicacion,
                  lastRequestParamsRef.current.destinoSeleccionado,
                  lastRequestParamsRef.current.distance,
                  lastRequestParamsRef.current.passengersCount,
                  lastRequestParamsRef.current.customOriginName,
                );
              } else {
                setIsSearching(false);
                setRequestAttempt(0);
                showAlert(
                  "Viaje Cancelado",
                  "El conductor ha cancelado tu solicitud.",
                  "info",
                );
              }
            })
            .listen(".PassengerBoarded", (eventPayload) => {
              setActiveTrip((previousActiveTrip) => {
                if (!previousActiveTrip) return previousActiveTrip;
                return {
                  ...previousActiveTrip,
                  passengers: previousActiveTrip.passengers?.map(
                    (passengerCandidate) =>
                      passengerCandidate.id === eventPayload.passenger_id
                        ? { ...passengerCandidate, status: "boarded" }
                        : passengerCandidate,
                  ),
                };
              });
            })
            .listen(".PassengerDroppedOff", (eventPayload) => {
              if (tripTimeoutRef.current) {
                clearTimeout(tripTimeoutRef.current);
                tripTimeoutRef.current = null;
              }
              setActiveTrip(null);
              setIsSearching(false);
              setRequestAttempt(0);
              showAlert(
                "¡Destino alcanzado!",
                "¡Has llegado a tu destino!",
                "success",
                {
                  onConfirm: () => setTripToRate(eventPayload.trip),
                },
              );
            })
            .listen(".TripFinished", (eventPayload) => {
              if (!activeTripIdRef.current) return;
              const incomingTripId =
                eventPayload.trip?.id || eventPayload.id;
              if (
                incomingTripId &&
                activeTripIdRef.current !== incomingTripId
              ) {
                return;
              }

              if (tripTimeoutRef.current) {
                clearTimeout(tripTimeoutRef.current);
                tripTimeoutRef.current = null;
              }
              setActiveTrip(null);
              setIsSearching(false);
              setRequestAttempt(0);
              showAlert(
                "¡Destino alcanzado!",
                "¡Has llegado a tu destino!",
                "success",
                {
                  onConfirm: () => setTripToRate(eventPayload.trip),
                },
              );
            });
        }

        // Canal específico del conductor para actualizaciones de carpooling
        if (!isPasajero) {
          const driverChannel = echoClient.private(`driver.${user.id}`);

          driverChannel
            .listen(".PassengerJoinRequested", (eventPayload) => {
              appendIncomingRequest(eventPayload);
            })
            .listen(".PassengerCancelledTrip", (eventPayload) => {
              setActiveTrip((previousActiveTrip) => {
                if (!previousActiveTrip) return previousActiveTrip;
                return {
                  ...previousActiveTrip,
                  passengers: previousActiveTrip.passengers?.map(
                    (passengerCandidate) =>
                      passengerCandidate.id === eventPayload.passenger_id
                        ? { ...passengerCandidate, status: "cancelled" }
                        : passengerCandidate,
                  ),
                };
              });
            })
            .listen(".PassengerBoarded", (eventPayload) => {
              setActiveTrip((previousActiveTrip) => {
                if (!previousActiveTrip) return previousActiveTrip;
                return {
                  ...previousActiveTrip,
                  passengers: previousActiveTrip.passengers?.map(
                    (passengerCandidate) =>
                      passengerCandidate.id === eventPayload.passenger_id
                        ? { ...passengerCandidate, status: "boarded" }
                        : passengerCandidate,
                  ),
                };
              });
            })
            .listen(".PassengerDroppedOff", (eventPayload) => {
              setActiveTrip((previousActiveTrip) => {
                if (!previousActiveTrip) return previousActiveTrip;
                return {
                  ...previousActiveTrip,
                  passengers: previousActiveTrip.passengers?.map(
                    (passengerCandidate) =>
                      passengerCandidate.id === eventPayload.passenger_id
                        ? { ...passengerCandidate, status: "dropped_off" }
                        : passengerCandidate,
                  ),
                };
              });
            });
        }
      }

      return () => {
        echoClient.disconnect();
        setEchoInstance(null);
        requestTimersRef.current.forEach((timerIdentifier) =>
          clearTimeout(timerIdentifier),
        );
        requestTimersRef.current.clear();
        if (tripTimeoutRef.current) {
          clearTimeout(tripTimeoutRef.current);
          tripTimeoutRef.current = null;
        }
      };
    } else {
      requestTimersRef.current.forEach((timerIdentifier) =>
        clearTimeout(timerIdentifier),
      );
      requestTimersRef.current.clear();
      if (tripTimeoutRef.current) {
        clearTimeout(tripTimeoutRef.current);
        tripTimeoutRef.current = null;
      }
    }
  }, [token, isOnline, user?.id, isPasajero]);

  // 2. Suscripciones Dinámicas para un Viaje Activo (Ubicación en Tiempo Real)
  useEffect(() => {
    if (!echoInstance || !activeTrip?.id) return;

    const tripChannelName = `trip.${activeTrip.id}`;
    const dynamicTripChannel = echoInstance.private(tripChannelName);

    const isDriverOfThisTrip =
      activeTrip.driver_id === user?.id ||
      activeTrip.driver?.id === user?.id;

    if (!isDriverOfThisTrip) {
      dynamicTripChannel.listen(".TripLocationUpdated", (eventPayload) => {
        setActiveTrip((previousActiveTrip) =>
          normalizeTripData(previousActiveTrip, eventPayload),
        );
      });
    }

    return () => {
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

  // --- ACCIONES DE API DESACOPLADAS ---

  const handleAcceptRequest = async (currentRequest) => {
    if (!currentRequest) return;
    try {
      const {
        ok: isSuccessful,
        status: httpStatus,
        data: responsePayload,
      } = await acceptTripRequest(token, currentRequest.id);

      if (isSuccessful) {
        setRequestQueue((previousQueue) =>
          previousQueue.filter(
            (requestCandidate) =>
              requestCandidate.id !== currentRequest.id,
          ),
        );
        setActiveTrip(responsePayload);
      } else {
        if (httpStatus === 409) {
          showAlert(
            "Viaje No Disponible",
            "Este viaje ya fue tomado por otro conductor.",
            "error",
          );
        } else {
          showAlert(
            "Error",
            "Error al aceptar el viaje: " +
              (responsePayload?.error || "Desconocido"),
            "error",
          );
        }
        setRequestQueue((previousQueue) =>
          previousQueue.filter(
            (requestCandidate) =>
              requestCandidate.id !== currentRequest.id,
          ),
        );
      }
    } catch (connectionError) {
      console.error("Error al aceptar viaje:", connectionError);
      showAlert(
        "Error de Conexión",
        "Error de conexión al aceptar el viaje.",
        "error",
      );
    }
  };

  const handleAcceptPassenger = async () => {
    if (!activeTrip || !incomingRequest) return;
    const passengerId =
      incomingRequest.passenger?.id || incomingRequest.passenger_id;

    try {
      const { ok: isSuccessful, data: responsePayload } =
        await acceptPassengerRequest(token, activeTrip.id, passengerId);

      if (isSuccessful) {
        setActiveTrip(responsePayload);
        setIncomingRequests((previousIncoming) =>
          previousIncoming.slice(1),
        );
        showAlert(
          "Pasajero Aceptado",
          "El pasajero ha sido añadido a tu ruta.",
          "success",
        );
      } else {
        showAlert(
          "Error",
          "No se pudo aceptar al pasajero: " +
            (responsePayload?.error || "Desconocido"),
          "error",
        );
        setIncomingRequests((previousIncoming) =>
          previousIncoming.slice(1),
        );
      }
    } catch (connectionError) {
      console.error("Error accepting passenger:", connectionError);
      showAlert(
        "Error",
        "Hubo un problema al procesar la solicitud.",
        "error",
      );
      setIncomingRequests((previousIncoming) =>
        previousIncoming.slice(1),
      );
    }
  };

  const handleRejectRequest = (requestToReject) => {
    setRequestQueue((previousQueue) => {
      if (!requestToReject?.id) return previousQueue.slice(1);
      return previousQueue.filter(
        (requestCandidate) => requestCandidate.id !== requestToReject.id,
      );
    });
  };

  const rejectPassenger = async (notify = true) => {
    if (!activeTrip || incomingRequests.length === 0) return;
    const currentIncomingRequest = incomingRequests[0];
    const passengerId =
      currentIncomingRequest.passenger?.id ||
      currentIncomingRequest.passenger_id;

    if (!passengerId) {
      setIncomingRequests((previousIncoming) =>
        previousIncoming.slice(1),
      );
      return;
    }

    try {
      const { ok: isSuccessful, data: responsePayload } =
        await rejectPassengerRequest(token, activeTrip.id, passengerId);

      if (isSuccessful) {
        setActiveTrip(responsePayload);
        setIncomingRequests((previousIncoming) =>
          previousIncoming.slice(1),
        );
        if (notify) {
          showAlert(
            "Solicitud Rechazada",
            "Se ha notificado al pasajero.",
            "info",
          );
        }
      } else {
        if (notify) {
          showAlert(
            "Error",
            "Error al rechazar: " +
              (responsePayload?.error || "Desconocido"),
            "error",
          );
        }
        setIncomingRequests((previousIncoming) =>
          previousIncoming.slice(1),
        );
      }
    } catch (connectionError) {
      console.error("Error rejecting passenger:", connectionError);
      if (notify) {
        showAlert(
          "Error",
          "Hubo un problema al procesar la solicitud.",
          "error",
        );
      }
      setIncomingRequests((previousIncoming) =>
        previousIncoming.slice(1),
      );
    }
  };

  const handleRejectPassenger = () => rejectPassenger(true);
  const handleExpirePassenger = () => rejectPassenger(false);

  const handleStartTrip = async () => {
    if (!activeTrip) return;
    try {
      const { ok: isSuccessful, data: responsePayload } =
        await startTripRoute(token, activeTrip.id);

      if (isSuccessful) {
        setActiveTrip(responsePayload);
        showAlert("Viaje Iniciado", "¡Viaje iniciado!", "info");
      } else {
        showAlert(
          "Error",
          "Error al iniciar: " +
            (responsePayload?.error || "Desconocido"),
          "error",
        );
      }
    } catch (connectionError) {
      console.error("Error al iniciar viaje:", connectionError);
      showAlert("Error de Conexión", "Error de conexión.", "error");
    }
  };

  const handleFinishTrip = async () => {
    if (!activeTrip) return;
    try {
      const { ok: isSuccessful, data: responsePayload } =
        await finishTripRoute(token, activeTrip.id);

      if (isSuccessful) {
        const finishedTripInstance = activeTrip;
        resetTripState();
        showAlert(
          "¡Viaje Completado!",
          "¡Viaje finalizado con éxito!",
          "success",
          {
            onConfirm: () => setTripToRate(finishedTripInstance),
          },
        );
      } else {
        showAlert(
          "Error",
          "Error al finalizar: " +
            (responsePayload?.error || "Desconocido"),
          "error",
        );
      }
    } catch (connectionError) {
      console.error("Error al finalizar viaje:", connectionError);
      showAlert("Error de Conexión", "Error de conexión.", "error");
    }
  };

  const handleBoardPassenger = async (passengerId) => {
    if (!activeTrip) return;
    try {
      const { ok: isSuccessful, data: responsePayload } =
        await boardPassenger(token, activeTrip.id, passengerId);

      if (isSuccessful) {
        setActiveTrip(responsePayload);
        showAlert(
          "Pasajero a bordo",
          "El pasajero ha subido al vehículo.",
          "success",
        );
      } else {
        showAlert(
          "Error",
          "Error al subir pasajero: " +
            (responsePayload?.error || "Desconocido"),
          "error",
        );
      }
    } catch (connectionError) {
      console.error("Error al abordar pasajero:", connectionError);
      showAlert("Error de Conexión", "Error de conexión.", "error");
    }
  };

  const handleDropOffPassenger = async (passengerId) => {
    try {
      const { ok: isSuccessful, data: responsePayload } =
        await dropOffPassenger(token, activeTrip.id, passengerId);

      if (!isSuccessful) {
        throw new Error(
          responsePayload?.error || "Error al bajar pasajero",
        );
      }

      setActiveTrip(responsePayload);
      showAlert("Éxito", "Pasajero bajado con éxito", "success");
    } catch (connectionError) {
      console.error("Error bajando pasajero:", connectionError);
      showAlert("Error", connectionError.message, "error");
    }
  };

  const handleCancelPassenger = async (passengerId) => {
    try {
      const { ok: isSuccessful, data: responsePayload } =
        await cancelPassengerTrip(token, activeTrip.id, passengerId);

      if (!isSuccessful) {
        throw new Error(
          responsePayload?.error || "Error al cancelar pasajero",
        );
      }

      setActiveTrip(responsePayload);
      showAlert("Éxito", "Pasajero cancelado", "success");
    } catch (connectionError) {
      console.error("Error cancelando pasajero:", connectionError);
      showAlert("Error", connectionError.message, "error");
    }
  };

  const requestTrip = async (
    ubicacion,
    destinoSeleccionado,
    distance,
    passengersCount = 1,
    customOriginName = null,
  ) => {
    try {
      setRequestAttempt((previousAttempt) => previousAttempt + 1);

      setLastRequestParams({
        ubicacion,
        destinoSeleccionado,
        distance,
        passengersCount,
        customOriginName,
      });

      let originAddress = customOriginName || "Mi Ubicación Actual";

      if (originAddress === "Mi Ubicación Actual") {
        try {
          const [geocodeResult] = await Location.reverseGeocodeAsync({
            latitude: ubicacion.latitude,
            longitude: ubicacion.longitude,
          });
          if (geocodeResult) {
            const addressParts = [];
            if (geocodeResult.street) {
              addressParts.push(
                `${geocodeResult.street} ${geocodeResult.streetNumber || ""}`.trim(),
              );
            } else if (geocodeResult.name) {
              addressParts.push(geocodeResult.name);
            }
            if (geocodeResult.city) addressParts.push(geocodeResult.city);

            if (addressParts.length > 0) {
              originAddress = addressParts.join(", ");
            }
          }
        } catch (geocodeError) {
          console.warn(
            "Error al obtener dirección del pasajero:",
            geocodeError,
          );
        }
      }

      const tripCreationPayload = {
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

      const {
        ok: isSuccessful,
        status: httpStatus,
        data: responsePayload,
      } = await requestNewTrip(token, tripCreationPayload);

      if (httpStatus === 429) {
        setIsSearching(false);
        showAlert(
          "Límite de solicitudes",
          "Estás haciendo demasiadas solicitudes muy rápido. Por favor, espera un minuto e inténtalo de nuevo.",
          "error",
        );
        return false;
      }

      if (isSuccessful) {
        setLastRequestParams((previousParams) => ({
          ...previousParams,
          tripId: responsePayload.id,
        }));

        setIsSearching(true);

        const timeoutIdentifier = setTimeout(() => {
          setIsSearching(false);

          // Notificar al backend que expiró la búsqueda de manera silenciosa
          cancelTripRequest(token, responsePayload.id).catch(
            (silentCancelError) =>
              console.log(
                "Silently failed to cancel expired trip:",
                silentCancelError,
              ),
          );

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
        }, 60000); // 1 minuto

        tripTimeoutRef.current = timeoutIdentifier;
        return true;
      } else {
        showAlert(
          "Error al solicitar",
          "Error al solicitar viaje: " +
            (responsePayload?.message || "Desconocido"),
          "error",
        );
        setRequestAttempt(0);
        return false;
      }
    } catch (connectionError) {
      console.error(
        "Error en la petición de solicitar viaje:",
        connectionError,
      );
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

      if (tripIdToCancel) {
        const { ok: isSuccessful } = await cancelTripRequest(
          token,
          tripIdToCancel,
          reason,
        );
        if (!isSuccessful) {
          console.error("Error al cancelar el viaje en el servidor.");
        }
      }

      setActiveTrip(null);
      setIsSearching(false);
      setRequestAttempt(0);
      setLastRequestParams(null);
    } catch (connectionError) {
      console.error("Error al cancelar:", connectionError);
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
