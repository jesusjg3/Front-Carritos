import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import { Text, Card, Button, useTheme, ActivityIndicator, Icon, Searchbar, Chip, FAB, Dialog, Portal, TextInput } from "react-native-paper";
import { useAppContext } from "../../../shared/contexts/AppContext";
import { AdminService } from "../../../core/services";
import AdminHeader from "../components/AdminHeader";
import { useFocusEffect } from "@react-navigation/native";
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONTS,
  LABELS,
  MESSAGES,
} from "../../../shared/constants";
import {
  getInitials,
  getRoleColor,
  getStatusColor,
  getAvatarColor,
  formatRoleName,
  formatStatus,
  filterUsersByQuery,
  filterUsersByRole,
  validateEmail,
  validatePassword,
  validateName,
} from "../../../shared/utils";

const TAB_ITEMS = [
  { id: 'list', label: 'Conductores', icon: 'car' },
  { id: 'roles', label: 'Gestionar Roles', icon: 'shield-account' },
];

export default function DriverManagementHub({ navigation }) {
  const { user } = useAppContext();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('list');
  const [drivers, setDrivers] = useState([]);
  const [roles, setRoles] = useState([]);
  
  const handleGoBack = () => {
    navigation.goBack();
  };
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rol_id: '',
    licenseNumber: '',
    vehicleInfo: '',
  });

  useFocusEffect(
    useCallback(() => {
      loadDrivers();
      loadRoles();
    }, [])
  );

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const allUsers = await AdminService.getUsers();
      const usersArray = allUsers?.data || allUsers || [];
      const conductores = filterUsersByRole(usersArray, 'conductor') || [];
      setDrivers(conductores);
    } catch (err) {
      console.error('Error cargando conductores:', err);
      Alert.alert(MESSAGES.ERROR, MESSAGES.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      console.log('[DriverManagementHub] Loading roles...');
      const data = await AdminService.getRoles();
      console.log('[DriverManagementHub] Roles loaded successfully:', data);
      setRoles(data?.data || data || []);
    } catch (err) {
      console.error('[DriverManagementHub] Error cargando roles:', err);
      Alert.alert(
        'Error', 
        `No se pudieron cargar los roles: ${err.message || 'Error desconocido'}`
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'list') {
      await loadDrivers();
    }
    setRefreshing(false);
  };

  const filteredDrivers = filterUsersByQuery(drivers, searchQuery);

  const handleCreateDriver = () => {
    setEditingDriver(null);
    setFormData({ name: '', email: '', password: '', rol_id: '', licenseNumber: '', vehicleInfo: '' });
    setShowCreateDialog(true);
  };

  const handleSaveDriver = async () => {
    if (!formData.name || !formData.email || !formData.rol_id) {
      Alert.alert(MESSAGES.ERROR, MESSAGES.REQUIRED_FIELD);
      return;
    }

    if (!validateName(formData.name)) {
      Alert.alert(MESSAGES.ERROR, 'El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (!validateEmail(formData.email)) {
      Alert.alert(MESSAGES.ERROR, MESSAGES.INVALID_EMAIL);
      return;
    }

    if (!editingDriver && !validatePassword(formData.password)) {
      Alert.alert(MESSAGES.ERROR, MESSAGES.PASSWORD_MIN_LENGTH);
      return;
    }

    try {
      if (editingDriver) {
        await AdminService.updateUser(editingDriver.id, {
          name: formData.name,
          email: formData.email,
          rol_id: formData.rol_id,
        });
        Alert.alert(MESSAGES.SUCCESS, MESSAGES.DRIVER_UPDATED);
      } else {
        await AdminService.createDriver({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          rol_id: formData.rol_id,
        });
        Alert.alert(MESSAGES.SUCCESS, MESSAGES.DRIVER_CREATED);
      }
      setShowCreateDialog(false);
      loadDrivers();
    } catch (err) {
      console.error('Error guardando conductor:', err);
      Alert.alert(MESSAGES.ERROR, 'No se pudo guardar el conductor');
    }
  };

  const handleToggleDriverStatus = async (driverId) => {
    try {
      await AdminService.toggleUserStatus(driverId);
      loadDrivers();
    } catch (err) {
      console.error('Error actualizando estado:', err);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const handleDeleteDriver = (driverId) => {
    Alert.alert(
      MESSAGES.DELETE_DRIVER_CONFIRM.split('?')[0] + '?',
      '¿Estás seguro de que deseas eliminar este conductor?',
      [
        { text: LABELS.CANCEL, onPress: () => {}, style: 'cancel' },
        {
          text: LABELS.DELETE,
          onPress: async () => {
            try {
              await AdminService.deleteUser(driverId);
              loadDrivers();
              Alert.alert(MESSAGES.SUCCESS, MESSAGES.DRIVER_DELETED);
            } catch (err) {
              console.error('Error eliminando conductor:', err);
              Alert.alert(MESSAGES.ERROR, 'No se pudo eliminar el conductor');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (!user || user.role !== "admin") {
    return (
      <View style={[styles.container, styles.centeredContent]}>
        <Icon source="lock" size={64} color={COLORS.ERROR_RED} />
        <Text variant="headlineSmall" style={{ marginTop: SPACING.LG, color: COLORS.ERROR_RED }}>
          Acceso denegado
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader 
        title="Gestión de Conductores"
        subtitle="Gestión de conductores activos"
        icon="car"
        onBackPress={handleGoBack}
      />

      <View style={styles.tabsContainer}>
        {TAB_ITEMS.map((tab) => (
          <Button
            key={tab.id}
            mode={activeTab === tab.id ? "contained" : "text"}
            icon={tab.icon}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && { backgroundColor: COLORS.DRIVER_RED }]}
            labelStyle={styles.tabLabel}
          >
            {tab.label}
          </Button>
        ))}
      </View>

      {activeTab === 'list' && (
        <View style={styles.content}>
          <Searchbar
            placeholder="Buscar conductor..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            icon="magnify"
          />

          {loading ? (
            <View style={styles.centeredContent}>
              <ActivityIndicator animating size="large" color={COLORS.DRIVER_RED} />
            </View>
          ) : filteredDrivers.length === 0 ? (
            <View style={styles.centeredContent}>
              <Icon source="car-off" size={64} color={COLORS.GRAY_300} />
              <Text style={{ marginTop: SPACING.LG, color: COLORS.GRAY_500 }}>
                {searchQuery ? 'No se encontraron conductores' : 'No hay conductores'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredDrivers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <DriverCard driver={item} onToggle={() => handleToggleDriverStatus(item.id)} onEdit={() => {
                setEditingDriver(item);
                setFormData({
                  name: item.name,
                  email: item.email,
                  password: '',
                  rol_id: item.rol_id?.toString() || '',
                  licenseNumber: item.licenseNumber || '',
                  vehicleInfo: item.vehicleInfo || '',
                });
                setShowCreateDialog(true);
              }} onDelete={() => handleDeleteDriver(item.id)} />}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          )}

          <FAB
            icon="plus"
            onPress={handleCreateDriver}
            style={[styles.fab, { backgroundColor: COLORS.DRIVER_RED }]}
          />
        </View>
      )}

      {activeTab === 'roles' && (
        <View style={styles.content}>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">Roles de Conductores</Text>
              <Text style={{ marginTop: 8, color: '#666' }}>
                Los conductores tienen los siguientes roles configurados:
              </Text>
              {roles.filter(r => r.rol_name === 'conductor').map((role) => (
                <View key={role.id} style={styles.roleInfo}>
                  <Chip
                    label={role.rol_name}
                    style={{ backgroundColor: '#D32F2F' }}
                    textStyle={{ color: '#fff' }}
                  />
                  <Text style={{ marginTop: 8, color: '#666' }}>
                    {role.description || 'Sin descripción'}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        </View>
      )}

      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>{editingDriver ? MESSAGES.EDIT_DRIVER_TITLE : MESSAGES.CREATE_DRIVER_TITLE}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={LABELS.NAME}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
              placeholder={LABELS.NAME}
            />
            <TextInput
              label={LABELS.EMAIL}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              style={styles.input}
              placeholder={LABELS.EMAIL}
              keyboardType="email-address"
            />
            {!editingDriver && (
              <TextInput
                label={LABELS.PASSWORD}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                style={styles.input}
                placeholder={LABELS.PASSWORD}
                secureTextEntry
              />
            )}
            <TextInput
              label="Número de Licencia (Opcional)"
              value={formData.licenseNumber}
              onChangeText={(text) => setFormData({ ...formData, licenseNumber: text })}
              style={styles.input}
              placeholder="Ej: ABC-123456"
            />
            <TextInput
              label="Información del Vehículo (Opcional)"
              value={formData.vehicleInfo}
              onChangeText={(text) => setFormData({ ...formData, vehicleInfo: text })}
              style={styles.input}
              placeholder="Ej: Chevrolet Aveo Blanco"
              multiline
            />
            <View style={styles.roleSelector}>
              <Text>{LABELS.ROLE}:</Text>
              {roles.filter(r => r.rol_name === 'conductor').map((role) => (
                <Chip
                  key={role.id}
                  label={formatRoleName(role.rol_name)}
                  onPress={() => setFormData({ ...formData, rol_id: role.id.toString() })}
                  selected={formData.rol_id === role.id.toString()}
                  style={styles.roleChip}
                />
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>{LABELS.CANCEL}</Button>
            <Button onPress={handleSaveDriver} mode="contained">{LABELS.SAVE}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function DriverCard({ driver, onToggle, onEdit, onDelete }) {
  const avatarColor = getAvatarColor(driver.name);
  const statusColor = getStatusColor(driver.is_active);
  const roleColor = getRoleColor(driver.rol?.rol_name || 'conductor');

  return (
    <Card style={styles.driverCard}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.driverHeader}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{getInitials(driver.name)}</Text>
          </View>
          <View style={styles.driverInfo}>
            <Text variant="titleMedium" style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.driverEmail}>{driver.email}</Text>
          </View>
        </View>

        <View style={styles.driverDetails}>
          <Chip
            label={formatRoleName(driver.rol?.rol_name || 'Sin rol')}
            style={{ backgroundColor: roleColor, marginRight: SPACING.SM }}
            textStyle={{ color: COLORS.WHITE }}
            icon="car"
          />
          <Chip
            label={formatStatus(driver.is_active)}
            style={{ backgroundColor: statusColor }}
            textStyle={{ color: COLORS.WHITE }}
            icon={driver.is_active ? 'check-circle' : 'close-circle'}
          />
        </View>

        <View style={styles.actions}>
          <Button
            icon={driver.is_active ? 'pause-circle' : 'play-circle'}
            mode="text"
            onPress={onToggle}
            labelStyle={{ fontSize: 12 }}
          >
            {driver.is_active ? LABELS.EDIT : LABELS.CANCEL}
          </Button>
          <Button icon="pencil" mode="text" onPress={onEdit} labelStyle={{ fontSize: 12 }}>{LABELS.EDIT}</Button>
          <Button icon="delete" mode="text" onPress={onDelete} labelStyle={{ fontSize: 12 }}>{LABELS.DELETE}</Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_50,
  },

  header: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.LG,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  headerSubtitle: {
    fontSize: FONTS.SIZE.XS,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.SM,
  },

  tabsContainer: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
    flexDirection: 'row',
    paddingHorizontal: SPACING.SM,
  },
  tab: {
    flex: 1,
    marginHorizontal: SPACING.SM,
  },
  tabLabel: {
    fontSize: FONTS.SIZE.XS,
  },

  content: {
    flex: 1,
    position: 'relative',
  },

  searchbar: {
    margin: SPACING.LG,
    marginBottom: SPACING.SM,
  },

  listContent: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: 100,
  },

  driverCard: {
    marginVertical: SPACING.SM,
    backgroundColor: COLORS.WHITE,
  },
  cardContent: {
    paddingVertical: SPACING.MD,
  },

  driverHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.MD,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  avatarText: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  driverInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  driverName: {
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: COLORS.GRAY_800,
  },
  driverEmail: {
    fontSize: FONTS.SIZE.XS,
    color: COLORS.GRAY_500,
    marginTop: SPACING.SM,
  },

  driverDetails: {
    flexDirection: 'row',
    marginBottom: SPACING.MD,
    flexWrap: 'wrap',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.SM,
  },

  input: {
    marginBottom: SPACING.MD,
  },

  roleSelector: {
    marginTop: SPACING.MD,
  },
  roleChip: {
    marginRight: SPACING.SM,
    marginTop: SPACING.SM,
  },

  infoCard: {
    margin: SPACING.LG,
  },
  roleInfo: {
    marginTop: SPACING.LG,
  },

  fab: {
    position: 'absolute',
    margin: SPACING.LG,
    right: 0,
    bottom: 0,
  },

  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
});
