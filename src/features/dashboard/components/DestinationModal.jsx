import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";
import { Text, Button, Divider, ActivityIndicator, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SHADOWS, BORDER_RADIUS } from "../../../core/constants/theme";
import AppModal from "../../../shared/components/AppModal";

export default function DestinationModal({ 
    visible, 
    onDismiss, 
    destinos, 
    cargando, 
    error, 
    onRetry, 
    destinoSeleccionado, 
    onSelect, 
    onConfirm,
    ubicacionActual
}) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const [passengersCount, setPassengersCount] = useState(1);
    const modalHeight = Math.min(height * 0.74, 500);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; 
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return parseFloat((R * c).toFixed(2));
    };

    return (
        <AppModal
            visible={visible}
            onDismiss={onDismiss}
            animation="slide"
            placement="bottom"
        >
                <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, height: modalHeight, paddingBottom: Math.max(12, insets.bottom) }]}>
                    {/* Sliding drag indicator bar */}
                    <View style={[styles.dragIndicator, { backgroundColor: theme.colors.outline }]} />
                    
                    <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.primary }]}>
                        ¿A dónde quieres ir?
                    </Text>
                    <Text variant="bodySmall" style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Selecciona un punto de destino autorizado en el campus
                    </Text>
                    
                    <Divider style={styles.divider} />

                    <ScrollView style={styles.destinosList} showsVerticalScrollIndicator={false}>
                        {cargando ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
                                <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>Cargando destinos del campus...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={32} color={theme.colors.error} />
                                <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
                                <Button mode="outlined" onPress={onRetry} style={styles.retryButton}>Reintentar</Button>
                            </View>
                        ) : destinos.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="map-marker-off-outline" size={32} color={theme.colors.onSurfaceVariant} />
                                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No hay destinos disponibles</Text>
                            </View>
                        ) : (
                            <View style={styles.listWrapper}>
                                {destinos.map((destino) => {
                                    const distancia = ubicacionActual 
                                        ? calculateDistance(ubicacionActual.latitude, ubicacionActual.longitude, destino.latitude, destino.longitude)
                                        : null;
                                    const isSelected = destinoSeleccionado?.id === destino.id;

                                    return (
                                        <TouchableOpacity
                                            key={destino.id}
                                            style={[
                                                styles.destinoItemCard,
                                                { backgroundColor: theme.colors.surface },
                                                isSelected && [styles.selectedCard, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '05' }]
                                            ]}
                                            onPress={() => onSelect(destino)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={[styles.itemLeftIconBg, { backgroundColor: isSelected ? theme.colors.primary + '15' : theme.colors.surfaceVariant }]}>
                                                <MaterialCommunityIcons 
                                                    name="map-marker-radius" 
                                                    size={22} 
                                                    color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                                                />
                                            </View>

                                            <View style={styles.destinoInfo}>
                                                <Text style={[styles.destinoText, { color: isSelected ? theme.colors.primary : theme.colors.onSurface }, isSelected && { fontWeight: 'bold' }]}>
                                                    {destino.name || destino.nombre || 'Destino Desconocido'}
                                                </Text>
                                                <Text style={[styles.destinoSubtext, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                                                    {destino.description || 'Punto de destino en el campus'}
                                                </Text>
                                            </View>

                                            {distancia !== null && (
                                                <View style={[styles.distanceBadge, { backgroundColor: isSelected ? theme.colors.primary + '10' : theme.colors.surfaceVariant }]}>
                                                    <Text style={[styles.distanceText, { color: isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
                                                        {distancia} km
                                                    </Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </ScrollView>

                    {/* Selector de número de pasajeros */}
                    <View style={[styles.passengersContainer, { backgroundColor: theme.colors.surfaceVariant, borderTopColor: theme.colors.outline }]}>
                        <Text style={[styles.passengersTitle, { color: theme.colors.onSurface }]}>Número de pasajeros a bordo</Text>
                        
                        <View style={styles.passengerCounter}>
                            <TouchableOpacity
                                style={[styles.counterButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }, passengersCount <= 1 && [styles.counterButtonDisabled, { backgroundColor: theme.colors.surfaceVariant }]]}
                                onPress={() => setPassengersCount(Math.max(1, passengersCount - 1))}
                                disabled={passengersCount <= 1}
                            >
                                <MaterialCommunityIcons name="minus" size={20} color={passengersCount <= 1 ? theme.colors.onSurfaceVariant : theme.colors.primary} />
                            </TouchableOpacity>

                            <View style={styles.counterDisplay}>
                                <Text style={[styles.counterText, { color: theme.colors.primary }]}>
                                    {passengersCount}
                                </Text>
                                <Text style={[styles.counterLabel, { color: theme.colors.onSurfaceVariant }]}>
                                    {passengersCount === 1 ? 'Persona' : 'Personas'}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.counterButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }, passengersCount >= 5 && [styles.counterButtonDisabled, { backgroundColor: theme.colors.surfaceVariant }]]}
                                onPress={() => setPassengersCount(Math.min(5, passengersCount + 1))}
                                disabled={passengersCount >= 5}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color={passengersCount >= 5 ? theme.colors.onSurfaceVariant : theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Dialog Buttons */}
                    <View style={styles.modalActions}>
                        <Button 
                            mode="outlined" 
                            onPress={onDismiss} 
                            style={[styles.actionButton, { borderColor: theme.colors.primary + '30' }]}
                            textColor={theme.colors.primary}
                            contentStyle={styles.actionButtonContent}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            mode="contained" 
                            onPress={() => onConfirm(passengersCount)} 
                            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]} 
                            contentStyle={styles.actionButtonContent}
                            disabled={!destinoSeleccionado}
                        >
                            Pedir Carrito
                        </Button>
                    </View>
                </View>
        </AppModal>
    );
}

const styles = StyleSheet.create({
    modalContent: {
        width: '100%',
        flexDirection: 'column',
        flexShrink: 1,
        borderTopLeftRadius: 28, 
        borderTopRightRadius: 28, 
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        paddingBottom: 12,
        ...SHADOWS.LARGE,
        borderWidth: 0,
    },
    dragIndicator: { 
        width: 44, 
        height: 5, 
        borderRadius: 2.5, 
        alignSelf: 'center', 
        marginTop: 10, 
        marginBottom: 10
    },
    modalTitle: { 
        fontWeight: 'bold', 
        textAlign: 'center', 
        paddingHorizontal: 24 
    },
    modalSubtitle: {
        textAlign: 'center',
        marginTop: 4,
        paddingHorizontal: 24,
    },
    divider: { marginTop: 10, marginBottom: 10 },
    destinosList: { flex: 1, minHeight: 0, paddingHorizontal: 12 },
    loadingContainer: { padding: 20, alignItems: 'center' },
    loadingText: { marginTop: 12, color: 'gray' },
    errorContainer: { padding: 20, alignItems: 'center' },
    errorText: { textAlign: 'center', marginVertical: 8 },
    retryButton: { marginTop: 8 },
    emptyContainer: { padding: 30, alignItems: 'center' },
    emptyText: { marginTop: 8 },
    listWrapper: {
        gap: 12,
        paddingBottom: 16,
    },
    destinoItemCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 10,
        borderRadius: BORDER_RADIUS.LG,
        borderWidth: 0,
        ...SHADOWS.SMALL,
    },
    selectedCard: {
        ...SHADOWS.MEDIUM,
    },
    itemLeftIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    destinoInfo: { flex: 1 },
    destinoText: { 
        fontSize: 14,
        fontWeight: 'bold',
    },
    destinoSubtext: {
        fontSize: 12,
        marginTop: 2,
    },
    distanceBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 10,
    },
    distanceText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    passengersContainer: { 
        paddingHorizontal: 24, 
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    passengersTitle: { 
        fontWeight: 'bold', 
        fontSize: 13,
        marginBottom: 8,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    passengerCounter: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 24,
    },
    counterButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.SMALL,
        borderWidth: 1,
    },
    counterButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    counterDisplay: { 
        alignItems: 'center', 
        minWidth: 80,
    },
    counterText: { 
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 28,
    },
    counterLabel: { 
        fontSize: 11,
        marginTop: 2,
    },
    modalActions: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16,
        paddingTop: 10,
        gap: 12,
    },
    actionButton: { flex: 1, borderRadius: BORDER_RADIUS.LG },
    actionButtonContent: {
        paddingVertical: 4,
    },
});
