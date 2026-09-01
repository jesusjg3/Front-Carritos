import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, Dialog, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SHADOWS, BORDER_RADIUS } from '../../core/constants/theme';
import { TextInput } from 'react-native';

export default function ReasonModal({ visible, onDismiss, onConfirm, title, placeholder }) {
    const theme = useTheme();
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) return;
        onConfirm(reason);
        setReason('');
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
                <View style={styles.modalContent}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.error + '15' }]}>
                        <MaterialCommunityIcons name="alert-circle" size={32} color={theme.colors.error} />
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
            </Dialog>
        </Portal>
    );
}

const styles = StyleSheet.create({
    dialog: {
        maxWidth: 340,
        alignSelf: 'center',
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
        color: '#333',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderRadius: BORDER_RADIUS.MD,
        padding: 12,
        fontSize: 15,
        minHeight: 64,
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
