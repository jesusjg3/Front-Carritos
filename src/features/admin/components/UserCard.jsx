import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, IconButton } from 'react-native-paper';
import { 
  getAvatarColor, 
  getInitials, 
  getRoleColor, 
  getStatusColor, 
  formatRoleName, 
  formatStatus 
} from '../../../core/utils';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../../core/constants/theme';

/**
 * Componente reutilizable para mostrar una tarjeta de usuario
 * @param {Object} user - Objeto de usuario con {id, name, email, rol, is_active}
 * @param {Function} onEdit - Callback al presionar editar
 * @param {Function} onDelete - Callback al presionar eliminar
 * @param {Function} onToggleStatus - Callback al presionar toggle de estado
 */
export default function UserCard({ user, onEdit, onDelete, onToggleStatus }) {
  const avatarColor = getAvatarColor(user.name);
  const roleColor = getRoleColor(user.rol?.rol_name);
  const statusColor = getStatusColor(user.is_active);

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        {/* Header con avatar y nombre */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text variant="titleMedium" style={styles.userName}>
              {user.name}
            </Text>
            <Text variant="bodySmall" style={styles.userEmail}>
              {user.email}
            </Text>
          </View>
        </View>

        {/* Chips de rol y estado */}
        <View style={styles.chipsContainer}>
          <Chip
            mode="flat"
            style={[styles.chip, { backgroundColor: roleColor }]}
            textStyle={styles.chipText}
            icon="shield-account"
          >
            {formatRoleName(user.rol?.rol_name)}
          </Chip>
          <Chip
            mode="flat"
            style={[styles.chip, { backgroundColor: statusColor }]}
            textStyle={styles.chipText}
            icon={user.is_active ? 'check-circle' : 'close-circle'}
          >
            {formatStatus(user.is_active)}
          </Chip>
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <IconButton
            icon={user.is_active ? 'eye-off' : 'eye'}
            size={20}
            iconColor={COLORS.GRAY_600}
            onPress={() => onToggleStatus && onToggleStatus(user.id)}
            style={styles.actionButton}
          />
          <IconButton
            icon="pencil"
            size={20}
            iconColor={COLORS.PRIMARY}
            onPress={() => onEdit && onEdit(user)}
            style={styles.actionButton}
          />
          <IconButton
            icon="delete"
            size={20}
            iconColor={COLORS.ERROR}
            onPress={() => onDelete && onDelete(user.id)}
            style={styles.actionButton}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.WHITE,
    ...SHADOWS.SMALL,
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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    color: COLORS.GRAY_900,
  },
  userEmail: {
    color: COLORS.GRAY_600,
    marginTop: 2,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.SM,
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
