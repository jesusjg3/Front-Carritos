import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card, useTheme, ActivityIndicator, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppContext } from "../../../shared/contexts/AppContext";
import { API_ROUTES } from "../../../Config/Routes";
import { SHADOWS, COLORS, BORDER_RADIUS } from "../../../core/constants/theme";
import { ReportTripModal } from '../components/ReportTripModal';

export default function HistoryScreen() {
    const { token } = useAppContext();
    const theme = useTheme();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [selectedTripId, setSelectedTripId] = useState(null);

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [])
    );

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_ROUTES.BASE_URL}/trips/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            if (response.ok) {
                setTrips(data);
            }
        } catch (error) {
            console.error("Error fetching history", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (state) => {
        const s = (state || '').toLowerCase();
        if (s === 'completado' || s === 'completed' || s === 'finished' || s === 'finalizado') {
            return { bg: '#E8F5E9', text: '#2E7D32', label: 'Completado' };
        }
        if (s === 'cancelado' || s === 'cancelled') {
            return { bg: '#FFEBEE', text: '#C62828', label: 'Cancelado' };
        }
        return { bg: '#E3F2FD', text: '#1565C0', label: state || 'En curso' };
    };

    const renderItem = ({ item }) => {
        const status = getStatusColor(item.state);
        const tripDate = new Date(item.created_at);
        const dateStr = tripDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        const timeStr = tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Card.Content style={styles.cardContent}>
                    {/* Header Row */}
                    <View style={styles.cardHeader}>
                        <View style={styles.dateTimeContainer}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#6C757D" style={{ marginRight: 4 }} />
                            <Text style={styles.dateTimeText}>{dateStr} • {timeStr}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                        </View>
                    </View>

                    {/* Destination Row */}
                    <View style={styles.routeRow}>
                        <View style={styles.routeIndicatorContainer}>
                            <View style={[styles.routeDot, { backgroundColor: theme.colors.primary }]} />
                            <View style={styles.routeLine} />
                            <View style={[styles.routeSquare, { backgroundColor: theme.colors.secondary }]} />
                        </View>
                        <View style={styles.routeDetails}>
                            <Text numberOfLines={1} style={styles.originText}>
                                {item.origin_address || item.origin?.address || 'Origen (Ubicación actual)'}
                            </Text>
                            <Text numberOfLines={1} style={styles.destinationText}>
                                {item.destination_address || item.destination?.address || 'Destino del campus'}
                            </Text>
                        </View>
                    </View>

                    <Divider style={styles.cardDivider} />

                    {/* Footer / Driver & Rating info */}
                    <View style={styles.cardFooter}>
                        <View style={styles.driverInfo}>
                            <View style={[styles.driverAvatar, { backgroundColor: theme.colors.primary + '12' }]}>
                                <MaterialCommunityIcons name="steering" size={16} color={theme.colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.driverTitle}>Conductor</Text>
                                <Text style={styles.driverName}>{item.driver?.name || 'N/A'}</Text>
                            </View>
                        </View>

                        {/* Rating Display */}
                        {item.my_rating ? (
                            <View style={styles.ratingBadge}>
                                <MaterialCommunityIcons name="star" size={14} color="#FFD700" style={{ marginRight: 2 }} />
                                <Text style={styles.ratingText}>{Number(item.my_rating.rating).toFixed(0)}</Text>
                            </View>
                        ) : (
                            <View style={[styles.ratingBadge, { backgroundColor: '#F5F5F5' }]}>
                                <Text style={[styles.ratingText, { color: '#888' }]}>Sin calificar</Text>
                            </View>
                        )}
                    </View>

                    {/* Comments if exist */}
                    {item.my_rating?.comment && (
                        <View style={[styles.commentBox, { backgroundColor: '#F8F9FA' }]}>
                            <MaterialCommunityIcons name="format-quote-close" size={12} color="#888" style={{ marginRight: 6 }} />
                            <Text numberOfLines={2} style={styles.commentText}>
                                "{item.my_rating.comment}"
                            </Text>
                        </View>
                    )}
                    
                    <TouchableOpacity 
                        style={styles.reportButton}
                        onPress={() => {
                            setSelectedTripId(item.id);
                            setReportModalVisible(true);
                        }}
                    >
                        <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.danger} />
                        <Text style={styles.reportButtonText}>Reportar Problema</Text>
                    </TouchableOpacity>
                </Card.Content>
            </Card>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <View style={styles.headerContainer}>
                <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                    Historial de Viajes
                </Text>
                <Text variant="bodySmall" style={styles.headerSubtitle}>
                    Tu historial de transportación universitaria
                </Text>
            </View>
            
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
                    <Text style={{ marginTop: 12, color: 'gray' }}>Cargando tus trayectos...</Text>
                </View>
            ) : (
                <FlatList
                    data={trips}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="map-marker-off-outline" size={48} color="#CCC" />
                            <Text style={styles.emptyText}>No hay viajes registrados aún.</Text>
                        </View>
                    }
                />
            )}

            <ReportTripModal
                visible={reportModalVisible}
                onClose={() => {
                    setReportModalVisible(false);
                    setSelectedTripId(null);
                }}
                tripId={selectedTripId}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        color: '#6C757D',
        marginTop: 2,
    },
    list: { padding: 20, paddingTop: 10 },
    card: { 
        marginBottom: 16, 
        borderRadius: BORDER_RADIUS.XL,
        ...SHADOWS.SMALL,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        overflow: 'hidden',
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateTimeText: {
        fontSize: 12,
        color: '#6C757D',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    routeRow: {
        flexDirection: 'row',
        marginVertical: 4,
        alignItems: 'center',
    },
    routeIndicatorContainer: {
        width: 16,
        alignItems: 'center',
        marginRight: 12,
        height: 48,
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    routeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    routeLine: {
        width: 1.5,
        flex: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 2,
    },
    routeSquare: {
        width: 8,
        height: 8,
        borderRadius: 2,
    },
    routeDetails: {
        flex: 1,
        height: 48,
        justifyContent: 'space-between',
    },
    originText: {
        fontSize: 13,
        color: '#6C757D',
    },
    destinationText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#212529',
    },
    cardDivider: {
        marginVertical: 14,
        opacity: 0.5,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    driverTitle: {
        fontSize: 10,
        color: '#888',
    },
    driverName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#212529',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#FFF9C4',
        borderRadius: 6,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#F57F17',
    },
    commentBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        marginTop: 12,
    },
    commentText: {
        fontSize: 12,
        color: '#495057',
        fontStyle: 'italic',
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 12,
        color: '#888',
        fontSize: 14,
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        gap: 6,
    },
    reportButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.danger,
    }
});
