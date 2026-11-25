import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SHADOWS, BORDER_RADIUS } from "../../../core/constants/theme";

import UniversalMap from "../../../shared/components/UniversalMap";
import RideRequestCard from "../components/RideRequestCard";
import DestinationModal from "../components/DestinationModal";
import RateDriverModal from "../components/RateDriverModal";
import RatePassengerModal from "../components/RatePassengerModal";
import ReasonModal from "../../../shared/components/ReasonModal";
import {
  CANCEL_TRIP_TEXTS,
  DISCONNECT_TEXTS,
  IDLE_TEXTS,
} from "../constants/dashboardConstants";

/**
 * Subcomponente para renderizar la lista vertical de solicitudes de viaje entrantes (Modo Conductor).
 */
function IdleDriverRequestsList({
  requestQueue,
  onAcceptRequest,
  onRejectRequest,
}) {
  if (!requestQueue || requestQueue.length === 0) {
    return null;
  }

  return (
    <View style={styles.requestsContainer}>
      <ScrollView
        style={styles.requestsScroll}
        contentContainerStyle={styles.requestsContent}
        showsVerticalScrollIndicator={false}
      >
        {requestQueue.map((rideRequestItem, requestIndex) => (
          <RideRequestCard
            key={rideRequestItem.id || requestIndex}
            request={rideRequestItem}
            onAccept={() => onAcceptRequest(rideRequestItem)}
            onReject={() => onRejectRequest(rideRequestItem)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * Subcomponente para el botón flotante inferior "¿A dónde vas?" (Modo Pasajero).
 */
function IdleDestinationSearchTrigger({
  destinoSeleccionado,
  onPressTrigger,
  theme,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.searchCardContainer,
        { backgroundColor: theme.colors.surface },
      ]}
      onPress={onPressTrigger}
      activeOpacity={0.9}
    >
      <View style={styles.searchCardInner}>
        <View
          style={[
            styles.searchIconBg,
            { backgroundColor: theme.colors.primary + "10" },
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.searchTextContainer}>
          <Text
            style={[
              styles.searchTextLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {IDLE_TEXTS.WHERE_TO}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.searchTextValue,
              destinoSeleccionado
                ? { color: theme.colors.primary, fontWeight: "bold" }
                : { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {destinoSeleccionado
              ? destinoSeleccionado.nombre
              : IDLE_TEXTS.SELECT_DESTINATION}
          </Text>
        </View>
        <View
          style={[
            styles.searchCircleIndicator,
            { backgroundColor: theme.colors.secondary },
          ]}
        >
          <MaterialCommunityIcons
            name="arrow-right"
            size={18}
            color={theme.colors.onSecondary}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Vista de Mapa en Reposo (Idle).
 * Muestra el mapa base, lista de solicitudes de conductores, barra de selección de destino
 * y modales de calificación, selección de destino y cancelaciones.
 */
export default function IdleMapView({
  webViewRef,
  mapBrain,
  isConductor,
  isPasajero,
  lifecycle,
  bookingState,
  destinationState,
  disconnectState,
  cancelModalVisible,
  onDismissCancelModal,
  onConfirmCancelTrip,
  ubicacion,
}) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      {/* Solicitudes de Pasajeros en Espera (Solo Conductor) */}
      {isConductor && (
        <IdleDriverRequestsList
          requestQueue={lifecycle.requestQueue}
          onAcceptRequest={lifecycle.handleAcceptRequest}
          onRejectRequest={lifecycle.handleRejectRequest}
        />
      )}

      {/* Mapa Principal y Botón Flotante */}
      <View style={styles.mapContainer}>
        <UniversalMap
          ref={webViewRef}
          source={mapBrain.mapSource}
          style={styles.map}
          onMessage={mapBrain.handleWebViewMessage}
          onLoadEnd={mapBrain.handleMapLoadEnd}
        />

        {isPasajero && !bookingState.modalVisible && (
          <IdleDestinationSearchTrigger
            destinoSeleccionado={bookingState.destinoSeleccionado}
            onPressTrigger={() => bookingState.setModalVisible(true)}
            theme={theme}
          />
        )}
      </View>

      {/* Modal para Búsqueda y Selección de Destinos */}
      <DestinationModal
        visible={bookingState.modalVisible}
        onDismiss={() => {
          bookingState.setModalVisible(false);
          bookingState.setDestinoSeleccionado(null);
        }}
        destinos={destinationState.destinos}
        cargando={destinationState.cargandoDestinos}
        error={destinationState.errorDestinos}
        onRetry={destinationState.cargarDestinos}
        destinoSeleccionado={bookingState.destinoSeleccionado}
        onSelect={bookingState.setDestinoSeleccionado}
        onConfirm={bookingState.confirmRequestTrip}
        ubicacionActual={ubicacion}
      />

      {/* Modal de Calificación a Conductor (Para Pasajero) */}
      <RateDriverModal
        visible={Boolean(lifecycle.tripToRate) && !isConductor}
        trip={lifecycle.tripToRate}
        onDismiss={() => lifecycle.setTripToRate(null)}
        onRateSuccess={() => lifecycle.setTripToRate(null)}
      />

      {/* Modal de Calificación a Pasajero (Para Conductor) */}
      <RatePassengerModal
        visible={Boolean(lifecycle.tripToRate) && isConductor}
        trip={lifecycle.tripToRate}
        onDismiss={() => lifecycle.setTripToRate(null)}
        onRateSuccess={() => lifecycle.setTripToRate(null)}
      />

      {/* Modal de Motivo de Cancelación */}
      <ReasonModal
        visible={cancelModalVisible}
        onDismiss={onDismissCancelModal}
        title={CANCEL_TRIP_TEXTS.MODAL_TITLE}
        placeholder={CANCEL_TRIP_TEXTS.MODAL_PLACEHOLDER}
        onConfirm={onConfirmCancelTrip}
      />

      {/* Modal de Motivo de Desconexión (Para Conductor) */}
      <ReasonModal
        visible={disconnectState.disconnectModalVisible}
        onDismiss={() => disconnectState.setDisconnectModalVisible(false)}
        title={DISCONNECT_TEXTS.MODAL_TITLE}
        placeholder={DISCONNECT_TEXTS.MODAL_PLACEHOLDER}
        onConfirm={disconnectState.handleRequestDisconnect}
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
  searchCardContainer: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
    borderRadius: BORDER_RADIUS.XL,
    ...SHADOWS.LARGE,
    borderWidth: 0,
    zIndex: 100,
    overflow: "hidden",
  },
  searchCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  searchIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  searchTextContainer: {
    flex: 1,
  },
  searchTextLabel: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  searchTextValue: {
    fontSize: 15,
    marginTop: 2,
  },
  searchCircleIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.SMALL,
  },
  requestsContainer: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 12,
    height: 250,
    maxHeight: "42%",
    paddingTop: 8,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    zIndex: 200,
    elevation: 20,
  },
  requestsScroll: {
    flex: 1,
  },
  requestsContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
});
