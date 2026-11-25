import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import UniversalMap from "../../../shared/components/UniversalMap";
import ActiveTripCard from "../components/ActiveTripCard";
import IncomingRequestCard from "../components/IncomingRequestCard";
import ReasonModal from "../../../shared/components/ReasonModal";
import { CANCEL_TRIP_TEXTS } from "../constants/dashboardConstants";

/**
 * Vista de Viaje Activo.
 * Orquesta la presentación del mapa en tiempo real, tarjeta de controles de viaje
 * (ActiveTripCard), solicitudes concurrentes de carpooling (IncomingRequestCard)
 * y el modal para ingresar el motivo de cancelación.
 */
export default function ActiveTripView({
  webViewRef,
  mapBrain,
  lifecycle,
  user,
  isPasajero,
  onContact,
  onCancelTripAction,
  cancelModalVisible,
  onDismissCancelModal,
  onConfirmCancelTrip,
}) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      {/* Contenedor del Mapa en Tiempo Real */}
      <View style={styles.mapContainer}>
        <UniversalMap
          ref={webViewRef}
          source={mapBrain.mapSource}
          style={styles.map}
          onMessage={mapBrain.handleWebViewMessage}
          onLoadEnd={mapBrain.handleMapLoadEnd}
        />
      </View>

      {/* Tarjeta de Controles y Detalles del Viaje Activo */}
      <ActiveTripCard
        activeTrip={lifecycle.activeTrip}
        user={user}
        isPasajero={isPasajero}
        onContact={onContact}
        onCancel={onCancelTripAction}
        onStartTrip={lifecycle.handleStartTrip}
        onFinishTrip={lifecycle.handleFinishTrip}
        onBoardPassenger={lifecycle.handleBoardPassenger}
        onDropOffPassenger={lifecycle.handleDropOffPassenger}
        onCancelPassenger={lifecycle.handleCancelPassenger}
      />

      {/* Tarjeta Flotante de Solicitudes de Pasajeros Secundarios (Carpooling) */}
      <IncomingRequestCard
        incomingRequest={lifecycle.incomingRequest}
        onAccept={lifecycle.handleAcceptPassenger}
        onReject={lifecycle.handleRejectPassenger}
        onExpire={lifecycle.handleExpirePassenger}
      />

      {/* Modal para Capturar Motivo de Cancelación */}
      <ReasonModal
        visible={cancelModalVisible}
        onDismiss={onDismissCancelModal}
        title={CANCEL_TRIP_TEXTS.MODAL_TITLE}
        placeholder={CANCEL_TRIP_TEXTS.MODAL_PLACEHOLDER}
        onConfirm={onConfirmCancelTrip}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
});
