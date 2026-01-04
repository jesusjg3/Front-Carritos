import React, { useEffect, useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Text, FAB, Snackbar, ActivityIndicator, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from "../../../shared/contexts/AppContext";
import { API_ROUTES } from "../../../Config/Routes";
import AdminHeader from "../components/AdminHeader";
import DataTableComponent from "../components/DataTableComponent";
import GenericFormModal from "../components/GenericFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import SearchBar from "../components/SearchBar";
import { COLORS, SPACING } from "../../../core/constants/theme";
import { getUserRole } from "../../../core/utils";

export default function AdminManagement({ navigation }) {
  const { user } = useAppContext();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchAdmins();
    fetchRoles();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [admins, searchQuery, filterStatus]);

  const filterAdmins = () => {
    let filtered = [...admins];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name?.toLowerCase().includes(query) ||
          a.email?.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(
        (a) => (filterStatus === 'active' ? a.is_active : !a.is_active)
      );
    }

    setFilteredAdmins(filtered);
  };

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.USERS, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error('Error al obtener administradores');

      const data = await res.json();
      const allUsers = data.data || data;
      const adminUsers = allUsers.filter(
        (u) => getUserRole(u)?.toLowerCase() === 'admin'
      );
      setAdmins(adminUsers);
    } catch (err) {
      setSnackbar({ visible: true, message: 'Error al cargar administradores' });
      setAdmins([]);
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
      await fetchAdmins();
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (adminId) => {
    if (adminId === user?.id) {
      setSnackbar({ visible: true, message: 'No puedes desactivar tu propia cuenta' });
      return;
    }

    try {
      const res = await fetch(`${API_ROUTES.USERS}/${adminId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error('Error al cambiar estado');

      setSnackbar({ visible: true, message: 'Estado actualizado correctamente' });
      await fetchAdmins();
    } catch (err) {
      setSnackbar({ visible: true, message: 'Error al cambiar estado del administrador' });
    }
  };

  const handleEdit = (adminData) => {
    setSelectedAdmin(adminData);
    setFormModalVisible(true);
  };

  const handleDelete = (adminId) => {
    if (adminId === user?.id) {
      setSnackbar({ visible: true, message: 'No puedes eliminar tu propia cuenta' });
      return;
    }

    setAdminToDelete(adminId);
    setDeleteDialogVisible(true);
  };

  const handleCreate = () => {
    setSelectedAdmin(null);
    setFormModalVisible(true);
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      const isEdit = !!selectedAdmin;

      let url = '';
      let payload = {};
      let method = isEdit ? 'PUT' : 'POST';

      if (isEdit) {
        url = `${API_ROUTES.USERS}/${selectedAdmin.id}`;
        payload = {
          name: formData.name,
          email: formData.email,
          rol_id: 1, // Admin
        };
      } else {
        url = API_ROUTES.AUTH.REGISTER;
        payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.password,
          role_id: 1, // Admin
        };
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

      const message = isEdit ? 'Administrador actualizado' : 'Administrador creado';
      setSnackbar({ visible: true, message });
      setFormModalVisible(false);
      setSelectedAdmin(null);
      await fetchAdmins();
    } catch (err) {
      setSnackbar({ visible: true, message: err.message || 'Error en la solicitud' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_ROUTES.USERS}/${adminToDelete}`, {
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

      setSnackbar({ visible: true, message: 'Administrador eliminado correctamente' });
      setDeleteDialogVisible(false);
      setAdminToDelete(null);
      await fetchAdmins();
    } catch (err) {
      setSnackbar({ visible: true, message: err.message || 'Error al eliminar' });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading && admins.length === 0) {
    return (
      <View style={styles.container}>
        <AdminHeader
          title="Gestión de Administradores"
          subtitle="Administra los administradores del sistema"
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
        title="Gestión de Administradores"
        subtitle="Administra los administradores del sistema"
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
        <SearchBar
          placeholder="Buscar administrador por nombre o email..."
          value={searchQuery}
          onSearch={setSearchQuery}
        />

        <View style={styles.controlsContainer}>
          <View style={styles.filtersContainer}>
            <Chip
              selected={filterStatus === 'all'}
              onPress={() => setFilterStatus('all')}
              style={styles.filterChip}
              icon={() => <MaterialCommunityIcons name="shield-account" size={18} />}
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
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        ) : (
          <DataTableComponent
            data={filteredAdmins}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            currentUserId={user?.id}
            onFilterStatusChange={setFilterStatus}
            emptyMessage="No se encontraron administradores con los filtros aplicados"
          />
        )}
      </View>

      <FAB
        icon="plus"
        label="Nuevo Admin"
        style={styles.fab}
        onPress={handleCreate}
        color={COLORS.WHITE}
      />

      <GenericFormModal
        visible={formModalVisible}
        onDismiss={() => {
          setFormModalVisible(false);
          setSelectedAdmin(null);
        }}
        onSubmit={handleFormSubmit}
        data={selectedAdmin}
        fields={(() => {
          const baseFields = [
            { name: 'name', label: 'Nombre Completo', type: 'text', placeholder: 'Ej: Juan García', required: true },
            { name: 'email', label: 'Correo Electrónico', type: 'email', placeholder: 'correo@example.com', required: true },
          ];
          if (!selectedAdmin) {
            baseFields.push({ name: 'password', label: 'Contraseña', type: 'password', placeholder: 'Mínimo 8 caracteres', required: true });
            baseFields.push({ name: 'password_confirmation', label: 'Confirmar Contraseña', type: 'password', placeholder: 'Repite la contraseña', required: true });
          }
          return baseFields;
        })()}
        isLoading={formLoading}
        title={selectedAdmin ? 'Editar Administrador' : 'Crear Nuevo Administrador'}
        submitText={selectedAdmin ? 'Actualizar' : 'Crear'}
      />

      <ConfirmDialog
        visible={deleteDialogVisible}
        onDismiss={() => {
          setDeleteDialogVisible(false);
          setAdminToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Administrador"
        message="¿Estás seguro de que deseas eliminar este administrador? Esta acción no se puede deshacer."
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
  fab: {
    position: 'absolute',
    margin: SPACING.MD,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.PRIMARY,
  },
});
