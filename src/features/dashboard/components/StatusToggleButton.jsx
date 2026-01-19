
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Switch } from 'react-native-paper';
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
                activeOpacity={0.8}
            >
                <Text style={styles.text}>
                    {isOnline ? 'DESCONECTARSE' : 'CONECTARSE'}
                </Text>

                <View style={styles.switchContainer}>
                    <View style={[styles.indicator, { backgroundColor: isOnline ? '#fff' : '#fff' }]} />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 100, // Moved up as requested
        alignSelf: 'center',
        zIndex: 10,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30, // Rounded pill shape
        minWidth: 200,
        ...SHADOWS.MEDIUM,
    },
    buttonOffline: {
        backgroundColor: COLORS.SUCCESS,
    },
    buttonOnline: {
        backgroundColor: COLORS.GRAY_800, // Dark grey for disconnect
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 10,
    },
    switchContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    }
});
