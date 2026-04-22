import React, { useEffect, useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Text, FAB, Snackbar, ActivityIndicator } from "react-native-paper";
import { useAppContext } from "../../../shared/contexts/AppContext";
import { API_ROUTES } from "../../../Config/Routes";
import AdminHeader from "../components/AdminHeader";
import DataTableComponent from "../components/DataTableComponent";
import GenericFormModal from "../components/GenericFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import SearchBar from "../components/SearchBar";
import { COLORS, SPACING } from "../../../core/constants/theme";

export default function DestinationManagement({ navigation }) {
  const { user } = useAppContext();
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [destinationToDelete, setDestinationToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchDestinations();
  }, []);

  useEffect(() => {
    filterData();
  }, [destinations, searchQuery, filterStatus]);

  const filterData = () => {
    let filtered = [...destinations];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name?.toLowerCase().includes(query) ||
          d.address?.toLowerCase().includes(query)
      );
    }

    if (filterStatus === 'deleted') {
      filtered = filtered.filter((d) => d.deleted_at !== null);
    } else if (filterStatus !== 'all') {
      filtered = filtered.filter((d) => {
        if (d.deleted_at !== null) return false;
        return filterStatus === 'active' ? d.is_active : !d.is_active;
      });
    }

    setFilteredDestinations(filtered);
  };

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.DESTINATIONS, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error('Error al obtener destinos');

      const data = await res.json();
      setDestinations(data.data || data);
    } catch (err) {
      setSnackbar({ visible: true, message: 'Error al cargar destinos' });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDestinations();
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await fetch(`${API_ROUTES.DESTINATIONS}/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error('Error al cambiar estado');

      setSnackbar({ visible: true, message: 'Estado del destino actualizado' });
      await fetchDestinations();
    } catch (err) {
      setSnackbar({ visible: true, message: 'Error al cambiar estado' });
    }
  };

  const handleEdit = (item) => {
    setSelectedDestination(item);
    setFormModalVisible(true);
  };

  const handleDelete = (id) => {
    setDestinationToDelete(id);
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_ROUTES.DESTINATIONS}/${destinationToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) throw new Error('Error al eliminar');

      setSnackbar({ visible: true, message: 'Destino eliminado (Oculto)' });
      setDeleteDialogVisible(false);
      setDestinationToDelete(null);
      await fetchDestinations();
    } catch (err) {
      setSnackbar({ visible: true, message: err.message || 'Error al eliminar' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Esta función llama a la ruta que creamos en el backend para resucitar el SoftDelete
  const handleRestore = async (id) => {
    try {
      const res = await fetch(`${API_ROUTES.DESTINATIONS}/${id}/restore`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) throw new Error('Error al restaurar');

      setSnackbar({ visible: true, message: 'Destino restaurado exitosamente' });
      await fetchDestinations();
    } catch (err) {
      setSnackbar({ visible: true, message: err.message || 'Error al restaurar' });
    }
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      const isEdit = !!selectedDestination;
      const url = isEdit 
        ? `${API_ROUTES.DESTINATIONS}/${selectedDestination.id}` 
        : API_ROUTES.DESTINATIONS;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error procesando solicitud');
      }

      setSnackbar({ visible: true, message: isEdit ? 'Destino actualizado' : 'Destino creado' });
      setFormModalVisible(false);
      setSelectedDestination(null);
      await fetchDestinations();
    } catch (err) {
      setSnackbar({ visible: true, message: err.message || 'Error' });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Gestión de Destinos"
        subtitle="Agrega puntos de referencia al mapa"
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
          placeholder="Buscar destino o dirección..."
          value={searchQuery}
          onSearch={setSearchQuery}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        ) : (
          <DataTableComponent
            data={filteredDestinations}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onRestore={handleRestore}
            onFilterStatusChange={setFilterStatus}
            emptyMessage="No hay destinos que coincidan."
          />
        )}
      </View>

      <FAB
        icon="plus"
        label="Nuevo Destino"
        style={styles.fab}
        onPress={() => {
          setSelectedDestination(null);
          setFormModalVisible(true);
        }}
        color={COLORS.WHITE}
      />

      {/* Modal Genérico Adaptado para Modo Destinos Básicos */}
      <GenericFormModal
        visible={formModalVisible}
        onDismiss={() => {
          setFormModalVisible(false);
          setSelectedDestination(null);
        }}
        onSubmit={handleFormSubmit}
        data={selectedDestination}
        fields={[
          { name: 'name', label: 'Nombre del Punto (Ej: Bloque A)', type: 'text', required: true },
          { name: 'address', label: 'Dirección o Referencia Corta', type: 'text', required: true },
          { 
            name: 'map_selector', 
            label: 'Ubicación en el Mapa', 
            type: 'map_picker', 
            required: false,
            onSelect: (lat, lng) => ({ latitude: lat.toString(), longitude: lng.toString() })
          },
          { name: 'latitude', label: 'Latitud Exacta', type: 'text', required: true, placeholder: '-1.8312' },
          { name: 'longitude', label: 'Longitud Exacta', type: 'text', required: true, placeholder: '-78.1834' },
        ]}
        isLoading={formLoading}
        title={selectedDestination ? 'Editar Destino' : 'Crear Nuevo Destino'}
        submitText={selectedDestination ? 'Actualizar' : 'Crear'}
      />

      <ConfirmDialog
        visible={deleteDialogVisible}
        onDismiss={() => {
          setDeleteDialogVisible(false);
          setDestinationToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Ocultar Destino"
        message="¿Estás seguro de que deseas eliminar este destino? Quedará oculto (Eliminación suave)."
        confirmText="Eliminar"
        isLoading={deleteLoading}
      />

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
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
  fab: {
    position: 'absolute',
    margin: SPACING.MD,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.SUCCESS,
  },
});
