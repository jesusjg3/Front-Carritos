import React, { useCallback, useState } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { View, FlatList, StyleSheet } from "react-native";
import { Text, Card, useTheme, ActivityIndicator, Avatar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppContext } from "../../../shared/contexts/AppContext";
import { API_ROUTES } from "../../../Config/Routes";

export default function CommentsScreen() {
    const { token } = useAppContext();
    const theme = useTheme();
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchRatings();
        }, [])
    );

    const fetchRatings = async () => {
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
    };

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <Card.Title
                title={item.emitter?.name || 'Usuario'}
                subtitle={new Date(item.created_at).toLocaleDateString()}
                left={(props) => <Avatar.Icon {...props} icon="account" />}
                right={(props) => <Text {...props} style={{ marginRight: 16, fontSize: 18, fontWeight: 'bold' }}>{item.rating} ★</Text>}
            />
            <Card.Content>
                <Text variant="bodyMedium">{item.comment || "Sin comentario"}</Text>
            </Card.Content>
        </Card>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <Text variant="headlineSmall" style={styles.header}>Comentarios y Calificaciones</Text>
            {loading ? (
                <ActivityIndicator animating={true} size="large" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={ratings}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay comentarios aun.</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16, paddingBottom: 0 },
    list: { padding: 16 },
    card: { marginBottom: 12, elevation: 2 },
});
