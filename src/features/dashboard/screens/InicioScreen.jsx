import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, ScrollView, Alert } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppContext } from "../../../shared/contexts/AppContext";
import { mapaHtml } from "../../../Web/mapaCode";
import { CARRITO_MARKER_BASE64 } from "../../../Web/carritoMarkerBase64";

// Components
import RideRequestCard from "../components/RideRequestCard";
import StatusToggleButton from "../components/StatusToggleButton";
import ActiveTripCard from "../components/ActiveTripCard";
import DestinationModal from "../components/DestinationModal";
import RateDriverModal from "../components/RateDriverModal";
import UniversalMap from "../../../shared/components/UniversalMap";
import RadarView from "../components/RadarView";

// Hooks
import { useLocationLogic } from "../../../shared/hooks/useLocationLogic";
import { useTripLifecycle } from "../../../shared/hooks/useTripLifecycle";
import { useDestinations } from "../../../shared/hooks/useDestinations";
import { useDriverLocation } from "../../../shared/hooks/useDriverLocation";
import { useNearbyDrivers } from "../../../shared/hooks/useNearbyDrivers";

export default function InicioScreen() {
    const { user, token } = useAppContext();
    const theme = useTheme();

    // Local UI State
    const [isOnline, setIsOnline] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [destinoSeleccionado, setDestinoSeleccionado] = useState(null);

    // Crear ref del UniversalMap
    const webViewRef = useRef(null);
    const hasCenteredRef = useRef(false);

    // Derived Roles
    const isPasajero = user && user.role === 'pasajero';
    const isConductor = user && user.role === 'conductor';

    // Custom Hooks
    const {
        requestQueue,
        activeTrip,
        isSearching,
        requestAttempt,
        tripToRate,
        setTripToRate,
        setIsSearching,
        handleAcceptRequest,
        handleRejectRequest,
        handleStartTrip,
        handleFinishTrip,
        requestTrip,
        cancelTrip
    } = useTripLifecycle(user, token, isOnline, isPasajero);

    const {
        ubicacion,
        obtenerUbicacion
    } = useLocationLogic(user, isPasajero);

    const {
        destinos,
        cargandoDestinos,
        errorDestinos,
        cargarDestinos
    } = useDestinations(user, isPasajero);

    // Hook para actualizar ubicación del conductor
    const { location: driverLocation } = useDriverLocation(user, token, isOnline);

    // Hook para obtener conductores cercanos (solo pasajeros)
    const { nearbyDrivers, loading: loadingDrivers } = useNearbyDrivers(
        user,
        token,
        ubicacion,
        isPasajero && !isSearching && !activeTrip
    );

    // Efecto de Limpieza Robusta (Si no hay viaje, mapa limpio)
    React.useEffect(() => {
        if (!activeTrip && webViewRef.current) {
            webViewRef.current.injectJavaScript(`
                if (typeof clearRoute === 'function') clearRoute();
                if (typeof clearDriverMarkers === 'function') clearDriverMarkers();
                if (typeof clearDestinationMarkers === 'function') clearDestinationMarkers();
            `);
        }
    }, [activeTrip]);

    // Limpiar destino seleccionado cuando finaliza el viaje
    useEffect(() => {
        if (tripToRate && ubicacion && webViewRef.current) {
            setDestinoSeleccionado(null);
            const cachedDrivers = JSON.stringify(nearbyDrivers || []);
            webViewRef.current.injectJavaScript(`
                if (typeof clearRoute === 'function') clearRoute();
                if (typeof clearDestinationMarkers === 'function') clearDestinationMarkers();
                if (typeof centerMap === 'function') centerMap(${ubicacion.latitude}, ${ubicacion.longitude});
                if (typeof updateNearbyDrivers === 'function') {
                    updateNearbyDrivers(${cachedDrivers});
                }
            `);
        }
    }, [tripToRate, ubicacion, nearbyDrivers]);

    // Efecto para actualizar conductores en el mapa
    React.useEffect(() => {
        if (isPasajero && webViewRef.current) {
            const driversData = JSON.stringify(nearbyDrivers || []);
            webViewRef.current.injectJavaScript(`
                if (typeof updateNearbyDrivers === 'function') {
                    updateNearbyDrivers(${driversData});
                }
            `);
        }
    }, [nearbyDrivers, isPasajero]);

    // Efecto para renderizar Destinos / Puntos de Interés (Solo si no hay viaje activo)
    React.useEffect(() => {
        if (!activeTrip && webViewRef.current) {
            const destData = JSON.stringify(destinos || []);
            webViewRef.current.injectJavaScript(`
                if (typeof addDestinationMarkers === 'function') {
                    addDestinationMarkers(${destData});
                }
            `);
        }
    }, [destinos, activeTrip]);

    // Efecto de limpieza temprana de estado para que no sobreviva un destino tras un viaje
    React.useEffect(() => {
        if (activeTrip) setDestinoSeleccionado(null);
    }, [activeTrip]);

    // Resetear el bloqueo de cámara en cada cambio de etapa para que encuadre la nueva ruta completa
    React.useEffect(() => {
        hasCenteredRef.current = false;
    }, [activeTrip?.status, activeTrip?.state_id, activeTrip?.id]);

    // Efecto para dibujar ruta cuando se selecciona destino
    React.useEffect(() => {
        if (isPasajero && destinoSeleccionado && ubicacion && webViewRef.current && !activeTrip) {
            webViewRef.current.injectJavaScript(`
                if (typeof drawRoute === 'function') {
                    drawRoute(${ubicacion.latitude}, ${ubicacion.longitude}, ${destinoSeleccionado.latitude}, ${destinoSeleccionado.longitude}, 400);
                }
                true;
            `);
        }
    }, [destinoSeleccionado, ubicacion, isPasajero, activeTrip]);

    // Efecto para limpiar ruta cuando se cancela selección
    React.useEffect(() => {
        if (isPasajero && !destinoSeleccionado && webViewRef.current) {
            if (!activeTrip) {
                const destData = JSON.stringify(destinos || []);
                webViewRef.current.injectJavaScript(`
                    if (typeof clearRoute === 'function') {
                        clearRoute();
                    }
                    if (typeof addDestinationMarkers === 'function') {
                        addDestinationMarkers(${destData});
                    }
                    true;
                `);
            }
        }
    }, [destinoSeleccionado, isPasajero, activeTrip, destinos]);

    const tripIsAccepted = (trip) => {
        if (!trip) return false;
        return trip.status === 'aceptado' || trip.status === 'accepted' || trip.state === 'accepted' || trip.state_id === 2 || trip.state_id === 3;
    };

    const tripInProgress = (trip) => {
        if (!trip) return false;
        return trip.status === 'en_progreso' || trip.status === 'in_progress' || trip.state === 'in_progress' || trip.state_id === 4;
    };

    // ========== EFECTO UNIFICADO DE MAPA ==========
    React.useEffect(() => {
        if (!webViewRef.current) return;

        const isPhase1 = tripIsAccepted(activeTrip); // Yendo al Pickup
        const isPhase2 = tripInProgress(activeTrip); // Yendo al Destino
        const isIdle = !isPhase1 && !isPhase2;

        if (isIdle) {
            if (ubicacion) {
                const lat = parseFloat(ubicacion.latitude);
                const lng = parseFloat(ubicacion.longitude);

                webViewRef.current.injectJavaScript(`
                    if (typeof placeUserMarker === 'function') {
                        placeUserMarker(${lat}, ${lng}, null, ${isConductor});
                    }
                    if (typeof centerMap === 'function') {
                        centerMap(${lat}, ${lng});
                    }
                    true;
                `);
            }
            return;
        }

        let start = { lat: 0, lng: 0 };
        let end = { lat: 0, lng: 0 };
        let padding = 100;
        let validCoords = false;

        const getVal = (v) => parseFloat(v) || 0;

        if (isPhase1) {
            end = {
                lat: getVal(activeTrip.origin_lat || activeTrip.origin?.lat),
                lng: getVal(activeTrip.origin_lng || activeTrip.origin?.lng)
            };

            if (isConductor) {
                start = { lat: getVal(ubicacion?.latitude), lng: getVal(ubicacion?.longitude) };
            } else {
                start = {
                    lat: getVal(activeTrip.driver?.latitude),
                    lng: getVal(activeTrip.driver?.longitude)
                };
            }
            padding = 180;
        } else if (isPhase2) {
            end = {
                lat: getVal(activeTrip.destination_lat || activeTrip.destination?.lat),
                lng: getVal(activeTrip.destination_lng || activeTrip.destination?.lng)
            };

            if (isConductor && ubicacion) {
                // El conductor CONFÍA en su propio GPS para trazar/recortar la ruta localmente sin lag
                start = { lat: getVal(ubicacion.latitude), lng: getVal(ubicacion.longitude) };
            } else {
                // El pasajero confía en la base de datos retransmitida
                start = { 
                    lat: getVal(activeTrip.driver?.latitude), 
                    lng: getVal(activeTrip.driver?.longitude) 
                };
            }

            if (start.lat === 0 && ubicacion) {
                start = { lat: getVal(ubicacion.latitude), lng: getVal(ubicacion.longitude) };
            }
            padding = 100;
        }

        validCoords = (start.lat !== 0 && start.lng !== 0 && end.lat !== 0 && end.lng !== 0);

        let script = '';

        const showUserMarker = isConductor || !isPhase2;
        if (showUserMarker && ubicacion) {
            if (isConductor) {
                // Forzar inyección del carrito global para evitar que se ponga el puntito azul estático
                const escapedIconUrl = CARRITO_MARKER_BASE64.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                script += `if (typeof setCarritoIcon === 'function') setCarritoIcon('${escapedIconUrl}');`;
            }
            script += `
                if (typeof placeUserMarker === 'function') {
                    placeUserMarker(${getVal(ubicacion.latitude)}, ${getVal(ubicacion.longitude)}, null, ${isConductor});
                }
            `;
        } else {
            script += `
                if (typeof removeUserMarker === 'function') {
                    removeUserMarker();
                }
            `;
        }

        if (validCoords) {
            const driverInfo = JSON.stringify([{
                id: activeTrip.driver?.id || 'driver',
                lat: start.lat,
                lng: start.lng,
                name: activeTrip.driver?.name || 'Conductor',
                iconUrl: activeTrip.driver?.iconUrl || CARRITO_MARKER_BASE64
            }]);

            const shouldAnimateZoom = isPhase1;

            script += `
                if (typeof drawRoute === 'function') {
                    drawRoute(${start.lat}, ${start.lng}, ${end.lat}, ${end.lng}, ${padding}, ${shouldAnimateZoom});
                }
                
                if (!${isConductor} && typeof updateNearbyDrivers === 'function') {
                    updateNearbyDrivers(${driverInfo});
                }

                if (${isPhase2} && typeof centerMap === 'function') {
                    centerMap(${start.lat}, ${start.lng});
                }
            `;
        } else if (ubicacion && !hasCenteredRef.current) {
            script += `
                if (typeof centerMap === 'function') {
                    centerMap(${getVal(ubicacion.latitude)}, ${getVal(ubicacion.longitude)});
                }
             `;
            hasCenteredRef.current = true;
        }

        if (script) {
            webViewRef.current.injectJavaScript(script + 'true;');
        }
    }, [
        activeTrip?.driver?.latitude,
        activeTrip?.driver?.longitude,
        activeTrip?.driver?.location?.last_update, 
        activeTrip?.state_id,
        isConductor,
        isPasajero,
        ubicacion
    ]);

    const handleToggleStatus = () => setIsOnline(!isOnline);

    const handleWebViewMessage = (event) => {
        try {
            const data = typeof event.nativeEvent.data === 'string' ? JSON.parse(event.nativeEvent.data) : event.nativeEvent.data;

            if (data.type === 'MAP_DOUBLE_TAP' && isPasajero) {
                const customDestino = {
                    id: 'custom-' + Date.now(),
                    nombre: 'Ubicación personalizada',
                    address: `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`,
                    latitude: data.latitude,
                    longitude: data.longitude
                };
                setDestinoSeleccionado(customDestino);
            }
        } catch (err) {
            console.error('Error parsing map message:', err);
        }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(2));
    };

    const confirmRequestTrip = async (passengersCount) => {
        if (!destinoSeleccionado || !ubicacion) {
            alert("Necesitamos tu ubicación y un destino.");
            return;
        }

        // --- Geofence check: Verificar si está dentro de la zona permitida ---
        const centerLat = parseFloat(process.env.EXPO_PUBLIC_CAMPUS_CENTER_LAT);
        const centerLng = parseFloat(process.env.EXPO_PUBLIC_CAMPUS_CENTER_LNG);
        const radiusKm = parseFloat(process.env.EXPO_PUBLIC_CAMPUS_RADIUS_KM);

        const distFromCenter = calculateDistance(ubicacion.latitude, ubicacion.longitude, centerLat, centerLng);
        if (distFromCenter > radiusKm) {
            Alert.alert("Fuera de zona", "Estás fuera de la zona de servicio permitida para pedir carritos.");
            return;
        }

        const dist = calculateDistance(ubicacion.latitude, ubicacion.longitude, destinoSeleccionado.latitude, destinoSeleccionado.longitude);

        const success = await requestTrip(ubicacion, destinoSeleccionado, dist, passengersCount);
        if (success) {
            setModalVisible(false);
        }
    };

    // --- RENDER ---

    if (isSearching) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
                <View style={styles.searchingContainer}>
                    <Text variant="headlineMedium" style={styles.searchingTitle}>Buscando conductores...</Text>
                    <Text variant="bodySmall" style={[styles.searchingSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Tiempo estimado de espera: ~2 min
                    </Text>

                    <RadarView ubicacion={ubicacion} />

                    <Text variant="bodySmall" style={[styles.searchingSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Intento #{requestAttempt}
                    </Text>
                    <Button mode="contained" onPress={() => { cancelTrip(); setDestinoSeleccionado(null); }} style={styles.cancelButton} buttonColor={theme.colors.error}>
                        Cancelar Solicitud
                    </Button>
                </View>
            </SafeAreaView>
        );
    }

    if (activeTrip) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
                <View style={[styles.mapContainer, { flex: 0.6 }]}>
                    <UniversalMap
                        ref={webViewRef}
                        source={{ html: mapaHtml }}
                        style={styles.map}
                        onMessage={handleWebViewMessage}
                        onLoadEnd={() => {
                            if (webViewRef.current) {
                                const escapedIconUrl = CARRITO_MARKER_BASE64.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                                webViewRef.current.injectJavaScript(`
                                    if (typeof setCarritoIcon === 'function') setCarritoIcon('${escapedIconUrl}');
                                `);
                            }
                        }}
                    />
                </View>
                <ActiveTripCard
                    activeTrip={activeTrip}
                    isPasajero={isPasajero}
                    onContact={() => alert('Contactando...')}
                    onCancel={() => {
                        Alert.alert(
                            "Cancelar Viaje",
                            "¿Estás seguro de que deseas cancelar este viaje?",
                            [
                                { text: "No", style: "cancel" },
                                { text: "Sí, cancelar", onPress: () => cancelTrip() }
                            ]
                        );
                    }}
                    onStartTrip={handleStartTrip}
                    onFinishTrip={handleFinishTrip}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <View style={styles.mapContainer}>
                <UniversalMap
                    ref={webViewRef}
                    source={{ html: mapaHtml }}
                    style={styles.map}
                    onMessage={handleWebViewMessage}
                    onLoadEnd={() => {
                        if (webViewRef.current) {
                            const escapedIconUrl = CARRITO_MARKER_BASE64.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                            webViewRef.current.injectJavaScript(`
                                if (typeof setCarritoIcon === 'function') setCarritoIcon('${escapedIconUrl}');
                            `);

                            if ((isPasajero || isConductor) && ubicacion) {
                                webViewRef.current.injectJavaScript(`
                                    if (typeof centerMap === 'function') centerMap(${ubicacion.latitude}, ${ubicacion.longitude});
                                    if (typeof placeUserMarker === 'function') placeUserMarker(${ubicacion.latitude}, ${ubicacion.longitude}, null, ${isConductor});
                                `);
                            }
                        }
                    }}
                />

                {isConductor && (
                    <StatusToggleButton isOnline={isOnline} onToggle={handleToggleStatus} />
                )}

                {isConductor && requestQueue.length > 0 && (
                    <View style={styles.requestsContainer}>
                        <ScrollView style={styles.requestsScroll} contentContainerStyle={styles.requestsContent} showsVerticalScrollIndicator={false}>
                            {requestQueue.map((req, index) => (
                                <RideRequestCard
                                    key={req.id || index}
                                    request={req}
                                    onAccept={() => handleAcceptRequest(req)}
                                    onReject={handleRejectRequest}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {isPasajero && (
                    <View style={styles.floatingButtonContainer}>
                        <Button
                            mode="contained"
                            icon="map-marker-radius"
                            onPress={() => setModalVisible(true)}
                            style={[styles.floatingButton, { backgroundColor: theme.colors.primary }]}
                            contentStyle={styles.floatingButtonContent}
                            labelStyle={styles.floatingButtonLabel}
                        >
                            {destinoSeleccionado ? destinoSeleccionado.nombre : "Seleccionar Destino"}
                        </Button>
                    </View>
                )}
            </View>

            <DestinationModal
                visible={modalVisible}
                onDismiss={() => {
                    setModalVisible(false);
                    setDestinoSeleccionado(null);
                }}
                destinos={destinos}
                cargando={cargandoDestinos}
                error={errorDestinos}
                onRetry={cargarDestinos}
                destinoSeleccionado={destinoSeleccionado}
                onSelect={setDestinoSeleccionado}
                onConfirm={confirmRequestTrip}
            />

            <RateDriverModal
                visible={!!tripToRate}
                trip={tripToRate}
                onDismiss={() => setTripToRate(null)}
                onRateSuccess={() => setTripToRate(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapContainer: { flex: 1, position: 'relative' },
    map: { flex: 1 },
    floatingButtonContainer: { position: 'absolute', bottom: 20, left: 16, right: 16, zIndex: 100 },
    floatingButton: { borderRadius: 12, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    floatingButtonContent: { paddingVertical: 12 },
    floatingButtonLabel: { fontSize: 16, fontWeight: '600' },
    searchingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    searchingTitle: { fontWeight: 'bold', textAlign: 'center' },
    searchingSubtitle: { textAlign: 'center' },
    cancelButton: { width: '100%', maxWidth: 300, paddingVertical: 8 },
    requestsContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        maxHeight: '65%',
        zIndex: 20,
    },
    requestsScroll: { flex: 1 },
    requestsContent: { paddingBottom: 0, flexGrow: 1, justifyContent: 'flex-end' },
});