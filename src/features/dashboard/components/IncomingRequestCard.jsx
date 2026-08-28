import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from "react-native";
import { Card, Text, Button, useTheme } from "react-native-paper";
import { SHADOWS, BORDER_RADIUS } from '../../../core/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PASSENGER_JOIN_DISPLAY_MS } from '../../../core/constants/timing';

export default function IncomingRequestCard({
    incomingRequest,
    onAccept,
    onReject,
    onExpire,
}) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [secondsLeft, setSecondsLeft] = useState(Math.ceil(PASSENGER_JOIN_DISPLAY_MS / 1000));
    const resolvedRef = useRef(false);

    const passenger = incomingRequest?.passenger;

    useEffect(() => {
        if (!incomingRequest) return undefined;

        resolvedRef.current = false;
        setSecondsLeft(Math.ceil(PASSENGER_JOIN_DISPLAY_MS / 1000));

        const interval = setInterval(() => {
            setSecondsLeft((seconds) => Math.max(0, seconds - 1));
        }, 1000);
        const timeout = setTimeout(() => {
            if (!resolvedRef.current) {
                resolvedRef.current = true;
                onExpire?.();
            }
        }, PASSENGER_JOIN_DISPLAY_MS);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [incomingRequest, onExpire]);

    const resolve = (callback) => {
        if (resolvedRef.current) return;
        resolvedRef.current = true;
        callback?.();
    };

    if (!incomingRequest) return null;

    return (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface, top: Math.max(insets.top + 20, 36) }]}>
            <View style={styles.headerRow}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="account-plus" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.headerText}>
                    <Text style={[styles.titleText, { color: theme.colors.onSurface }]}>Nuevo pasajero en ruta</Text>
                    <Text style={[styles.subtitleText, { color: theme.colors.onSurfaceVariant }]}>Quiere unirse a tu viaje</Text>
                </View>
                <Text style={[styles.timerText, { color: theme.colors.primary }]}>{secondsLeft}s</Text>
            </View>

            <Card.Content style={styles.cardContent}>
                <View style={styles.userInfo}>
                    <View style={styles.userDetails}>
                        <Text style={[styles.userName, { color: theme.colors.onSurface }]} numberOfLines={1}>{passenger?.name || 'Pasajero'}</Text>
                        <Text style={[styles.userSubtext, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>Recoger en: {passenger?.pickup_address || 'Ubicación desconocida'}</Text>
                        <Text style={[styles.userSubtext, { color: theme.colors.onSurfaceVariant }]}>Pasajeros: {passenger?.passengers_count || 1}</Text>
                    </View>
                </View>
            </Card.Content>

            <Card.Actions style={styles.cardActions}>
                <View style={styles.buttonRow}>
                    <Button 
                        mode="outlined" 
                        textColor={theme.colors.error} 
                        style={[styles.actionButton, { borderColor: theme.colors.error + '50' }]} 
                        contentStyle={styles.actionButtonContent}
                        onPress={() => resolve(onReject)}
                        icon="close"
                    >
                        Ignorar
                    </Button>
                    <Button 
                        mode="contained" 
                        style={[styles.actionButton, { backgroundColor: '#2E7D32' }]} 
                        contentStyle={styles.actionButtonContent}
                        onPress={() => resolve(onAccept)}
                        icon="check"
                    >
                        Aceptar
                    </Button>
                </View>
            </Card.Actions>
        </Card >
    );
}

const styles = StyleSheet.create({
    card: { 
        position: 'absolute', 
        top: 12,
        left: 10,
        right: 10,
        borderRadius: 16,
        ...SHADOWS.LARGE,
        borderWidth: 0,
        paddingTop: 8,
        zIndex: 1000,
        elevation: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        marginBottom: 2,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E88E510',
        marginRight: 8,
    },
    headerText: {
        flex: 1,
    },
    titleText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#212529',
    },
    subtitleText: {
        fontSize: 11,
        marginTop: 1,
    },
    timerText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    cardContent: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    userInfo: { 
        flexDirection: 'row', 
        alignItems: 'center',
        marginBottom: 4,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    userSubtext: {
        fontSize: 11,
        marginTop: 2,
    },
    cardActions: { 
        paddingHorizontal: 12,
        paddingBottom: 6,
        paddingTop: 0,
    },
    buttonRow: { 
        flexDirection: 'row', 
        flex: 1,
        gap: 8,
    },
    actionButton: { 
        flex: 1, 
        borderRadius: BORDER_RADIUS.LG,
        ...SHADOWS.SMALL,
    },
    actionButtonContent: {
        paddingVertical: 0,
    },
});
