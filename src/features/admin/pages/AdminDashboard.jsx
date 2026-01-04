import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, Card, ActivityIndicator } from "react-native-paper";
import { useAppContext } from "../../../shared/contexts/AppContext";
import { ROUTES } from "../../../core/constants/routes";
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from "../../../core/constants/theme";
import AdminHeader from "../components/AdminHeader";
import { API_ROUTES } from "../../../Config/Routes";
import { getUserRole } from "../../../core/utils/normalization";

const MENU_ITEMS = [
  {
    id: 'users',
    title: 'Gestión de Usuarios',
    description: 'Crear, editar y eliminar usuarios',
    icon: '👥',
    color: '#1976D2',
    route: ROUTES.USER_MANAGEMENT,
  },
  {
    id: 'drivers',
    title: 'Gestión de Conductores',
    description: 'Administrar conductores del sistema',
    icon: '🚗',
    color: '#388E3C',
    route: ROUTES.DRIVER_MANAGEMENT,
  },
];

export default function AdminDashboard({ navigation }) {
  const { user, logout } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalTrips: 0,
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Intentar obtener estadísticas básicas
      const [usersRes, tripsRes] = await Promise.all([
        fetch(API_ROUTES.USERS, {
          headers: { Authorization: `Bearer ${user?.token}` },
        }),
        fetch(API_ROUTES.TRIPS, {
          headers: { Authorization: `Bearer ${user?.token}` },
        }),
      ]);

      if (usersRes.ok) {
        const userData = await usersRes.json();
        setStats((prev) => ({
          ...prev,
          totalUsers: userData.data?.length || userData.length || 0,
        }));
      }

      if (tripsRes.ok) {
        const tripsData = await tripsRes.json();
        setStats((prev) => ({
          ...prev,
          totalTrips: tripsData.data?.length || tripsData.length || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const userRole = getUserRole(user);
  if (!user || userRole !== "admin") {
    return (
      <View style={styles.centered}>
        <Text variant="titleLarge" style={{ color: COLORS.ERROR }}>
          Acceso denegado
        </Text>
        <Text>Debes ser administrador para ver este panel.</Text>
      </View>
    );
  }

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: ROUTES.WELCOME }],
    });
  };

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Panel de Administración"
        subtitle="Sistema de Gestión de Carritos"
        actions={[
          {
            icon: 'logout',
            onPress: handleLogout,
          },
        ]}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de estadísticas */}
        {!loading && (
          <Card style={styles.statsCard}>
            <Card.Content style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text variant="titleMedium" style={styles.statLabel}>
                  Usuarios
                </Text>
                <Text variant="displaySmall" style={styles.statValue}>
                  {stats.totalUsers}
                </Text>
              </View>
              <View style={[styles.statItem, styles.statItemBorder]}>
                <Text variant="titleMedium" style={styles.statLabel}>
                  Viajes
                </Text>
                <Text variant="displaySmall" style={styles.statValue}>
                  {stats.totalTrips}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleMedium" style={styles.statLabel}>
                  Conductores
                </Text>
                <Text variant="displaySmall" style={styles.statValue}>
                  {stats.totalDrivers}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Título de menú */}
        <Text
          variant="titleLarge"
          style={styles.menuTitle}
        >
          Opciones de Gestión
        </Text>

        {/* Grid de opciones */}
        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItemTouchable}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.8}
            >
              <Card style={[styles.menuItem, { borderLeftColor: item.color, borderLeftWidth: 4 }]}>
                <Card.Content style={styles.menuItemContent}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text
                    variant="titleMedium"
                    style={[styles.menuItemTitle, { color: item.color }]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={styles.menuItemDescription}
                  >
                    {item.description}
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.MD,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.LG,
  },
  statsCard: {
    marginBottom: SPACING.LG,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.WHITE,
    ...SHADOWS.MEDIUM,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.LG,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  statLabel: {
    color: COLORS.GRAY_600,
    marginBottom: SPACING.SM,
  },
  statValue: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  menuTitle: {
    marginTop: SPACING.LG,
    marginBottom: SPACING.MD,
    color: COLORS.GRAY_900,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
  },
  menuItemTouchable: {
    width: '48%',
    marginBottom: SPACING.MD,
  },
  menuItem: {
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.WHITE,
    ...SHADOWS.SMALL,
    overflow: 'hidden',
  },
  menuItemContent: {
    alignItems: 'center',
    paddingVertical: SPACING.MD,
  },
  menuIcon: {
    fontSize: 40,
    marginBottom: SPACING.SM,
  },
  menuItemTitle: {
    fontWeight: '600',
    marginBottom: SPACING.XS,
    textAlign: 'center',
  },
  menuItemDescription: {
    color: COLORS.GRAY_600,
    textAlign: 'center',
    marginTop: SPACING.XS,
  },
});
