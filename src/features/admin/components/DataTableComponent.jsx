import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { DataTable, Text, Avatar, Switch, IconButton, Chip, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../../core/constants/theme';

/**
 * Tabla profesional de datos con acciones
 * @param {Object} props
 * @param {Array} props.data - Array de datos a mostrar
 * @param {Array} props.columns - Columnas de la tabla
 * @param {Function} props.onEdit - Callback al editar
 * @param {Function} props.onDelete - Callback al eliminar
 * @param {Function} props.onToggleStatus - Callback al cambiar estado
 * @param {Function} props.renderAvatar - Función para renderizar avatar
 * @param {Number} props.currentUserId - ID del usuario actual para protección
 * @param {Function} props.onFilterStatusChange - Callback para cambiar filtro de estado
 */
export default function DataTableComponent({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  onToggleStatus,
  renderAvatar,
  currentUserId,
  onFilterStatusChange,
  emptyMessage = 'No hay datos para mostrar',
}) {
  const [page, setPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [menuVisible, setMenuVisible] = useState({});
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, data.length);
  const paginatedData = data.slice(from, to);

  const openMenu = (id) => setMenuVisible({ ...menuVisible, [id]: true });
  const closeMenu = (id) => setMenuVisible({ ...menuVisible, [id]: false });

  const getStatusColor = (isActive) => {
    return isActive ? COLORS.SUCCESS : COLORS.GRAY_400;
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return COLORS.ADMIN;
      case 'pasajero':
        return COLORS.PASSENGER;
      case 'conductor':
        return COLORS.DRIVER;
      default:
        return COLORS.PRIMARY;
    }
  };

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="table-off" size={64} color={COLORS.GRAY_400} />
        <Text variant="titleMedium" style={styles.emptyText}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <DataTable style={styles.table}>
          {/* Header */}
          <DataTable.Header style={styles.tableHeader}>
            <DataTable.Title style={styles.avatarColumn}>Usuario</DataTable.Title>
            <DataTable.Title style={styles.nameColumn}>Nombre</DataTable.Title>
            <DataTable.Title style={styles.emailColumn}>Email</DataTable.Title>
            <DataTable.Title style={styles.roleColumn}>Rol</DataTable.Title>
            <DataTable.Title style={styles.statusColumn}>
              <View style={styles.statusHeaderContainer}>
                <Text variant="labelMedium" style={styles.statusHeaderText}>Estado</Text>
                <Menu
                  visible={statusMenuVisible}
                  onDismiss={() => setStatusMenuVisible(false)}
                  anchor={
                    <TouchableOpacity
                      onPress={() => setStatusMenuVisible(true)}
                      style={styles.statusMenuTrigger}
                    >
                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={18}
                        color={COLORS.GRAY_700}
                      />
                    </TouchableOpacity>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      onFilterStatusChange?.('active');
                      setStatusMenuVisible(false);
                    }}
                    title="✓ Activos"
                  />
                  <Menu.Item
                    onPress={() => {
                      onFilterStatusChange?.('inactive');
                      setStatusMenuVisible(false);
                    }}
                    title="✓ Inactivos"
                  />
                  <Menu.Item
                    onPress={() => {
                      onFilterStatusChange?.('all');
                      setStatusMenuVisible(false);
                    }}
                    title="✓ Ver todos"
                  />
                </Menu>
              </View>
            </DataTable.Title>
            <DataTable.Title style={styles.actionsColumn}>Acciones</DataTable.Title>
          </DataTable.Header>

          {/* Rows */}
          {paginatedData.map((item) => (
            <DataTable.Row key={item.id} style={styles.tableRow}>
              {/* Avatar */}
              <DataTable.Cell style={styles.avatarColumn}>
                <Avatar.Text
                  size={40}
                  label={item.name?.substring(0, 2).toUpperCase() || 'U'}
                  style={{ backgroundColor: getRoleColor(item.rol?.nombre || item.role?.name) }}
                />
              </DataTable.Cell>

              {/* Nombre */}
              <DataTable.Cell style={styles.nameColumn}>
                <View>
                  <Text variant="titleSmall" style={styles.nameText}>
                    {item.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.idText}>
                    ID: {item.id}
                  </Text>
                </View>
              </DataTable.Cell>

              {/* Email */}
              <DataTable.Cell style={styles.emailColumn}>
                <Text variant="bodyMedium" style={styles.emailText}>
                  {item.email}
                </Text>
              </DataTable.Cell>

              {/* Rol */}
              <DataTable.Cell style={styles.roleColumn}>
                <Chip
                  mode="flat"
                  style={[styles.roleChip, { backgroundColor: `${getRoleColor(item.rol?.nombre || item.role?.name)}15` }]}
                  textStyle={[styles.roleChipText, { color: getRoleColor(item.rol?.nombre || item.role?.name) }]}
                  icon={() => (
                    <MaterialCommunityIcons
                      name={
                        (item.rol?.nombre || item.role?.name)?.toLowerCase() === 'admin'
                          ? 'shield-account'
                          : (item.rol?.nombre || item.role?.name)?.toLowerCase() === 'conductor'
                          ? 'steering'
                          : 'account'
                      }
                      size={16}
                      color={getRoleColor(item.rol?.nombre || item.role?.name)}
                    />
                  )}
                >
                  {item.rol?.nombre || item.role?.name || 'Usuario'}
                </Chip>
              </DataTable.Cell>

              {/* Estado (Switch) */}
              <DataTable.Cell style={styles.statusColumn}>
                <View style={styles.statusContainer}>
                  <Switch
                    value={item.is_active}
                    onValueChange={() => onToggleStatus && onToggleStatus(item.id)}
                    color={COLORS.SUCCESS}
                    disabled={currentUserId === item.id}
                  />
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.statusText,
                      { 
                        color: item.is_active ? COLORS.SUCCESS : COLORS.GRAY_600,
                        opacity: currentUserId === item.id ? 0.5 : 1,
                      },
                    ]}
                  >
                    {item.is_active ? 'Activo' : 'Inactivo'} {currentUserId === item.id && '(Tu cuenta)'}
                  </Text>
                </View>
              </DataTable.Cell>

              {/* Acciones */}
              <DataTable.Cell style={styles.actionsColumn}>
                <View style={styles.actionsContainer}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    iconColor={COLORS.PRIMARY_LIGHT}
                    onPress={() => onEdit && onEdit(item)}
                    style={styles.actionButton}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor={currentUserId === item.id ? COLORS.GRAY_400 : "#f83737"}
                    disabled={currentUserId === item.id}
                    onPress={() => onDelete && onDelete(item.id)}
                    style={[styles.actionButton, currentUserId === item.id && { opacity: 0.5 }]}
                  />
                  <Menu
                    visible={menuVisible[item.id]}
                    onDismiss={() => closeMenu(item.id)}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        size={20}
                        iconColor={COLORS.GRAY_600}
                        onPress={() => openMenu(item.id)}
                        style={styles.actionButton}
                      />
                    }
                  >
                    <Menu.Item
                      leadingIcon="information"
                      onPress={() => {
                        closeMenu(item.id);
                        // Ver detalles
                      }}
                      title="Ver detalles"
                    />
                    <Menu.Item
                      leadingIcon="email"
                      onPress={() => {
                        closeMenu(item.id);
                        // Enviar email
                      }}
                      title="Enviar email"
                    />
                  </Menu>
                </View>
              </DataTable.Cell>
            </DataTable.Row>
          ))}

          {/* Paginación */}
          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(data.length / itemsPerPage)}
            onPageChange={(page) => setPage(page)}
            label={`${from + 1}-${to} de ${data.length}`}
            numberOfItemsPerPage={itemsPerPage}
            showFastPaginationControls
            style={styles.pagination}
          />
        </DataTable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    ...SHADOWS.MEDIUM,
    marginTop: SPACING.MD,
  },
  table: {
    minWidth: 900,
  },
  tableHeader: {
    backgroundColor: '#f5f7fa',
    borderTopLeftRadius: BORDER_RADIUS.LG,
    borderTopRightRadius: BORDER_RADIUS.LG,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
    minHeight: 72,
  },
  avatarColumn: {
    flex: 0.8,
    minWidth: 80,
  },
  nameColumn: {
    flex: 1.5,
    minWidth: 180,
  },
  emailColumn: {
    flex: 2,
    minWidth: 220,
  },
  roleColumn: {
    flex: 1.2,
    minWidth: 140,
  },
  statusColumn: {
    flex: 1.2,
    minWidth: 140,
  },
  actionsColumn: {
    flex: 1.3,
    minWidth: 150,
  },
  nameText: {
    fontWeight: '600',
    color: COLORS.GRAY_900,
  },
  idText: {
    color: COLORS.GRAY_500,
    marginTop: 2,
  },
  emailText: {
    color: COLORS.GRAY_700,
  },
  roleChip: {
    alignSelf: 'flex-start',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    justifyContent: 'flex-start',
  },
  statusHeaderText: {
    fontWeight: '600',
    color: COLORS.GRAY_900,
  },
  statusMenuTrigger: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    margin: 0,
  },
  pagination: {
    borderBottomLeftRadius: BORDER_RADIUS.LG,
    borderBottomRightRadius: BORDER_RADIUS.LG,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL * 2,
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    marginTop: SPACING.MD,
  },
  emptyText: {
    color: COLORS.GRAY_500,
    marginTop: SPACING.MD,
  },
});
