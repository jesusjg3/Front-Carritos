import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, ScrollView, Animated, Easing } from "react-native";
import { Text, Button, ActivityIndicator, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from 'react-native-webview';

import { useAppContext } from "../../../shared/contexts/AppContext";
import { mapaHtml } from "../../../Web/mapaCode";
import { CARRITO_MARKER_BASE64 } from "../../../Web/carritoMarkerBase64";

// Components
import RideRequestCard from "../components/RideRequestCard";
import StatusToggleButton from "../components/StatusToggleButton";
import ActiveTripCard from "../components/ActiveTripCard";
import DestinationModal from "../components/DestinationModal";
import RateDriverModal from "../components/RateDriverModal";

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
    
    // Crear ref del WebView en el componente (no en hooks)
    const webViewRef = useRef(null);

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
    } = useLocationLogic(user, isPasajero, activeTrip, webViewRef);

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

    // Animación radar (vista de espera)
    const radarAnims = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0)
    ]).current;
    const centerPulse = useRef(new Animated.Value(0)).current;
    const radarLoopsRef = useRef([]);
    const centerPulseLoopRef = useRef(null);

    // Ref para el webview del radar
    const radarWebViewRef = useRef(null);

    useEffect(() => {
        // Limpiar animaciones previas
        radarLoopsRef.current.forEach(loop => loop.stop());
        radarLoopsRef.current = [];

        // Crear nuevas animaciones
        const loops = radarAnims.map((anim, idx) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(idx * 420),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true
                    })
                ])
            )
        );

        loops.forEach((loop) => {
            loop.start();
            radarLoopsRef.current.push(loop);
        });

        return () => {
            radarLoopsRef.current.forEach(loop => loop.stop());
            radarLoopsRef.current = [];
        };
    }, [isSearching]); // Reiniciar cuando cambia isSearching

    useEffect(() => {
        // Limpiar animación previa
        if (centerPulseLoopRef.current) {
            centerPulseLoopRef.current.stop();
        }

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(centerPulse, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true
                }),
                Animated.timing(centerPulse, {
                    toValue: 0,
                    duration: 1000,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true
                })
            ])
        );
        pulse.start();
        centerPulseLoopRef.current = pulse;

        return () => {
            if (centerPulseLoopRef.current) {
                centerPulseLoopRef.current.stop();
            }
        };
    }, [isSearching]); // Reiniciar cuando cambia isSearching

    const renderRadar = () => {
        const radarBg = 'transparent';
        const ringColor = theme.colors.primary;

        return (
            <View style={styles.radarContainer}>
                {/* Mapa de fondo con zoom out */}
                <View style={styles.radarMapBackground}>
                    <WebView
                        ref={radarWebViewRef}
                        source={{ html: mapaHtml }}
                        style={styles.radarMap}
                        originWhitelist={['*']}
                        scrollEnabled={false}
                        onLoadEnd={() => {
                            if (radarWebViewRef.current && ubicacion) {
                                // Configurar icono del carrito
                                const escapedIconUrl = CARRITO_MARKER_BASE64.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                                
                                radarWebViewRef.current.injectJavaScript(`
                                    if (typeof setCarritoIcon === 'function') setCarritoIcon('${escapedIconUrl}');
                                    
                                    // Variables para control de zoom y conductores
                                    var currentZoom = 18; // Empezar en zoom máximo
                                    var targetZoom = 14; // Zoom final (más alejado)
                                    var zoomStep = 0.015; // Velocidad de alejamiento (muy muy lento)
                                    var simulatedDrivers = [];
                                    var driverCount = 0;
                                    var lastPulseTime = 0;
                                    var pulseInterval = 2500; // Pulso cada 2.5 segundos
                                    
                                    // Inicializar mapa en zoom máximo
                                    if (typeof map !== 'undefined') {
                                        map.setView([${ubicacion.latitude}, ${ubicacion.longitude}], currentZoom);
                                    }
                                    
                                    // Esperar un tick para asegurar que setCarritoIcon se ejecutó
                                    setTimeout(function() {
                                        if (typeof placeUserMarker === 'function') {
                                            placeUserMarker(${ubicacion.latitude}, ${ubicacion.longitude}, null, false);
                                        }
                                    }, 50);
                                    
                                    // Estilo CSS para transiciones suaves
                                    var style = document.createElement('style');
                                    style.textContent = \`
                                        .leaflet-marker-icon {
                                            transition: opacity 0.8s ease-in-out, transform 0.8s ease-in-out !important;
                                        }
                                        .leaflet-marker-icon.driver-appearing {
                                            animation: driverAppear 0.8s ease-out forwards;
                                        }
                                        .leaflet-marker-icon.driver-disappearing {
                                            animation: driverDisappear 0.8s ease-in forwards;
                                        }
                                        @keyframes driverAppear {
                                            from {
                                                opacity: 0;
                                                transform: scale(0.3);
                                            }
                                            to {
                                                opacity: 1;
                                                transform: scale(1);
                                            }
                                        }
                                        @keyframes driverDisappear {
                                            from {
                                                opacity: 1;
                                                transform: scale(1);
                                            }
                                            to {
                                                opacity: 0;
                                                transform: scale(0.3);
                                            }
                                        }
                                    \`;
                                    document.head.appendChild(style);
                                    
                                    function getRandomNearbyPosition(lat, lng) {
                                        var radius = 0.008; // ~800m
                                        var angle = Math.random() * 2 * Math.PI;
                                        var distance = 0.003 + Math.random() * (radius - 0.003); // Entre 300m y 800m
                                        return {
                                            lat: lat + distance * Math.cos(angle),
                                            lng: lng + distance * Math.sin(angle)
                                        };
                                    }
                                    
                                    function updateZoom() {
                                        if (currentZoom > targetZoom && typeof map !== 'undefined') {
                                            currentZoom -= zoomStep;
                                            if (currentZoom < targetZoom) currentZoom = targetZoom;
                                            map.setZoom(currentZoom, { animate: true, duration: 1.5 });
                                        }
                                    }
                                    
                                    function updateSimulatedDrivers() {
                                        // Verificar que el mapa existe
                                        if (typeof map === 'undefined') {
                                            console.log("updateSimulatedDrivers: mapa aún no inicializado");
                                            return;
                                        }
                                        
                                        var now = Date.now();
                                        
                                        // Solo actualizar en intervalos de pulso
                                        if (now - lastPulseTime < pulseInterval) {
                                            return;
                                        }
                                        lastPulseTime = now;
                                        
                                        // Decidir acción: agregar o quitar conductores
                                        var action = Math.random();
                                        
                                        if (action > 0.5 && simulatedDrivers.length < 3) {
                                            // Agregar 1-2 conductores (máximo 3 total)
                                            var toAdd = Math.min(2, 3 - simulatedDrivers.length);
                                            for (var i = 0; i < toAdd; i++) {
                                                var pos = getRandomNearbyPosition(${ubicacion.latitude}, ${ubicacion.longitude});
                                                simulatedDrivers.push({
                                                    id: 'sim-' + driverCount++,
                                                    lat: pos.lat,
                                                    lng: pos.lng,
                                                    name: 'Conductor ' + driverCount,
                                                    iconUrl: carritoIconUrl, // Usar el icono del carrito configurado
                                                    appearing: true
                                                });
                                            }
                                        } else if (simulatedDrivers.length > 0 && action > 0.3) {
                                            // Quitar 1 conductor aleatorio
                                            var removeIdx = Math.floor(Math.random() * simulatedDrivers.length);
                                            simulatedDrivers[removeIdx].disappearing = true;
                                            
                                            // Remover después de la animación
                                            setTimeout(function() {
                                                simulatedDrivers.splice(removeIdx, 1);
                                                if (typeof updateNearbyDrivers === 'function') {
                                                    updateNearbyDrivers(simulatedDrivers);
                                                }
                                            }, 800);
                                        }
                                        
                                        if (typeof updateNearbyDrivers === 'function') {
                                            updateNearbyDrivers(simulatedDrivers);
                                        }
                                        
                                        // Agregar clases de animación a los marcadores
                                        setTimeout(function() {
                                            var markers = document.querySelectorAll('.leaflet-marker-icon');
                                            markers.forEach(function(marker, idx) {
                                                if (simulatedDrivers[idx]) {
                                                    if (simulatedDrivers[idx].appearing) {
                                                        marker.classList.add('driver-appearing');
                                                        delete simulatedDrivers[idx].appearing;
                                                    } else if (simulatedDrivers[idx].disappearing) {
                                                        marker.classList.add('driver-disappearing');
                                                    }
                                                }
                                            });
                                        }, 100);
                                    }
                                    
                                    // Actualizar zoom gradualmente cada 400ms (más lento)
                                    setInterval(updateZoom, 400);
                                    
                                    // Actualizar conductores cada 200ms (pero solo cambia en pulsos)
                                    setInterval(updateSimulatedDrivers, 200);
                                    
                                    // Primera actualización inmediata después de un pequeño delay
                                    setTimeout(function() {
                                        updateSimulatedDrivers();
                                    }, 500);
                                `);
                            }
                        }}
                        key={isSearching ? 'searching' : 'idle'} // Forzar reload cuando cambia isSearching
                    />
                </View>
                
                {/* Anillos del radar con opacidad para ver el mapa */}
                {radarAnims.map((anim, idx) => (
                    <Animated.View
                        key={idx}
                        style={[
                            styles.radarRing,
                            {
                                borderColor: ringColor,
                                backgroundColor: 'transparent',
                                opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] }),
                                transform: [
                                    {
                                        scale: anim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.35 + idx * 0.12, 2.1 + idx * 0.22]
                                        })
                                    }
                                ]
                            }
                        ]}
                    />
                ))}

                {/* Punto central del pasajero */}
                <View style={[styles.radarCenter, { borderColor: ringColor }]}> 
                    <Animated.View
                        style={[
                            styles.radarCenterInner,
                            {
                                backgroundColor: ringColor,
                                opacity: centerPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                                transform: [
                                    {
                                        scale: centerPulse.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.9, 1.08]
                                        })
                                    }
                                ]
                            }
                        ]}
                    />
                </View>
            </View>
        );
    };


    // Efecto para actualizar conductores en el mapa
    React.useEffect(() => {
        if (isPasajero && webViewRef.current) {
            // Pasamos la lista (vacía o llena) para que el mapa se actualice
            const driversData = JSON.stringify(nearbyDrivers || []);
            webViewRef.current.injectJavaScript(`
                if (typeof updateNearbyDrivers === 'function') {
                    updateNearbyDrivers(${driversData});
                }
            `);
        }
    }, [nearbyDrivers, isPasajero]);

    // Efecto para dibujar ruta cuando se selecciona destino
    React.useEffect(() => {
        if (isPasajero && destinoSeleccionado && ubicacion && webViewRef.current) {
            webViewRef.current.injectJavaScript(`
                if (typeof drawRoute === 'function') {
                    drawRoute(${ubicacion.latitude}, ${ubicacion.longitude}, ${destinoSeleccionado.latitude}, ${destinoSeleccionado.longitude});
                }
                true;
            `);
        }
    }, [destinoSeleccionado, ubicacion, isPasajero]);

    // Efecto para limpiar ruta cuando se cancela selección
    React.useEffect(() => {
        if (isPasajero && !destinoSeleccionado && webViewRef.current) {
            webViewRef.current.injectJavaScript(`
                if (typeof clearRoute === 'function') {
                    clearRoute();
                }
                true;
            `);
        }
    }, [destinoSeleccionado, isPasajero]);

    const tripIsAccepted = (trip) => {
        if (!trip) return false;
        // state_id: 2 = ACCEPTED, 3 = EN PROGRESO/STARTED, 4 = EN VIAJE
        return trip.status === 'aceptado' || trip.status === 'accepted' || trip.state === 'accepted' || trip.state_id === 2 || trip.state_id === 3;
    };

    const tripInProgress = (trip) => {
        if (!trip) return false;
        return trip.status === 'en_progreso' || trip.status === 'in_progress' || trip.state === 'in_progress' || trip.state_id === 4;
    };

    // ========== EFECTO CRÍTICO: Actualizar marcador del pasajero en tiempo real durante viaje ==========
    React.useEffect(() => {
        if (isPasajero && activeTrip && ubicacion && webViewRef.current) {
            console.log('[MAP] Pasajero - Actualizando marcador en tiempo real', { 
                lat: ubicacion.latitude, 
                lng: ubicacion.longitude,
                state_id: activeTrip.state_id,
                status: activeTrip.status,
                state: activeTrip.state
            });
            
            // Actualizar el marcador del pasajero y centrar el mapa
            webViewRef.current.injectJavaScript(`
                if (typeof placeUserMarker === 'function') {
                    placeUserMarker(${ubicacion.latitude}, ${ubicacion.longitude}, null, false);
                }
                if (typeof centerMap === 'function') {
                    centerMap(${ubicacion.latitude}, ${ubicacion.longitude});
                }
            `);
        }
    }, [isPasajero, activeTrip, ubicacion]);

    // Efecto para dibujar ruta del conductor hacia el pasajero (Fase 1)
    React.useEffect(() => {
        if (isConductor && activeTrip && tripIsAccepted(activeTrip) && ubicacion && webViewRef.current) {
            const pickupLat = activeTrip.origin_lat || activeTrip.origin?.lat;
            const pickupLng = activeTrip.origin_lng || activeTrip.origin?.lng;

            if (pickupLat && pickupLng) {
                webViewRef.current.injectJavaScript(`
                    if (typeof drawRoute === 'function') {
                        drawRoute(${ubicacion.latitude}, ${ubicacion.longitude}, ${pickupLat}, ${pickupLng});
                    }
                    true;
                `);
            }
        }
    }, [isConductor, activeTrip, ubicacion]);

    // Efecto para actualizar ruta del conductor hacia el destino (Fase 2)
    React.useEffect(() => {
        if (isConductor && activeTrip && tripInProgress(activeTrip) && ubicacion && webViewRef.current) {
            const destLat = activeTrip.destination_lat || activeTrip.destination?.lat;
            const destLng = activeTrip.destination_lng || activeTrip.destination?.lng;

            if (destLat && destLng) {
                webViewRef.current.injectJavaScript(`
                    if (typeof drawRoute === 'function') {
                        drawRoute(${ubicacion.latitude}, ${ubicacion.longitude}, ${destLat}, ${destLng});
                    }
                    true;
                `);
            }
        }
    }, [isConductor, activeTrip, ubicacion]);

    // Efecto para que el pasajero vea la ruta del conductor hacia él (Fase 1)
    React.useEffect(() => {
        if (isPasajero && activeTrip && tripIsAccepted(activeTrip) && webViewRef.current) {
            const conductorLat = activeTrip.driver?.latitude;
            const conductorLng = activeTrip.driver?.longitude;
            const pickupLat = activeTrip.origin_lat || activeTrip.origin?.lat;
            const pickupLng = activeTrip.origin_lng || activeTrip.origin?.lng;

            console.log('[MAP] Pasajero Fase 1 - state_id:', activeTrip.state_id, 'Datos:', {
                conductorLat,
                conductorLng,
                pickupLat,
                pickupLng
            });

            if (conductorLat && conductorLng && pickupLat && pickupLng) {
                console.log('[MAP] Pasajero Fase 1 - Dibujando ruta conductor→pickup');
                webViewRef.current.injectJavaScript(`
                    if (typeof drawRoute === 'function') {
                        drawRoute(${conductorLat}, ${conductorLng}, ${pickupLat}, ${pickupLng});
                    }
                    true;
                `);
            }
        } else if (isPasajero && activeTrip && tripInProgress(activeTrip) && webViewRef.current) {
            console.log('[MAP] Pasajero pasó a Fase 2, limpiando Fase 1');
            webViewRef.current.injectJavaScript(`
                if (typeof clearRoute === 'function') {
                    clearRoute();
                }
            `);
        }
    }, [isPasajero, activeTrip]);

    // Efecto para que el pasajero vea la ruta del conductor hacia el destino (Fase 2)
    React.useEffect(() => {
        if (isPasajero && activeTrip && tripInProgress(activeTrip) && webViewRef.current) {
            const conductorLat = activeTrip.driver?.latitude;
            const conductorLng = activeTrip.driver?.longitude;
            const destLat = activeTrip.destination_lat || activeTrip.destination?.lat;
            const destLng = activeTrip.destination_lng || activeTrip.destination?.lng;

            console.log('[MAP] Pasajero Fase 2 - state_id:', activeTrip.state_id, 'Datos:', {
                conductorLat,
                conductorLng,
                destLat,
                destLng
            });

            if (conductorLat && conductorLng && destLat && destLng) {
                console.log('[MAP] Pasajero Fase 2 - Dibujando ruta conductor→destino');
                webViewRef.current.injectJavaScript(`
                    if (typeof drawRoute === 'function') {
                        drawRoute(${conductorLat}, ${conductorLng}, ${destLat}, ${destLng});
                    }
                    true;
                `);
            }
        }
    }, [isPasajero, activeTrip]);

    // Handlers
    const handleToggleStatus = () => setIsOnline(!isOnline);

    const handleWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            
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
                    <Text variant="headlineMedium" style={styles.searchingTitle}>Buscando conductores cercanos...</Text>
                    <Text variant="bodySmall" style={[styles.searchingSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Tiempo estimado de espera: ~2 min
                    </Text>

                    {renderRadar()}

                    <Text variant="bodySmall" style={[styles.searchingSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Intento #{requestAttempt}
                    </Text>
                    <Button mode="contained" onPress={cancelTrip} style={styles.cancelButton} buttonColor={theme.colors.error}>
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
                        onMessage={handleWebViewMessage}
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
                        onMessage={handleWebViewMessage}
                        onLoadEnd={() => {
                            if (webViewRef.current) {
                                // 1. Configurar icono siempre (independiente de la ubicación)
                                const escapedIconUrl = CARRITO_MARKER_BASE64.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                                webViewRef.current.injectJavaScript(`
                                    if (typeof setCarritoIcon === 'function') setCarritoIcon('${escapedIconUrl}');
                                `);

                                // 2. Si ya tenemos ubicación, centrar y poner marcador
                                if ((isPasajero || isConductor) && ubicacion) {
                                    webViewRef.current.injectJavaScript(`
                                        if (typeof centerMap === 'function') centerMap(${ubicacion.latitude}, ${ubicacion.longitude});
                                        if (typeof placeUserMarker === 'function') placeUserMarker(${ubicacion.latitude}, ${ubicacion.longitude}, null, ${isConductor});
                                    `);
                                }
                            }
                        }}
                    />
                )}

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
    radarContainer: {
        width: 280,
        height: 280,
        borderRadius: 140,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 28,
        overflow: 'hidden',
        position: 'relative'
    },
    radarMapBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 140,
        overflow: 'hidden'
    },
    radarMap: {
        flex: 1,
        backgroundColor: 'transparent'
    },
    radarRing: {
        position: 'absolute',
        width: 210,
        height: 210,
        borderRadius: 105,
        borderWidth: 2
    },
    radarCenter: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        zIndex: 10
    },
    radarCenterInner: {
        width: 32,
        height: 32,
        borderRadius: 16
    },
    cancelButton: { width: '100%', maxWidth: 300, paddingVertical: 8 },
    requestsContainer: {
        position: 'absolute',
        bottom: 20, // Raised up from 20 to 80
        left: 20,
        right: 20,
        maxHeight: '65%', // Allow up to ~3 cards visible (compact mode)
        zIndex: 20,
    },
    requestsScroll: {
        flex: 1,
    },
    requestsContent: {
        paddingBottom: 0,
        flexGrow: 1,
        justifyContent: 'flex-end', // Stack from bottom up
    },
});