import React from 'react';
import { View, StyleSheet } from "react-native";
import { Card, Text, Button, Divider, ActivityIndicator, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SHADOWS, COLORS, BORDER_RADIUS } from '../../../core/constants/theme';

export default function ActiveTripCard({
    activeTrip,
    isPasajero,
    onContact,
    onCancel,
    onStartTrip,
    onFinishTrip,
    onBoardPassenger,
    onDropOffPassenger,
    onCancelPassenger
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

    const getInitials = (name) => {
        if (!name) return isPasajero ? "CH" : "PA";
        return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    };

    return (
        <Card style={[styles.tripCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.sheetIndicator} />
            
            <View style={styles.headerRow}>
                <View style={styles.iconContainer}>
                    <ActivityIndicator animating={true} size="small" color={theme.colors.primary} />
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
                        <View style={[styles.avatarGlow, { borderColor: theme.colors.primary }]}>
                            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.initials}>
                                    {getInitials(activeTrip.driver?.name)}
                                </Text>
                            </View>
                        </View>
                        
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>
                                {activeTrip.driver?.name || 'Conductor'}
                            </Text>
                            <Text style={styles.userSubtext}>
                                Vehículo Asignado
                            </Text>
                            
                            <View style={styles.metadataContainer}>
                                <View style={styles.ratingBadge}>
                                    <MaterialCommunityIcons name="star" size={12} color="#FFD700" style={{ marginRight: 2 }} />
                                    <Text style={styles.ratingText}>
                                        {Number(activeTrip.driver?.rating || activeTrip.driver?.score || 5).toFixed(1)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    // Driver View - List of passengers
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#666', marginBottom: 8 }}>
                            PASAJEROS ({activeTrip.passengers?.length || 0})
                        </Text>
                        {activeTrip.passengers && activeTrip.passengers.map((p) => (
                            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#f8f9fa', padding: 8, borderRadius: 12 }}>
                                <View style={[styles.avatar, { backgroundColor: theme.colors.primary, width: 36, height: 36, borderRadius: 18, marginRight: 10 }]}>
                                    <Text style={[styles.initials, { fontSize: 13 }]}>
                                        {getInitials(p.name)}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#333' }}>{p.name}</Text>
                                    <Text style={{ fontSize: 11, color: '#888' }}>{p.phone || 'Sin número'}</Text>
                                </View>
                                <View>
                                    {p.status === 'accepted' && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Button 
                                                mode="contained" 
                                                compact 
                                                style={{ backgroundColor: '#2E7D32', borderRadius: 8, marginRight: 4 }}
                                                labelStyle={{ fontSize: 10, marginHorizontal: 8, marginVertical: 4 }}
                                                onPress={() => onBoardPassenger(p.id)}
                                            >
                                                Subió
                                            </Button>
                                            <Button 
                                                mode="outlined" 
                                                compact 
                                                style={{ borderColor: '#F44336', borderRadius: 8 }}
                                                textColor="#F44336"
                                                labelStyle={{ fontSize: 10, marginHorizontal: 8, marginVertical: 4 }}
                                                onPress={() => {
                                                    Alert.alert(
                                                        "Cancelar Pasajero",
                                                        `¿Estás seguro de cancelar a ${p.name}?`,
                                                        [
                                                            { text: "No", style: "cancel" },
                                                            { text: "Sí, Cancelar", onPress: () => onCancelPassenger(p.id), style: "destructive" }
                                                        ]
                                                    );
                                                }}
                                            >
                                                No llegó
                                            </Button>
                                        </View>
                                    )}
                                    {p.status === 'boarded' && (
                                        <Button 
                                            mode="outlined" 
                                            compact 
                                            style={{ borderColor: '#FF6B6B', borderRadius: 8 }}
                                            textColor="#FF6B6B"
                                            labelStyle={{ fontSize: 10, marginHorizontal: 8, marginVertical: 4 }}
                                            onPress={() => onDropOffPassenger(p.id)}
                                        >
                                            Bajó
                                        </Button>
                                    )}
                                    {p.status === 'dropped_off' && (
                                        <Text style={{ fontSize: 11, color: '#9E9E9E', fontStyle: 'italic', marginRight: 4 }}>
                                            Finalizado
                                        </Text>
                                    )}
                                    {p.status === 'cancelled' && (
                                        <Text style={{ fontSize: 11, color: '#F44336', fontStyle: 'italic', marginRight: 4 }}>
                                            Cancelado
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
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
                                {activeTrip.origin?.address || activeTrip.origin_address || 'Ubicación actual'}
                            </Text>
                        </View>
                        
                        <View style={styles.routeBlock}>
                            <Text style={styles.routeLabel}>Punto de Destino</Text>
                            <Text style={styles.routeValue} numberOfLines={1}>
                                {activeTrip.destination?.address || activeTrip.destination_address || 'Destino seleccionado'}
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
                            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
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
                                style={[styles.actionButton, { borderColor: theme.colors.error + '50' }]} 
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
                                style={[styles.actionButton, { borderColor: theme.colors.error + '50' }]} 
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
                                style={[styles.actionButton, { backgroundColor: theme.colors.primary + '15' }]} 
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
                                style={[styles.actionButton, { backgroundColor: '#1E88E5' }]} 
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
                                style={[styles.actionButton, { backgroundColor: '#2E7D32' }]} 
                                contentStyle={styles.actionButtonContent}
                                onPress={onFinishTrip}
                                icon="flag-checkered"
                            >
                                Finalizar Viaje Completo
                            </Button>
                        )}
                    </View>
                )}
            </Card.Actions>
        </Card >
    );
}

const styles = StyleSheet.create({
    tripCard: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24, 
        ...SHADOWS.LARGE,
        borderWidth: 1.5,
        borderColor: '#EEEEEE',
        paddingTop: 8,
    },
    sheetIndicator: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
        alignSelf: 'center',
        marginBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E88E510',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    titleText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
    },
    subtitleText: {
        fontSize: 12,
        color: '#6C757D',
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
        flexDirection: 'row', 
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarGlow: {
        borderWidth: 2,
        borderColor: '#1E88E530',
        padding: 3,
        borderRadius: 28,
        marginRight: 14,
    },
    avatar: { 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    initials: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#212529',
    },
    userSubtext: {
        fontSize: 12,
        color: '#888',
        marginTop: 1,
    },
    metadataContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9C4',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#F57F17',
    },
    passengerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    passengerText: {
        fontSize: 11,
        color: '#6C757D',
        fontWeight: 'bold',
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: BORDER_RADIUS.LG,
    },
    routeIndicators: {
        width: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
        marginRight: 10,
    },
    dotOrigin: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1E88E5',
    },
    routeLine: {
        width: 1.5,
        flex: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 2,
    },
    squareDestination: {
        width: 8,
        height: 8,
        borderRadius: 2,
        backgroundColor: '#FF6B6B',
    },
    routeDetails: {
        flex: 1,
        justifyContent: 'space-between',
        height: 60,
    },
    routeBlock: {
        justifyContent: 'center',
    },
    routeLabel: {
        fontSize: 9,
        color: '#888',
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    routeValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    cardActions: { 
        paddingHorizontal: 20, 
        paddingBottom: 20, 
        paddingTop: 0,
    },
    buttonRow: { 
        flexDirection: 'row', 
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
