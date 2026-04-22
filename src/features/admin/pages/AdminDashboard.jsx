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
import UniversalMap from "../../../shared/components/UniversalMap";
import { createEcho } from "../../../core/services/echo";
import { CARRITO_MARKER_BASE64 } from "../../../Web/carritoMarkerBase64";

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
    id: 'destinations',
    title: 'Gestión de Destinos',
    description: 'Administrar puntos de referencia',
    icon: 'map-marker-radius',
    color: COLORS.SUCCESS,
    gradient: [COLORS.SUCCESS, '#388E3C'],
    route: ROUTES.DESTINATION_MANAGEMENT,
  },
  {
    id: 'trips',
    title: 'Historial de Viajes',
    description: 'Ver historial completo',
    icon: 'map-clock',
    color: COLORS.PRIMARY,
    gradient: [COLORS.PRIMARY, COLORS.PRIMARY_DARK],
    route: ROUTES.TRIP_MANAGEMENT,
  },
];

export default function AdminDashboard({ navigation }) {
  const { user, logout } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const mapRef = React.useRef(null);
  const echoInstanceRef = React.useRef(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalTrips: 0,
    activeTrips: 0,
    pendingRequests: 0,
  });

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

  const fetchInitialDrivers = async () => {
    try {
      const centerLat = process.env.EXPO_PUBLIC_CAMPUS_CENTER_LAT || "-0.95278";
      const centerLng = process.env.EXPO_PUBLIC_CAMPUS_CENTER_LNG || "-80.74548";
      const driversRes = await fetch(`${API_ROUTES.NEARBY_DRIVERS}?latitude=${centerLat}&longitude=${centerLng}&radius=50`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (driversRes.ok) {
        const driversData = await driversRes.json();
        if (driversData && driversData.drivers && mapRef.current) {
          driversData.drivers.forEach(driver => {
            const script = `
              if (typeof window.updateLiveDriver === 'function') {
                window.updateLiveDriver({
                  driver_id: ${driver.id},
                  latitude: ${driver.lat},
                  longitude: ${driver.lng}
                });
              }
              true;
            `;
            mapRef.current.injectJavaScript(script);
          });
        }
      }
    } catch(e) {
      console.log('Error initial drivers', e);
    }
  };

  const fetchDestinations = async () => {
    try {
      const destRes = await fetch(API_ROUTES.DESTINATIONS, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (destRes.ok) {
        const payload = await destRes.json();
        const destinos = payload.data || payload;
        if (Array.isArray(destinos) && mapRef.current) {
          const script = `
            if (typeof window.updateDestinations === 'function') {
              window.updateDestinations(${JSON.stringify(destinos)});
            }
            true;
          `;
          mapRef.current.injectJavaScript(script);
        }
      }
    } catch(e) {
      console.log('Error initial destinations', e);
    }
  };

  useEffect(() => {
    let pollInterval;
    if (user && user.is_active && getUserRole(user) === 'admin') {
      fetchStats();
      fetchInitialDrivers(); // Fetch immediately
      fetchDestinations();   // Fetch destinations

      // Iniciar el polling de limpieza
      pollInterval = setInterval(() => {
        fetchInitialDrivers();
        fetchDestinations();
      }, 30000);

      // Iniciar Radar Tracker Global
      const echo = createEcho(user.token);
      echoInstanceRef.current = echo;

      const channel = echo.channel('drivers.live');
      channel.listen('.DriverGlobalLocationUpdated', (e) => {
        if (mapRef.current) {
          const script = `
                  if (typeof window.updateLiveDriver === 'function') {
                      window.updateLiveDriver(${JSON.stringify(e)});
                  }
                  true;
              `;
          mapRef.current.injectJavaScript(script);
        }
      });
    }

    return () => {
      if (echoInstanceRef.current) {
        echoInstanceRef.current.disconnect();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const userRole = getUserRole(user);
  if (!user || userRole !== "admin" || !user.is_active) {
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
    // Limpiar el contexto y volver a la pantalla de bienvenida
    // El NavigationContainer se actualizará automáticamente cuando user sea null
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

      <View style={{ flex: 1, backgroundColor: '#e5e9f0', position: 'relative' }}>
        <UniversalMap
          ref={mapRef}
          onLoadEnd={() => {
            fetchInitialDrivers();
            fetchDestinations();
          }}
          source={{
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                <style>
                  body { margin: 0; padding: 0; }
                  #map { width: 100vw; height: 100vh; }
                  .carrito-marker {
                      text-align: center;
                      transition: transform 1.5s linear;
                      filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));
                  }
                </style>
              </head>
              <body>
                <div id="map"></div>
                <script>
                  // AQUI ABAJO AJUSTAS EL ZOOM: Cambia el '15' al final de setView al número que mejor te quede a ojo 
                  var centerLat = ${process.env.EXPO_PUBLIC_CAMPUS_CENTER_LAT || -0.9527840150449474};
                  var centerLng = ${process.env.EXPO_PUBLIC_CAMPUS_CENTER_LNG || -80.74548840522768};
                  var map = L.map('map', {zoomControl: false}).setView([centerLat, centerLng], 17);
                  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                      maxZoom: 19
                  }).addTo(map);
                  
                  // Zoom control bottom right
                  L.control.zoom({ position: 'bottomright' }).addTo(map);

                  // Base de datos local de Iconos
                  var liveDrivers = {};
                  var destinationMarkers = [];
                  
                  var carIcon = L.icon({
                      iconUrl: '${CARRITO_MARKER_BASE64}',
                      iconSize: [46, 46],
                      iconAnchor: [23, 23],
                      className: 'dummy-car-icon carrito-marker'
                  });

                  // Ícono de destino (rojo como en el móvil)
                  var destSvg = '<svg width="32" height="32" viewBox="0 0 24 24" fill="#d32f2f" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
                  var destIcon = L.divIcon({
                      html: '<div style="text-align: center; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.4));">' + destSvg + '</div>',
                      className: 'dummy-dest-icon destination-marker',
                      iconSize: [32, 32],
                      iconAnchor: [16, 32]
                  });

                  // Motor Live Radar para Vehículos
                  window.updateLiveDriver = function(data) {
                      var dId = data.driver_id;
                      if (!liveDrivers[dId]) {
                          liveDrivers[dId] = L.marker([data.latitude, data.longitude], {icon: carIcon}).addTo(map);
                      } else {
                          liveDrivers[dId].setLatLng([data.latitude, data.longitude]);
                      }
                  };

                  // Control de Destinos
                  window.updateDestinations = function(dests) {
                      destinationMarkers.forEach(function(m) { map.removeLayer(m); });
                      destinationMarkers = [];
                      if (Array.isArray(dests)) {
                          dests.forEach(function(d) {
                              var marker = L.marker([d.latitude, d.longitude], {icon: destIcon}).addTo(map)
                                  .bindPopup(d.name || 'Punto de Interés');
                              destinationMarkers.push(marker);
                          });
                      }
                  };

                  // 🔥 MAGIC FIX: Listener especial para capturar comandos (injectJavaScript) desde Expo en la Web
                  window.addEventListener('message', function(e) {
                      if (e.data && e.data.type === 'EVAL') {
                          try {
                              eval(e.data.code);
                          } catch(err) {
                              console.error("Eval Error:", err);
                          }
                      }
                  });
                </script>
              </body>
              </html>
            `}}
          style={{ width: '100%', height: '100%' }}
        />

      </View>
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
  floatingStats: {
    position: 'absolute',
    top: SPACING.MD,
    right: SPACING.MD,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    ...SHADOWS.MEDIUM,
    minWidth: 180,
  }
});
