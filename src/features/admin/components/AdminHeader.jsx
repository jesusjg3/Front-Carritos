import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, useTheme, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SHADOWS } from '../../../core/constants/theme';

/**
 * Encabezado reutilizable para páginas de administración
 * @param {Object} props
 * @param {string} props.title - Título principal
 * @param {string} props.subtitle - Subtítulo opcional
 * @param {Function} props.onBackPress - Callback al presionar retroceso
 * @param {Array} props.actions - Array de acciones (botones en el header) - cada acción puede tener {icon, onPress, disabled, badge}
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
    <LinearGradient
      colors={[COLORS.PRIMARY, COLORS.PRIMARY_LIGHT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        {showBack && (
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor="#FFFFFF"
            onPress={onBackPress}
            style={styles.backButton}
          />
        )}
        <View style={styles.titleContainer}>
          <Text
            variant="headlineSmall"
            style={styles.title}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              variant="bodyMedium"
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <View key={index} style={styles.actionButton}>
              <IconButton
                icon={action.icon}
                size={24}
                iconColor="#FFFFFF"
                onPress={action.onPress}
                disabled={action.disabled}
              />
              {action.badge && action.badge > 0 && (
                <Badge size={18} style={styles.badge}>
                  {action.badge}
                </Badge>
              )}
            </View>
          ))}
        </View>
      </View>
      
      {/* Decorative elements */}
      <View style={styles.decorationContainer}>
        <View style={[styles.decorationCircle, styles.circle1]} />
        <View style={[styles.decorationCircle, styles.circle2]} />
        <View style={[styles.decorationCircle, styles.circle3]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: SPACING.LG,
    paddingTop: SPACING.SM,
    overflow: 'hidden',
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.SM,
    zIndex: 10,
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
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF5252',
  },
  decorationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    opacity: 0.15,
  },
  decorationCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: '#FFFFFF',
  },
  circle1: {
    width: 120,
    height: 120,
    top: -40,
    right: 60,
  },
  circle2: {
    width: 80,
    height: 80,
    top: 20,
    right: -20,
  },
  circle3: {
    width: 60,
    height: 60,
    top: 60,
    left: -20,
  },
});
