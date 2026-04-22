import { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Text, Avatar, Divider, Switch, List, useTheme, Button, Portal, Dialog, Paragraph } from "react-native-paper";
import { useAppContext } from "../../../shared/contexts/AppContext";

export default function PerfilScreen() {
    const { user, isDarkTheme, toggleTheme, notificationsEnabled, toggleNotifications, logout } = useAppContext();
    const theme = useTheme();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleLogout = () => {
        setShowLogoutDialog(false);
        logout();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.card}>
                    <Card.Content>
                        <List.Item
                            title="Tema oscuro"
                            description="Activa o desactiva el modo oscuro."
                            right={() => <Switch value={isDarkTheme} onValueChange={toggleTheme} />}
                        />
                        <Divider />
                        <List.Item
                            title="Notificaciones"
                            description="Activa o desactiva las notificaciones."
                            right={() => <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />}
                        />
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Title
                        title={user?.nombre || "Usuario"}
                        subtitle={user?.rol || "Invitado"}
                        left={(props) => <Avatar.Text {...props} label={user?.nombre ? user.nombre[0] : "U"} />}
                    />
                    <Card.Content>
                        <Text style={styles.label}>Nombre:</Text>
                        <Text>{user?.name || user?.nombre || "Usuario"}</Text>
                        <Divider style={{ marginVertical: 10 }} />
                        <Text style={styles.label}>Correo:</Text>
                        <Text>{user?.email || user?.correo || "-"}</Text>
                        <Divider style={{ marginVertical: 10 }} />
                        <Text style={styles.label}>Fecha de ingreso:</Text>
                        <Text>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : (user?.ingreso || "-")}</Text>
                        {/* Bio removed as it is not in the backend model */}
                    </Card.Content>
                </Card>

                <Button
                    mode="contained"
                    onPress={() => setShowLogoutDialog(true)}
                    icon="logout"
                    buttonColor={theme.colors.error}
                    style={styles.logoutButton}
                >
                    Cerrar Sesión
                </Button>

                <Portal>
                    <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
                        <Dialog.Icon icon="alert-circle-outline" />
                        <Dialog.Title>Cerrar Sesión</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>¿Estás seguro de que deseas cerrar sesión?</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setShowLogoutDialog(false)}>Cancelar</Button>
                            <Button onPress={handleLogout} textColor={theme.colors.error}>Cerrar Sesión</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        borderRadius: 10,
        elevation: 2,
        marginBottom: 16,
    },
    label: {
        fontWeight: "bold",
        marginTop: 8,
    },
    logoutButton: {
        marginTop: 8,
        marginBottom: 16,
    },
});