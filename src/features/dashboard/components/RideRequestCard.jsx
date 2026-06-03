import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOWS, BORDER_RADIUS, COLORS } from '../../../core/constants/theme';

export default function RideRequestCard({ request, onAccept, onReject }) {
    if (!request) return null;

    // Helper for passenger initials
    const getInitials = (name) => {
        if (!name) return "PA";
        return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {/* Upper Section: Premium Passenger Header with Corporate Gradient */}
                <LinearGradient
                    colors={['#144985', '#1E88E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerGradient}
                >
                    <View style={styles.passengerProfile}>
                        <View style={styles.avatarOuterGlow}>
                            <View style={styles.avatarInner}>
                                <Text style={styles.avatarText}>
                                    {getInitials(request.passenger?.name || request.passenger_name)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.passengerMeta}>
                            <Text style={styles.passengerRole}>PASAJERO SOLICITANTE</Text>
                            <Text style={styles.passengerName} numberOfLines={1}>
                                {request.passenger?.name || request.passenger_name || 'Estudiante'}
                            </Text>
                        </View>
                    </View>
                    
                    <LinearGradient
                        colors={['#FFFFFF', '#F1F5F9']}
                        style={styles.newBadge}
                    >
                        <MaterialCommunityIcons name="flash" size={12} color="#144985" style={{ marginRight: 2 }} />
                        <Text style={styles.newBadgeText}>NUEVO</Text>
                    </LinearGradient>
                </LinearGradient>

                {/* Tactile Ticket Notches and Dashed Divider */}
                <View style={styles.notchContainer}>
                    <View style={styles.leftNotch} />
                    <View style={styles.dashedDividerLine} />
                    <View style={styles.rightNotch} />
                </View>

                {/* Central Section: High-End Route Details and Stats */}
                <View style={styles.contentBody}>
                    <View style={styles.routeCard}>
                        {/* Premium Vertical Route Line with a moving car icon in the middle! */}
                        <View style={styles.verticalTimeline}>
                            <View style={styles.originIndicator} />
                            <View style={styles.timelineDashedLine} />
                            <View style={styles.carIconContainer}>
                                <MaterialCommunityIcons name="car-side" size={13} color="#1E88E5" />
                            </View>
                            <View style={styles.timelineDashedLine} />
                            <View style={styles.destIndicator} />
                        </View>

                        <View style={styles.routeTextContainer}>
                            <View style={styles.routePoint}>
                                <Text style={styles.routeLabel}>PUNTO DE PARTIDA (ORIGEN)</Text>
                                <Text style={styles.routeValue} numberOfLines={1}>
                                    {request.origin || 'Mi Ubicación Actual'}
                                </Text>
                            </View>
                            
                            <View style={styles.routePoint}>
                                <Text style={styles.routeLabel}>PUNTO DE LLEGADA (DESTINO)</Text>
                                <Text style={styles.routeValue} numberOfLines={1}>
                                    {request.destination}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats pills side by side */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statPill}>
                            <MaterialCommunityIcons name="account-group" size={16} color="#144985" style={{ marginRight: 6 }} />
                            <Text style={styles.statText}>
                                {request.passengers_count || 1} {(request.passengers_count || 1) === 1 ? 'Pasajero' : 'Pasajeros'}
                            </Text>
                        </View>
                        
                        <View style={styles.statPill}>
                            <MaterialCommunityIcons name="map-marker-distance" size={16} color="#1E88E5" style={{ marginRight: 6 }} />
                            <Text style={styles.statText}>
                                {request.distance || '1.2 km'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bottom Section: Premium Actions (Pill shape side by side) */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectPill]}
                        onPress={onReject}
                        activeOpacity={0.85}
                    >
                        <MaterialCommunityIcons name="close-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                        <Text style={styles.rejectText}>RECHAZAR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.acceptPill]}
                        onPress={onAccept}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.acceptGradient}
                        >
                            <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.acceptText}>ACEPTAR VIAJE</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 20,
        backgroundColor: 'transparent',
        zIndex: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        ...SHADOWS.LARGE,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    headerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
    },
    passengerProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarOuterGlow: {
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        padding: 3,
        borderRadius: 24,
        marginRight: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    avatarInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#144985',
        letterSpacing: 0.5,
    },
    passengerMeta: {
        flex: 1,
    },
    passengerRole: {
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: 'bold',
        letterSpacing: 1.2,
    },
    passengerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 2,
    },
    newBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        ...SHADOWS.SMALL,
    },
    newBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#144985',
        letterSpacing: 0.8,
    },
    notchContainer: {
        height: 20,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
    },
    leftNotch: {
        width: 16,
        height: 20,
        backgroundColor: '#E2E8F0',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        marginLeft: -8,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    rightNotch: {
        width: 16,
        height: 20,
        backgroundColor: '#E2E8F0',
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        marginRight: -8,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    dashedDividerLine: {
        flex: 1,
        height: 1,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginHorizontal: 12,
    },
    contentBody: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
        backgroundColor: '#FFFFFF',
    },
    routeCard: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'stretch',
    },
    verticalTimeline: {
        width: 24,
        alignItems: 'center',
        marginRight: 14,
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    originIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        ...SHADOWS.SMALL,
    },
    timelineDashedLine: {
        width: 1.5,
        flex: 1,
        backgroundColor: '#CBD5E1',
        marginVertical: 4,
    },
    carIconContainer: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    destIndicator: {
        width: 12,
        height: 12,
        borderRadius: 3,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        ...SHADOWS.SMALL,
    },
    routeTextContainer: {
        flex: 1,
        height: 84,
        justifyContent: 'space-between',
    },
    routePoint: {
        justifyContent: 'center',
    },
    routeLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 0.8,
    },
    routeValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 14,
    },
    statPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        justifyContent: 'center',
    },
    statText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1E40AF',
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 14,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
    },
    actionButton: {
        flex: 1,
        height: 48,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.MEDIUM,
    },
    rejectPill: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#EF4444',
        shadowOpacity: 0.05,
        elevation: 1,
    },
    acceptPill: {
        overflow: 'hidden',
    },
    acceptGradient: {
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 0.8,
    },
    rejectText: {
        color: '#EF4444',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 0.8,
    },
});
