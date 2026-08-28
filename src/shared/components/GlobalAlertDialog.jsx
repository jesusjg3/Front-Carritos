import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOWS } from '../../core/constants/theme';
import { MODAL_ANIMATION_MS } from '../../core/constants/timing';

export default function GlobalAlertDialog({ config, onDismiss }) {
    const theme = useTheme();

    const {
        title,
        message,
        type = 'info', // 'info' | 'success' | 'error' | 'warning'
        confirmText = 'Aceptar',
        cancelText = 'Cancelar',
        onConfirm,
        onCancel
    } = config || {};

    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (config?.visible) {
            scaleAnim.setValue(0.9);
            opacityAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 60,
                    useNativeDriver: true
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: MODAL_ANIMATION_MS,
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [config?.visible]);

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        else onDismiss();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        else onDismiss();
    };

    // Icon & Color mapping based on alert type
    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'check-decagram',
                    color: '#10B981',
                    colors: ['#10B981', '#059669'],
                    bg: '#ECFDF5'
                };
            case 'error':
                return {
                    icon: 'alert-octagon',
                    color: '#EF4444',
                    colors: ['#EF4444', '#DC2626'],
                    bg: '#FEF2F2'
                };
            case 'warning':
                return {
                    icon: 'alert',
                    color: '#F59E0B',
                    colors: ['#F59E0B', '#D97706'],
                    bg: '#FFFBEB'
                };
            case 'info':
            default:
                return {
                    icon: 'information',
                    color: '#1E88E5',
                    colors: ['#144985', '#1E88E5'],
                    bg: '#EFF6FF'
                };
        }
    };

    const typeConfig = getTypeConfig();

    if (!config || !config.visible) return null;

    return (
        <Modal
            transparent
            visible={config.visible}
            animationType="none"
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay}>
                <Animated.View 
                    style={[
                        styles.container,
                        {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.outline,
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    {/* Header Glowing Ring & Icon */}
                    <View style={styles.header}>
                        <View style={[styles.iconOuterRing, { backgroundColor: typeConfig.bg }]}>
                            <View style={[styles.iconInner, { backgroundColor: typeConfig.color }]}>
                                <MaterialCommunityIcons name={typeConfig.icon} size={28} color="#FFFFFF" />
                            </View>
                        </View>
                    </View>

                    {/* Content Section */}
                    <View style={styles.content}>
                        {title ? (
                            <Text style={[styles.title, { color: typeConfig.color }]}>
                                {title}
                            </Text>
                        ) : (
                            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                                {type === 'success' ? '¡Éxito!' : type === 'error' ? 'Error' : 'Notificación'}
                            </Text>
                        )}
                        <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>{message}</Text>
                    </View>

                    {/* Footer Buttons Section */}
                    <View style={styles.footer}>
                        {onCancel && (
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}
                                onPress={handleCancel}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.cancelButtonText, { color: theme.colors.onSurfaceVariant }]}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton]}
                            onPress={handleConfirm}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={typeConfig.colors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.confirmGradient}
                            >
                                <Text style={styles.confirmButtonText}>{confirmText}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(13, 52, 97, 0.45)', // Premium dark blue overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        ...SHADOWS.LARGE,
        borderWidth: 0,
    },
    header: {
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconOuterRing: {
        width: 76,
        height: 76,
        borderRadius: 38,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
    },
    iconInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.SMALL,
    },
    content: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 8,
    },
    footer: {
        width: '100%',
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.MEDIUM,
    },
    confirmButton: {
        overflow: 'hidden',
    },
    confirmGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 0.8,
    },
    cancelButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowOpacity: 0.05,
        elevation: 1,
    },
    cancelButtonText: {
        color: '#64748B',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 0.8,
    },
});
