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
    const { user, token } = useAppContext();
    const theme = useTheme();
    const isConductor = user?.role?.toLowerCase() === 'conductor' || user?.rol?.toLowerCase() === 'conductor';
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [selectedTripId, setSelectedTripId] = useState(null);

    const fetchHistory = useCallback(async () => {
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
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [fetchHistory])
    );

    const getStatusColor = (state) => {
        const s = (state || '').toLowerCase();
        if (s === 'completado' || s === 'completed' || s === 'finished' || s === 'finalizado') {
            return theme.dark
                ? { bg: '#173B2A', text: '#86EFAC', label: 'Completado' }
                : { bg: '#E8F5E9', text: '#2E7D32', label: 'Completado' };
        }
        if (s === 'cancelado' || s === 'cancelled') {
            return theme.dark
                ? { bg: '#451A1A', text: '#FCA5A5', label: 'Cancelado' }
                : { bg: '#FFEBEE', text: '#C62828', label: 'Cancelado' };
        }
        return theme.dark
            ? { bg: '#172B46', text: '#93C5FD', label: state || 'En curso' }
            : { bg: '#E3F2FD', text: '#1565C0', label: state || 'En curso' };
    };

    const renderItem = ({ item }) => {
        const status = getStatusColor(item.state);
        const tripDate = new Date(item.created_at);
        const dateStr = tripDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        const timeStr = tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                <Card.Content style={styles.cardContent}>
                    {/* Header Row */}
                    <View style={styles.cardHeader}>
                        <View style={styles.dateTimeContainer}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.onSurfaceVariant} style={{ marginRight: 4 }} />
                            <Text style={[styles.dateTimeText, { color: theme.colors.onSurfaceVariant }]}>{dateStr} • {timeStr}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                        </View>
                    </View>

                    {/* Destination Row */}
                    <View style={[styles.routeRow, !isConductor && styles.routeRowVertical, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <View style={[styles.routePoint, !isConductor && styles.routePointVertical]}>
                            <View style={styles.routePointHeader}>
                                <View style={[styles.routeDot, { backgroundColor: theme.colors.primary }]} />
                                <Text style={[styles.routeLabel, { color: theme.colors.onSurfaceVariant }]}>Origen</Text>
                            </View>
                            <Text numberOfLines={1} style={[styles.originText, { color: theme.colors.onSurface }]}>
                                {item.origin_address || item.origin?.address || 'Origen (Ubicación actual)'}
                            </Text>
                        </View>
                        <MaterialCommunityIcons name={isConductor ? "arrow-right" : "arrow-down"} size={17} color={theme.colors.primary} style={[styles.routeArrow, !isConductor && styles.routeArrowVertical]} />
                        <View style={[styles.routePoint, !isConductor && styles.routePointVertical]}>
                            <View style={styles.routePointHeader}>
                                <View style={[styles.routeSquare, { backgroundColor: theme.colors.secondary }]} />
                                <Text style={[styles.routeLabel, { color: theme.colors.onSurfaceVariant }]}>Destino</Text>
                            </View>
                            <Text numberOfLines={1} style={[styles.destinationText, { color: theme.colors.onSurface }]}>
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
                                <Text style={[styles.driverTitle, { color: theme.colors.onSurfaceVariant }]}>Conductor</Text>
                                <Text style={[styles.driverName, { color: theme.colors.onSurface }]}>{item.driver?.name || 'N/A'}</Text>
                            </View>
                        </View>

                        {/* Rating Display */}
                        {item.my_rating ? (
                            <View style={[styles.ratingBadge, { backgroundColor: theme.dark ? '#4A3B10' : '#FFF9C4' }]}>
                                <MaterialCommunityIcons name="star" size={14} color="#FFD700" style={{ marginRight: 2 }} />
                                <Text style={styles.ratingText}>{Number(item.my_rating.rating).toFixed(0)}</Text>
                            </View>
                        ) : (
                            <View style={[styles.ratingBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                                <Text style={[styles.ratingText, { color: theme.colors.onSurfaceVariant }]}>Sin calificar</Text>
                            </View>
                        )}
                    </View>

                    {/* Comments if exist */}
                    {item.my_rating?.comment && (
                        <View style={[styles.commentBox, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <MaterialCommunityIcons name="format-quote-close" size={12} color="#888" style={{ marginRight: 6 }} />
                            <Text numberOfLines={2} style={[styles.commentText, { color: theme.colors.onSurfaceVariant }]}>
                                "{item.my_rating.comment}"
                            </Text>
                        </View>
                    )}
                    
                    <TouchableOpacity 
                        style={[styles.reportButton, { backgroundColor: theme.colors.surfaceVariant }]}
                        onPress={() => {
                            setSelectedTripId(item.id);
                            setReportModalVisible(true);
                        }}
                    >
                        <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.ERROR} />
                        <Text style={[styles.reportButtonText, { color: theme.colors.error }]}>Reportar Problema</Text>
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
                <Text variant="bodySmall" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Tu historial de transportación universitaria
                </Text>
            </View>
            
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
                    <Text style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>Cargando tus trayectos...</Text>
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
                            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No hay viajes registrados aún.</Text>
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
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 4,
    },
    headerTitle: {
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        color: '#6C757D',
        marginTop: 2,
    },
    list: { padding: 16, paddingTop: 6 },
    card: { 
        marginBottom: 10,
        borderRadius: BORDER_RADIUS.XL,
        ...SHADOWS.SMALL,
        borderWidth: 0,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 12,
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
        marginVertical: 2,
        alignItems: 'center',
        padding: 8,
        borderRadius: BORDER_RADIUS.MD,
    },
    routeRowVertical: {
        alignItems: 'stretch',
    },
    routePoint: {
        flex: 1,
        minWidth: 0,
    },
    routePointVertical: {
        flex: 0,
    },
    routePointHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    routeLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    routeArrow: {
        marginHorizontal: 6,
    },
    routeArrowVertical: {
        alignSelf: 'center',
        marginVertical: 4,
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
        marginRight: 5,
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
        marginRight: 5,
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
        width: 28,
        height: 28,
        borderRadius: 14,
        aspectRatio: 1,
        overflow: 'hidden',
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
        paddingVertical: 8,
        marginTop: 8,
        borderRadius: BORDER_RADIUS.MD,
        gap: 6,
    },
    reportButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.ERROR,
    }
});
