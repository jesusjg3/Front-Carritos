import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Snackbar } from "react-native-paper";
import { useAppContext } from "../../../shared/contexts/AppContext";
import { API_ROUTES } from "../../../Config/Routes";
import AdminHeader from "../components/AdminHeader";
import TripTableComponent from "../components/TripTableComponent";
import { COLORS, SPACING } from "../../../core/constants/theme";

export default function TripManagement({ navigation }) {
  const { user } = useAppContext();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.TRIPS, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error("Error al obtener viajes");

      const data = await res.json();

      const mapped = data.map((t) => ({
        id: t.id,
        "Pasajero": t.passenger?.name || 'N/A',
        "Conductor": t.driver?.name || 'N/A',
        "Origen": t.origin_address || 'ND',
        "Destino": t.destination_address || 'ND',
        "Estado": t.state?.state_name || 'Desconocido',
        "Fecha": new Date(t.created_at).toLocaleDateString() + ' ' + new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      setTrips(mapped);
    } catch (err) {
      setSnackbar({ visible: true, message: "Error al cargar historial de viajes" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Historial de Viajes"
        subtitle="Registro general de la plataforma"
        showBack
        onBackPress={() => navigation.goBack()}
        actions={[
          {
            icon: 'refresh',
            onPress: fetchTrips,
          },
        ]}
      />

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        ) : (
          <TripTableComponent
            data={trips}
            emptyMessage="No hay registros de viajes todavía."
          />
        )}
      </View>

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
  },
});
