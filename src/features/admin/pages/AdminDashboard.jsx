import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { Text, Card, ActivityIndicator, Divider, Badge } from "react-native-paper";
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
    description: 'Administrar usuarios pasajeros del sistema',
    icon: 'account-group',
    color: COLORS.PRIMARY,
    gradient: [COLORS.PRIMARY, COLORS.PRIMARY_DARK],
    route: ROUTES.USER_MANAGEMENT,
  },
  {
    id: 'admins',
    title: 'Gestión de Administradores',
    description: 'Administrar administradores del sistema',
    icon: 'shield-account',
    color: COLORS.ADMIN,
    gradient: [COLORS.ADMIN, '#b71c1c'],
    route: ROUTES.ADMIN_MANAGEMENT,
  },
  {
    id: 'drivers',
    title: 'Gestión de Conductores',
    description: 'Administrar conductores y sus vehículos',
    icon: 'car-multiple',
    color: COLORS.PRIMARY_LIGHT,
    gradient: [COLORS.PRIMARY_LIGHT, COLORS.PRIMARY],
    route: ROUTES.DRIVER_MANAGEMENT,
  },
  {
    id: 'routes',
    title: 'Rutas y Viajes',
    description: 'Administrar rutas y seguimiento de viajes',
    icon: 'map-marker-path',
    color: COLORS.PRIMARY_DARK,
    gradient: [COLORS.PRIMARY_DARK, '#01579B'],
  },
  {
    id: 'schedules',
    title: 'Horarios',
    description: 'Configurar horarios de operación',
    icon: 'calendar-clock',
    color: COLORS.PRIMARY,
    gradient: [COLORS.PRIMARY, COLORS.PRIMARY_DARK],
  },
];

export default function AdminDashboard({ navigation }) {
  const { user, logout } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalTrips: 0,
    activeTrips: 0,
    pendingRequests: 0,
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
        const users = userData.data || userData;
        const drivers = Array.isArray(users) 
          ? users.filter(u => u.role === 'conductor' || u.rol === 'conductor')
          : [];
        
        setStats((prev) => ({
          ...prev,
          totalUsers: Array.isArray(users) ? users.length : 0,
          totalDrivers: drivers.length,
        }));
      }

      if (tripsRes.ok) {
        const tripsData = await tripsRes.json();
        const trips = tripsData.data || tripsData;
        const activeTrips = Array.isArray(trips)
          ? trips.filter(t => t.status === 'active' || t.estado === 'activo')
          : [];
        
        setStats((prev) => ({
          ...prev,
          totalTrips: Array.isArray(trips) ? trips.length : 0,
          activeTrips: activeTrips.length,
          pendingRequests: Math.floor(Math.random() * 10), // Simulado
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
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
      <View style={styles.headerWrapper}>
        <TouchableOpacity 
          style={styles.hamburgerButton}
          onPress={() => setSidebarVisible(!sidebarVisible)}
        >
          <MaterialCommunityIcons name="menu" size={28} color={COLORS.WHITE} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <AdminHeader
            title="Panel de Administración"
            subtitle={`Bienvenido, ${user?.name || 'Admin'}`}
            actions={[
              {
                icon: 'bell-outline',
                onPress: () => console.log('Notificaciones'),
                badge: stats.pendingRequests > 0 ? stats.pendingRequests : null,
              },
              {
                icon: 'logout',
                onPress: handleLogout,
              },
            ]}
          />
        </View>
      </View>

      {/* Sidebar Overlay */}
      {sidebarVisible && (
        <TouchableOpacity
          style={styles.sidebarOverlay}
          activeOpacity={1}
          onPress={() => setSidebarVisible(false)}
        />
      )}

      {/* Sidebar Menu */}
      {sidebarVisible && (
        <View style={styles.sidebarMenu}>
          <View style={styles.sidebarHeader}>
            <MaterialCommunityIcons name="menu-close" size={28} color={COLORS.WHITE} />
            <Text variant="titleMedium" style={styles.sidebarTitle}>Gestiones</Text>
          </View>

          <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.sidebarMenuItem}
                onPress={() => {
                  if (item.route) {
                    navigation.navigate(item.route);
                    setSidebarVisible(false);
                  }
                }}
              >
                <MaterialCommunityIcons 
                  name={item.icon} 
                  size={24} 
                  color={item.color} 
                  style={styles.sidebarMenuIcon}
                />
                <View style={styles.sidebarMenuContent}>
                  <Text variant="titleSmall" style={styles.sidebarMenuTitle}>
                    {item.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.sidebarMenuDescription}>
                    {item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Contenido vacío - Por definir */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARY,
    paddingTop: SPACING.SM,
  },
  hamburgerButton: {
    padding: SPACING.MD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  sidebarMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '75%',
    backgroundColor: COLORS.WHITE,
    zIndex: 999,
    ...SHADOWS.LARGE,
  },
  sidebarHeader: {
    backgroundColor: COLORS.PRIMARY,
    padding: SPACING.MD,
    paddingTop: SPACING.LG,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
  },
  sidebarTitle: {
    color: COLORS.WHITE,
    fontWeight: '700',
    flex: 1,
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
    gap: SPACING.MD,
  },
  sidebarMenuIcon: {
    marginRight: SPACING.XS,
  },
  sidebarMenuContent: {
    flex: 1,
  },
  sidebarMenuTitle: {
    fontWeight: '600',
    color: COLORS.GRAY_900,
    marginBottom: 2,
  },
  sidebarMenuDescription: {
    color: COLORS.GRAY_600,
    fontSize: 11,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XL,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.LG,
  },
  loadingContainer: {
    paddingVertical: SPACING.XL * 2,
    alignItems: 'center',
  },
  sectionTitle: {
    marginTop: SPACING.LG,
    marginBottom: SPACING.MD,
    color: COLORS.GRAY_900,
    fontWeight: '700',
    paddingLeft: SPACING.XS,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.MD,
  },
  halfCard: {
    flex: 1,
  },
  quickActionsContainer: {
    marginBottom: SPACING.MD,
  },
  quickActionsContent: {
    paddingRight: SPACING.MD,
    gap: SPACING.SM,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
    gap: SPACING.MD,
  },
});
