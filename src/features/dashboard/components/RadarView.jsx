import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from "react-native";
import { useTheme } from "react-native-paper";
import UniversalMap from "../../../shared/components/UniversalMap";
import { mapaHtml } from "../../../Web/mapaCode";
import { CARRITO_MARKER_BASE64 } from "../../../Web/carritoMarkerBase64";

export default function RadarView({ ubicacion }) {
    const theme = useTheme();
    const radarWebViewRef = useRef(null);

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

        // Pulsación central
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
            radarLoopsRef.current.forEach(loop => loop.stop());
            if (centerPulseLoopRef.current) {
                centerPulseLoopRef.current.stop();
            }
        };
    }, []); 

    const radarBg = 'transparent';
    const ringColor = theme.colors.primary;

    const handleRadarMapLoad = () => {
        if (radarWebViewRef.current && ubicacion) {
            const escapedIconUrl = CARRITO_MARKER_BASE64.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

            radarWebViewRef.current.injectJavaScript(`
                if (typeof setCarritoIcon === 'function') setCarritoIcon('${escapedIconUrl}');
                
                var currentZoom = 18;
                var targetZoom = 14;
                var zoomStep = 0.015;
                var simulatedDrivers = [];
                var driverCount = 0;
                var lastPulseTime = 0;
                var pulseInterval = 2500;
                
                if (typeof map !== 'undefined') {
                    map.setView([${ubicacion.latitude}, ${ubicacion.longitude}], currentZoom);
                }
                
                setTimeout(function() {
                    if (typeof placeUserMarker === 'function') {
                        placeUserMarker(${ubicacion.latitude}, ${ubicacion.longitude}, null, false);
                    }
                }, 50);
                
                // Animaciones CSS inyectadas
                if (!document.getElementById('radar-map-styles')) {
                    var style = document.createElement('style');
                    style.id = 'radar-map-styles';
                    style.textContent = \`
                        .leaflet-marker-icon { transition: opacity 0.8s ease-in-out, transform 0.8s ease-in-out !important; }
                        .leaflet-marker-icon.driver-appearing { animation: driverAppear 0.8s ease-out forwards; }
                        .leaflet-marker-icon.driver-disappearing { animation: driverDisappear 0.8s ease-in forwards; }
                        @keyframes driverAppear { from { opacity: 0; transform: scale(0.3); } to { opacity: 1; transform: scale(1); } }
                        @keyframes driverDisappear { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.3); } }
                    \`;
                    document.head.appendChild(style);
                }
                
                function getRandomNearbyPosition(lat, lng) {
                    var radius = 0.008;
                    var angle = Math.random() * 2 * Math.PI;
                    var distance = 0.003 + Math.random() * (radius - 0.003);
                    return { lat: lat + distance * Math.cos(angle), lng: lng + distance * Math.sin(angle) };
                }
                
                function updateZoom() {
                    if (currentZoom > targetZoom && typeof map !== 'undefined') {
                        currentZoom -= zoomStep;
                        if (currentZoom < targetZoom) currentZoom = targetZoom;
                        map.setZoom(currentZoom, { animate: true, duration: 1.5 });
                    }
                }
                
                function updateSimulatedDrivers() {
                    if (typeof map === 'undefined') return;
                    var now = Date.now();
                    if (now - lastPulseTime < pulseInterval) return;
                    lastPulseTime = now;
                    
                    var action = Math.random();
                    if (action > 0.5 && simulatedDrivers.length < 3) {
                        var toAdd = Math.min(2, 3 - simulatedDrivers.length);
                        for (var i = 0; i < toAdd; i++) {
                            var pos = getRandomNearbyPosition(${ubicacion.latitude}, ${ubicacion.longitude});
                            simulatedDrivers.push({ id: 'sim-' + driverCount++, lat: pos.lat, lng: pos.lng, name: 'Conductor', iconUrl: carritoIconUrl, appearing: true });
                        }
                    } else if (simulatedDrivers.length > 0 && action > 0.3) {
                        var removeIdx = Math.floor(Math.random() * simulatedDrivers.length);
                        simulatedDrivers[removeIdx].disappearing = true;
                        setTimeout(function() {
                            simulatedDrivers.splice(removeIdx, 1);
                            if (typeof updateNearbyDrivers === 'function') updateNearbyDrivers(simulatedDrivers);
                        }, 800);
                    }
                    if (typeof updateNearbyDrivers === 'function') updateNearbyDrivers(simulatedDrivers);
                    
                    setTimeout(function() {
                        var markers = document.querySelectorAll('.leaflet-marker-icon');
                        markers.forEach(function(marker, idx) {
                            if (simulatedDrivers[idx]) {
                                if (simulatedDrivers[idx].appearing) { marker.classList.add('driver-appearing'); delete simulatedDrivers[idx].appearing; } 
                                else if (simulatedDrivers[idx].disappearing) marker.classList.add('driver-disappearing');
                            }
                        });
                    }, 100);
                }
                
                setInterval(updateZoom, 400);
                setInterval(updateSimulatedDrivers, 200);
                setTimeout(function() { updateSimulatedDrivers(); }, 500);
            `);
        }
    };

    return (
        <View style={styles.radarContainer}>
            <View style={styles.radarMapBackground}>
                <UniversalMap
                    ref={radarWebViewRef}
                    source={{ html: mapaHtml }}
                    scrollEnabled={false}
                    onLoadEnd={handleRadarMapLoad}
                />
            </View>

            {radarAnims.map((anim, idx) => (
                <Animated.View
                    key={idx}
                    style={[
                        styles.radarRing,
                        {
                            borderColor: ringColor,
                            backgroundColor: 'transparent',
                            opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] }),
                            transform: [{
                                scale: anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.35 + idx * 0.12, 2.1 + idx * 0.22]
                                })
                            }]
                        }
                    ]}
                />
            ))}

            <View style={[styles.radarCenter, { borderColor: ringColor }]}>
                <Animated.View
                    style={[
                        styles.radarCenterInner,
                        {
                            backgroundColor: ringColor,
                            opacity: centerPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                            transform: [{
                                scale: centerPulse.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.9, 1.08]
                                })
                            }]
                        }
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
    }
});
