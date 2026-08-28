import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Card,
  Text,
  Button,
  Divider,
  ActivityIndicator,
  IconButton,
  useTheme,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SHADOWS, COLORS, BORDER_RADIUS } from "../../../core/constants/theme";

export default function ActiveTripCard({
  activeTrip,
  user,
  isPasajero,
  onContact,
  onCancel,
  onStartTrip,
  onFinishTrip,
  onBoardPassenger,
  onDropOffPassenger,
  onCancelPassenger,
}) {
  const theme = useTheme();

  // Find the specific passenger record if viewing as a passenger
  const myPassengerRecord = isPasajero && user ? 
    activeTrip?.passengers?.find(p => p.id === user.id) 
    : null;


  // Helper functions for display
  const getStateTitle = () => {
    if (isPasajero && myPassengerRecord) {
      return myPassengerRecord.status === 'boarded' ? "Viaje en curso" : "Conductor en camino";
    }
    return activeTrip.state_id == 4 ? "Viaje en curso" : "Conductor en camino";
  };

  const getStateSubtitle = () => {
    if (isPasajero && myPassengerRecord) {
      return myPassengerRecord.status === 'boarded' ? "Disfruta tu viaje" : "Recogiéndote en breve";
    }
    return activeTrip.state_id == 4 ? "Disfruta tu viaje" : "Tu viaje ha sido aceptado";
  };

  const getDriverIcon = () => (isPasajero ? "car" : "account");

  // Driver specific Titles
  const getDriverTitle = () =>
    activeTrip.state_id == 4
      ? "En camino al destino"
      : "Recogiendo al pasajero";
  const getDriverSubtitle = () =>
    activeTrip.state_id == 4
      ? "Rumbo al destino final"
      : "Dirígete al punto de partida";

  const title = isPasajero ? getStateTitle() : getDriverTitle();
  const subtitle = isPasajero ? getStateSubtitle() : getDriverSubtitle();

  const getInitials = (name) => {
    if (!name) return isPasajero ? "CH" : "PA";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <Card style={[styles.tripCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.sheetIndicator} />

      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <ActivityIndicator
            animating={true}
            size="small"
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.titleText, { color: theme.colors.onSurface }]}>{title}</Text>
          <Text style={[styles.subtitleText, { color: theme.colors.onSurfaceVariant }]}>{subtitle}</Text>
        </View>
      </View>

      <Divider style={styles.headerDivider} />

      <Card.Content style={styles.cardContent}>
        {/* User/Driver profile section */}
        {isPasajero ? (
          <View style={styles.userInfo}>
            <View
              style={[styles.avatarGlow, { borderColor: theme.colors.primary }]}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={styles.initials}>
                  {getInitials(activeTrip.driver?.name)}
                </Text>
              </View>
            </View>

            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
                {activeTrip.driver?.name || "Conductor"}
              </Text>
              <Text style={[styles.userSubtext, { color: theme.colors.onSurfaceVariant }]}>Vehículo Asignado</Text>

              <View style={styles.metadataContainer}>
                <View style={styles.ratingBadge}>
                  <MaterialCommunityIcons
                    name="star"
                    size={12}
                    color="#FFD700"
                    style={{ marginRight: 2 }}
                  />
                  <Text style={styles.ratingText}>
                    {Number(
                      activeTrip.driver?.rating ||
                        activeTrip.driver?.score ||
                        5,
                    ).toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          // Driver View - Passenger details (multiple)
          <View>
            {(activeTrip.passengers || [])
              .filter(
                (p) =>
                  p.status !== "dropped_off" &&
                  p.status !== "cancelled" &&
                  p.status !== "requested",
              )
              .map((passenger) => {
                return (
                  <View key={passenger.id} style={styles.userInfo}>
                    <View
                      style={[
                        styles.avatarGlow,
                        { borderColor: theme.colors.primary },
                      ]}
                    >
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <Text style={styles.initials}>
                          {getInitials(passenger.name || "Pasajero")}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.userDetails}>
                      <View style={styles.passengerNameRow}>
                        <Text
                          style={[styles.userName, { color: theme.colors.onSurface }]}
                          numberOfLines={1}
                        >
                          {passenger.name || "Pasajero"}
                        </Text>
                        {passenger.id !== activeTrip.passengers?.[0]?.id &&
                          passenger.status === "accepted" && (
                            <View style={styles.passengerActions}>
                              <IconButton
                                icon="account-check-outline"
                                iconColor="#2E7D32"
                                size={18}
                                style={styles.passengerActionIcon}
                                onPress={() => onBoardPassenger(passenger.id)}
                                accessibilityLabel="Marcar pasajero como subido"
                              />
                              <IconButton
                                icon="account-remove-outline"
                                iconColor={theme.colors.error}
                                size={18}
                                style={styles.passengerActionIcon}
                                onPress={() => onCancelPassenger(passenger.id)}
                                accessibilityLabel="Marcar pasajero como no llegado"
                              />
                            </View>
                          )}
                      </View>
                      {!isPasajero && passenger.pickup_address && (
                        <Text style={[styles.userSubtext, { color: theme.colors.outline, fontSize: 12 }]}>
                          📍 {passenger.pickup_address}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {/* Ruta compacta para no consumir altura en el móvil */}
        <View style={[styles.routeContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={styles.routeBlock}>
            <View style={styles.routeBlockHeader}>
              <View style={styles.dotOrigin} />
              <Text style={[styles.routeLabel, { color: theme.colors.onSurfaceVariant }]}>Origen</Text>
            </View>
              <Text style={[styles.routeValue, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {activeTrip.origin?.address ||
                  activeTrip.origin_address ||
                  "Ubicación actual"}
              </Text>
          </View>

          <MaterialCommunityIcons name="arrow-right" size={18} color={theme.colors.primary} style={styles.routeArrow} />

          <View style={styles.routeBlock}>
            <View style={styles.routeBlockHeader}>
              <View style={styles.squareDestination} />
              <Text style={[styles.routeLabel, { color: theme.colors.onSurfaceVariant }]}>Destino</Text>
            </View>
              <Text style={[styles.routeValue, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {activeTrip.destination?.address ||
                  activeTrip.destination_address ||
                  "Destino seleccionado"}
              </Text>
          </View>
        </View>
      </Card.Content>

      {/* Premium action buttons with clean shapes */}
      <Card.Actions style={styles.cardActions}>
        {isPasajero ? (
          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary },
              ]}
              contentStyle={styles.actionButtonContent}
              onPress={onContact}
              icon="phone"
            >
              Contactar
            </Button>
            {![3, 5].includes(activeTrip.state_id) && (
              <Button
                mode="outlined"
                textColor={theme.colors.error}
                style={[
                  styles.actionButton,
                  { borderColor: theme.colors.error + "50" },
                ]}
                contentStyle={styles.actionButtonContent}
                onPress={() => onCancel(false)}
                icon="close"
              >
                Cancelar
              </Button>
            )}
          </View>
        ) : (
          <View style={styles.buttonRow}>
            {![3, 5].includes(activeTrip.state_id) && (
              <Button
                mode="outlined"
                textColor={theme.colors.error}
                style={[
                  styles.actionButton,
                  { borderColor: theme.colors.error + "50" },
                ]}
                contentStyle={styles.actionButtonContent}
                onPress={() => onCancel(activeTrip.state_id != 4)}
                icon="close"
              >
                {activeTrip.state_id == 4 ? "Cancelar" : "No llegó"}
              </Button>
            )}
            {activeTrip.state_id != 4 && (
              <Button
                mode="contained"
                style={[styles.actionButton, { backgroundColor: "#1E88E5" }]}
                contentStyle={styles.actionButtonContent}
                onPress={onStartTrip}
                icon="play-circle"
              >
                Iniciar Ruta
              </Button>
            )}
            {activeTrip.state_id == 4 && (
              <Button
                mode="contained"
                style={[
                  styles.actionButton, 
                  { backgroundColor: activeTrip.passengers?.some(p => p.status === 'accepted') ? "#888888" : "#2E7D32" }
                ]}
                contentStyle={styles.actionButtonContent}
                onPress={onFinishTrip}
                icon="flag-checkered"
                disabled={activeTrip.passengers?.some(p => p.status === 'accepted')}
              >
                {activeTrip.passengers?.some(p => p.status === 'accepted') ? "Pasajeros pendientes" : "Finalizar Viaje Completo"}
              </Button>
            )}
          </View>
        )}
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  tripCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...SHADOWS.LARGE,
    borderWidth: 0,
    paddingTop: 8,
    zIndex: 500,
    elevation: 12,
  },
  sheetIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E88E510",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
  },
  subtitleText: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 1,
  },
  headerDivider: {
    opacity: 0.5,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  avatarGlow: {
    borderWidth: 1,
    borderColor: "#1E88E530",
    padding: 2,
    borderRadius: 24,
    marginRight: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  userDetails: {
    flex: 1,
  },
  passengerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  passengerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },
  passengerActionIcon: {
    width: 28,
    height: 28,
    margin: 0,
  },
  userName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#212529",
  },
  userSubtext: {
    fontSize: 12,
    color: "#888",
    marginTop: 1,
  },
  metadataContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9C4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#F57F17",
  },
  passengerBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  passengerText: {
    fontSize: 11,
    color: "#6C757D",
    fontWeight: "bold",
  },
  routeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 8,
    borderRadius: BORDER_RADIUS.LG,
  },
  routeBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  dotOrigin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E88E5",
    marginRight: 5,
  },
  routeLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 2,
  },
  squareDestination: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#FF6B6B",
    marginRight: 5,
  },
  routeDetails: {
    flex: 1,
    justifyContent: "space-between",
    height: 52,
  },
  routeBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  routeArrow: {
    marginHorizontal: 6,
  },
  routeLabel: {
    fontSize: 9,
    color: "#888",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  routeValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  cardActions: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 0,
  },
  buttonRow: {
    flexDirection: "row",
    flex: 1,
    gap: 6,
  },
  actionButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.LG,
    ...SHADOWS.SMALL,
  },
  actionButtonContent: {
    paddingVertical: 2,
  },
});
