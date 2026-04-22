import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl, useWindowDimensions, ScrollView } from "react-native";
import { Text, FAB, Snackbar, ActivityIndicator, Chip, Divider, SegmentedButtons, Menu } from "react-native-paper";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from "../../../shared/contexts/AppContext";
import { API_ROUTES } from "../../../Config/Routes";
import AdminHeader from "../components/AdminHeader";
import DataTableComponent from "../components/DataTableComponent";
import GenericFormModal from "../components/GenericFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import SearchBar from "../components/SearchBar";
import { COLORS, SPACING, SHADOWS } from "../../../core/constants/theme";
import { getInitials, getUserRole } from "../../../core/utils";

export default function UserManagement({ navigation }) {
  const { user } = useAppContext();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active'); // 'active', 'inactive', 'all'
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' o 'list'
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, filterRole, filterStatus]);

  const filterUsers = () => {
    let filtered = [...users];

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
      );
    }

    // Filtrar por rol
    if (filterRole !== 'all') {
      filtered = filtered.filter(
        (u) => getUserRole(u)?.toLowerCase() === filterRole.toLowerCase()
      );
    }

    // Filtrar por estado
    if (filterStatus === 'deleted') {
      filtered = filtered.filter((u) => u.deleted_at !== null);
    } else if (filterStatus !== 'all') {
      filtered = filtered.filter((u) => {
        if (u.deleted_at !== null) return false;
        return filterStatus === 'active' ? u.is_active : !u.is_active;
      });
    }

    setFilteredUsers(filtered);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.USERS, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error('Error al obtener usuarios');

      const data = await res.json();
      const allUsers = data.data || data;
      // Filtrar solo pasajeros (no admins ni conductores)
      const passengerUsers = allUsers.filter(
        (u) => getUserRole(u)?.toLowerCase() === 'pasajero'
      );
      setUsers(passengerUsers);
    } catch (err) {
      setSnackbar({ visible: true, message: 'Error al cargar usuarios' });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(API_ROUTES.ROLES, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error('Error al obtener roles');

      const data = await res.json();
      setRoles(data.data || data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUsers();
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    // No permitir cambiar tu propio estado
    if (userId === user?.id) {
      setSnackbar({ visible: true, message: 'No puedes desactivar tu propia cuenta' });
      return;
    }

    try {
      const res = await fetch(`${API_ROUTES.USERS}/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error('Error al cambiar estado');

      setSnackbar({ visible: true, message: 'Estado actualizado correctamente' });
      await fetchUsers();
    } catch (err) {
      setSnackbar({ visible: true, message: 'Error al cambiar estado del usuario' });
    }
  };

  const handleRestore = async (userId) => {
    try {
      const res = await fetch(`${API_ROUTES.USERS}/${userId}/restore`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error('Error al restaurar estado');

      setSnackbar({ visible: true, message: 'Usuario restaurado correctamente' });
      await fetchUsers();
    } catch (err) {
      setSnackbar({ visible: true, message: 'Error al restaurar al usuario' });
    }
  };

  const handleEdit = (userData) => {
    setSelectedUser(userData);
    setFormModalVisible(true);
  };

  const handleDelete = (userId) => {
    // No permitir eliminar tu propia cuenta
    if (userId === user?.id) {
      setSnackbar({ visible: true, message: 'No puedes eliminar tu propia cuenta' });
      return;
    }

    setUserToDelete(userId);
    setDeleteDialogVisible(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setFormModalVisible(true);
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      const isEdit = !!selectedUser;
      const selectedRoleId = Number(formData.rol_id);

      if (!isEdit && selectedRoleId === 1) {
        throw new Error('No puedes crear usuarios admin desde aquí');
      }

      let url = '';
      let payload = {};
      let method = isEdit ? 'PUT' : 'POST';

      if (isEdit) {
        url = `${API_ROUTES.USERS}/${selectedUser.id}`;
        payload = {
          name: formData.name,
          email: formData.email,
          rol_id: selectedRoleId,
        };
      } else {
        const isDriver = selectedRoleId === 3;
        if (isDriver) {
          url = API_ROUTES.DRIVERS;
          payload = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
          };
        } else {
          url = API_ROUTES.AUTH.REGISTER;
          payload = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            password_confirmation: formData.password,
            role_id: selectedRoleId,
          };
        }
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al procesar la solicitud');
      }

      const message = isEdit ? 'Usuario actualizado' : 'Usuario creado';
      setSnackbar({ visible: true, message });
      setFormModalVisible(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      setSnackbar({ visible: true, message: err.message || 'Error en la solicitud' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_ROUTES.USERS}/${userToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar');
      }

      setSnackbar({ visible: true, message: 'Usuario eliminado correctamente' });
      setDeleteDialogVisible(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (err) {
      setSnackbar({ visible: true, message: err.message || 'Error al eliminar' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getUserColor = (roleName) => {
    switch (roleName?.toLowerCase()) {
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

  if (loading && users.length === 0) {
    return (
      <View style={styles.container}>
        <AdminHeader
          title="Gestión de Usuarios"
          subtitle="Administra todos los usuarios"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" color={COLORS.PRIMARY} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Gestión de Usuarios"
        subtitle="Administra los usuarios pasajeros"
        showBack
        onBackPress={() => navigation.goBack()}
        actions={[
          {
            icon: 'refresh',
            onPress: onRefresh,
          },
        ]}
      />

      <View style={styles.content}>
        {/* Barra de búsqueda */}
        <SearchBar
          placeholder="Buscar por nombre o email..."
          value={searchQuery}
          onSearch={setSearchQuery}
        />

        {/* Controles de vista y filtros */}
        <View style={styles.controlsContainer}>
          <View style={styles.filtersContainer}>
            <Chip
              selected={filterStatus === 'all'}
              onPress={() => setFilterStatus('all')}
              style={styles.filterChip}
              icon={() => <MaterialCommunityIcons name="account-group" size={18} />}
            >
              Todos
            </Chip>
            <Chip
              selected={filterStatus === 'active'}
              onPress={() => setFilterStatus('active')}
              style={styles.filterChip}
              icon={() => <MaterialCommunityIcons name="check-circle" size={18} />}
            >
              Activos
            </Chip>
            <Chip
              selected={filterStatus === 'inactive'}
              onPress={() => setFilterStatus('inactive')}
              style={styles.filterChip}
              icon={() => <MaterialCommunityIcons name="close-circle" size={18} />}
            >
              Inactivos
            </Chip>
            <Chip
              selected={filterStatus === 'deleted'}
              onPress={() => setFilterStatus('deleted')}
              style={styles.filterChip}
              icon={() => <MaterialCommunityIcons name="delete-restore" size={18} />}
            >
              Eliminados
            </Chip>
          </View>

          <SegmentedButtons
            value={viewMode}
            onValueChange={setViewMode}
            buttons={[
              {
                value: 'table',
                label: 'Tabla',
                icon: 'table',
              },
              {
                value: 'list',
                label: 'Lista',
                icon: 'view-list',
              },
            ]}
            style={styles.viewToggle}
          />
        </View>

        {/* Tabla de usuarios */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        ) : (
          <DataTableComponent
            data={filteredUsers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onRestore={handleRestore}
            currentUserId={user?.id}
            onFilterStatusChange={setFilterStatus}
            emptyMessage="No se encontraron usuarios con los filtros aplicados"
          />
        )}
      </View>

      <FAB
        icon="plus"
        label="Nuevo Usuario"
        style={styles.fab}
        onPress={handleCreate}
        color={COLORS.WHITE}
      />

      <GenericFormModal
        visible={formModalVisible}
        onDismiss={() => {
          setFormModalVisible(false);
          setSelectedUser(null);
        }}
        onSubmit={handleFormSubmit}
        data={selectedUser}
        fields={(() => {
          const allowedRoles = roles.filter((r) => r.id === 2 || r.id === 3);

          const baseFields = [
            { name: 'name', label: 'Nombre Completo', type: 'text', placeholder: 'Ej: Juan García', required: true },
            { name: 'email', label: 'Correo Electrónico', type: 'email', placeholder: 'correo@example.com', required: true },
            { name: 'rol_id', label: 'Rol', type: 'select', options: selectedUser ? roles : allowedRoles, required: true },
          ];
          if (!selectedUser) {
            baseFields.push({ name: 'password', label: 'Contraseña', type: 'password', placeholder: 'Mínimo 8 caracteres', required: true });
            baseFields.push({ name: 'password_confirmation', label: 'Confirmar Contraseña', type: 'password', placeholder: 'Repite la contraseña', required: true });
          }
          return baseFields;
        })()}
        isLoading={formLoading}
        title={selectedUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        submitText={selectedUser ? 'Actualizar' : 'Crear'}
      />

      <ConfirmDialog
        visible={deleteDialogVisible}
        onDismiss={() => {
          setDeleteDialogVisible(false);
          setUserToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Usuario"
        message="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        isLoading={deleteLoading}
      />

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbar({ ...snackbar, visible: false }),
        }}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.SM,
    paddingTop: SPACING.SM,
    alignItems: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL * 2,
  },
  controlsContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    marginBottom: SPACING.SM,
    maxWidth: 1200,
    width: '100%',
    gap: SPACING.SM,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: SPACING.XS,
    flex: 1,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 0,
  },
  viewToggle: {
    marginLeft: 0,
    width: '100%',
  },
  fab: {
    position: 'absolute',
    margin: SPACING.MD,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.PRIMARY,
  },
});
