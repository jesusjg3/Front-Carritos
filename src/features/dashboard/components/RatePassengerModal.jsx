import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Button, useTheme, Text, Divider } from 'react-native-paper';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_ROUTES } from '../../../Config/Routes';
import { useAppContext } from '../../../shared/contexts/AppContext';
import { SHADOWS, COLORS, BORDER_RADIUS } from '../../../core/constants/theme';

export default function RatePassengerModal({ visible, trip, onDismiss, onRateSuccess }) {
    const theme = useTheme();
    const { token, showAlert } = useAppContext();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const getRatingLabel = (score) => {
        switch(score) {
            case 1: return "Muy mal pasajero";
            case 2: return "Regular";
            case 3: return "Buen pasajero";
            case 4: return "Muy bueno";
            case 5: return "¡Excelente pasajero!";
            default: return "Califica al pasajero";
        }
    };

    const getRatingStatusConfig = (score) => {
        switch(score) {
            case 1:
            case 2:
                return { bg: '#FEF2F2', text: '#EF4444', border: '#FEE2E2' };
            case 3:
                return { bg: '#FFFBEB', text: '#D97706', border: '#FEF3C7' };
            case 4:
            case 5:
            default:
                return { bg: '#ECFDF5', text: '#10B981', border: '#D1FAE5' };
        }
    };

    const handleSubmit = async () => {
        if (!trip) return;
        
        // Una sola evaluación se replica en todos los pasajeros que llegaron.
        if (!trip.passengers || trip.passengers.length === 0) {
            showAlert("Error", "No se encontró la información de los pasajeros para calificar.", "error");
            if (onDismiss) onDismiss();
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_ROUTES.TRIPS}/${trip.id}/rate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    score: rating, 
                    comment: comment
                })
            });

            if (response.ok) {
                showAlert("Calificación Enviada", "¡Gracias por tus comentarios!", "success");
                if (onRateSuccess) onRateSuccess();
            } else {
                const data = await response.json();
                showAlert("Error", "Error al enviar calificación: " + (data.error || "Desconocido"), "error");
            }
        } catch (error) {
            console.error(error);
            showAlert("Error de Conexión", "No se pudo enviar la calificación por problemas de conexión.", "error");
        } finally {
            setLoading(false);
            if (onDismiss) onDismiss();
        }
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7}>
                    <FontAwesome
                        name={i <= rating ? "star" : "star-o"}
                        size={42}
                        color={i <= rating ? "#FFD700" : "#E2E8F0"}
                        style={{ marginHorizontal: 6 }}
                    />
                </TouchableOpacity>
            );
        }
        return <View style={styles.starsContainer}>{stars}</View>;
    };

    const statusConfig = getRatingStatusConfig(rating);

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onDismiss}>
            <View style={styles.modalOverlay}>
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.avatarBg, { backgroundColor: '#10B981' }]}>
                            <MaterialCommunityIcons name="account-star" size={30} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.titleText, { color: theme.colors.primary }]}>Califica a tu pasajero</Text>
                        <Text style={[styles.subtitleText, { color: theme.colors.onSurfaceVariant }]}>¿Cómo se comportó el pasajero durante el viaje?</Text>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.cardContent}>
                        {renderStars()}

                        <View style={[styles.ratingBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
                            <Text style={[styles.ratingLabelText, { color: statusConfig.text }]}>
                                {getRatingLabel(rating)}
                            </Text>
                        </View>
                        
                        <TextInput
                            placeholder="Comparte tu experiencia (Opcional)"
                            placeholderTextColor={theme.colors.onSurfaceVariant}
                            multiline
                            numberOfLines={3}
                            value={comment}
                            onChangeText={setComment}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            style={[
                                [styles.input, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline, color: theme.colors.onSurface }],
                                isFocused && styles.inputFocused
                            ]}
                        />
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={onDismiss}
                            disabled={loading}
                            style={[styles.omitButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.omitButtonText, { color: theme.colors.onSurfaceVariant }]}>Omitir</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={loading}
                            style={styles.submitButton}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#10B981', '#059669']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitGradient}
                            >
                                <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.submitButtonText}>Enviar</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(6, 78, 59, 0.45)', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '90%',
        maxWidth: 340,
        borderRadius: BORDER_RADIUS.XL,
        overflow: 'hidden',
        padding: 16,
        ...SHADOWS.LARGE,
        borderWidth: 0,
    },
    cardHeader: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    avatarBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        ...SHADOWS.SMALL,
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitleText: {
        fontSize: 12,
        color: '#6C757D',
        textAlign: 'center',
        marginTop: 4,
        paddingHorizontal: 16,
    },
    divider: {
        marginVertical: 12,
        opacity: 0.5,
    },
    cardContent: {
        alignItems: 'center',
        paddingHorizontal: 8,
        width: '100%',
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 10,
    },
    ratingBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1.5,
        marginBottom: 16,
        ...SHADOWS.SMALL,
    },
    ratingLabelText: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    input: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 13,
        color: '#1E293B',
        textAlignVertical: 'top',
        minHeight: 76,
    },
    inputFocused: {
        borderColor: '#10B981',
        backgroundColor: '#FFFFFF',
        ...SHADOWS.SMALL,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingBottom: 8,
        gap: 12,
        marginTop: 12,
    },
    omitButton: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        shadowOpacity: 0.05,
        elevation: 1,
    },
    omitButtonText: {
        color: '#64748B',
        fontWeight: 'bold',
        fontSize: 13,
        letterSpacing: 0.8,
    },
    submitButton: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.MEDIUM,
    },
    submitGradient: {
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 13,
        letterSpacing: 0.8,
    },
});
