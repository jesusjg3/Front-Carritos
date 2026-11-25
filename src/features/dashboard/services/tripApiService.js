import { API_ROUTES } from "../../../Config/Routes";

/**
 * Servicio API desacoplado para las operaciones REST del ciclo de vida de viajes.
 * Centraliza las peticiones de red hacia el backend para reducir la complejidad de los hooks.
 */

const HTTP_HEADERS_JSON = Object.freeze({
  "Content-Type": "application/json",
  Accept: "application/json",
});

/**
 * Genera los encabezados requeridos para las solicitudes autenticadas.
 */
function buildAuthorizationHeaders(userToken, customHeaders = {}) {
  return {
    Authorization: `Bearer ${userToken}`,
    ...HTTP_HEADERS_JSON,
    ...customHeaders,
  };
}

/**
 * Recupera el viaje activo del usuario actual (si existe).
 */
export async function fetchCurrentActiveTrip(userToken) {
  const response = await fetch(`${API_ROUTES.TRIPS}/current`, {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  const parsedData = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data: parsedData,
  };
}

/**
 * Acepta una solicitud de viaje por parte de un conductor.
 */
export async function acceptTripRequest(userToken, tripRequestId) {
  const response = await fetch(`${API_ROUTES.TRIPS}/${tripRequestId}/accept`, {
    method: "POST",
    headers: buildAuthorizationHeaders(userToken),
  });

  const parsedData = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data: parsedData,
  };
}

/**
 * Acepta un pasajero adicional en una ruta carpooling en curso.
 */
export async function acceptPassengerRequest(userToken, tripId, passengerId) {
  const response = await fetch(
    `${API_ROUTES.TRIPS}/${tripId}/accept-passenger`,
    {
      method: "POST",
      headers: buildAuthorizationHeaders(userToken),
      body: JSON.stringify({ passenger_id: passengerId }),
    },
  );

  const parsedData = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data: parsedData,
  };
}

/**
 * Rechaza la solicitud de un pasajero para sumarse a la ruta.
 */
export async function rejectPassengerRequest(userToken, tripId, passengerId) {
  const response = await fetch(
    `${API_ROUTES.TRIPS}/${tripId}/reject-passenger/${passengerId}`,
    {
      method: "POST",
      headers: buildAuthorizationHeaders(userToken),
    },
  );

  const parsedData = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data: parsedData,
  };
}

/**
 * Inicia el recorrido de un viaje una vez que el conductor está listo.
 */
export async function startTripRoute(userToken, tripId) {
  const response = await fetch(`${API_ROUTES.TRIPS}/${tripId}/start`, {
    method: "POST",
    headers: buildAuthorizationHeaders(userToken),
  });

  const parsedData = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data: parsedData,
  };
}

/**
 * Finaliza el viaje cuando todos los pasajeros han sido transportados.
 */
export async function finishTripRoute(userToken, tripId) {
  const response = await fetch(`${API_ROUTES.TRIPS}/${tripId}/finish`, {
    method: "POST",
    headers: buildAuthorizationHeaders(userToken),
  });

  const parsedData = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data: parsedData,
  };
}

/**
 * Marca a un pasajero como abordado en el vehículo.
 */
export async function boardPassenger(userToken, tripId, passengerId) {
  const response = await fetch(
    `${API_ROUTES.TRIPS}/${tripId}/board/${passengerId}`,
    {
      method: "POST",
      headers: buildAuthorizationHeaders(userToken),
    },
  );

  const parsedData = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data: parsedData,
  };
}

/**
 * Marca a un pasajero como dejado en su parada de destino.
 */
export async function dropOffPassenger(userToken, tripId, passengerId) {
  const response = await fetch(
    `${API_ROUTES.TRIPS}/${tripId}/dropoff/${passengerId}`,
    {
      method: "POST",
      headers: buildAuthorizationHeaders(userToken),
    },
  );

  const parsedData = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data: parsedData,
  };
}

/**
 * Cancela a un pasajero individual dentro del viaje.
 */
export async function cancelPassengerTrip(userToken, tripId, passengerId) {
  const response = await fetch(
    `${API_ROUTES.TRIPS}/${tripId}/cancel-passenger/${passengerId}`,
    {
      method: "POST",
      headers: buildAuthorizationHeaders(userToken),
    },
  );

  const parsedData = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data: parsedData,
  };
}

/**
 * Solicita una nueva ruta de viaje para un pasajero.
 */
export async function requestNewTrip(userToken, tripPayload) {
  const response = await fetch(`${API_ROUTES.TRIPS}/request`, {
    method: "POST",
    headers: buildAuthorizationHeaders(userToken),
    body: JSON.stringify(tripPayload),
  });

  const parsedData = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data: parsedData,
  };
}

/**
 * Cancela un viaje completo (por parte del pasajero o del conductor).
 */
export async function cancelTrip(userToken, tripId, cancellationReason = null) {
  const requestBodyPayload = cancellationReason
    ? JSON.stringify({ reason: cancellationReason })
    : undefined;

  const response = await fetch(`${API_ROUTES.TRIPS}/${tripId}/cancel`, {
    method: "DELETE",
    headers: buildAuthorizationHeaders(userToken),
    body: requestBodyPayload,
  });

  let parsedData = null;
  try {
    parsedData = await response.json();
  } catch (parseError) {
    // Algunas respuestas DELETE 204 no contienen cuerpo JSON
    parsedData = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data: parsedData,
  };
}
