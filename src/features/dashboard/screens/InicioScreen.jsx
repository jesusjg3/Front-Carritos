
import { View, StyleSheet, Platform } from "react-native";
import { Card, Text } from "react-native-paper";
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
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <View style={styles.mapContainer}>
                {Platform.OS === 'web' ? (
                    <iframe
                        title="mapa"
                        srcDoc={mapaHtml}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                ) : (
                    <WebView
                        source={{ html: mapaHtml }}
                        style={styles.map}
                        originWhitelist={['*']}
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
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'flex-start',
    },
    mapContainer: {
        flex: 1,
        overflow: 'hidden',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    map: {
        flex: 1,
    },
});