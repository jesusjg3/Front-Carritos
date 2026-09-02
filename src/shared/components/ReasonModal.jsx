import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BORDER_RADIUS } from '../../core/constants/theme';
import { MODAL_ANIMATION_MS } from '../../core/constants/timing';
import { TextInput } from 'react-native';
import AppModal from './AppModal';

export default function ReasonModal({ visible, onDismiss, onConfirm, title, placeholder }) {
    const theme = useTheme();
    const [reason, setReason] = useState('');
    const resetTimerRef = useRef(null);

    useEffect(() => {
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        if (!visible) {
            resetTimerRef.current = setTimeout(() => setReason(''), MODAL_ANIMATION_MS);
        }
        return () => {
            if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        };
    }, [visible]);

    const handleConfirm = () => {
        if (!reason.trim()) return;
        onConfirm(reason);
        setReason('');
    };

    return (
        <AppModal visible={visible} onDismiss={onDismiss}>
                <View style={[styles.dialog, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.modalContent}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.error + '15' }]}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={32} color={theme.colors.error} />
                    </View>
                    
                    <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
                    
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.colors.surfaceVariant,
                            borderColor: theme.colors.outline,
                            color: theme.colors.onSurface,
                        }]}
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        placeholder={placeholder || "Ingresa el motivo..."}
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        scrollEnabled
                    />

                    <View style={styles.buttonRow}>
                        <Button mode="text" onPress={onDismiss} style={styles.button} textColor={theme.colors.onSurfaceVariant}>
                            Cancelar
                        </Button>
                        <Button 
                            mode="contained" 
                            onPress={handleConfirm} 
                            style={styles.button}
                            disabled={!reason.trim()}
                            buttonColor={theme.colors.primary}
                        >
                            Confirmar
                        </Button>
                    </View>
                  </View>
                </View>
        </AppModal>
    );
}

const styles = StyleSheet.create({
    dialog: {
        width: '100%',
        maxWidth: 340,
        alignSelf: 'center',
        borderRadius: BORDER_RADIUS.XL,
        overflow: 'hidden',
    },
    modalContent: {
        width: '100%',
        padding: 18,
        alignItems: 'center',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 88,
        maxHeight: 88,
        borderWidth: 1,
        borderRadius: BORDER_RADIUS.MD,
        padding: 12,
        fontSize: 15,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 12,
    },
    button: {
        flex: 1,
        borderRadius: BORDER_RADIUS.MD,
    }
});
