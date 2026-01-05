import React from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { Text, Button, RadioButton, Divider, ActivityIndicator, useTheme } from "react-native-paper";

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

                    <View style={styles.modalActions}>
                        <Button mode="outlined" onPress={onDismiss} style={styles.actionButton}>Cancelar</Button>
                        <Button mode="contained" onPress={onConfirm} style={styles.actionButton} disabled={!destinoSeleccionado}>Confirmar</Button>
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
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16 },
    actionButton: { flex: 1, marginHorizontal: 8 },
});
