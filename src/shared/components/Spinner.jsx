import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

/**
 * Mapeo de tamaños estándar para el indicador de actividad nativo.
 */
const INDICATOR_SIZE_MAP = {
    small: 'small',
    large: 'large',
};

/**
 * Componente unificado de Spinner que utiliza el ActivityIndicator nativo de React Native.
 * Resuelve el fallo en modo producción (--no-dev --minify) donde los círculos SVG con
 * strokeDasharray y strokeLinecap="round" colapsan en Android Skia dejando solo los extremos.
 */
export default function Spinner({ size = 'small', color, style }) {
    const theme = useTheme();
    const resolvedColor = color || theme.colors.primary;
    const resolvedSize = typeof size === 'number'
        ? size
        : (INDICATOR_SIZE_MAP[size] || 'small');

    return (
        <View style={[styles.container, style]}>
            <ActivityIndicator
                size={resolvedSize}
                color={resolvedColor}
                animating={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
