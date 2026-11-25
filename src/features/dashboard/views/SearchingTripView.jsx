import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SHADOWS } from "../../../core/constants/theme";
import RadarView from "../components/RadarView";
import { SEARCHING_TEXTS } from "../constants/dashboardConstants";

// Coordenadas fijas para la inclinación horizontal del gradiente del encabezado del ticket
const GRADIENT_START_COORDINATES = Object.freeze({ x: 0, y: 0 });
const GRADIENT_END_COORDINATES = Object.freeze({ x: 1, y: 0 });

/**
 * Subcomponente para renderizar la animación de radar con halos concéntricos.
 */
function SearchingRadarSection({ ubicacion }) {
  return (
    <View style={styles.radarCard}>
      <View style={styles.radarGlowContainer}>
        <View style={styles.radarGlowRing1} />
        <View style={styles.radarGlowRing2} />
        <RadarView ubicacion={ubicacion} />
      </View>
    </View>
  );
}

/**
 * Subcomponente para el ticket estilo tarjeta de embarque que muestra
 * el intento de búsqueda y la ruta seleccionada.
 */
function SearchingBoardingTicket({
  ubicacion,
  destinoSeleccionado,
  requestAttempt,
  theme,
}) {
  const originText = ubicacion
    ? SEARCHING_TEXTS.CURRENT_LOCATION
    : SEARCHING_TEXTS.SEARCHING_GPS;
  const destinationText = destinoSeleccionado
    ? destinoSeleccionado.nombre
    : SEARCHING_TEXTS.DEFAULT_DESTINATION;

  return (
    <View
      style={[
        styles.searchingTicket,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      {/* Encabezado del Ticket */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={GRADIENT_START_COORDINATES}
        end={GRADIENT_END_COORDINATES}
        style={styles.ticketHeader}
      >
        <View style={styles.ticketHeaderLeft}>
          <MaterialCommunityIcons
            name="ticket-confirmation"
            size={18}
            color={theme.colors.onPrimary}
            style={styles.ticketIconMargin}
          />
          <Text style={styles.ticketHeaderTitle}>
            {SEARCHING_TEXTS.TICKET_HEADER}
          </Text>
        </View>
        <Text style={styles.ticketHeaderCode}>#{requestAttempt}</Text>
      </LinearGradient>

      {/* Segmento de Ruta (Origen -> Destino) */}
      <View
        style={[
          styles.ticketRouteContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.searchingRouteTexts}>
          <View style={styles.searchingRoutePoint}>
            <View style={styles.searchingRoutePointHeader}>
              <View style={styles.searchingOriginDot} />
              <Text
                style={[
                  styles.searchingRouteLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {SEARCHING_TEXTS.ORIGIN_LABEL}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.searchingRouteValue,
                { color: theme.colors.onSurface },
              ]}
            >
              {originText}
            </Text>
          </View>

          <MaterialCommunityIcons
            name="arrow-right"
            size={17}
            color={theme.colors.primary}
            style={styles.searchingRouteArrow}
          />

          <View style={styles.searchingRoutePoint}>
            <View style={styles.searchingRoutePointHeader}>
              <View style={styles.searchingDestSquare} />
              <Text
                style={[
                  styles.searchingRouteLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {SEARCHING_TEXTS.DESTINATION_LABEL}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.searchingRouteValue,
                { color: theme.colors.onSurface },
              ]}
            >
              {destinationText}
            </Text>
          </View>
        </View>
      </View>

      {/* Muescas divisorias de estilo troquelado */}
      <View
        style={[
          styles.ticketNotchContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View
          style={[
            styles.ticketLeftNotch,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outline,
            },
          ]}
        />
        <View
          style={[
            styles.ticketDashedDivider,
            { borderColor: theme.colors.outline },
          ]}
        />
        <View
          style={[
            styles.ticketRightNotch,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outline,
            },
          ]}
        />
      </View>

      {/* Pie del ticket con indicadores de estado */}
      <View
        style={[
          styles.ticketFooter,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.ticketInfoRow}>
          <View
            style={[
              styles.ticketInfoPill,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={15}
              color={theme.colors.secondary}
              style={styles.ticketIconMargin}
            />
            <Text
              style={[
                styles.ticketInfoPillText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {SEARCHING_TEXTS.ESTIMATED_TIME}
            </Text>
          </View>
          <View
            style={[
              styles.ticketInfoPill,
              {
                backgroundColor: theme.colors.success + "18",
                borderColor: theme.colors.success + "40",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="sync"
              size={15}
              color={theme.colors.success}
              style={styles.ticketIconMargin}
            />
            <Text
              style={[
                styles.ticketInfoPillText,
                { color: theme.colors.success },
              ]}
            >
              {SEARCHING_TEXTS.CONNECTING_STATUS}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Vista de búsqueda activa de conductores para el pasajero.
 * Muestra el radar en tiempo real, un ticket de viaje y opción para cancelar.
 */
export default function SearchingTripView({
  ubicacion,
  requestAttempt,
  destinoSeleccionado,
  onCancelSearch,
}) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <LinearGradient
        colors={[
          theme.colors.primary + "18",
          theme.colors.background,
          theme.colors.background,
        ]}
        style={styles.searchingWrapper}
      >
        {/* Encabezado principal */}
        <View style={styles.searchingHeader}>
          <Text
            variant="headlineMedium"
            style={[styles.searchingTitle, { color: theme.colors.primary }]}
          >
            {SEARCHING_TEXTS.TITLE}
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              styles.searchingSubtitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {SEARCHING_TEXTS.SUBTITLE}
          </Text>
        </View>

        {/* Radar animado */}
        <SearchingRadarSection ubicacion={ubicacion} />

        {/* Tarjeta de embarque */}
        <SearchingBoardingTicket
          ubicacion={ubicacion}
          destinoSeleccionado={destinoSeleccionado}
          requestAttempt={requestAttempt}
          theme={theme}
        />

        {/* Botón de cancelación de solicitud */}
        <View style={styles.searchingFooter}>
          <TouchableOpacity
            style={[
              styles.cancelRequestPill,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.error + "70",
              },
            ]}
            onPress={onCancelSearch}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={16}
              color={theme.colors.error}
              style={styles.ticketIconMargin}
            />
            <Text style={styles.cancelRequestPillText}>
              {SEARCHING_TEXTS.CANCEL_BUTTON}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchingWrapper: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  searchingHeader: {
    alignItems: "center",
    width: "100%",
  },
  searchingTitle: {
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 8,
  },
  searchingSubtitle: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  radarCard: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  radarGlowContainer: {
    position: "relative",
    width: 236,
    height: 236,
    justifyContent: "center",
    alignItems: "center",
  },
  radarGlowRing1: {
    position: "absolute",
    width: 226,
    height: 226,
    borderRadius: 113,
    borderWidth: 1,
    borderColor: "rgba(30, 136, 229, 0.12)",
    backgroundColor: "rgba(30, 136, 229, 0.02)",
  },
  radarGlowRing2: {
    position: "absolute",
    width: 246,
    height: 246,
    borderRadius: 123,
    borderWidth: 1.5,
    borderColor: "rgba(30, 136, 229, 0.06)",
    backgroundColor: "rgba(30, 136, 229, 0.01)",
  },
  searchingTicket: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    ...SHADOWS.LARGE,
    borderWidth: 0,
    overflow: "hidden",
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  ticketHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketIconMargin: {
    marginRight: 6,
  },
  ticketHeaderTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.2,
  },
  ticketHeaderCode: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
    opacity: 0.9,
  },
  ticketRouteContainer: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  searchingOriginDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginRight: 5,
    ...SHADOWS.SMALL,
  },
  searchingDestSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginRight: 5,
    ...SHADOWS.SMALL,
  },
  searchingRouteTexts: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  searchingRoutePoint: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  searchingRoutePointHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  searchingRouteArrow: {
    marginHorizontal: 6,
  },
  searchingRouteLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  searchingRouteValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1E293B",
    marginTop: 1,
  },
  ticketNotchContainer: {
    height: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  ticketLeftNotch: {
    width: 12,
    height: 16,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    marginLeft: -6,
    borderWidth: 1.5,
  },
  ticketRightNotch: {
    width: 12,
    height: 16,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    marginRight: -6,
    borderWidth: 1.5,
  },
  ticketDashedDivider: {
    flex: 1,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginHorizontal: 8,
  },
  ticketFooter: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  ticketInfoRow: {
    flexDirection: "row",
    gap: 12,
  },
  ticketInfoPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ticketInfoPillText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  searchingFooter: {
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  cancelRequestPill: {
    width: "100%",
    maxWidth: 280,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.MEDIUM,
  },
  cancelRequestPillText: {
    color: "#EF4444",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.8,
  },
});
