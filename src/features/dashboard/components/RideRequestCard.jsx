import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOWS, BORDER_RADIUS } from '../../../core/constants/theme';

export default function RideRequestCard({ request, onAccept, onReject }) {
    const theme = useTheme();
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        if (!request?.expiresAt) return undefined;
        const update = () => setSecondsLeft(Math.max(0, Math.ceil((request.expiresAt - Date.now()) / 1000)));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [request?.expiresAt]);

    if (!request) return null;

    // Helper for passenger initials
    const getInitials = (name) => {
        if (!name) return "PA";
        return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    };

    return (
        <View style={styles.container}>
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
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
                    {secondsLeft > 0 && <Text style={styles.expiryText}>{secondsLeft}s</Text>}
                </LinearGradient>

                {/* Tactile Ticket Notches and Dashed Divider */}
                    <View style={[styles.notchContainer, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.leftNotch, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} />
                    <View style={[styles.dashedDividerLine, { borderColor: theme.colors.outline }]} />
                    <View style={[styles.rightNotch, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} />
                </View>

                {/* Central Section: High-End Route Details and Stats */}
                <View style={[styles.contentBody, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.routeCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <View style={styles.routePointCompact}>
                            <View style={styles.routePointHeader}>
                                <View style={styles.originIndicator} />
                                <Text style={[styles.routeLabel, { color: theme.colors.onSurfaceVariant }]}>ORIGEN</Text>
                            </View>
                            <Text style={[styles.routeValue, { color: theme.colors.onSurface }]} numberOfLines={2}>
                                {request.origin || 'Mi Ubicación Actual'}
                            </Text>
                        </View>
                        <MaterialCommunityIcons name="arrow-right" size={18} color={theme.colors.primary} style={styles.routeArrow} />
                        <View style={styles.routePointCompact}>
                            <View style={styles.routePointHeader}>
                                <View style={styles.destIndicator} />
                                <Text style={[styles.routeLabel, { color: theme.colors.onSurfaceVariant }]}>DESTINO</Text>
                            </View>
                            <Text style={[styles.routeValue, { color: theme.colors.onSurface }]} numberOfLines={2}>
                                {request.destination}
                            </Text>
                        </View>
                    </View>

                    {/* Stats pills side by side */}
                    <View style={styles.statsContainer}>
                        <View style={[styles.statPill, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <MaterialCommunityIcons name="account-group" size={16} color="#144985" style={{ marginRight: 6 }} />
                            <Text style={[styles.statText, { color: theme.colors.primary }]}>
                                {request.passengers_count || 1} {(request.passengers_count || 1) === 1 ? 'Pasajero' : 'Pasajeros'}
                            </Text>
                        </View>
                        
                        <View style={[styles.statPill, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <MaterialCommunityIcons name="map-marker-distance" size={16} color="#1E88E5" style={{ marginRight: 6 }} />
                            <Text style={[styles.statText, { color: theme.colors.primary }]}>
                                {request.distance || '1.2 km'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bottom Section: Premium Actions (Pill shape side by side) */}
                    <View style={[styles.actions, { backgroundColor: theme.colors.surface }]}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectPill, { backgroundColor: theme.colors.surface }]}
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
        marginHorizontal: 4,
        marginBottom: 8,
        backgroundColor: 'transparent',
        zIndex: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        ...SHADOWS.LARGE,
        borderWidth: 0,
    },
    headerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
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
        padding: 2,
        borderRadius: 24,
        marginRight: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    avatarInner: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontWeight: 'bold',
        fontSize: 12,
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
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 2,
    },
    newBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        ...SHADOWS.SMALL,
    },
    newBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#144985',
        letterSpacing: 0.8,
    },
    expiryText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    notchContainer: {
        height: 12,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
    },
    leftNotch: {
        width: 16,
        height: 12,
        backgroundColor: '#E2E8F0',
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
        marginLeft: -6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    rightNotch: {
        width: 16,
        height: 20,
        backgroundColor: '#E2E8F0',
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
        marginRight: -6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    dashedDividerLine: {
        flex: 1,
        height: 1,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginHorizontal: 8,
    },
    contentBody: {
        paddingHorizontal: 12,
        paddingBottom: 10,
        paddingTop: 6,
        backgroundColor: '#FFFFFF',
    },
    routeCard: {
        flexDirection: 'row',
        borderRadius: 14,
        padding: 8,
        borderWidth: 0,
        alignItems: 'center',
    },
    routePointCompact: {
        flex: 1,
        minWidth: 0,
    },
    originIndicator: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        marginRight: 5,
        ...SHADOWS.SMALL,
    },
    routePointHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    destIndicator: {
        width: 12,
        height: 12,
        borderRadius: 3,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        marginRight: 5,
        ...SHADOWS.SMALL,
    },
    routeArrow: {
        marginHorizontal: 5,
    },
    routeLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 0.8,
    },
    routeValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 8,
    },
    statPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 30,
        borderWidth: 0,
        justifyContent: 'center',
    },
    statText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1E40AF',
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingBottom: 10,
        gap: 8,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
    },
    actionButton: {
        flex: 1,
        height: 32,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.MEDIUM,
    },
    rejectPill: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
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
        fontSize: 11,
        letterSpacing: 0.8,
    },
    rejectText: {
        color: '#EF4444',
        fontWeight: '900',
        fontSize: 11,
        letterSpacing: 0.8,
    },
});
