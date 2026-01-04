import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { Text, FAB, Snackbar, ActivityIndicator } from "react-native-paper";
import { useAppContext } from "../../../shared/contexts/AppContext";
import { API_ROUTES } from "../../../Config/Routes";
import AdminHeader from "../components/AdminHeader";
import GenericCard from "../components/GenericCard";
import GenericFormModal from "../components/GenericFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { COLORS, SPACING } from "../../../core/constants/theme";
import { getInitials, getUserRole } from "../../../core/utils";

const DRIVER_FIELDS = [
  { name: 'name', label: 'Nombre Completo', type: 'text', placeholder: 'Ej: Juan García', required: true },
  { name: 'email', label: 'Correo Electrónico', type: 'email', placeholder: 'correo@example.com', required: true },
];

export default function DriverManagement({ navigation }) {
  const { user } = useAppContext();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.USERS, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error('Error al obtener conductores');

      const data = await res.json();
      const allUsers = data.data || data;

      // Filtrar solo conductores usando la función de normalización
      const driversFiltered = allUsers.filter(
        (u) => getUserRole(u) === 'conductor'
      );

      setDrivers(driversFiltered);
    } catch (err) {
      setSnackbar({ visible: true, message: 'Error al cargar conductores' });
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDrivers();
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (driverId) => {
    try {
      const res = await fetch(`${API_ROUTES.USERS}/${driverId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error('Error al cambiar estado');

      setSnackbar({ visible: true, message: 'Estado actualizado correctamente' });
      fetchDrivers();
    } catch (err) {
      setSnackbar({ visible: true, message: 'Error al cambiar estado del conductor' });
    }
  };

  const handleEdit = (driverData) => {
    setSelectedDriver(driverData);
    setFormModalVisible(true);
  };

  const handleDelete = (driverId) => {
    setDriverToDelete(driverId);
    setDeleteDialogVisible(true);
  };

  const handleCreate = () => {
    setSelectedDriver(null);
    setFormModalVisible(true);
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      const submitData = {
        ...formData,
        rol_id: 3, // ID del rol conductor
      };

      const method = selectedDriver ? 'PUT' : 'POST';
      const url = selectedDriver
        ? `${API_ROUTES.USERS}/${selectedDriver.id}`
        : API_ROUTES.DRIVERS;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al procesar la solicitud');
      }

      const message = selectedDriver ? 'Conductor actualizado' : 'Conductor creado';
      setSnackbar({ visible: true, message });
      setFormModalVisible(false);
      setSelectedDriver(null);
      await fetchDrivers();
    } catch (err) {
      setSnackbar({ visible: true, message: err.message || 'Error en la solicitud' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_ROUTES.USERS}/${driverToDelete}`, {
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

      setSnackbar({ visible: true, message: 'Conductor eliminado correctamente' });
      setDeleteDialogVisible(false);
      setDriverToDelete(null);
      await fetchDrivers();
    } catch (err) {
      setSnackbar({ visible: true, message: err.message || 'Error al eliminar' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const roleName = getUserRole(item) || 'Conductor';
    return (
      <GenericCard
        item={item}
        avatarText={getInitials(item.name)}
        avatarColor={COLORS.DRIVER}
        fields={[
          { key: 'name', label: 'Nombre', variant: 'titleMedium' },
          { key: 'email', label: 'Email', variant: 'bodySmall' },
        ]}
        chips={[
          { key: 'rol', getValue: () => roleName, color: COLORS.DRIVER },
          { key: 'status', getValue: () => item.is_active ? 'Activo' : 'Inactivo', color: item.is_active ? COLORS.SUCCESS : COLORS.WARNING },
        ]}
        actions={[
          { icon: item.is_active ? 'eye-off' : 'eye', color: COLORS.GRAY_600, onPress: () => handleToggleStatus(item.id) },
          { icon: 'pencil', color: COLORS.PRIMARY, onPress: () => handleEdit(item) },
          { icon: 'delete', color: COLORS.ERROR, onPress: () => handleDelete(item.id) },
        ]}
      />
    );
  };

  if (loading && drivers.length === 0) {
    return (
      <View style={styles.container}>
        <AdminHeader
          title="Gestión de Conductores"
          subtitle="Administra todos los conductores"
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
        title="Gestión de Conductores"
        subtitle={`Total: ${drivers.length}`}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={drivers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No hay conductores registrados
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreate}
        color={COLORS.WHITE}
      />

      <GenericFormModal
        visible={formModalVisible}
        onDismiss={() => {
          setFormModalVisible(false);
          setSelectedDriver(null);
        }}
        onSubmit={handleFormSubmit}
        data={selectedDriver}
        fields={DRIVER_FIELDS}
        isLoading={formLoading}
        title={selectedDriver ? 'Editar Conductor' : 'Crear Nuevo Conductor'}
        submitText={selectedDriver ? 'Actualizar' : 'Crear'}
      />

      <ConfirmDialog
        visible={deleteDialogVisible}
        onDismiss={() => {
          setDeleteDialogVisible(false);
          setDriverToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Conductor"
        message="¿Estás seguro de que deseas eliminar este conductor? Esta acción no se puede deshacer."
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
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.MD,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    color: COLORS.GRAY_600,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: SPACING.MD,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.DRIVER,
  },
});
