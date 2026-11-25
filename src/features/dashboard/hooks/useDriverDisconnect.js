import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { API_ROUTES } from "../../../Config/Routes";
import { createEcho } from "../../../core/services/echo";
import {
  DISCONNECT_SOCKET_EVENTS,
  DISCONNECT_TEXTS,
} from "../constants/dashboardConstants";

/**
 * Hook personalizado para gestionar el ciclo de solicitud de desconexión del conductor,
 * incluyendo la sincronización en tiempo real vía WebSocket (Laravel Echo).
 */
export function useDriverDisconnect({
  user,
  token,
  isConductor,
  showAlert,
  setIsOnline,
}) {
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
  const [isWaitingDisconnect, setIsWaitingDisconnect] = useState(false);

  useEffect(() => {
    let echoInstance;

    if (isConductor && token && user?.id) {
      echoInstance = createEcho(token);
      const driverChannel = echoInstance.private(`driver.${user.id}`);

      driverChannel.listen(
        DISCONNECT_SOCKET_EVENTS.APPROVED,
        () => {
          setIsWaitingDisconnect(false);
          setIsOnline(false);
          showAlert(
            DISCONNECT_TEXTS.APPROVED_TITLE,
            DISCONNECT_TEXTS.APPROVED_MESSAGE,
            "success",
          );
        },
      );

      driverChannel.listen(
        DISCONNECT_SOCKET_EVENTS.REJECTED,
        () => {
          setIsWaitingDisconnect(false);

          // Alerta nativa de respaldo por si el contenedor de alerta personalizada está oculto
          Alert.alert(
            DISCONNECT_TEXTS.REJECTED_TITLE,
            DISCONNECT_TEXTS.REJECTED_MESSAGE,
          );

          if (typeof showAlert === "function") {
            showAlert(
              DISCONNECT_TEXTS.REJECTED_TITLE,
              DISCONNECT_TEXTS.REJECTED_MESSAGE,
              "error",
            );
          }
        },
      );
    }

    return () => {
      if (echoInstance) {
        echoInstance.leave(`driver.${user.id}`);
        echoInstance.disconnect();
      }
    };
  }, [isConductor, token, user?.id, showAlert, setIsOnline]);

  /**
   * Envía la solicitud de desconexión del conductor al backend y activa el estado de espera.
   */
  const handleRequestDisconnect = useCallback(
    async (disconnectReason) => {
      setDisconnectModalVisible(false);
      setIsWaitingDisconnect(true);

      try {
        const response = await fetch(
          `${API_ROUTES.BASE_URL}/driver/request-disconnect`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reason: disconnectReason }),
          },
        );

        const responsePayload = await response.json();
        if (!response.ok) {
          setIsWaitingDisconnect(false);
          showAlert(
            "Error",
            responsePayload.error || DISCONNECT_TEXTS.DEFAULT_ERROR,
            "error",
          );
        }
      } catch (requestError) {
        setIsWaitingDisconnect(false);
        console.error(
          "Error de red al solicitar desconexión del conductor:",
          requestError,
        );
        showAlert("Error", DISCONNECT_TEXTS.CONNECTION_ERROR, "error");
      }
    },
    [token, showAlert],
  );

  return {
    disconnectModalVisible,
    setDisconnectModalVisible,
    isWaitingDisconnect,
    setIsWaitingDisconnect,
    handleRequestDisconnect,
  };
}
