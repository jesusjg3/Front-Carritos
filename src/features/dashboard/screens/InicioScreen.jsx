import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, ScrollView, Alert, TouchableOpacity } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOWS, COLORS, BORDER_RADIUS } from "../../../core/constants/theme";

import { useAppContext } from "../../../shared/contexts/AppContext";
import { mapaHtml } from "../../../Web/mapaCode";
import { CARRITO_MARKER_BASE64 } from "../../../Web/carritoMarkerBase64";

// Components
import RideRequestCard from "../components/RideRequestCard";
import StatusToggleButton from "../components/StatusToggleButton";
import ActiveTripCard from "../components/ActiveTripCard";
import DestinationModal from "../components/DestinationModal";
import RateDriverModal from "../components/RateDriverModal";
import RatePassengerModal from "../components/RatePassengerModal";
import UniversalMap from "../../../shared/components/UniversalMap";
import ReasonModal from "../../../shared/components/ReasonModal";
import RadarView from "../components/RadarView";

// Hooks
import { useLocationLogic } from "../../../shared/hooks/useLocationLogic";
import { useTripLifecycle } from "../../../shared/hooks/useTripLifecycle";
import { useDestinations } from "../../../shared/hooks/useDestinations";
import { useDriverLocation } from "../../../shared/hooks/useDriverLocation";
import { useNearbyDrivers } from "../../../shared/hooks/useNearbyDrivers";

export default function InicioScreen() {
    const { user, token, showAlert } = useAppContext();
    const theme = useTheme();

    // Local UI State
    // Iniciar siempre en línea si es conductor por defecto
    const [isOnline, setIsOnline] = useState(user?.role === 'conductor');
    const [modalVisible, setModalVisible] = useState(false);
    const [destinoSeleccionado, setDestinoSeleccionado] = useState(null);
    const [mapLoadCount, setMapLoadCount] = useState(0);

    // Reason Modals State
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
    const [isWaitingDisconnect, setIsWaitingDisconnect] = useState(false);

    // Crear ref del UniversalMap
    const webViewRef = useRef(null);
    const hasCenteredRef = useRef(false);
    const lastRouteRef = useRef({ startLat: 0, startLng: 0, endLat: 0, endLng: 0, phase: null });

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
        handleBoardPassenger,
        handleDropOffPassenger,
        handleCancelPassenger,
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
        if (tripToRate) {
            setDestinoSeleccionado(null);
            // NOTA: La limpieza visual del mapa (clearRoute, centerMap) 
            // ahora es manejada por completo por el Cerebro Unificado (isIdle).
        }
    }, [tripToRate]);
    const tripIsAccepted = (trip) => {
        if (!trip) return false;
        return trip.status === 'aceptado' || trip.status === 'accepted' || trip.state === 'accepted' || trip.state_id === 2 || trip.state_id === 3;
    };

    const tripInProgress = (trip) => {
        if (!trip) return false;
        return trip.status === 'en_progreso' || trip.status === 'in_progress' || trip.state === 'in_progress' || trip.state_id === 4;
    };

    // ========== CEREBRO UNIFICADO DE MAPA ==========
    // Efecto para Cerebro Unificado de Mapa y Controladores de Estado Visual
    // NOTA: Se ha consolidado TODA la lógica de inyección a Leaflet aquí

    // WebSocket for Driver Disconnect Approved
    useEffect(() => {
        if (isConductor && token && user?.id) {
            import('../../../core/services/echo').then(({ createEcho }) => {
                const echo = createEcho(token);
                const channel = echo.private(`driver.${user.id}`);
                
                channel.listen('.driver.disconnect.approved', () => {
                    setIsWaitingDisconnect(false);
                    setIsOnline(false);
                    showAlert("Desconexión Aprobada", "El administrador aprobó tu desconexión.", "success");
                });

                channel.listen('.driver.disconnect.rejected', () => {
                    setIsWaitingDisconnect(false);
                    showAlert("Desconexión Rechazada", "El administrador denegó tu solicitud de desconexión.", "error");
                });

                return () => {
                    echo.leave(`driver.${user.id}`);
                    echo.disconnect();
                };
            });
        }
    }, [isConductor, token, user]);

    useEffect(() => {
        if (!webViewRef.current) return;

        const isPhase1 = tripIsAccepted(activeTrip); // Yendo al Pickup
        const isPhase2 = tripInProgress(activeTrip); // Yendo al Destino
        const isSelectingDestination = isPasajero && destinoSeleccionado && !activeTrip;
        const isIdle = !isPhase1 && !isPhase2;

        let script = '';

        if (isIdle) {
            // 1. LIMPIEZA OBLIGATORIA
            if (!isSelectingDestination) {
                script += `if (typeof clearRoute === 'function') clearRoute();`;
            }
            // Resetear la referencia de la última ruta trazada para permitir un re-trazado si se cancela y se pide de nuevo desde el mismo lugar.
            lastRouteRef.current = { startLat: 0, startLng: 0, endLat: 0, endLng: 0, phase: null };
            
            // 2. ACTUALIZAR CONDUCTORES EN EL RADAR
            if (isPasajero && nearbyDrivers) {
                const driversData = JSON.stringify(nearbyDrivers);
                script += `
                    if (typeof updateNearbyDrivers === 'function') {
                        updateNearbyDrivers(${driversData});
                    }
                `;
            }

            // 3. MODO PREVISUALIZACIÓN DE VIAJE (Pasajero Eligiendo Destino)
            if (isSelectingDestination && ubicacion) {
                script += `
                    if (typeof drawRoute === 'function') {
                        drawRoute(${ubicacion.latitude}, ${ubicacion.longitude}, ${destinoSeleccionado.latitude}, ${destinoSeleccionado.longitude}, 400, ${!hasCenteredRef.current});
                    }
                `;
                hasCenteredRef.current = true;
            } 
            // 4. MODO IDLE PURO (Explorando)
            else {
                const destData = JSON.stringify(destinos || []);
                script += `
                    if (typeof addDestinationMarkers === 'function') addDestinationMarkers(${destData});
                `;
                
                if (ubicacion) {
                    const lat = parseFloat(ubicacion.latitude) || 0;
                    const lng = parseFloat(ubicacion.longitude) || 0;
                    if (lat !== 0 && lng !== 0) {
                        script += `
                            if (typeof placeUserMarker === 'function') {
                                placeUserMarker(${lat}, ${lng}, null, ${isConductor});
                            }
                            if (typeof centerMap === 'function' && !${hasCenteredRef.current}) {
                                centerMap(${lat}, ${lng});
                            }
                        `;
                        hasCenteredRef.current = true;
                    }
                }
            }
        } else {
            // VIAJE ACTIVO (Fase 1 o Fase 2)
            let start = { lat: 0, lng: 0 };
            let end = { lat: 0, lng: 0 };
            let padding = 100;
            
            const getVal = (v) => parseFloat(v) || 0;

            if (isPhase1) {
                end = {
                    lat: getVal(activeTrip.origin_lat || activeTrip.origin?.lat),
                    lng: getVal(activeTrip.origin_lng || activeTrip.origin?.lng)
                };

                if (isConductor) {
                    start = { lat: getVal(ubicacion?.latitude), lng: getVal(ubicacion?.longitude) };
                } else {
                    let dLat = getVal(activeTrip.driver?.latitude);
                    let dLng = getVal(activeTrip.driver?.longitude);
                    if (dLat === 0 && dLng === 0 && nearbyDrivers && nearbyDrivers.length > 0) {
                        const knownDriver = nearbyDrivers.find(d => d.id == activeTrip.driver?.id);
                        if (knownDriver) {
                            dLat = getVal(knownDriver.latitude);
                            dLng = getVal(knownDriver.longitude);
                        }
                    }
                    start = { lat: dLat, lng: dLng };
                }
                padding = 180;
            } else if (isPhase2) {
                end = {
                    lat: getVal(activeTrip.destination_lat || activeTrip.destination?.lat),
                    lng: getVal(activeTrip.destination_lng || activeTrip.destination?.lng)
                };

                if (isConductor && ubicacion) {
                    start = { lat: getVal(ubicacion.latitude), lng: getVal(ubicacion.longitude) };
                } else {
                    start = { 
                        lat: getVal(activeTrip.driver?.latitude), 
                        lng: getVal(activeTrip.driver?.longitude) 
                    };
                }

                if (start.lat === 0 && ubicacion) {
                    if (isConductor || isPhase2) {
                        start = { lat: getVal(ubicacion.latitude), lng: getVal(ubicacion.longitude) };
                    }
                }
                padding = 100;
            }

            const validCoords = (start.lat !== 0 && start.lng !== 0 && end.lat !== 0 && end.lng !== 0);
            
            // Marker del usuario (solo si aplica)
            const showUserMarker = isConductor || !isPhase2;
            if (showUserMarker && ubicacion) {
                if (isConductor && !user?.vehicle_maintenance) {
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
                    if (typeof removeUserMarker === 'function') removeUserMarker();
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

                const currentPhase = isPhase1 ? 1 : 2;
                const shouldAnimateZoom = lastRouteRef.current.phase !== currentPhase;
                
                const routeChanged = Math.abs(lastRouteRef.current.endLat - end.lat) > 0.0001 ||
                                     Math.abs(lastRouteRef.current.endLng - end.lng) > 0.0001 ||
                                     Math.abs(lastRouteRef.current.startLat - start.lat) > 0.0001 ||
                                     Math.abs(lastRouteRef.current.startLng - start.lng) > 0.0001 ||
                                     lastRouteRef.current.phase !== currentPhase;

                if (routeChanged) {
                    script += `
                        if (typeof drawRoute === 'function') {
                            drawRoute(${start.lat}, ${start.lng}, ${end.lat}, ${end.lng}, ${padding}, ${shouldAnimateZoom});
                        }
                    `;
                    lastRouteRef.current = { startLat: start.lat, startLng: start.lng, endLat: end.lat, endLng: end.lng, phase: currentPhase };
                }

                script += `
                    if (!${isConductor} && typeof updateNearbyDrivers === 'function') {
                        updateNearbyDrivers(${driverInfo});
                    }

                    if (${isPhase2} && typeof centerMap === 'function') {
                        centerMap(${start.lat}, ${start.lng});
                    }
                `;
            } else if (ubicacion) {
                script += `
                    if (typeof centerMap === 'function') {
                        centerMap(${getVal(ubicacion.latitude)}, ${getVal(ubicacion.longitude)});
                    }
                 `;
                hasCenteredRef.current = true;
            }
        }

        webViewRef.current.injectJavaScript(script + " true;");
    }, [
        mapLoadCount,
        activeTrip?.status, 
        activeTrip?.state_id, 
        activeTrip?.driver?.latitude, 
        activeTrip?.driver?.longitude, 
        destinoSeleccionado, 
        ubicacion, 
        nearbyDrivers, 
        isConductor, 
        isPasajero, 
        destinos
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
            showAlert("Ubicación Requerida", "Necesitamos tu ubicación y un destino.", "warning");
            return;
        }

        // --- Geofence check activo ---
        const centerLat = parseFloat(process.env.EXPO_PUBLIC_CAMPUS_CENTER_LAT);
        const centerLng = parseFloat(process.env.EXPO_PUBLIC_CAMPUS_CENTER_LNG);
        const radiusKm = parseFloat(process.env.EXPO_PUBLIC_CAMPUS_RADIUS_KM);

        const distFromCenter = calculateDistance(ubicacion.latitude, ubicacion.longitude, centerLat, centerLng);
        if (distFromCenter > radiusKm) {
            Alert.alert("Fuera de zona", `Estás fuera de la zona de servicio permitida (${radiusKm} km).`);
            return;
        }



        let dist = calculateDistance(ubicacion.latitude, ubicacion.longitude, destinoSeleccionado.latitude, destinoSeleccionado.longitude);
        if (isNaN(dist)) dist = 0.0; // Fallback por seguridad

        // Ocultar modal primero para que las alertas globales sean visibles
        setModalVisible(false);
        const success = await requestTrip(ubicacion, destinoSeleccionado, dist, passengersCount);
    };

    const handleRequestDisconnect = async (reason) => {
        setDisconnectModalVisible(false);
        setIsWaitingDisconnect(true);
        try {
            const response = await fetch(`${API_ROUTES.BASE_URL}/driver/request-disconnect`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason })
            });
            const data = await response.json();
            if (!response.ok) {
                setIsWaitingDisconnect(false);
                showAlert("Error", data.error || "No se pudo solicitar la desconexión.", "error");
            }
        } catch (e) {
            setIsWaitingDisconnect(false);
            showAlert("Error", "Error de conexión al servidor.", "error");
        }
    };

    const handleCancelTripAction = () => {
        if (isConductor) {
            setCancelModalVisible(true);
        } else {
            showAlert(
                "Cancelar Viaje",
                "¿Estás seguro de que deseas cancelar este viaje?",
                "warning",
                {
                    confirmText: "Sí, cancelar",
                    cancelText: "No",
                    onConfirm: () => cancelTrip()
                }
            );
        }
    };

    // --- RENDER ---

    if (isWaitingDisconnect) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
                <ActivityIndicator animating={true} size="large" color={theme.colors.primary} style={{ marginBottom: 20 }} />
                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#333' }}>Esperando Aprobación...</Text>
                <Text variant="bodyMedium" style={{ color: '#666', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
                    Tu solicitud ha sido enviada al administrador. Por favor, no cierres la app.
                </Text>
            </SafeAreaView>
        );
    }

    if (isSearching) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]} edges={['top']}>
                <LinearGradient
                    colors={['#14498518', '#F8FAFC', '#F8FAFC']}
                    style={styles.searchingWrapper}
                >
                    {/* Header: Title and connecting text */}
                    <View style={styles.searchingHeader}>
                        <Text variant="headlineMedium" style={[styles.searchingTitle, { color: '#144985' }]}>
                            Buscando Conductor
                        </Text>
                        <Text variant="bodyMedium" style={styles.searchingSubtitle}>
                            Conectando con el carrito más cercano a tu ubicación...
                        </Text>
                    </View>

                    {/* Radar Map Section with glowing halos */}
                    <View style={styles.radarCard}>
                        <View style={styles.radarGlowContainer}>
                            <View style={styles.radarGlowRing1} />
                            <View style={styles.radarGlowRing2} />
                            <RadarView ubicacion={ubicacion} />
                        </View>
                    </View>

                    {/* Boarding Pass Ride Ticket */}
                    <View style={styles.searchingTicket}>
                        {/* Ticket Header: Brand and Trip Title */}
                        <LinearGradient
                            colors={['#144985', '#1E88E5']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ticketHeader}
                        >
                            <View style={styles.ticketHeaderLeft}>
                                <MaterialCommunityIcons name="ticket-confirmation" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.ticketHeaderTitle}>PASE DE VIAJE ACTIVO</Text>
                            </View>
                            <Text style={styles.ticketHeaderCode}>#{requestAttempt}</Text>
                        </LinearGradient>

                        {/* Route Segment */}
                        <View style={styles.ticketRouteContainer}>
                            <View style={styles.searchingTimeline}>
                                <View style={styles.searchingOriginDot} />
                                <View style={styles.searchingDashedLine} />
                                <View style={styles.searchingDestSquare} />
                            </View>
                            
                            <View style={styles.searchingRouteTexts}>
                                <View style={styles.searchingRoutePoint}>
                                    <Text style={styles.searchingRouteLabel}>PUNTO DE PARTIDA (ORIGEN)</Text>
                                    <Text numberOfLines={1} style={styles.searchingRouteValue}>
                                        {ubicacion ? 'Mi Ubicación Actual' : 'Buscando GPS...'}
                                    </Text>
                                </View>
                                <View style={styles.searchingRoutePoint}>
                                    <Text style={styles.searchingRouteLabel}>PUNTO DE LLEGADA (DESTINO)</Text>
                                    <Text numberOfLines={1} style={styles.searchingRouteValue}>
                                        {destinoSeleccionado ? destinoSeleccionado.nombre : "Bienestar, Campus"}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Ticket Punch Notches and Separator */}
                        <View style={styles.ticketNotchContainer}>
                            <View style={styles.ticketLeftNotch} />
                            <View style={styles.ticketDashedDivider} />
                            <View style={styles.ticketRightNotch} />
                        </View>

                        {/* Ticket Footer details */}
                        <View style={styles.ticketFooter}>
                            <View style={styles.ticketInfoRow}>
                                <View style={styles.ticketInfoPill}>
                                    <MaterialCommunityIcons name="clock-outline" size={15} color="#1E88E5" style={{ marginRight: 6 }} />
                                    <Text style={styles.ticketInfoPillText}>~2 min esp.</Text>
                                </View>
                                <View style={[styles.ticketInfoPill, { backgroundColor: '#10B98110', borderColor: '#10B98125' }]}>
                                    <MaterialCommunityIcons name="sync" size={15} color="#10B981" style={{ marginRight: 6 }} />
                                    <Text style={[styles.ticketInfoPillText, { color: '#059669' }]}>Conectando...</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Action buttons (Clean and modern Cancel Button) */}
                    <View style={styles.searchingFooter}>
                        <TouchableOpacity
                            style={styles.cancelRequestPill}
                            onPress={() => { cancelTrip(); setDestinoSeleccionado(null); }}
                            activeOpacity={0.85}
                        >
                            <MaterialCommunityIcons name="close-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                            <Text style={styles.cancelRequestPillText}>CANCELAR SOLICITUD</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
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
                                if (!user?.vehicle_maintenance) {
                                    const escapedIconUrl = CARRITO_MARKER_BASE64.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                                    webViewRef.current.injectJavaScript(`
                                        if (typeof setCarritoIcon === 'function') setCarritoIcon('${escapedIconUrl}');
                                    `);
                                }
                                lastRouteRef.current.phase = null;
                                setMapLoadCount(prev => prev + 1);
                            }
                        }}
                    />
                </View>
                <ActiveTripCard
                    activeTrip={activeTrip}
                    isPasajero={isPasajero}
                    onContact={() => showAlert("Contacto", "Contactando al conductor...", "info")}
                    onCancel={handleCancelTripAction}
                    onStartTrip={handleStartTrip}
                    onFinishTrip={handleFinishTrip}
                    onBoardPassenger={handleBoardPassenger}
                    onDropOffPassenger={handleDropOffPassenger}
                    onCancelPassenger={handleCancelPassenger}
                />
                
                <ReasonModal
                    visible={cancelModalVisible}
                    onDismiss={() => setCancelModalVisible(false)}
                    title="Motivo de Cancelación"
                    placeholder="¿Por qué debes cancelar el viaje?"
                    onConfirm={(reason) => {
                        setCancelModalVisible(false);
                        cancelTrip(reason);
                    }}
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
                            if (!user?.vehicle_maintenance) {
                                const escapedIconUrl = CARRITO_MARKER_BASE64.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                                webViewRef.current.injectJavaScript(`
                                    if (typeof setCarritoIcon === 'function') setCarritoIcon('${escapedIconUrl}');
                                `);
                            }

                            if ((isPasajero || isConductor) && ubicacion) {
                                webViewRef.current.injectJavaScript(`
                                    if (typeof centerMap === 'function') centerMap(${ubicacion.latitude}, ${ubicacion.longitude});
                                    if (typeof placeUserMarker === 'function') placeUserMarker(${ubicacion.latitude}, ${ubicacion.longitude}, null, ${isConductor});
                                `);
                            }
                            lastRouteRef.current.phase = null;
                            setMapLoadCount(prev => prev + 1);
                        }
                    }}
                />

                {/* isConductor controls removed and moved to profile */}

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
                    <TouchableOpacity 
                        style={[styles.searchCardContainer, { backgroundColor: theme.colors.surface }]}
                        onPress={() => setModalVisible(true)}
                        activeOpacity={0.9}
                    >
                        <View style={styles.searchCardInner}>
                            <View style={[styles.searchIconBg, { backgroundColor: theme.colors.primary + '10' }]}>
                                <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.primary} />
                            </View>
                            <View style={styles.searchTextContainer}>
                                <Text style={styles.searchTextLabel}>¿A dónde vas?</Text>
                                <Text numberOfLines={1} style={[styles.searchTextValue, destinoSeleccionado ? { color: theme.colors.primary, fontWeight: 'bold' } : { color: '#888' }]}>
                                    {destinoSeleccionado ? destinoSeleccionado.nombre : "Seleccionar Destino..."}
                                </Text>
                            </View>
                            <View style={[styles.searchCircleIndicator, { backgroundColor: theme.colors.secondary }]}>
                                <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
                            </View>
                        </View>
                    </TouchableOpacity>
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
                visible={!!tripToRate && !isConductor}
                trip={tripToRate}
                onDismiss={() => setTripToRate(null)}
                onRateSuccess={() => setTripToRate(null)}
            />

            <RatePassengerModal
                visible={!!tripToRate && isConductor}
                trip={tripToRate}
                onDismiss={() => setTripToRate(null)}
                onRateSuccess={() => setTripToRate(null)}
            />

            <ReasonModal
                visible={cancelModalVisible}
                onDismiss={() => setCancelModalVisible(false)}
                title="Motivo de Cancelación"
                placeholder="¿Por qué debes cancelar el viaje?"
                onConfirm={(reason) => {
                    setCancelModalVisible(false);
                    cancelTrip(reason);
                }}
            />

            <ReasonModal
                visible={disconnectModalVisible}
                onDismiss={() => setDisconnectModalVisible(false)}
                title="Motivo de Desconexión"
                placeholder="Ej. Terminé mi turno, Problema mecánico..."
                onConfirm={handleRequestDisconnect}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapContainer: { flex: 1, position: 'relative' },
    map: { flex: 1 },
    
    // Bottom Search Card styled similar to Uber/DiDi
    searchCardContainer: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        borderRadius: BORDER_RADIUS.XL,
        ...SHADOWS.LARGE,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        zIndex: 100,
        overflow: 'hidden',
    },
    searchCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    searchIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    searchTextContainer: {
        flex: 1,
    },
    searchTextLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6C757D',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    searchTextValue: {
        fontSize: 15,
        marginTop: 2,
    },
    searchCircleIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.SMALL,
    },

    // Searching and matching screen
    searchingWrapper: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    searchingHeader: {
        alignItems: 'center',
        width: '100%',
    },
    searchingTitle: {
        fontWeight: '900',
        letterSpacing: -0.5,
        textAlign: 'center',
        marginBottom: 8,
    },
    searchingSubtitle: {
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
        color: '#64748B',
        paddingHorizontal: 16,
    },
    radarCard: {
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    radarGlowContainer: {
        position: 'relative',
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radarGlowRing1: {
        position: 'absolute',
        width: 290,
        height: 290,
        borderRadius: 145,
        borderWidth: 1,
        borderColor: 'rgba(30, 136, 229, 0.12)',
        backgroundColor: 'rgba(30, 136, 229, 0.02)',
    },
    radarGlowRing2: {
        position: 'absolute',
        width: 310,
        height: 310,
        borderRadius: 155,
        borderWidth: 1.5,
        borderColor: 'rgba(30, 136, 229, 0.06)',
        backgroundColor: 'rgba(30, 136, 229, 0.01)',
    },
    searchingTicket: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        ...SHADOWS.LARGE,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    ticketHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
    },
    ticketHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ticketHeaderTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1.2,
    },
    ticketHeaderCode: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FFFFFF',
        opacity: 0.9,
    },
    ticketRouteContainer: {
        flexDirection: 'row',
        paddingVertical: 18,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
    },
    searchingTimeline: {
        width: 14,
        alignItems: 'center',
        marginRight: 14,
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    searchingOriginDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        ...SHADOWS.SMALL,
    },
    searchingDashedLine: {
        width: 1.5,
        height: 34,
        backgroundColor: '#CBD5E1',
    },
    searchingDestSquare: {
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        ...SHADOWS.SMALL,
    },
    searchingRouteTexts: {
        flex: 1,
        height: 62,
        justifyContent: 'space-between',
    },
    searchingRoutePoint: {
        justifyContent: 'center',
    },
    searchingRouteLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 0.8,
    },
    searchingRouteValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 1,
    },
    ticketNotchContainer: {
        height: 16,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
    },
    ticketLeftNotch: {
        width: 12,
        height: 16,
        backgroundColor: '#F8FAFC',
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        marginLeft: -6,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    ticketRightNotch: {
        width: 12,
        height: 16,
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        marginRight: -6,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    ticketDashedDivider: {
        flex: 1,
        height: 1,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginHorizontal: 8,
    },
    ticketFooter: {
        paddingHorizontal: 20,
        paddingBottom: 18,
        paddingTop: 8,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
    },
    ticketInfoRow: {
        flexDirection: 'row',
        gap: 12,
    },
    ticketInfoPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        paddingVertical: 8,
        borderRadius: 20,
    },
    ticketInfoPillText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1E40AF',
    },
    searchingFooter: {
        width: '100%',
        alignItems: 'center',
        marginTop: 8,
    },
    cancelRequestPill: {
        width: '100%',
        maxWidth: 280,
        height: 48,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#EF4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.MEDIUM,
    },
    cancelRequestPillText: {
        color: '#EF4444',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 0.8,
    },

    // Driver Requests
    requestsContainer: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        maxHeight: '65%',
        zIndex: 20,
    },
    requestsScroll: { flex: 1 },
    requestsContent: { paddingBottom: 0, flexGrow: 1, justifyContent: 'flex-end' },
});