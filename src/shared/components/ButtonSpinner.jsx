import React from 'react';
import { ActivityIndicator } from 'react-native';

/**
 * Renderizador del icono de carga dentro de los botones de React Native Paper.
 * Utiliza ActivityIndicator nativo para evitar fragmentación o desbordamiento en producción.
 */
export const renderButtonSpinner = ({ color }) => (
    <ActivityIndicator size="small" color={color} animating={true} />
);
