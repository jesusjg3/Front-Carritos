import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Button, TextInput, useTheme, Card, Text } from 'react-native-paper';
import { FontAwesome } from '@expo/vector-icons';
import { API_ROUTES } from '../../../../Config/Routes';
import { useAppContext } from '../../../../shared/contexts/AppContext';

export default function RateDriverModal({ visible, trip, onDismiss, onRateSuccess }) {
    const theme = useTheme();
    const { token } = useAppContext();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!trip) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_ROUTES.TRIPS}/${trip.id}/rate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ score: rating, comment })
            });

            if (response.ok) {
                alert("¡Gracias por tu calificación!");
                if (onRateSuccess) onRateSuccess();
            } else {
                const data = await response.json();
                alert("Error al enviar calificación: " + (data.error || ""));
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión.");
        } finally {
            setLoading(false);
            if (onDismiss) onDismiss();
        }
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                    <FontAwesome
                        name="star"
                        size={40}
                        color={i <= rating ? "#FFD700" : "#E0E0E0"}
                        style={{ marginHorizontal: 5 }}
                    />
                </TouchableOpacity>
            );
        }
        return <View style={styles.starsContainer}>{stars}</View>;
    };

    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onDismiss}>
            <View style={styles.modalOverlay}>
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Card.Title title="Califica tu viaje" subtitle="¿Qué tal estuvo tu conductor?" />
                    <Card.Content>
                        {renderStars()}
                        <Text style={{ textAlign: 'center', marginBottom: 10 }}>{rating} / 5</Text>
                        <TextInput
                            label="Comentarios (Opcional)"
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            value={comment}
                            onChangeText={setComment}
                            style={styles.input}
                        />
                    </Card.Content>
                    <Card.Actions style={styles.actions}>
                        <Button onPress={onDismiss} disabled={loading}>Omitir</Button>
                        <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading}>
                            Enviar
                        </Button>
                    </Card.Actions>
                </Card>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    card: {
        padding: 10,
        elevation: 5
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 15
    },
    input: {
        marginBottom: 20,
        marginTop: 10
    },
    actions: {
        justifyContent: 'flex-end'
    }
});
