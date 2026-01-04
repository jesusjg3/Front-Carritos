import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Alert, RefreshControl } from "react-native";
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
  validateEmail,
  validatePassword,
  validateName,
} from "../../../shared/utils";

const TAB_ITEMS = [
  { id: 'list', label: 'Usuarios', icon: 'account-multiple' },
  { id: 'roles', label: 'Gestionar Roles', icon: 'shield-account' },
];

export default function UserManagementHub({ navigation }) {
  const { user } = useAppContext();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('list');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  
  const handleGoBack = () => {
    navigation.goBack();
  };
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rol_id: '',
  });

  useFocusEffect(
    useCallback(() => {
      loadUsers();
      loadRoles();
    }, [])
  );

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getUsers();
      setUsers(data?.data || data || []);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      console.log('[UserManagementHub] Loading roles...');
      const data = await AdminService.getRoles();
      console.log('[UserManagementHub] Roles loaded successfully:', data);
      // Manejar respuesta paginada o array
      setRoles(data?.data || data || []);
    } catch (err) {
      console.error('[UserManagementHub] Error cargando roles:', err);
      Alert.alert(
        'Error', 
        `No se pudieron cargar los roles: ${err.message || 'Error desconocido'}`
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'list') {
      await loadUsers();
    } else {
      await loadRoles();
    }
    setRefreshing(false);
  };

  const filteredUsers = filterUsersByQuery(users, searchQuery);

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', rol_id: '' });
    setShowCreateDialog(true);
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email || !formData.rol_id) {
      Alert.alert(MESSAGES.ERROR, MESSAGES.REQUIRED_FIELD);
      return;
    }

    // Validaciones específicas
    if (!validateName(formData.name)) {
      Alert.alert(MESSAGES.ERROR, 'El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (!validateEmail(formData.email)) {
      Alert.alert(MESSAGES.ERROR, MESSAGES.INVALID_EMAIL);
      return;
    }

    if (!editingUser && !validatePassword(formData.password)) {
      Alert.alert(MESSAGES.ERROR, MESSAGES.PASSWORD_MIN_LENGTH);
      return;
    }

    try {
      if (editingUser) {
        await AdminService.updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          rol_id: formData.rol_id,
        });
        Alert.alert(MESSAGES.SUCCESS, MESSAGES.USER_UPDATED);
      } else {
        await AdminService.createDriver({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          rol_id: formData.rol_id,
        });
        Alert.alert(MESSAGES.SUCCESS, MESSAGES.USER_CREATED);
      }
      setShowCreateDialog(false);
      loadUsers();
    } catch (err) {
      console.error('Error guardando usuario:', err);
      Alert.alert(MESSAGES.ERROR, 'No se pudo guardar el usuario');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await AdminService.toggleUserStatus(userId);
      loadUsers();
    } catch (err) {
      console.error('Error actualizando estado:', err);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const handleDeleteUser = (userId) => {
    Alert.alert(
      MESSAGES.DELETE_USER_CONFIRM.split('?')[0] + '?',
      '¿Estás seguro de que deseas eliminar este usuario?',
      [
        { text: LABELS.CANCEL, onPress: () => {}, style: 'cancel' },
        {
          text: LABELS.DELETE,
          onPress: async () => {
            try {
              await AdminService.deleteUser(userId);
              loadUsers();
              Alert.alert(MESSAGES.SUCCESS, MESSAGES.USER_DELETED);
            } catch (err) {
              console.error('Error eliminando usuario:', err);
              Alert.alert(MESSAGES.ERROR, 'No se pudo eliminar el usuario');
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
        title="Gestión de Usuarios"
        subtitle="Gestión de pasajeros del sistema"
        icon="account-multiple"
        onBackPress={handleGoBack}
      />

      <View style={styles.tabsContainer}>
        {TAB_ITEMS.map((tab) => (
          <Button
            key={tab.id}
            mode={activeTab === tab.id ? "contained" : "text"}
            icon={tab.icon}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && { backgroundColor: theme.colors.primary }]}
            labelStyle={styles.tabLabel}
          >
            {tab.label}
          </Button>
        ))}
      </View>

      {activeTab === 'list' && (
        <View style={styles.content}>
          <Searchbar
            placeholder="Buscar usuario..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            icon="magnify"
          />

          {loading ? (
            <View style={styles.centeredContent}>
              <ActivityIndicator animating size="large" color={theme.colors.primary} />
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.centeredContent}>
              <Icon source="account-off" size={64} color={COLORS.GRAY_300} />
              <Text style={{ marginTop: SPACING.LG, color: COLORS.GRAY_500 }}>
                {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <UserCard user={item} onToggle={() => handleToggleUserStatus(item.id, item.is_active)} onEdit={() => {
                setEditingUser(item);
                setFormData({
                  name: item.name,
                  email: item.email,
                  password: '',
                  rol_id: item.rol_id?.toString() || '',
                });
                setShowCreateDialog(true);
              }} onDelete={() => handleDeleteUser(item.id)} />}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          )}

          <FAB
            icon="plus"
            onPress={handleCreateUser}
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          />
        </View>
      )}

      {activeTab === 'roles' && (
        <View style={styles.content}>
          <Button
            mode="contained"
            icon="plus"
            style={styles.createButton}
            onPress={() => navigation.navigate('RoleManagement')}
          >
            Gestionar Roles
          </Button>
        </View>
      )}

      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
        <Dialog.Title>{editingUser ? MESSAGES.EDIT_USER_TITLE : MESSAGES.CREATE_USER_TITLE}</Dialog.Title>
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
            {!editingUser && (
              <TextInput
                label={LABELS.PASSWORD}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                style={styles.input}
                placeholder={LABELS.PASSWORD}
                secureTextEntry
              />
            )}
            <View style={styles.roleSelector}>
              <Text>{LABELS.ROLE}:</Text>
              {roles.map((role) => (
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
            <Button onPress={handleSaveUser} mode="contained">{LABELS.SAVE}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function UserCard({ user, onToggle, onEdit, onDelete }) {
  const avatarColor = getAvatarColor(user.name);
  const statusColor = getStatusColor(user.is_active);
  const roleColor = getRoleColor(user.rol?.rol_name);

  return (
    <Card style={styles.userCard}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.userHeader}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text variant="titleMedium" style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.userDetails}>
          <Chip
            label={formatRoleName(user.rol?.rol_name || 'Sin rol')}
            style={{ backgroundColor: roleColor, marginRight: SPACING.SM }}
            textStyle={{ color: COLORS.WHITE }}
            icon="shield"
          />
          <Chip
            label={formatStatus(user.is_active)}
            style={{ backgroundColor: statusColor }}
            textStyle={{ color: COLORS.WHITE }}
            icon={user.is_active ? 'check-circle' : 'close-circle'}
          />
        </View>

        <View style={styles.actions}>
          <Button
            icon={user.is_active ? 'pause-circle' : 'play-circle'}
            mode="text"
            onPress={onToggle}
          >
            {user.is_active ? LABELS.EDIT : LABELS.CANCEL}
          </Button>
          <Button icon="pencil" mode="text" onPress={onEdit}>{LABELS.EDIT}</Button>
          <Button icon="delete" mode="text" onPress={onDelete}>{LABELS.DELETE}</Button>
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

  userCard: {
    marginVertical: SPACING.SM,
    backgroundColor: COLORS.WHITE,
  },
  cardContent: {
    paddingVertical: SPACING.MD,
  },

  userHeader: {
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
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: COLORS.GRAY_800,
  },
  userEmail: {
    fontSize: FONTS.SIZE.XS,
    color: COLORS.GRAY_500,
    marginTop: SPACING.SM,
  },

  userDetails: {
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

  createButton: {
    margin: SPACING.LG,
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
