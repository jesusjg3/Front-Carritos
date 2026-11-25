/**
 * Constantes semánticas para el módulo de Dashboard.
 * Evita magic strings y centraliza configuraciones de estados, textos y mapas.
 */

// Roles de usuario en el sistema
export const USER_ROLES = Object.freeze({
  PASAJERO: "pasajero",
  CONDUCTOR: "conductor",
});

// Estados y fases del ciclo de vida de un viaje
export const TRIP_STATUS = Object.freeze({
  ACEPTADO: "aceptado",
  ACCEPTED: "accepted",
  EN_PROGRESO: "en_progreso",
  IN_PROGRESS: "in_progress",
  FINALIZADO: "finalizado",
  FINISHED: "finished",
  CANCELADO: "cancelado",
  CANCELLED: "cancelled",
});

export const TRIP_STATE_IDS = Object.freeze({
  PENDING: 1,
  ACCEPTED: 2,
  ARRIVED: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
  CANCELLED: 6,
});

// Eventos de WebSocket recibidos a través de Laravel Echo
export const DISCONNECT_SOCKET_EVENTS = Object.freeze({
  APPROVED: ".driver.disconnect.approved",
  REJECTED: ".driver.disconnect.rejected",
});

// Espaciado (padding en píxeles) para el ajuste automático de cámara en Leaflet
export const MAP_PADDING = Object.freeze({
  PHASE_1_PICKUP: 180,
  PHASE_2_DESTINATION: 100,
  PREVIEW_ROUTE: 400,
});

// Constantes físicas y umbrales de geolocalización
export const DEFAULT_RADAR_RADIUS_KM = 250;

export const GEOLOCATION_CONSTANTS = Object.freeze({
  EARTH_RADIUS_KM: 6371,
  NEARBY_DESTINATION_THRESHOLD_KM: 0.25, // 250 metros para asociar el origen a un hito
  DEFAULT_RADAR_RADIUS_KM,
});

// Tipos de eventos emitidos desde el mapa embebido (Leaflet WebView)
export const MAP_MESSAGE_TYPES = Object.freeze({
  DOUBLE_TAP: "MAP_DOUBLE_TAP",
});

// Cadenas de texto para el proceso de solicitud de desconexión del conductor
export const DISCONNECT_TEXTS = Object.freeze({
  WAITING_TITLE: "Esperando Aprobación...",
  WAITING_DESCRIPTION:
    "Tu solicitud ha sido enviada al administrador. Por favor, no cierres la app.",
  APPROVED_TITLE: "Desconexión Aprobada",
  APPROVED_MESSAGE: "El administrador aprobó tu desconexión.",
  REJECTED_TITLE: "Desconexión Rechazada",
  REJECTED_MESSAGE: "El administrador denegó tu solicitud de desconexión.",
  MODAL_TITLE: "Motivo de Desconexión",
  MODAL_PLACEHOLDER: "Ej. Terminé mi turno, Problema mecánico...",
  DEFAULT_ERROR: "No se pudo solicitar la desconexión.",
  CONNECTION_ERROR: "Error de conexión al servidor.",
});

// Cadenas de texto para cancelación de viajes
export const CANCEL_TRIP_TEXTS = Object.freeze({
  MODAL_TITLE: "Motivo de Cancelación",
  MODAL_PLACEHOLDER: "¿Por qué debes cancelar el viaje?",
  CONFIRM_TITLE: "Cancelar Viaje",
  CONFIRM_MESSAGE: "¿Estás seguro de que deseas cancelar este viaje?",
  CONFIRM_BUTTON: "Sí, cancelar",
  CANCEL_BUTTON: "No",
  NO_SHOW_REASON: "Pasajero no se presentó",
});

// Cadenas de texto para la pantalla de búsqueda de conductor
export const SEARCHING_TEXTS = Object.freeze({
  TITLE: "Buscando Conductor",
  SUBTITLE: "Conectando con el carrito más cercano a tu ubicación...",
  TICKET_HEADER: "PASE DE VIAJE ACTIVO",
  ORIGIN_LABEL: "ORIGEN",
  DESTINATION_LABEL: "DESTINO",
  CURRENT_LOCATION: "Mi Ubicación Actual",
  SEARCHING_GPS: "Buscando GPS...",
  DEFAULT_DESTINATION: "Bienestar, Campus",
  ESTIMATED_TIME: "~2 min esp.",
  CONNECTING_STATUS: "Conectando...",
  CANCEL_BUTTON: "CANCELAR SOLICITUD",
});

// Cadenas de texto para validación de geocerca del campus
export const GEOFENCE_TEXTS = Object.freeze({
  OUT_OF_ZONE_TITLE: "Fuera de zona",
  OUT_OF_ZONE_MESSAGE: "Estás fuera de la zona de servicio permitida",
  LOCATION_REQUIRED_TITLE: "Ubicación Requerida",
  LOCATION_REQUIRED_MESSAGE: "Necesitamos tu ubicación y un destino.",
});

// Textos informativos de contacto
export const CONTACT_TEXTS = Object.freeze({
  TITLE: "Contacto",
  MESSAGE: "Contactando al conductor...",
});

// Cadenas de texto para la vista en reposo (Idle)
export const IDLE_TEXTS = Object.freeze({
  WHERE_TO: "¿A dónde vas?",
  SELECT_DESTINATION: "Seleccionar Destino...",
});

