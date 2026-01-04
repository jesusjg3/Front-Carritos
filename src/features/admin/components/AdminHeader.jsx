import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { COLORS, SPACING, SHADOWS } from '../../../core/constants/theme';

/**
 * Encabezado reutilizable para páginas de administración
 * @param {Object} props
 * @param {string} props.title - Título principal
 * @param {string} props.subtitle - Subtítulo opcional
 * @param {Function} props.onBackPress - Callback al presionar retroceso
 * @param {Array} props.actions - Array de acciones (botones en el header)
 * @param {boolean} props.showBack - Mostrar botón de retroceso
 */
export default function AdminHeader({
  title,
  subtitle = '',
  onBackPress,
  actions = [],
  showBack = false,
}) {
  const theme = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: COLORS.PRIMARY }]}>
      <View style={styles.headerContent}>
        {showBack && (
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={COLORS.WHITE}
            onPress={onBackPress}
            style={styles.backButton}
          />
        )}
        <View style={styles.titleContainer}>
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: COLORS.WHITE }]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              variant="bodySmall"
              style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <IconButton
              key={index}
              icon={action.icon}
              size={24}
              iconColor={COLORS.WHITE}
              onPress={action.onPress}
              disabled={action.disabled}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    ...SHADOWS.MEDIUM,
    paddingBottom: SPACING.MD,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.SM,
  },
  backButton: {
    marginRight: SPACING.SM,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
