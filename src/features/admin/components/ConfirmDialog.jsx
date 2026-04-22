import React from 'react';
import { Portal, Dialog, Button, Text } from 'react-native-paper';
import { COLORS, SPACING } from '../../../core/constants/theme';

/**
 * Diálogo de confirmación para acciones destructivas
 * @param {Object} props
 * @param {boolean} props.visible - Control de visibilidad
 * @param {Function} props.onDismiss - Callback al cerrar
 * @param {Function} props.onConfirm - Callback al confirmar
 * @param {string} props.title - Título del diálogo
 * @param {string} props.message - Mensaje de confirmación
 * @param {string} props.confirmText - Texto del botón de confirmación (default: 'Eliminar')
 * @param {string} props.cancelText - Texto del botón de cancelación (default: 'Cancelar')
 * @param {boolean} props.isLoading - Indicador de carga
 * @param {string} props.buttonColor - Color del botón de confirmación (default: ERROR)
 */
export default function ConfirmDialog({
  visible,
  onDismiss,
  onConfirm,
  title = 'Confirmar Acción',
  message = '¿Estás seguro?',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isLoading = false,
  buttonColor = COLORS.ERROR,
}) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ color: COLORS.GRAY_700 }}>
            {message}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={{ justifyContent: 'flex-end', paddingTop: SPACING.MD }}>
          <Button
            mode="text"
            onPress={onDismiss}
            disabled={isLoading}
            textColor={COLORS.GRAY_600}
          >
            {cancelText}
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            disabled={isLoading}
            loading={isLoading}
            buttonColor={buttonColor}
            style={{ marginLeft: SPACING.SM }}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
