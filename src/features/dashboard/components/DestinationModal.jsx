import React, { useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { Text, Button, RadioButton, Divider, ActivityIndicator, useTheme, SegmentedButtons, IconButton } from "react-native-paper";

export default function DestinationModal({ 
    visible, 
    onDismiss, 
    destinos, 
    cargando, 
    error, 
    onRetry, 
    destinoSeleccionado, 
    onSelect, 
    onConfirm 
}) {
    const theme = useTheme();
    const [passengersCount, setPassengersCount] = useState(1);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onDismiss}
        >
            <Pressable style={styles.modalOverlay} onPress={onDismiss}>
                <Pressable style={[styles.modalContent, { backgroundColor: theme.colors.surface }]} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.dragIndicator} />
                    <Text variant="titleLarge" style={styles.modalTitle}>Selecciona tu destino</Text>
                    <Divider style={styles.divider} />

                    <ScrollView style={styles.destinosList} showsVerticalScrollIndicator={false}>
                        {cargando ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator animating={true} size="large" />
                                <Text style={styles.loadingText}>Cargando destinos...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
                                <Button mode="outlined" onPress={onRetry} style={styles.retryButton}>Reintentar</Button>
                            </View>
                        ) : destinos.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No hay destinos disponibles</Text>
                            </View>
                        ) : (
                            <RadioButton.Group
                                onValueChange={(value) => {
                                    const destino = destinos.find(d => d.id.toString() === value);
                                    onSelect(destino);
                                }}
                                value={destinoSeleccionado?.id.toString() || ''}
                            >
                                {destinos.map((destino) => (
                                    <TouchableOpacity
                                        key={destino.id}
                                        style={styles.destinoItem}
                                        onPress={() => onSelect(destino)}
                                        activeOpacity={0.7}
                                    >
                                        <RadioButton.Android value={destino.id.toString()} />
                                        <Text
                                            variant="bodyLarge"
                                            style={[styles.destinoText, destinoSeleccionado?.id === destino.id && { color: theme.colors.primary, fontWeight: 'bold' }]}
                                        >
                                            {destino.nombre}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </RadioButton.Group>
                        )}
                    </ScrollView>

                    {/* Selector de número de pasajeros */}
                    <View style={styles.passengersContainer}>
                        <Text variant="titleMedium" style={styles.passengersTitle}>Número de pasajeros</Text>
                        <View style={styles.passengerCounter}>
                            <IconButton
                                icon="minus-circle"
                                size={32}
                                onPress={() => setPassengersCount(Math.max(1, passengersCount - 1))}
                                disabled={passengersCount <= 1}
                                iconColor={passengersCount <= 1 ? theme.colors.disabled : theme.colors.primary}
                            />
                            <View style={styles.counterDisplay}>
                                <Text variant="headlineMedium" style={[styles.counterText, { color: theme.colors.primary }]}>
                                    {passengersCount}
                                </Text>
                                <Text variant="bodySmall" style={styles.counterLabel}>
                                    {passengersCount === 1 ? 'pasajero' : 'pasajeros'}
                                </Text>
                            </View>
                            <IconButton
                                icon="plus-circle"
                                size={32}
                                onPress={() => setPassengersCount(Math.min(5, passengersCount + 1))}
                                disabled={passengersCount >= 5}
                                iconColor={passengersCount >= 5 ? theme.colors.disabled : theme.colors.primary}
                            />
                        </View>
                    </View>

                    <View style={styles.modalActions}>
                        <Button mode="outlined" onPress={onDismiss} style={styles.actionButton}>Cancelar</Button>
                        <Button 
                            mode="contained" 
                            onPress={() => onConfirm(passengersCount)} 
                            style={styles.actionButton} 
                            disabled={!destinoSeleccionado}
                        >
                            Confirmar
                        </Button>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32, maxHeight: '75%', elevation: 5 },
    dragIndicator: { width: 40, height: 4, backgroundColor: '#BDBDBD', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
    modalTitle: { fontWeight: 'bold', textAlign: 'center', marginBottom: 8, paddingHorizontal: 24 },
    divider: { marginBottom: 16 },
    destinosList: { maxHeight: 400, paddingHorizontal: 16 },
    loadingContainer: { padding: 20, alignItems: 'center' },
    loadingText: { marginTop: 10 },
    errorContainer: { padding: 20, alignItems: 'center' },
    errorText: { textAlign: 'center', marginBottom: 10 },
    retryButton: { marginTop: 10 },
    emptyContainer: { padding: 20, alignItems: 'center' },
    emptyText: { color: 'gray' },
    destinoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
    destinoText: { marginLeft: 12, flex: 1 },
    passengersContainer: { 
        paddingHorizontal: 24, 
        paddingVertical: 16, 
        borderTopWidth: 1, 
        borderTopColor: '#E0E0E0',
        backgroundColor: '#F5F5F5',
    },
    passengersTitle: { 
        fontWeight: '600', 
        marginBottom: 12, 
        textAlign: 'center',
    },
    passengerCounter: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 16,
    },
    counterDisplay: { 
        alignItems: 'center', 
        minWidth: 80,
    },
    counterText: { 
        fontWeight: 'bold',
    },
    counterLabel: { 
        color: 'gray',
        marginTop: 4,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16 },
    actionButton: { flex: 1, marginHorizontal: 8 },
});
