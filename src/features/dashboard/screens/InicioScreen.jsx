import React, { useState } from 'react';
import { View, StyleSheet, Platform } from "react-native";
import { Text, Button, ActivityIndicator, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from 'react-native-webview';

import { useAppContext } from "../../../shared/contexts/AppContext";
import { mapaHtml } from "../../../Web/mapaCode";

// Components
import RideRequestCard from "../components/RideRequestCard";
import StatusToggleButton from "../components/StatusToggleButton";
import ActiveTripCard from "../components/ActiveTripCard";
import DestinationModal from "../components/DestinationModal";

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

    // Derived Roles
    const isPasajero = user && user.role === 'pasajero';
    const isConductor = user && user.role === 'conductor';

    // Custom Hooks
    const { 
        requestQueue, 
        activeTrip, 
        isSearching,
        requestAttempt,
        setIsSearching, 
        handleAcceptRequest, 
        handleRejectRequest, 
        handleStartTrip, 
        handleFinishTrip,
        requestTrip 
    } = useTripLifecycle(user, token, isOnline, isPasajero);

    const { 
        ubicacion, 
        webViewRef, 
        obtenerUbicacion 
    } = useLocationLogic(user, isPasajero, activeTrip);

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

    // Efecto para actualizar conductores en el mapa
    React.useEffect(() => {
        if (isPasajero && nearbyDrivers.length > 0 && webViewRef.current) {
            const driversData = JSON.stringify(nearbyDrivers);
            webViewRef.current.injectJavaScript(`
                if (typeof updateNearbyDrivers === 'function') {
                    updateNearbyDrivers(${driversData});
                }
            `);
        }
    }, [nearbyDrivers, isPasajero]);


    // Handlers
    const handleToggleStatus = () => setIsOnline(!isOnline);
    
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

    const confirmRequestTrip = async (passengersCount) => {
        if (!destinoSeleccionado || !ubicacion) {
            alert("Necesitamos tu ubicación y un destino.");
            return;
        }
        const dist = calculateDistance(ubicacion.latitude, ubicacion.longitude, destinoSeleccionado.latitude, destinoSeleccionado.longitude);
        
        const success = await requestTrip(ubicacion, destinoSeleccionado, dist, passengersCount);
        if (success) {
            setModalVisible(false);
        }
    };

    // --- RENDER ---
    
    // 1. Searching View
    if (isSearching) {
         return (
             <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
                 <View style={styles.searchingContainer}>
                     <Text variant="headlineMedium" style={styles.searchingTitle}>Buscando conductor...</Text>
                     <Text variant="bodySmall" style={styles.searchingSubtitle}>Intento #{requestAttempt}</Text>
                     <ActivityIndicator size="large" animating={true} color={theme.colors.primary} style={{ marginVertical: 20 }} />
                     <View style={styles.radarContainer}>
                         <View style={[styles.radarCircle, { borderColor: theme.colors.primary }]} />
                         <View style={[styles.radarCircle, { width: 150, height: 150, opacity: 0.5, borderColor: theme.colors.primary }]} />
                     </View>
                     <Button mode="contained" onPress={() => setIsSearching(false)} style={styles.cancelButton} buttonColor={theme.colors.error}>
                         Cancelar Solicitud
                     </Button>
                 </View>
             </SafeAreaView>
         );
    }

    // 2. Active Trip View
    if (activeTrip) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
                <View style={[styles.mapContainer, { flex: 0.6 }]}>
                    <WebView
                        ref={webViewRef}
                        source={{ html: mapaHtml }}
                        style={styles.map}
                        originWhitelist={['*']}
                    />
                </View>
                <ActiveTripCard 
                    activeTrip={activeTrip}
                    isPasajero={isPasajero}
                    onContact={() => alert('Contactando...')}
                    onCancel={() => alert('Cancel feature pending')}
                    onStartTrip={handleStartTrip}
                    onFinishTrip={handleFinishTrip}
                />
            </SafeAreaView>
        );
    }

    // 3. Default View (Map + Controls)
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <View style={styles.mapContainer}>
                {Platform.OS === 'web' ? (
                    <iframe title="mapa" srcDoc={mapaHtml} style={{ width: '100%', height: '100%', border: 'none' }} />
                ) : (
                    <WebView
                        ref={webViewRef}
                        source={{ html: mapaHtml }}
                        style={styles.map}
                        originWhitelist={['*']}
                        onLoadEnd={() => {
                            if (isPasajero && ubicacion && webViewRef.current) {
                                setTimeout(() => {
                                    webViewRef.current.injectJavaScript(`
                                        if (typeof centerMap === 'function') centerMap(${ubicacion.latitude}, ${ubicacion.longitude});
                                        if (typeof placeUserMarker === 'function') placeUserMarker(${ubicacion.latitude}, ${ubicacion.longitude});
                                    `);
                                }, 2000);
                            }
                        }}
                    />
                )}
                
                {isConductor && (
                    <StatusToggleButton isOnline={isOnline} onToggle={handleToggleStatus} />
                )}

                {isConductor && requestQueue.length > 0 && (
                     <RideRequestCard 
                        request={requestQueue[0]} 
                        onAccept={() => handleAcceptRequest(requestQueue[0])} 
                        onReject={handleRejectRequest} 
                    />
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
                onDismiss={() => setModalVisible(false)}
                destinos={destinos}
                cargando={cargandoDestinos}
                error={errorDestinos}
                onRetry={cargarDestinos}
                destinoSeleccionado={destinoSeleccionado}
                onSelect={setDestinoSeleccionado}
                onConfirm={confirmRequestTrip}
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
    searchingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    searchingTitle: { marginBottom: 10, fontWeight: 'bold', textAlign: 'center' },
    searchingSubtitle: { marginBottom: 20, textAlign: 'center', color: '#666' },
    radarContainer: { width: 200, height: 200, justifyContent: 'center', alignItems: 'center', marginVertical: 40 },
    radarCircle: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, opacity: 0.8 },
    cancelButton: { width: '100%', maxWidth: 300, paddingVertical: 8 },
});