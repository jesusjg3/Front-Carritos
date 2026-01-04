import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Text, Card, Button, useTheme, Icon, Chip, Divider } from "react-native-paper";
import { useAppContext } from "../../../shared/contexts/AppContext";
import { 
  COLORS, 
  SPACING, 
  BORDER_RADIUS, 
  FONTS, 
  LABELS, 
} from "../../../shared/constants";
import AdminHeader from "../components/AdminHeader";

export default function AdminDashboard({ navigation }) {
  const { user, logout } = useAppContext();
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  const handleNavigateToMenu = (screen) => {
    setMenuOpen(false);
    if (screen !== 'Dashboard') {
      navigation.navigate(screen);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <View style={[styles.container, styles.centeredContent]}>
        <Icon source="lock" size={64} color={COLORS.ERROR_RED} />
        <Text variant="headlineSmall" style={{ marginTop: SPACING.LG, color: COLORS.ERROR_RED, fontWeight: 'bold' }}>
          Acceso denegado
        </Text>
        <Text style={{ marginTop: SPACING.SM, textAlign: 'center', color: COLORS.GRAY_500 }}>
          Solo administradores pueden acceder a este panel.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal 
        visible={menuOpen} 
        transparent 
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <TouchableOpacity 
            style={styles.menuContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menú</Text>
              <TouchableOpacity 
                onPress={() => setMenuOpen(false)}
                style={styles.closeButton}
              >
                <Icon source="close" size={28} color={COLORS.GRAY_800} />
              </TouchableOpacity>
            </View>
            <Divider />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleNavigateToMenu('Dashboard')}
            >
              <Icon source="home" size={24} color={COLORS.PRIMARY_BLUE} />
              <Text style={styles.menuItemText}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleNavigateToMenu('UserManagementHub')}
            >
              <Icon source="account-multiple" size={24} color={COLORS.PRIMARY_BLUE} />
              <Text style={styles.menuItemText}>Usuarios</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleNavigateToMenu('DriverManagementHub')}
            >
              <Icon source="car" size={24} color={COLORS.PRIMARY_BLUE} />
              <Text style={styles.menuItemText}>Conductores</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleNavigateToMenu('TabsManagement')}
            >
              <Icon source="tab" size={24} color={COLORS.PRIMARY_BLUE} />
              <Text style={styles.menuItemText}>Tabs</Text>
            </TouchableOpacity>

            <Divider style={styles.menuDivider} />

            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <Icon source="logout" size={24} color={COLORS.ERROR_RED} />
              <Text style={[styles.menuItemText, { color: COLORS.ERROR_RED }]}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <AdminHeader 
        title="Panel Administrativo"
        subtitle="Gestión del Sistema Carritos"
        icon="account-circle"
        showBackButton={false}
        showMenuButton={true}
        onMenuPress={() => setMenuOpen(true)}
      />
      <ScrollView style={styles.content}>
        <View style={styles.contentInner}>
          <Card style={styles.infoCard}>
            <Card.Title 
              title="Información del Sistema"
              left={(props) => <Icon {...props} source="information" />}
            />
            <Card.Content>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Versión:</Text>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estado:</Text>
                <Chip 
                  label="Operativo" 
                  icon="check-circle" 
                  style={{ backgroundColor: COLORS.SUCCESS_GREEN }}
                  textStyle={{ color: COLORS.WHITE }}
                />
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="outlined"
            icon="logout"
            style={[styles.mainButton, { marginTop: SPACING.XXL, borderColor: COLORS.ERROR_RED }]}
            labelStyle={[styles.mainButtonLabel, { color: COLORS.ERROR_RED }]}
            onPress={handleLogout}
          >
            Cerrar Sesión
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuContainer: {
    backgroundColor: COLORS.WHITE,
    width: '75%',
    maxWidth: 320,
    height: '100%',
    paddingTop: SPACING.LG,
    paddingHorizontal: SPACING.LG,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  menuTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.GRAY_800,
  },
  closeButton: {
    padding: SPACING.SM,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS,
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s ease',
  },
  menuItemText: {
    marginLeft: SPACING.MD,
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.GRAY_800,
  },
  menuDivider: {
    marginVertical: SPACING.MD,
  },
  logoutItem: {
    marginBottom: SPACING.LG,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: SPACING.LG,
  },
  infoCard: {
    backgroundColor: COLORS.WHITE,
    marginVertical: SPACING.XXL,
    marginHorizontal: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  infoLabel: {
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.GRAY_600,
  },
  infoValue: {
    color: COLORS.GRAY_800,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    padding: SPACING.LG,
  },
});
