import React, { useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { Text, Button, Divider, ActivityIndicator, useTheme, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SHADOWS, COLORS, BORDER_RADIUS } from "../../../core/constants/theme";

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
    const [passengersCount, setPassengersCount] = useState(1);

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
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onDismiss}
        >
            <Pressable style={styles.modalOverlay} onPress={onDismiss}>
                <Pressable style={[styles.modalContent, { backgroundColor: theme.colors.surface }]} onPress={(e) => e.stopPropagation()}>
                    {/* Sliding drag indicator bar */}
                    <View style={styles.dragIndicator} />
                    
                    <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.primary }]}>
                        ¿A dónde quieres ir?
                    </Text>
                    <Text variant="bodySmall" style={styles.modalSubtitle}>
                        Selecciona un punto de destino autorizado en el campus
                    </Text>
                    
                    <Divider style={styles.divider} />

                    <ScrollView style={styles.destinosList} showsVerticalScrollIndicator={false}>
                        {cargando ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
                                <Text style={styles.loadingText}>Cargando destinos del campus...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={32} color={theme.colors.error} />
                                <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
                                <Button mode="outlined" onPress={onRetry} style={styles.retryButton}>Reintentar</Button>
                            </View>
                        ) : destinos.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="map-marker-off-outline" size={32} color="#CCC" />
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
                                                isSelected && [styles.selectedCard, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '05' }]
                                            ]}
                                            onPress={() => onSelect(destino)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={[styles.itemLeftIconBg, { backgroundColor: isSelected ? theme.colors.primary + '15' : '#F8F9FA' }]}>
                                                <MaterialCommunityIcons 
                                                    name="map-marker-radius" 
                                                    size={22} 
                                                    color={isSelected ? theme.colors.primary : '#6C757D'} 
                                                />
                                            </View>

                                            <View style={styles.destinoInfo}>
                                                <Text style={[styles.destinoText, isSelected && { color: theme.colors.primary, fontWeight: 'bold' }]}>
                                                    {destino.nombre}
                                                </Text>
                                                <Text style={styles.destinoSubtext} numberOfLines={1}>
                                                    {destino.description || 'Punto de destino en el campus'}
                                                </Text>
                                            </View>

                                            {distancia !== null && (
                                                <View style={[styles.distanceBadge, { backgroundColor: isSelected ? theme.colors.primary + '10' : '#EAEAEA' }]}>
                                                    <Text style={[styles.distanceText, { color: isSelected ? theme.colors.primary : '#495057' }]}>
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
                    <View style={[styles.passengersContainer, { backgroundColor: '#F8F9FA', borderTopColor: '#EEEEEE' }]}>
                        <Text style={styles.passengersTitle}>Número de pasajeros a bordo</Text>
                        
                        <View style={styles.passengerCounter}>
                            <TouchableOpacity
                                style={[styles.counterButton, passengersCount <= 1 && styles.counterButtonDisabled]}
                                onPress={() => setPassengersCount(Math.max(1, passengersCount - 1))}
                                disabled={passengersCount <= 1}
                            >
                                <MaterialCommunityIcons name="minus" size={20} color={passengersCount <= 1 ? '#CCC' : theme.colors.primary} />
                            </TouchableOpacity>

                            <View style={styles.counterDisplay}>
                                <Text style={[styles.counterText, { color: theme.colors.primary }]}>
                                    {passengersCount}
                                </Text>
                                <Text style={styles.counterLabel}>
                                    {passengersCount === 1 ? 'Persona' : 'Personas'}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.counterButton, passengersCount >= 5 && styles.counterButtonDisabled]}
                                onPress={() => setPassengersCount(Math.min(5, passengersCount + 1))}
                                disabled={passengersCount >= 5}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color={passengersCount >= 5 ? '#CCC' : theme.colors.primary} />
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
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
    modalContent: { 
        borderTopLeftRadius: 28, 
        borderTopRightRadius: 28, 
        paddingBottom: 32, 
        maxHeight: '80%', 
        ...SHADOWS.LARGE,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    dragIndicator: { 
        width: 44, 
        height: 5, 
        borderRadius: 2.5, 
        backgroundColor: '#E0E0E0', 
        alignSelf: 'center', 
        marginTop: 10, 
        marginBottom: 16 
    },
    modalTitle: { 
        fontWeight: 'bold', 
        textAlign: 'center', 
        paddingHorizontal: 24 
    },
    modalSubtitle: {
        textAlign: 'center',
        color: '#6C757D',
        marginTop: 4,
        paddingHorizontal: 24,
    },
    divider: { marginTop: 12, marginBottom: 16 },
    destinosList: { maxHeight: 320, paddingHorizontal: 16 },
    loadingContainer: { padding: 30, alignItems: 'center' },
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
        padding: 12, 
        backgroundColor: '#FFFFFF',
        borderRadius: BORDER_RADIUS.LG,
        borderWidth: 1.5,
        borderColor: '#EEEEEE',
        ...SHADOWS.SMALL,
    },
    selectedCard: {
        ...SHADOWS.MEDIUM,
    },
    itemLeftIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    destinoInfo: { flex: 1 },
    destinoText: { 
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    destinoSubtext: {
        fontSize: 12,
        color: '#777',
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
        paddingVertical: 16, 
        borderTopWidth: 1,
    },
    passengersTitle: { 
        fontWeight: 'bold', 
        fontSize: 13,
        color: '#495057',
        marginBottom: 12, 
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
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.SMALL,
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    counterButtonDisabled: {
        backgroundColor: '#F5F5F5',
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
        color: '#6C757D',
        marginTop: 2,
    },
    modalActions: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingTop: 16,
        gap: 12,
    },
    actionButton: { flex: 1, borderRadius: BORDER_RADIUS.LG },
    actionButtonContent: {
        paddingVertical: 8,
    },
});
