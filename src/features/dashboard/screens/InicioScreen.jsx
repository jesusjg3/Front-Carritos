
import { View, StyleSheet, Platform, ScrollView, Modal, TouchableOpacity, Pressable } from "react-native";
import { Card, Text, Button, RadioButton, Divider, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from 'react-native-webview';
import { useAppContext } from "../../../shared/contexts/AppContext";
import { useTheme } from "react-native-paper";
import { mapaHtml } from "../../../Web/mapaCode";
import React from 'react';
import RideRequestCard from "../components/RideRequestCard";
import StatusToggleButton from "../components/StatusToggleButton";

import { createEcho } from "../../../core/services/echo";
import { API_ROUTES } from "../../../Config/Routes";

import { useState, useEffect, useRef } from "react";
import { API_ROUTES } from "../../../Config/Routes";
import * as Location from 'expo-location';
export default function InicioScreen() {
    const { user, token } = useAppContext();
    const theme = useTheme();
    const [isOnline, setIsOnline] = React.useState(false);
    const [requestQueue, setRequestQueue] = React.useState([]);
    const [echoInstance, setEchoInstance] = React.useState(null);

    // Initial setup for Echo (or when token changes)
    React.useEffect(() => {
        if (token && isOnline) {
            const echo = createEcho(token);
            setEchoInstance(echo);

            // Event Name: NewTripRequest (fully qualified or short depending on config)
            // Default Laravel Broadcast event name is usually `App\Events\NewTripRequest` unless `as` is used or `dots`.
            // Let's assume '.' format if configured, or just short name if client handles namespace. 
            // Usually Echo expects the class name without namespace if configured, or full namespace.
            // Let's listen with dot notation just in case `.` is used, but normally it is `.NewTripRequest` or `NewTripRequest`.
            // Laravel defaults: The event's class name. If you use Reverb/Pusher, usually `App\\Events\\NewTripRequest`.
            // However, most Echo examples use `.NewTripRequest` (dot prefix) to append namespace automatically.
            
            console.log('Echo connected, subscribing to drivers...');

            const channel = echo.private('drivers');

            channel.listen('.NewTripRequest', (event) => {
                console.log('EVENT RECEIVED: NewTripRequest', event);
                setRequestQueue(prev => [...prev, {
                    ...event,
                    origin: event.origin_address || 'Ubicación desconocida',
                    destination: event.destination_address || 'Destino desconocido',
                    distance: `${event.distance} km` 
                }]);
            })
            .listen('.TripTaken', (event) => {
                 console.log('EVENT RECEIVED: .TripTaken', event);
                 setRequestQueue(prev => prev.filter(req => req.id != event.id));
            })
            .listen('TripTaken', (event) => {
                 console.log('EVENT RECEIVED: TripTaken', event);
                 setRequestQueue(prev => prev.filter(req => req.id != event.id));
            })
            .subscribed(() => {
                console.log('Successfully subscribed to private-drivers channel');
            })
            .error((error) => {
                console.error('Echo subscription error:', error);
            });

            return () => {
                echo.disconnect();
                setEchoInstance(null);
            };
        }
    }, [token, isOnline]);

    const handleToggleStatus = () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        
        if (!newStatus) {
            setRequestQueue([]);
        }
    };

    const currentRequest = requestQueue.length > 0 ? requestQueue[0] : null;

    const handleAccept = async () => {
        if (!currentRequest) return;
        
        try {
            console.log('Accepting trip:', currentRequest.id);
            const response = await fetch(`${API_ROUTES.TRIPS}/${currentRequest.id}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Viaje aceptado exitosamente:', data);
                // The TripTaken event will remove it for others, but we should remove it locally immediately
                // and navigate to the "In Trip" screen/state.
                setRequestQueue(prev => prev.slice(1));
                // TODO: Navigate to Active Trip Screen
            } else {
                console.error('Error accepting trip:', data);
                // If 409, it means someone else took it
                if (response.status === 409) {
                     alert("Este viaje ya fue tomado por otro conductor.");
                } else {
                     alert("Error al aceptar el viaje: " + (data.error || "Desconocido"));
                }
                // In both error cases, remove from queue since it's invalid
                setRequestQueue(prev => prev.slice(1));
            }
        } catch (error) {
            console.error('Network error accepting trip:', error);
            alert("Error de conexión al aceptar el viaje.");
        }
    };

    const handleReject = () => {
        console.log('Viaje rechazado');
        setRequestQueue(prev => prev.slice(1));
    const [modalVisible, setModalVisible] = useState(false);
    const [destinoSeleccionado, setDestinoSeleccionado] = useState(null);
    const [destinos, setDestinos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [ubicacion, setUbicacion] = useState(null);
    const [permisoUbicacion, setPermisoUbicacion] = useState(false);
    const webViewRef = useRef(null);

    useEffect(() => {
        cargarDestinos();
        obtenerUbicacion();
    }, []);

    const obtenerUbicacion = async () => {
        try {
            // Solicitar permisos de ubicación
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                console.warn('Permiso de ubicación denegado');
                setPermisoUbicacion(false);
                return;
            }

            setPermisoUbicacion(true);

            // Obtener ubicación actual
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = location.coords;
            setUbicacion({ latitude, longitude });

            console.log('Ubicación del usuario:', { latitude, longitude });

            // Centrar mapa en la ubicación del usuario
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                    if (window.map) {
                        window.map.setView([${latitude}, ${longitude}], 15);
                        L.marker([${latitude}, ${longitude}])
                            .bindPopup('Tu ubicación')
                            .addTo(window.map)
                            .openPopup();
                    }
                `);
            }
        } catch (err) {
            console.error('Error al obtener ubicación:', err);
        }
    };

    const cargarDestinos = async () => {
        try {
            setCargando(true);
            setError(null);

            console.log('Intentando cargar destinos desde:', API_ROUTES.DESTINATIONS);

            const response = await fetch(API_ROUTES.DESTINATIONS);

            console.log('Status de respuesta:', response.status);
            console.log('Status OK:', response.ok);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Error del servidor:', errorData);
                throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Datos recibidos:', data);

            const destinosTransformados = (data.destinations || data || []).map(destino => ({
                ...destino,
                nombre: destino.name || destino.nombre
            }));

            setDestinos(destinosTransformados);
            console.log('Destinos cargados desde backend:', destinosTransformados);
        } catch (err) {
            console.error('Error completo:', err);
            setError(err.message || 'No se pudieron cargar los destinos disponibles');
        } finally {
            setCargando(false);
        }
    };

    const openModal = () => setModalVisible(true);
    const closeModal = () => setModalVisible(false);

    const handleDestinoSelect = (destino) => {
        setDestinoSeleccionado(destino);
        console.log('Destino seleccionado:', destino);
    };

    const confirmarDestino = () => {
        if (destinoSeleccionado) {
            closeModal();
            // TODO: Aquí se enviará el destino seleccionado vía WebSocket para buscar conductores disponibles
            console.log('Buscando conductores para destino:', destinoSeleccionado);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            {/* Mapa */}
            <View style={styles.mapContainer}>
                {Platform.OS === 'web' ? (
                    <iframe
                        title="mapa"
                        srcDoc={mapaHtml}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                ) : (
                    <WebView
                        ref={webViewRef}
                        source={{ html: mapaHtml }}
                        style={styles.map}
                        originWhitelist={['*']}
                        onLoadEnd={() => {
                            // Centrar el mapa cuando carga
                            if (ubicacion && webViewRef.current) {
                                setTimeout(() => {
                                    const jsCode = `
                                        console.log('Intentando centrar mapa en:', ${ubicacion.latitude}, ${ubicacion.longitude});
                                        console.log('Funciones disponibles:', typeof centerMap, typeof placeUserMarker);
                                        
                                        if (typeof centerMap === 'function') {
                                            centerMap(${ubicacion.latitude}, ${ubicacion.longitude});
                                            console.log('centerMap ejecutada');
                                        } else {
                                            console.error('centerMap no está disponible');
                                        }
                                        
                                        if (typeof placeUserMarker === 'function') {
                                            placeUserMarker(${ubicacion.latitude}, ${ubicacion.longitude});
                                            console.log('placeUserMarker ejecutada');
                                        } else {
                                            console.error('placeUserMarker no está disponible');
                                        }
                                        
                                        true;
                                    `;
                                    webViewRef.current.injectJavaScript(jsCode);
                                }, 2000);
                            }
                        }}
                    />
                )}
                
                {/* Driver Status Toggle */}
                <StatusToggleButton 
                    isOnline={isOnline} 
                    onToggle={handleToggleStatus} 
                />

                {/* Incoming Request Card */}
                {currentRequest && (
                    <RideRequestCard 
                        request={currentRequest}
                        onAccept={handleAccept}
                        onReject={handleReject}
                    />
                )}
                {/* Botón flotante sobre el mapa */}
                <View style={styles.floatingButtonContainer}>
                    <Button
                        mode="contained"
                        icon="map-marker-radius"
                        onPress={openModal}
                        style={[styles.floatingButton, { backgroundColor: theme.colors.primary }]}
                        contentStyle={styles.floatingButtonContent}
                        labelStyle={styles.floatingButtonLabel}
                    >
                        {destinoSeleccionado ? destinoSeleccionado.nombre : "Seleccionar Destino"}
                    </Button>
                </View>
            </View>

            {/* Modal de selección de destino (estilo bottom sheet) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <Pressable style={styles.modalOverlay} onPress={closeModal}>
                    <Pressable style={[styles.modalContent, { backgroundColor: theme.colors.surface }]} onPress={(e) => e.stopPropagation()}>
                        {/* Indicador de arrastre */}
                        <View style={styles.dragIndicator} />

                        {/* Título */}
                        <Text variant="titleLarge" style={styles.modalTitle}>
                            Selecciona tu destino
                        </Text>
                        <Divider style={styles.divider} />

                        {/* Lista de destinos con RadioButtons */}
                        <ScrollView style={styles.destinosList} showsVerticalScrollIndicator={false}>
                            {cargando ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator animating={true} size="large" />
                                    <Text style={styles.loadingText}>Cargando destinos...</Text>
                                </View>
                            ) : error ? (
                                <View style={styles.errorContainer}>
                                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                                        {error}
                                    </Text>
                                    <Button
                                        mode="outlined"
                                        onPress={cargarDestinos}
                                        style={styles.retryButton}
                                    >
                                        Reintentar
                                    </Button>
                                </View>
                            ) : destinos.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>
                                        No hay destinos disponibles en este momento
                                    </Text>
                                </View>
                            ) : (
                                <RadioButton.Group
                                    onValueChange={(value) => {
                                        const destino = destinos.find(d => d.id.toString() === value);
                                        handleDestinoSelect(destino);
                                    }}
                                    value={destinoSeleccionado?.id.toString() || ''}
                                >
                                    {destinos.map((destino) => (
                                        <TouchableOpacity
                                            key={destino.id}
                                            style={styles.destinoItem}
                                            onPress={() => handleDestinoSelect(destino)}
                                            activeOpacity={0.7}
                                        >
                                            <RadioButton.Android value={destino.id.toString()} />
                                            <Text
                                                variant="bodyLarge"
                                                style={[
                                                    styles.destinoText,
                                                    destinoSeleccionado?.id === destino.id && {
                                                        color: theme.colors.primary,
                                                        fontWeight: 'bold'
                                                    }
                                                ]}
                                            >
                                                {destino.nombre}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </RadioButton.Group>
                            )}
                        </ScrollView>

                        {/* Botones de acción */}
                        <View style={styles.modalActions}>
                            <Button
                                mode="outlined"
                                onPress={closeModal}
                                style={styles.actionButton}
                            >
                                Cancelar
                            </Button>
                            <Button
                                mode="contained"
                                onPress={confirmarDestino}
                                style={styles.actionButton}
                                disabled={!destinoSeleccionado}
                            >
                                Confirmar
                            </Button>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        zIndex: 100,
    },
    floatingButton: {
        borderRadius: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    floatingButtonContent: {
        paddingVertical: 12,
    },
    floatingButtonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 32,
        maxHeight: '75%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    dragIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#BDBDBD',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    modalTitle: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        paddingHorizontal: 24,
    },
    divider: {
        marginBottom: 16,
    },
    destinosList: {
        maxHeight: 400,
        paddingHorizontal: 16,
    },
    destinoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    destinoText: {
        marginLeft: 12,
        flex: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        textAlign: 'center',
    },
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    errorText: {
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '500',
    },
    retryButton: {
        borderRadius: 8,
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        textAlign: 'center',
        opacity: 0.6,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        borderRadius: 8,
    },
});