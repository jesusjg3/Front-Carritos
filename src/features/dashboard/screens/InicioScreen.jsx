import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "react-native-paper";
import { useAppContext } from "../../../shared/contexts/AppContext";
import { useLocationLogic } from "../../../shared/hooks/useLocationLogic";
import { useTripLifecycle } from "../../../shared/hooks/useTripLifecycle";
import { useDestinations } from "../../../shared/hooks/useDestinations";
import { useDriverLocation } from "../../../shared/hooks/useDriverLocation";
import { useNearbyDrivers } from "../../../shared/hooks/useNearbyDrivers";
import { USER_ROLES, CONTACT_TEXTS } from "../constants/dashboardConstants";
import { useUnifiedMapBrain } from "../hooks/useUnifiedMapBrain";
import { useDriverDisconnect } from "../hooks/useDriverDisconnect";
import { useTripBooking } from "../hooks/useTripBooking";
import { useTripCancellation } from "../hooks/useTripCancellation";
import { useModalTabsLock } from "../hooks/useModalTabsLock";
import WaitingDisconnectView from "../views/WaitingDisconnectView";
import SearchingTripView from "../views/SearchingTripView";
import ActiveTripView from "../views/ActiveTripView";
import IdleMapView from "../views/IdleMapView";

/**
 * Pantalla Principal del Dashboard (InicioScreen).
 * Componente orquestador que conecta los hooks de ciclo de vida, mapa y geolocalización,
 * renderizando la vista correspondiente según el estado de la sesión.
 */
export default function InicioScreen() {
  const { user, token, showAlert, setTabsLocked, setTabsLockCloseHandler } = useAppContext();
  const theme = useTheme();
  const webViewRef = useRef(null);

  const isPasajero = user?.role === USER_ROLES.PASAJERO;
  const isConductor = user?.role === USER_ROLES.CONDUCTOR;
  const [isOnline, setIsOnline] = useState(isConductor);

  const lifecycle = useTripLifecycle(user, token, isOnline, isPasajero);
  const { ubicacion } = useLocationLogic(user, isPasajero);
  const destinationState = useDestinations(user, isPasajero);
  useDriverLocation(user, token, isOnline, ubicacion);
  const { nearbyDrivers } = useNearbyDrivers(user, token, ubicacion, isPasajero && !lifecycle.isSearching && !lifecycle.activeTrip);

  const disconnectState = useDriverDisconnect({ user, token, isConductor, showAlert, setIsOnline });
  const bookingState = useTripBooking({ ubicacion, destinos: destinationState.destinos, requestTrip: lifecycle.requestTrip, showAlert });
  const cancellationState = useTripCancellation({ isConductor, lifecycle, showAlert });

  const mapBrain = useUnifiedMapBrain({
    webViewRef, user, activeTrip: lifecycle.activeTrip, destinoSeleccionado: bookingState.destinoSeleccionado,
    ubicacion, nearbyDrivers, destinos: destinationState.destinos, isConductor, isPasajero, isOnline, theme,
    onDoubleTapDestination: bookingState.setDestinoSeleccionado,
  });

  useEffect(() => {
    if (lifecycle.tripToRate) bookingState.setDestinoSeleccionado(null);
  }, [lifecycle.tripToRate, bookingState.setDestinoSeleccionado]);

  const closeAllModals = useCallback(() => {
    bookingState.setModalVisible(false);
    cancellationState.setCancelModalVisible(false);
    disconnectState.setDisconnectModalVisible(false);
    lifecycle.setTripToRate(null);
  }, [
    bookingState.setModalVisible,
    cancellationState.setCancelModalVisible,
    disconnectState.setDisconnectModalVisible,
    lifecycle.setTripToRate,
  ]);

  useModalTabsLock({
    isModalOpen: bookingState.modalVisible || cancellationState.cancelModalVisible ||
      disconnectState.disconnectModalVisible || Boolean(lifecycle.tripToRate),
    closeAllModals, setTabsLocked, setTabsLockCloseHandler,
  });

  if (disconnectState.isWaitingDisconnect) return <WaitingDisconnectView />;

  if (lifecycle.isSearching) {
    return (
      <SearchingTripView
        ubicacion={ubicacion}
        requestAttempt={lifecycle.requestAttempt}
        destinoSeleccionado={bookingState.destinoSeleccionado}
        onCancelSearch={() => { lifecycle.cancelTrip(); bookingState.setDestinoSeleccionado(null); }}
      />
    );
  }

  if (lifecycle.activeTrip) {
    return (
      <ActiveTripView
        webViewRef={webViewRef}
        mapBrain={mapBrain}
        lifecycle={lifecycle}
        user={user}
        isPasajero={isPasajero}
        onContact={() => showAlert(CONTACT_TEXTS.TITLE, CONTACT_TEXTS.MESSAGE, "info")}
        onCancelTripAction={cancellationState.handleCancelTripAction}
        cancelModalVisible={cancellationState.cancelModalVisible}
        onDismissCancelModal={() => cancellationState.setCancelModalVisible(false)}
        onConfirmCancelTrip={cancellationState.handleConfirmCancelTrip}
      />
    );
  }

  return (
    <IdleMapView
      webViewRef={webViewRef}
      mapBrain={mapBrain}
      isConductor={isConductor}
      isPasajero={isPasajero}
      lifecycle={lifecycle}
      bookingState={bookingState}
      destinationState={destinationState}
      disconnectState={disconnectState}
      cancelModalVisible={cancellationState.cancelModalVisible}
      onDismissCancelModal={() => cancellationState.setCancelModalVisible(false)}
      onConfirmCancelTrip={cancellationState.handleConfirmCancelTrip}
      ubicacion={ubicacion}
    />
  );
}
