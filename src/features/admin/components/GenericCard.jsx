import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, IconButton } from 'react-native-paper';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../../core/constants/theme';

/**
 * Componente de tarjeta genérico reutilizable para mostrar datos de cualquier entidad
 * @param {Object} props
 * @param {Object} props.item - Objeto de datos
 * @param {Array} props.fields - Array de configuración de campos a mostrar
 * @param {Array} props.chips - Array de configuración de chips
 * @param {Array} props.actions - Array de acciones (edit, delete, etc)
 * @param {string} props.avatarText - Texto para el avatar (iniciales)
 * @param {string} props.avatarColor - Color de fondo del avatar
 * @param {Function} props.onPress - Callback al presionar la tarjeta
 * 
 * Estructura de fields:
 * [
 *   { key: 'name', label: 'Nombre', variant: 'titleMedium' },
 *   { key: 'email', label: 'Email', variant: 'bodySmall' }
 * ]
 * 
 * Estructura de chips:
 * [
 *   { key: 'rol_id', getValue: (item) => item.rol?.rol_name, color: '#1976D2' }
 * ]
 * 
 * Estructura de actions:
 * [
 *   { icon: 'pencil', color: COLORS.PRIMARY, onPress: (item) => {} },
 *   { icon: 'delete', color: COLORS.ERROR, onPress: (item) => {} }
 * ]
 */
export default function GenericCard({
  item,
  fields = [],
  chips = [],
  actions = [],
  avatarText = '',
  avatarColor = COLORS.PRIMARY,
  onPress,
}) {
  return (
    <Card style={styles.card}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Card.Content style={styles.cardContent}>
          {/* Header con avatar si se proporciona */}
          {avatarText && (
            <View style={styles.header}>
              <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarText}>{avatarText}</Text>
              </View>
              <View style={styles.headerContent}>
                {fields.slice(0, 2).map((field, index) => (
                  <Text
                    key={field.key}
                    variant={field.variant || 'bodyMedium'}
                    style={[
                      styles.field,
                      index === 0 && styles.fieldPrimary,
                    ]}
                  >
                    {field.label && <Text style={styles.label}>{field.label}:</Text>}
                    {field.getValue ? field.getValue(item) : item[field.key]}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Campos adicionales */}
          {fields.length > 2 && (
            <View style={styles.fieldsContainer}>
              {fields.slice(2).map((field) => (
                <View key={field.key} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{field.label}:</Text>
                  <Text style={styles.fieldValue}>
                    {field.getValue ? field.getValue(item) : item[field.key]}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Chips */}
          {chips.length > 0 && (
            <View style={styles.chipsContainer}>
              {chips.map((chip) => {
                const chipValue = chip.getValue ? chip.getValue(item) : item[chip.key];
                return (
                  <Chip
                    key={chip.key}
                    mode="flat"
                    style={[styles.chip, { backgroundColor: chip.color || COLORS.PRIMARY }]}
                    textStyle={styles.chipText}
                    icon={chip.icon}
                  >
                    {chipValue}
                  </Chip>
                );
              })}
            </View>
          )}

          {/* Acciones */}
          {actions.length > 0 && (
            <View style={styles.actions}>
              {actions.map((action, index) => (
                <IconButton
                  key={index}
                  icon={action.icon}
                  size={20}
                  iconColor={action.color || COLORS.GRAY_600}
                  onPress={() => action.onPress && action.onPress(item)}
                  style={styles.actionButton}
                  disabled={action.disabled}
                />
              ))}
            </View>
          )}
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.WHITE,
    ...SHADOWS.SMALL,
    overflow: 'hidden',
  },
  touchable: {
    flex: 1,
  },
  cardContent: {
    padding: SPACING.MD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  headerContent: {
    flex: 1,
  },
  field: {
    color: COLORS.GRAY_700,
  },
  fieldPrimary: {
    fontWeight: '600',
    color: COLORS.GRAY_900,
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
    color: COLORS.GRAY_600,
  },
  fieldsContainer: {
    marginVertical: SPACING.SM,
    paddingVertical: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.XS,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.GRAY_600,
  },
  fieldValue: {
    fontSize: 12,
    color: COLORS.GRAY_900,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: SPACING.SM,
    gap: SPACING.SM,
  },
  chip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.WHITE,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
    paddingTop: SPACING.SM,
  },
  actionButton: {
    margin: 0,
  },
});
