import React, { useCallback, useState } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { View, FlatList, StyleSheet } from "react-native";
import { Text, Card, useTheme, ActivityIndicator, Avatar, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppContext } from "../../../shared/contexts/AppContext";
import { API_ROUTES } from "../../../Config/Routes";
import { SHADOWS, COLORS, BORDER_RADIUS } from "../../../core/constants/theme";

export default function CommentsScreen() {
    const { token } = useAppContext();
    const theme = useTheme();
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchRatings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_ROUTES.BASE_URL}/ratings`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            if (response.ok) {
                setRatings(data);
            }
        } catch (error) {
            console.error("Error fetching ratings", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            fetchRatings();
        }, [fetchRatings])
    );

    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    };

    const renderStars = (score) => {
        const ratingVal = Math.round(Number(score || 5));
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <MaterialCommunityIcons 
                    key={i}
                    name={i <= ratingVal ? "star" : "star-outline"} 
                    size={16} 
                    color={i <= ratingVal ? "#FFD700" : theme.colors.outline}
                    style={{ marginRight: 2 }}
                />
            );
        }
        return <View style={styles.starsContainer}>{stars}</View>;
    };

    const renderItem = ({ item }) => {
        const reviewDate = new Date(item.created_at);
        const dateStr = reviewDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

        return (
            <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                <Card.Content style={styles.cardContent}>
                    {/* Header Row: Passenger Profile & Rating */}
                    <View style={styles.cardHeader}>
                        <Avatar.Text 
                            size={40} 
                            label={getInitials(item.emitter?.name)} 
                            style={[styles.avatar, { backgroundColor: theme.colors.primary + '15' }]} 
                            labelStyle={[styles.avatarText, { color: theme.colors.primary }]}
                        />
                        <View style={styles.headerInfo}>
                            <Text style={[styles.passengerName, { color: theme.colors.onSurface }]}>{item.emitter?.name || 'Pasajero Anónimo'}</Text>
                            <Text style={[styles.reviewDate, { color: theme.colors.onSurfaceVariant }]}>{dateStr}</Text>
                        </View>
                        <View style={styles.ratingSection}>
                            {renderStars(item.rating)}
                        <Text style={[styles.ratingNumber, { color: theme.colors.tertiary || theme.colors.primary }]}>{item.rating}.0</Text>
                        </View>
                    </View>

                    <Divider style={styles.cardDivider} />

                    {/* Testimonial Quote Box */}
                    <View style={[styles.commentBox, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <MaterialCommunityIcons name="format-quote-open" size={20} color={theme.colors.primary + '40'} style={styles.quoteIcon} />
                        <Text style={[styles.commentText, { color: theme.colors.onSurfaceVariant }]}>
                            {item.comment || "El pasajero completó el viaje con éxito sin dejar comentarios adicionales."}
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <View style={styles.headerContainer}>
                <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                    Calificaciones Recibidas
                </Text>
                <Text variant="bodySmall" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Comentarios y feedback de los pasajeros sobre tu servicio
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
                    <Text style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>Cargando opiniones...</Text>
                </View>
            ) : (
                <FlatList
                    data={ratings}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="comment-text-multiple-outline" size={48} color={theme.colors.onSurfaceVariant} />
                            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No has recibido calificaciones aún.</Text>
                        </View>
                    }
                />
            )}
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
        alignItems: 'center',
    },
    avatar: {
        marginRight: 12,
        ...SHADOWS.SMALL,
    },
    avatarText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    passengerName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#212529',
    },
    reviewDate: {
        fontSize: 11,
        color: '#6C757D',
        marginTop: 2,
    },
    ratingSection: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    ratingNumber: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#F57F17',
    },
    cardDivider: {
        marginVertical: 12,
        opacity: 0.5,
    },
    commentBox: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: BORDER_RADIUS.MD,
        alignItems: 'flex-start',
    },
    quoteIcon: {
        marginRight: 8,
        marginTop: -4,
    },
    commentText: {
        fontSize: 13,
        color: '#495057',
        lineHeight: 18,
        flex: 1,
        fontStyle: 'italic',
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
});
