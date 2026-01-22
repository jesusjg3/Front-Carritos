import React from 'react';
import { View, StyleSheet } from "react-native";
import { Card, Text, Button, Divider, ActivityIndicator, useTheme } from "react-native-paper";

export default function ActiveTripCard({
    activeTrip,
    isPasajero,
    onContact,
    onCancel,
    onStartTrip,
    onFinishTrip
}) {
    const theme = useTheme();

    // Helper functions for display
    const getStateTitle = () => activeTrip.state_id == 4 ? "Viaje en curso" : "Conductor en camino";
    const getStateSubtitle = () => activeTrip.state_id == 4 ? "Disfruta tu viaje" : "Tu viaje ha sido aceptado";
    const getDriverIcon = () => isPasajero ? "car" : "account";

    // Driver specific Titles
    const getDriverTitle = () => activeTrip.state_id == 4 ? "En camino al destino" : "Recogiendo al pasajero";
    const getDriverSubtitle = () => activeTrip.state_id == 4 ? "Rumbo al destino final" : "Dirígete al punto de partida";

    const title = isPasajero ? getStateTitle() : getDriverTitle();
    const subtitle = isPasajero ? getStateSubtitle() : getDriverSubtitle();

    return (
        <Card style={styles.tripCard}>
            <View>
                <Card.Title
                    title={title}
                    subtitle={subtitle}
                    left={(props) => <ActivityIndicator {...props} icon={getDriverIcon()} />}
                />
                <Card.Content>
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.initials}>
                                {isPasajero
                                    ? (activeTrip.driver?.name?.substring(0, 2).toUpperCase() || 'CH')
                                    : (activeTrip.passenger?.name?.substring(0, 2).toUpperCase() || 'PA')
                                }
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text variant="titleMedium">
                                {isPasajero ? (activeTrip.driver?.name || 'Conductor') : (activeTrip.passenger?.name || 'Pasajero')}
                            </Text>
                            <Text variant="bodyMedium" style={{ color: 'gray' }}>
                                {isPasajero ? "Carrito #12" : "Universidad Laica Eloy Alfaro"}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {isPasajero && (
                                    <>
                                        <Text>⭐ {Number(activeTrip.driver?.rating || activeTrip.driver?.score || 5).toFixed(1)}</Text>
                                    </>
                                )}
                                {!isPasajero && activeTrip.passengers_count && (
                                    <Text style={{ color: 'gray' }}>
                                        👥 {activeTrip.passengers_count} {activeTrip.passengers_count === 1 ? 'pasajero' : 'pasajeros'}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                    <Divider style={{ marginVertical: 10 }} />

                    {isPasajero ? (
                        <View>
                            <Text variant="labelLarge" style={{ marginBottom: 4 }}>Origen: {activeTrip.origin?.address || activeTrip.origin_address}</Text>
                            <Text variant="labelLarge">Destino: {activeTrip.destination?.address || activeTrip.destination_address}</Text>
                        </View>
                    ) : (
                        <View>
                            <Text variant="labelLarge" style={{ marginBottom: 4 }}>
                                {activeTrip.state_id == 4 ? "Destino:" : "Recoger en:"}
                            </Text>
                            <Text variant="bodyMedium">
                                {activeTrip.state_id == 4
                                    ? (activeTrip.destination?.address || activeTrip.destination_address)
                                    : (activeTrip.origin?.address || activeTrip.origin_address)
                                }
                            </Text>
                        </View>
                    )}
                </Card.Content>
                <Card.Actions style={{ padding: 16 }}>
                    {isPasajero ? (
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <Button mode="contained" style={{ flex: 1 }} onPress={onContact}>Contactar</Button>
                            <Button mode="outlined" textColor={theme.colors.error} style={{ flex: 1, marginLeft: 10 }} onPress={onCancel}>Cancelar</Button>
                        </View>
                    ) : (
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            {activeTrip.state_id != 4 && (
                                <Button mode="contained" style={{ flex: 1, backgroundColor: theme.colors.primary }} onPress={onContact}>
                                    Contactar
                                </Button>
                            )}
                            {activeTrip.state_id != 4 && (
                                <Button mode="contained" style={{ flex: 1, marginLeft: 10, backgroundColor: '#4CAF50' }} onPress={onStartTrip}>
                                    Llegué / Recogí
                                </Button>
                            )}
                            {activeTrip.state_id == 4 && (
                                <Button mode="contained" style={{ flex: 1, backgroundColor: '#4CAF50' }} onPress={onFinishTrip}>
                                    Finalizar Viaje
                                </Button>
                            )}
                        </View>
                    )}
                </Card.Actions>
            </View >
        </Card >
    );
}

const styles = StyleSheet.create({
    tripCard: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 8 },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    initials: { fontSize: 20, fontWeight: 'bold', color: '#757575' },
});
