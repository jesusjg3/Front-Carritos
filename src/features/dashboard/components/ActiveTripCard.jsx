import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Card,
  Text,
  Button,
  Divider,
  ActivityIndicator,
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
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>
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
              <Text style={styles.userName}>
                {activeTrip.driver?.name || "Conductor"}
              </Text>
              <Text style={styles.userSubtext}>Vehículo Asignado</Text>

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
                      <Text style={styles.userName}>
                        {passenger.name || "Pasajero"}
                      </Text>
                      {!isPasajero && passenger.pickup_address && (
                        <Text style={[styles.userSubtext, { color: theme.colors.outline, fontSize: 12 }]}>
                          📍 {passenger.pickup_address}
                        </Text>
                      )}
                      <Text style={styles.userSubtext}>
                        {passenger.phone || "Sin número"}
                      </Text>
                      <View
                        style={{ flexDirection: "row", marginTop: 4, gap: 8 }}
                      >
                        {passenger.id !== activeTrip.passengers?.[0]?.id && (
                          <>
                            {passenger.status === "accepted" ? (
                              <Button
                                mode="contained"
                                compact
                                style={{ backgroundColor: "#2E7D32", flex: 1 }}
                                onPress={() => onBoardPassenger(passenger.id)}
                              >
                                Subió
                              </Button>
                            ) : null}
                            {passenger.status === "accepted" ? (
                              <Button
                                mode="outlined"
                                compact
                                textColor={theme.colors.error}
                                style={{
                                  borderColor: theme.colors.error + "50",
                                  flex: 1,
                                }}
                                onPress={() => onCancelPassenger(passenger.id)}
                              >
                                No llegó
                              </Button>
                            ) : null}
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {/* Vertical route map nodes instead of plain text */}
        <View style={styles.routeContainer}>
          <View style={styles.routeIndicators}>
            <View style={styles.dotOrigin} />
            <View style={styles.routeLine} />
            <View style={styles.squareDestination} />
          </View>

          <View style={styles.routeDetails}>
            <View style={styles.routeBlock}>
              <Text style={styles.routeLabel}>Punto de Partida</Text>
              <Text style={styles.routeValue} numberOfLines={1}>
                {activeTrip.origin?.address ||
                  activeTrip.origin_address ||
                  "Ubicación actual"}
              </Text>
            </View>

            <View style={styles.routeBlock}>
              <Text style={styles.routeLabel}>Punto de Destino</Text>
              <Text style={styles.routeValue} numberOfLines={1}>
                {activeTrip.destination?.address ||
                  activeTrip.destination_address ||
                  "Destino seleccionado"}
              </Text>
            </View>
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
                onPress={onCancel}
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
                onPress={onCancel}
                icon="close"
              >
                Cancelar
              </Button>
            )}
            {activeTrip.state_id != 4 && (
              <Button
                mode="contained-tonal"
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.colors.primary + "15" },
                ]}
                textColor={theme.colors.primary}
                contentStyle={styles.actionButtonContent}
                onPress={onContact}
                icon="phone"
              >
                Llamar a todos
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...SHADOWS.LARGE,
    borderWidth: 1.5,
    borderColor: "#EEEEEE",
    paddingTop: 8,
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
    paddingHorizontal: 20,
    marginBottom: 10,
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
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarGlow: {
    borderWidth: 2,
    borderColor: "#1E88E530",
    padding: 3,
    borderRadius: 28,
    marginRight: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  userDetails: {
    flex: 1,
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
    alignItems: "stretch",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: BORDER_RADIUS.LG,
  },
  routeIndicators: {
    width: 16,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    marginRight: 10,
  },
  dotOrigin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E88E5",
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
  },
  routeDetails: {
    flex: 1,
    justifyContent: "space-between",
    height: 60,
  },
  routeBlock: {
    justifyContent: "center",
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 0,
  },
  buttonRow: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.LG,
    ...SHADOWS.SMALL,
  },
  actionButtonContent: {
    paddingVertical: 6,
  },
});
