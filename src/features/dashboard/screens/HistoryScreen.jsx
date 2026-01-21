import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Text, Card, useTheme, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppContext } from "../../../shared/contexts/AppContext";
import { API_ROUTES } from "../../../Config/Routes";

export default function HistoryScreen() {
    const { token } = useAppContext();
    const theme = useTheme();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);

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

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <Card.Title title={`Viaje a ${item.destination_address || 'Destino'}`} subtitle={new Date(item.created_at).toLocaleDateString() + ' ' + new Date(item.created_at).toLocaleTimeString()} />
            <Card.Content>
                <Text>Conductor: {item.driver?.name || 'N/A'}</Text>
                <Text>Estado: {item.state}</Text>
                {item.my_rating ? (
                    <View style={styles.ratingContainer}>
                        <Text style={{ fontWeight: 'bold' }}>Tu Calificación: {item.my_rating.rating} ★</Text>
                        {item.my_rating.comment && <Text>Comentario: {item.my_rating.comment}</Text>}
                    </View>
                ) : (
                    <Text style={{ fontStyle: 'italic', color: 'gray' }}>No calificado</Text>
                )}
            </Card.Content>
        </Card>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <Text variant="headlineSmall" style={styles.header}>Historial de Viajes</Text>
            {loading ? (
                <ActivityIndicator animating={true} size="large" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={trips}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay viajes registrados.</Text>}
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
    ratingContainer: { marginTop: 8, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 4 }
});
