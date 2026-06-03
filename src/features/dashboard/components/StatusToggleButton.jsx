
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '../../../core/constants/theme';

export default function StatusToggleButton({ isOnline, onToggle }) {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.button,
                    isOnline ? styles.buttonOnline : styles.buttonOffline,
                ]}
                onPress={onToggle}
                activeOpacity={0.85}
            >
                <MaterialCommunityIcons 
                    name={isOnline ? "wifi" : "wifi-off"} 
                    size={20} 
                    color="#fff" 
                    style={{ marginRight: 8 }}
                />
                
                <Text style={styles.text}>
                    {isOnline ? 'EN LÍNEA' : 'DESCONECTADO'}
                </Text>

                <View style={styles.switchContainer}>
                    <View style={[styles.indicator, isOnline ? styles.indicatorOnline : styles.indicatorOffline]} />
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
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30, // Rounded pill shape
        minWidth: 180,
        ...SHADOWS.MEDIUM,
        borderWidth: 1.5,
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
        fontSize: 14,
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
