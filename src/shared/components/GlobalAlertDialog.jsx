import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOWS } from '../../core/constants/theme';
import AppModal from './AppModal';

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
                    color: theme.colors.success,
                    colors: [theme.colors.success, theme.colors.success],
                    bg: `${theme.colors.success}18`,
                    textColor: theme.colors.onSuccess
                };
            case 'error':
                return {
                    icon: 'alert-octagon',
                    color: theme.colors.error,
                    colors: [theme.colors.error, theme.colors.error],
                    bg: `${theme.colors.error}18`,
                    textColor: theme.colors.onError
                };
            case 'warning':
                return {
                    icon: 'alert',
                    color: theme.colors.warning,
                    colors: [theme.colors.warning, theme.colors.warning],
                    bg: `${theme.colors.warning}18`,
                    textColor: theme.colors.onWarning
                };
            case 'info':
            default:
                return {
                    icon: 'information',
                    color: theme.colors.info,
                    colors: [theme.colors.primary, theme.colors.info],
                    bg: `${theme.colors.info}18`,
                    textColor: theme.colors.onPrimary
                };
        }
    };

    const typeConfig = getTypeConfig();

    return (
        <AppModal visible={Boolean(config?.visible)} onDismiss={handleCancel}>
                <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
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
                                <Text style={[styles.confirmButtonText, { color: typeConfig.textColor }]}>{confirmText}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
        </AppModal>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 320,
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
