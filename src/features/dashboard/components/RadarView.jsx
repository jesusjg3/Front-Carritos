import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing } from "react-native";
import { useTheme } from "react-native-paper";
import { SHADOWS } from '../../../core/constants/theme';
import UniversalMap from "../../../shared/components/UniversalMap";
import { mapaHtml } from "../../../Web/mapaCode";
import { CARRITO_MARKER_BASE64 } from "../../../Web/carritoMarkerBase64";

export default function RadarView({ ubicacion }) {
    const theme = useTheme();
    const radarWebViewRef = useRef(null);
    const mapSource = useMemo(() => ({ html: mapaHtml }), []);

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
                if (window.__radarSimulationInterval) {
                    clearInterval(window.__radarSimulationInterval);
                    window.__radarSimulationInterval = null;
                }

                if (typeof setCarritoIcon === 'function') setCarritoIcon('${escapedIconUrl}');
                
                var simulatedDrivers = [];
                var driverCount = 0;
                var lastPulseTime = 0;
                var pulseInterval = 2500;
                
                if (typeof map !== 'undefined') {
                    map.setView([${ubicacion.latitude}, ${ubicacion.longitude}], 18);
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
                
                if (typeof map !== 'undefined') {
                    map.setZoom(14, { animate: true, duration: 1.2 });
                }
                window.__radarSimulationInterval = setInterval(updateSimulatedDrivers, 2500);
                setTimeout(function() { updateSimulatedDrivers(); }, 500);
            `);
        }
    };

    return (
        <View style={styles.radarContainer}>
            <View style={styles.radarMapBackground}>
                <UniversalMap
                    ref={radarWebViewRef}
                    source={mapSource}
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
        width: 220,
        height: 220,
        borderRadius: 110,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 3,
        borderColor: '#14498525',
        shadowColor: '#144985',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    radarMapBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 110,
        overflow: 'hidden'
    },
    radarRing: {
        position: 'absolute',
        width: 170,
        height: 170,
        borderRadius: 85,
        borderWidth: 1.5,
    },
    radarCenter: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(20, 73, 133, 0.1)',
        zIndex: 10,
        borderColor: '#144985',
        shadowColor: '#144985',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    radarCenterInner: {
        width: 28,
        height: 28,
        borderRadius: 14,
        shadowColor: '#144985',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
    }
});
