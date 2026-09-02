
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SHADOWS } from '../../../core/constants/theme';

export default function StatusToggleButton({ isOnline, onToggle }) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.button,
                    isOnline ? styles.buttonOnline : styles.buttonOffline,
                    { backgroundColor: isOnline ? theme.colors.success : theme.colors.primary },
                ]}
                onPress={onToggle}
                activeOpacity={0.85}
            >
                <MaterialCommunityIcons 
                    name={isOnline ? "wifi" : "wifi-off"} 
                    size={18}
                    color={isOnline ? theme.colors.onSuccess : theme.colors.onPrimary}
                    style={{ marginRight: 6 }}
                />
                
                <Text style={[styles.text, { color: isOnline ? theme.colors.onSuccess : theme.colors.onPrimary }]}>
                    {isOnline ? 'EN LÍNEA' : 'DESCONECTADO'}
                </Text>

                <View style={[styles.switchContainer, { backgroundColor: isOnline ? theme.colors.onSuccess + '30' : theme.colors.onPrimary + '30' }]}>
                    <View style={[styles.indicator, { backgroundColor: isOnline ? theme.colors.onSuccess : theme.colors.onPrimary }, isOnline ? styles.indicatorOnline : styles.indicatorOffline]} />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 40, // Elegant top placement overlaying map
        alignSelf: 'center',
        zIndex: 90,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 24,
        minWidth: 160,
        ...SHADOWS.MEDIUM,
        borderWidth: 0,
    },
    buttonOffline: {
        backgroundColor: '#144985', // Brand Deep Blue
        borderColor: '#144985',
    },
    buttonOnline: {
        backgroundColor: '#2E7D32', // Emerald green
        borderColor: '#2E7D32',
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 0.8,
        flex: 1,
        textAlign: 'center',
    },
    switchContainer: {
        width: 36,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    indicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    indicatorOffline: {
        alignSelf: 'flex-start',
    },
    indicatorOnline: {
        alignSelf: 'flex-end',
    }
});
