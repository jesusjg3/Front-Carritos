import { useRef, useMemo, useEffect, useCallback, useState } from "react";
import { Platform } from "react-native";
import { mapaHtml } from "../../../Web/mapaCode";
import { CARRITO_MARKER_BASE64 } from "../../../Web/carritoMarkerBase64";
import {
  TRIP_STATUS,
  TRIP_STATE_IDS,
  MAP_PADDING,
  MAP_MESSAGE_TYPES,
} from "../constants/dashboardConstants";

/**
 * Convierte cualquier candidato a coordenada a número flotante seguro.
 */
function parseCoordinateValue(numericCandidate) {
  return parseFloat(numericCandidate) || 0;
}

/**
 * Determina si el viaje se encuentra en estado de aceptación (conductor en camino a recoger al pasajero).
 */
function isTripAccepted(trip) {
  if (!trip) return false;
  return (
    trip.status === TRIP_STATUS.ACEPTADO ||
    trip.status === TRIP_STATUS.ACCEPTED ||
    trip.state === TRIP_STATUS.ACCEPTED ||
    trip.state_id === TRIP_STATE_IDS.ACCEPTED
  );
}

/**
 * Determina si el viaje se encuentra en progreso hacia el destino final.
 */
function isTripInProgress(trip) {
  if (!trip) return false;
  return (
    trip.status === TRIP_STATUS.EN_PROGRESO ||
    trip.status === TRIP_STATUS.IN_PROGRESS ||
    trip.state === TRIP_STATUS.IN_PROGRESS ||
    trip.state_id === TRIP_STATE_IDS.IN_PROGRESS
  );
}

/**
 * Determina las coordenadas de inicio y fin para la fase actual del viaje activo.
 * - Fase 1 (Aceptado): Del conductor al punto de recogida del pasajero.
 * - Fase 2 (En progreso): Del conductor (o ubicación actual) al destino acordado.
 */
function resolveTripCoordinates({
  activeTrip,
  isPhase1,
  isPhase2,
  isConductor,
  isPasajero,
  ubicacion,
  nearbyDrivers,
  currentUserId,
}) {
  let startCoordinates = { latitude: 0, longitude: 0 };
  let endCoordinates = { latitude: 0, longitude: 0 };
  let cameraPadding = MAP_PADDING.PHASE_2_DESTINATION;

  if (isPhase1) {
    const passengerRecord = isPasajero
      ? activeTrip?.passengers?.find(
          (passengerItem) => passengerItem.id === currentUserId,
        )
      : null;

    endCoordinates = {
      latitude: parseCoordinateValue(
        passengerRecord?.pickup_lat ||
          activeTrip.origin_lat ||
          activeTrip.origin?.lat,
      ),
      longitude: parseCoordinateValue(
        passengerRecord?.pickup_lng ||
          activeTrip.origin_lng ||
          activeTrip.origin?.lng,
      ),
    };

    if (isConductor) {
      startCoordinates = {
        latitude: parseCoordinateValue(ubicacion?.latitude),
        longitude: parseCoordinateValue(ubicacion?.longitude),
      };
    } else {
      let driverLatitude = parseCoordinateValue(activeTrip.driver?.latitude);
      let driverLongitude = parseCoordinateValue(activeTrip.driver?.longitude);

      if (
        driverLatitude === 0 &&
        driverLongitude === 0 &&
        nearbyDrivers &&
        nearbyDrivers.length > 0
      ) {
        const matchedDriver = nearbyDrivers.find(
          (driverCandidate) => driverCandidate.id == activeTrip.driver?.id,
        );
        if (matchedDriver) {
          driverLatitude = parseCoordinateValue(matchedDriver.latitude);
          driverLongitude = parseCoordinateValue(matchedDriver.longitude);
        }
      }
      startCoordinates = {
        latitude: driverLatitude,
        longitude: driverLongitude,
      };
    }
    cameraPadding = MAP_PADDING.PHASE_1_PICKUP;
  } else if (isPhase2) {
    endCoordinates = {
      latitude: parseCoordinateValue(
        activeTrip.destination_lat || activeTrip.destination?.lat,
      ),
      longitude: parseCoordinateValue(
        activeTrip.destination_lng || activeTrip.destination?.lng,
      ),
    };

    if (isConductor && ubicacion) {
      startCoordinates = {
        latitude: parseCoordinateValue(ubicacion.latitude),
        longitude: parseCoordinateValue(ubicacion.longitude),
      };
    } else {
      startCoordinates = {
        latitude: parseCoordinateValue(activeTrip.driver?.latitude),
        longitude: parseCoordinateValue(activeTrip.driver?.longitude),
      };
    }

    if (startCoordinates.latitude === 0 && ubicacion) {
      startCoordinates = {
        latitude: parseCoordinateValue(ubicacion.latitude),
        longitude: parseCoordinateValue(ubicacion.longitude),
      };
    }
    cameraPadding = MAP_PADDING.PHASE_2_DESTINATION;
  }

  return { startCoordinates, endCoordinates, cameraPadding };
}

/**
 * Construye los waypoints ordenados para la ruta compuesta (carpooling).
 * Solo incluye pasajeros cuyo estado sea 'accepted' para no interferir en la ruta.
 */
function buildCarpoolingWaypoints({
  startCoordinates,
  endCoordinates,
  passengersList,
  originLatitudeFallback,
  originLongitudeFallback,
}) {
  const waypoints = [
    {
      lat: startCoordinates.latitude,
      lng: startCoordinates.longitude,
      title: "Conductor",
    },
  ];

  passengersList.forEach((passengerElement) => {
    let passengerLat = parseFloat(passengerElement.pickup_lat);
    let passengerLng = parseFloat(passengerElement.pickup_lng);
    const passengerStatus = String(passengerElement.status || "").toLowerCase();

    if (isNaN(passengerLat) || isNaN(passengerLng)) {
      passengerLat = parseFloat(originLatitudeFallback);
      passengerLng = parseFloat(originLongitudeFallback);
    }

    if (
      passengerStatus === "accepted" &&
      !isNaN(passengerLat) &&
      !isNaN(passengerLng)
    ) {
      waypoints.push({
        lat: passengerLat,
        lng: passengerLng,
        title: `Recoger a ${passengerElement.name}`,
        type: "pickup",
      });
    }
  });

  waypoints.push({
    lat: endCoordinates.latitude,
    lng: endCoordinates.longitude,
    title: "Destino final",
    type: "destination",
  });

  return waypoints;
}

/**
 * Hook orquestador del cerebro visual de Leaflet.
 * Centraliza la inyección de JavaScript, control de temas, trazado de rutas
 * y manejo de marcadores para todas las fases del Dashboard.
 */
export function useUnifiedMapBrain({
  webViewRef,
  user,
  activeTrip,
  destinoSeleccionado,
  ubicacion,
  nearbyDrivers,
  destinos,
  isConductor,
  isPasajero,
  isOnline,
  theme,
  onDoubleTapDestination,
}) {
  const [mapLoadCount, setMapLoadCount] = useState(0);
  const mapSource = useMemo(() => ({ html: mapaHtml }), []);
  const hasCenteredRef = useRef(false);
  const lastRouteRef = useRef({
    startLat: 0,
    startLng: 0,
    endLat: 0,
    endLng: 0,
    phase: null,
  });

  const passengersSignature = useMemo(
    () =>
      activeTrip?.passengers ? JSON.stringify(activeTrip.passengers) : null,
    [activeTrip?.passengers],
  );

  const mapTheme = useMemo(
    () => ({
      primary: theme.colors.primary,
      primaryDark: theme.colors.primaryContainer,
      pickup: theme.colors.info,
      destination: theme.colors.error,
      markerBorder: theme.colors.surface,
      route: theme.colors.primary,
    }),
    [
      theme.colors.error,
      theme.colors.info,
      theme.colors.primary,
      theme.colors.primaryContainer,
      theme.colors.surface,
    ],
  );
  const mapThemeSignature = useMemo(() => JSON.stringify(mapTheme), [mapTheme]);

  // Limpieza reactiva al terminar o desvincular un viaje
  useEffect(() => {
    if (!activeTrip && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (typeof clearRoute === 'function') clearRoute();
        if (typeof clearDriverMarkers === 'function') clearDriverMarkers();
        if (typeof clearDestinationMarkers === 'function') clearDestinationMarkers();
      `);
    }
  }, [activeTrip, webViewRef]);

  // Sincronización continua entre el estado de React y el motor Leaflet en el WebView
  useEffect(() => {
    if (!webViewRef.current) return;

    const isPhase1 = isTripAccepted(activeTrip);
    const isPhase2 = isTripInProgress(activeTrip);
    const isSelectingDestination =
      isPasajero && destinoSeleccionado && !activeTrip;
    const isIdleMode = !isPhase1 && !isPhase2;

    let injectionScript = "";

    // Sincronizar colores de la paleta solo en plataformas nativas para optimizar rendimiento web
    if (Platform.OS !== "web") {
      injectionScript += `if (typeof setMapTheme === 'function') setMapTheme(${mapThemeSignature});`;
    }

    if (isIdleMode) {
      if (!isSelectingDestination) {
        injectionScript += `if (typeof clearRoute === 'function') clearRoute();`;
      }

      // Reiniciar referencia de ruta anterior para permitir retrazar en el mismo punto
      lastRouteRef.current = {
        startLat: 0,
        startLng: 0,
        endLat: 0,
        endLng: 0,
        phase: null,
      };

      if (isPasajero && nearbyDrivers) {
        const driversPayload = JSON.stringify(nearbyDrivers);
        injectionScript += `
          if (typeof updateNearbyDrivers === 'function') {
            updateNearbyDrivers(${driversPayload});
          }
        `;
      }

      if (isSelectingDestination && ubicacion) {
        injectionScript += `
          if (typeof drawRoute === 'function') {
            drawRoute(${ubicacion.latitude}, ${ubicacion.longitude}, ${destinoSeleccionado.latitude}, ${destinoSeleccionado.longitude}, ${MAP_PADDING.PREVIEW_ROUTE}, ${!hasCenteredRef.current});
          }
        `;
        hasCenteredRef.current = true;
      } else {
        const destinationsPayload = JSON.stringify(destinos || []);
        injectionScript += `
          if (typeof addDestinationMarkers === 'function') addDestinationMarkers(${destinationsPayload});
        `;

        if (ubicacion) {
          const latitudeNumber = parseFloat(ubicacion.latitude) || 0;
          const longitudeNumber = parseFloat(ubicacion.longitude) || 0;
          if (latitudeNumber !== 0 && longitudeNumber !== 0) {
            injectionScript += `
              if (typeof placeUserMarker === 'function') {
                placeUserMarker(${latitudeNumber}, ${longitudeNumber}, null, ${isConductor && isOnline});
              }
              if (typeof centerMap === 'function' && !${hasCenteredRef.current}) {
                centerMap(${latitudeNumber}, ${longitudeNumber});
              }
            `;
            hasCenteredRef.current = true;
          }
        }
      }
    } else {
      // Flujo de viaje activo (Fase 1 de recogida o Fase 2 en tránsito)
      const { startCoordinates, endCoordinates, cameraPadding } =
        resolveTripCoordinates({
          activeTrip,
          isPhase1,
          isPhase2,
          isConductor,
          isPasajero,
          ubicacion,
          nearbyDrivers,
          currentUserId: user?.id,
        });

      const hasValidCoordinates =
        startCoordinates.latitude !== 0 &&
        startCoordinates.longitude !== 0 &&
        endCoordinates.latitude !== 0 &&
        endCoordinates.longitude !== 0;

      const shouldShowUserMarker = isConductor || !isPhase2;
      if (shouldShowUserMarker && ubicacion) {
        if (isConductor && isOnline && !user?.vehicle_maintenance) {
          const escapedMarkerIcon = CARRITO_MARKER_BASE64.replace(
            /\\/g,
            "\\\\",
          ).replace(/'/g, "\\'");
          injectionScript += `if (typeof setCarritoIcon === 'function') setCarritoIcon('${escapedMarkerIcon}');`;
        }
        injectionScript += `
          if (typeof placeUserMarker === 'function') {
            placeUserMarker(${parseCoordinateValue(ubicacion.latitude)}, ${parseCoordinateValue(ubicacion.longitude)}, null, ${isConductor && isOnline});
          }
        `;
      } else {
        injectionScript += `
          if (typeof removeUserMarker === 'function') removeUserMarker();
        `;
      }

      if (hasValidCoordinates) {
        const driverInfoPayload = JSON.stringify([
          {
            id: activeTrip.driver?.id || "driver",
            lat: startCoordinates.latitude,
            lng: startCoordinates.longitude,
            name: activeTrip.driver?.name || "Conductor",
            iconUrl: activeTrip.driver?.iconUrl || CARRITO_MARKER_BASE64,
          },
        ]);

        const shouldAnimateZoom =
          lastRouteRef.current?.phase !== (isPhase2 ? "phase2" : "phase1");

        // Soporte de ruta multi-destino para viajes compartidos (carpooling)
        if (
          isConductor &&
          activeTrip.passengers &&
          activeTrip.passengers.length > 0
        ) {
          const carpoolingWaypoints = buildCarpoolingWaypoints({
            startCoordinates,
            endCoordinates,
            passengersList: activeTrip.passengers,
            originLatitudeFallback: activeTrip.origin_lat,
            originLongitudeFallback: activeTrip.origin_lng,
          });

          const waypointsJsonString = JSON.stringify(carpoolingWaypoints).replace(
            /'/g,
            "\\'",
          );
          const currentRoutePhase = "multi_" + waypointsJsonString;
          const hasRouteChanged =
            lastRouteRef.current?.phase !== currentRoutePhase;

          if (hasRouteChanged) {
            injectionScript += `
              try {
                if (typeof drawMultiRoute === 'function') {
                  drawMultiRoute('${waypointsJsonString}', ${cameraPadding}, ${shouldAnimateZoom});
                }
              } catch (mapMultiRouteError) {
                console.error('Error al dibujar ruta carpooling:', mapMultiRouteError);
              }
            `;
            lastRouteRef.current = { phase: currentRoutePhase };
          }
        } else {
          const currentRoutePhase = isPhase2 ? "phase2" : "phase1";
          const hasRouteChanged =
            lastRouteRef.current?.startLat !== startCoordinates.latitude ||
            lastRouteRef.current?.startLng !== startCoordinates.longitude ||
            lastRouteRef.current?.endLat !== endCoordinates.latitude ||
            lastRouteRef.current?.endLng !== endCoordinates.longitude ||
            lastRouteRef.current?.phase !== currentRoutePhase;

          if (hasRouteChanged) {
            injectionScript += `
              if (typeof drawRoute === 'function') {
                drawRoute(${startCoordinates.latitude}, ${startCoordinates.longitude}, ${endCoordinates.latitude}, ${endCoordinates.longitude}, ${cameraPadding}, ${shouldAnimateZoom});
              }
            `;
            lastRouteRef.current = {
              startLat: startCoordinates.latitude,
              startLng: startCoordinates.longitude,
              endLat: endCoordinates.latitude,
              endLng: endCoordinates.longitude,
              phase: currentRoutePhase,
            };
          }
        }

        if (!isConductor) {
          injectionScript += `
            if (typeof updateNearbyDrivers === 'function') {
              updateNearbyDrivers(${driverInfoPayload});
            }
          `;
        }

        if (isPhase2) {
          injectionScript += `
            if (typeof centerMap === 'function') {
              centerMap(${startCoordinates.latitude}, ${startCoordinates.longitude});
            }
          `;
        }
      } else if (ubicacion) {
        injectionScript += `
          if (typeof centerMap === 'function') {
            centerMap(${parseCoordinateValue(ubicacion.latitude)}, ${parseCoordinateValue(ubicacion.longitude)});
          }
        `;
        hasCenteredRef.current = true;
      }
    }

    // Leaflet WebView en iOS y Android requiere que la expresión evaluada finalice
    // con un valor primitivo ('true;') para evitar excepciones de tipo.
    webViewRef.current.injectJavaScript(injectionScript + " true;");
  }, [
    webViewRef,
    mapLoadCount,
    activeTrip?.status,
    activeTrip?.state_id,
    activeTrip?.driver?.latitude,
    activeTrip?.driver?.longitude,
    passengersSignature,
    destinoSeleccionado,
    ubicacion,
    nearbyDrivers,
    isConductor,
    isPasajero,
    isOnline,
    user?.id,
    user?.vehicle_maintenance,
    destinos,
    mapThemeSignature,
  ]);

  /**
   * Manejador de eventos entrantes enviados por Leaflet WebView vía postMessage.
   */
  const handleWebViewMessage = useCallback(
    (eventPayload) => {
      try {
        const receivedData =
          typeof eventPayload.nativeEvent.data === "string"
            ? JSON.parse(eventPayload.nativeEvent.data)
            : eventPayload.nativeEvent.data;

        if (
          receivedData.type === MAP_MESSAGE_TYPES.DOUBLE_TAP &&
          isPasajero &&
          onDoubleTapDestination
        ) {
          const customDestinationPoint = {
            id: `custom-${Date.now()}`,
            nombre: "Ubicación personalizada",
            address: `${receivedData.latitude.toFixed(4)}, ${receivedData.longitude.toFixed(4)}`,
            latitude: receivedData.latitude,
            longitude: receivedData.longitude,
          };
          onDoubleTapDestination(customDestinationPoint);
        }
      } catch (deserializationError) {
        console.error(
          "Error al procesar mensaje enviado desde el mapa Leaflet:",
          deserializationError,
        );
      }
    },
    [isPasajero, onDoubleTapDestination],
  );

  /**
   * Inicialización de marcadores y ajuste visual cuando el WebView finaliza su carga.
   */
  const handleMapLoadEnd = useCallback(() => {
    if (!webViewRef.current) return;

    if (!user?.vehicle_maintenance) {
      const escapedMarkerIcon = CARRITO_MARKER_BASE64.replace(
        /\\/g,
        "\\\\",
      ).replace(/'/g, "\\'");
      webViewRef.current.injectJavaScript(`
        if (typeof setCarritoIcon === 'function') setCarritoIcon('${escapedMarkerIcon}');
      `);
    }

    if (!activeTrip && (isPasajero || isConductor) && ubicacion) {
      webViewRef.current.injectJavaScript(`
        if (typeof centerMap === 'function') centerMap(${ubicacion.latitude}, ${ubicacion.longitude});
        if (typeof placeUserMarker === 'function') placeUserMarker(${ubicacion.latitude}, ${ubicacion.longitude}, null, ${isConductor && isOnline});
      `);
    }

    setTimeout(() => {
      lastRouteRef.current.phase = null;
      setMapLoadCount((previousCount) => previousCount + 1);
    }, 0);
  }, [
    activeTrip,
    isConductor,
    isOnline,
    isPasajero,
    ubicacion,
    user?.vehicle_maintenance,
    webViewRef,
  ]);

  return {
    mapSource,
    handleWebViewMessage,
    handleMapLoadEnd,
    mapLoadCount,
  };
}
