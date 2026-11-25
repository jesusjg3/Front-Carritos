import { useState, useCallback } from "react";
import { CANCEL_TRIP_TEXTS } from "../constants/dashboardConstants";

/**
 * Hook para centralizar los flujos de confirmación y cancelación de viajes
 * tanto para pasajeros como para conductores.
 */
export function useTripCancellation({ isConductor, lifecycle, showAlert }) {
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  const handleCancelTripAction = useCallback(
    (isNoShow = false) => {
      if (isConductor) {
        if (isNoShow === true) {
          lifecycle.cancelTrip(CANCEL_TRIP_TEXTS.NO_SHOW_REASON);
        } else {
          setCancelModalVisible(true);
        }
      } else {
        showAlert(
          CANCEL_TRIP_TEXTS.CONFIRM_TITLE,
          CANCEL_TRIP_TEXTS.CONFIRM_MESSAGE,
          "warning",
          {
            confirmText: CANCEL_TRIP_TEXTS.CONFIRM_BUTTON,
            cancelText: CANCEL_TRIP_TEXTS.CANCEL_BUTTON,
            onConfirm: () => lifecycle.cancelTrip(),
            onCancel: () => {},
          },
        );
      }
    },
    [isConductor, lifecycle, showAlert],
  );

  const handleConfirmCancelTrip = useCallback(
    (cancelReason) => {
      setCancelModalVisible(false);
      lifecycle.cancelTrip(cancelReason);
    },
    [lifecycle],
  );

  return {
    cancelModalVisible,
    setCancelModalVisible,
    handleCancelTripAction,
    handleConfirmCancelTrip,
  };
}
