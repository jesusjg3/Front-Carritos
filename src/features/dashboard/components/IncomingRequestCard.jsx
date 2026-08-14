import React from 'react';
import { View, StyleSheet } from "react-native";
import { Card, Text, Button, useTheme } from "react-native-paper";
import { SHADOWS, COLORS, BORDER_RADIUS } from '../../../core/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function IncomingRequestCard({
    incomingRequest,
    onAccept,
    onReject
}) {
    const theme = useTheme();

    if (!incomingRequest) return null;

    const passenger = incomingRequest.passenger;

    return (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.sheetIndicator} />
            
            <View style={styles.headerRow}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="account-plus" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.titleText}>Nuevo pasajero en ruta</Text>
                    <Text style={styles.subtitleText}>Quiere unirse a tu viaje</Text>
                </View>
            </View>

            <Card.Content style={styles.cardContent}>
                <View style={styles.userInfo}>
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{passenger?.name || 'Pasajero'}</Text>
                        <Text style={styles.userSubtext}>Recoger en: {passenger?.pickup_address || 'Ubicación desconocida'}</Text>
                        <Text style={styles.userSubtext}>Pasajeros a subir: {passenger?.passengers_count || 1}</Text>
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
                        onPress={onReject}
                        icon="close"
                    >
                        Ignorar
                    </Button>
                    <Button 
                        mode="contained" 
                        style={[styles.actionButton, { backgroundColor: '#2E7D32' }]} 
                        contentStyle={styles.actionButtonContent}
                        onPress={onAccept}
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
        bottom: 0, 
        left: 0, 
        right: 0, 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24, 
        ...SHADOWS.LARGE,
        borderWidth: 1.5,
        borderColor: '#EEEEEE',
        paddingTop: 8,
        zIndex: 1000, // Ensure it sits above ActiveTripCard
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
    cardContent: {
        paddingHorizontal: 20,
        paddingVertical: 14,
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
        fontSize: 15,
        fontWeight: 'bold',
        color: '#212529',
    },
    userSubtext: {
        fontSize: 13,
        color: '#555',
        marginTop: 2,
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
