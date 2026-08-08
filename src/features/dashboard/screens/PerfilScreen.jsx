import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Text, Avatar, Divider, Switch, List, useTheme, Button, Portal, Dialog, Paragraph } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppContext } from "../../../shared/contexts/AppContext";
import ReasonModal from "../../../shared/components/ReasonModal";
import { SHADOWS, COLORS, BORDER_RADIUS } from "../../../core/constants/theme";

export default function PerfilScreen() {
    const { user, token, showAlert, isDarkTheme, toggleTheme, notificationsEnabled, toggleNotifications, logout } = useAppContext();
    const theme = useTheme();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
    const [isWaitingDisconnect, setIsWaitingDisconnect] = useState(false);
    const [complaintModalVisible, setComplaintModalVisible] = useState(false);
    const [isSendingComplaint, setIsSendingComplaint] = useState(false);

    // Escuchar WebSocket para desconexión por si el conductor se queda en esta pantalla
    useEffect(() => {
        if (user?.id && token) {
            import('../../../core/services/echo').then(({ createEcho }) => {
                const echo = createEcho(token);
                const channel = echo.private(`driver.${user.id}`);
                
                channel.listen('.driver.disconnect.approved', () => {
                    setIsWaitingDisconnect(false);
                    if (showAlert) showAlert("Desconexión Aprobada", "El administrador aprobó tu desconexión.", "success");
                });

                channel.listen('.driver.disconnect.rejected', () => {
                    setIsWaitingDisconnect(false);
                    import('react-native').then(({ Alert }) => {
                        Alert.alert("Desconexión Rechazada", "El administrador denegó tu solicitud de desconexión.");
                    });
                    if (showAlert) showAlert("Desconexión Rechazada", "El administrador denegó tu solicitud de desconexión.", "error");
                });

                return () => {
                    echo.leave(`driver.${user.id}`);
                    echo.disconnect();
                };
            });
        }
    }, [user, token]);

    const handleLogout = () => {
        setShowLogoutDialog(false);
        logout();
    };

    const handleRequestDisconnect = async (reason) => {
        setDisconnectModalVisible(false);
        setIsWaitingDisconnect(true);
        try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
            const response = await fetch(`${API_URL}/driver/request-disconnect`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason })
            });
            const data = await response.json();
            setIsWaitingDisconnect(false);
            if (!response.ok) {
                if (showAlert) showAlert("Error", data.error || "No se pudo solicitar la desconexión.", "error");
                else alert(data.error || "No se pudo solicitar la desconexión.");
            } else {
                if (showAlert) showAlert("Enviado", "Solicitud de desconexión enviada al administrador.", "success");
                else alert("Solicitud de desconexión enviada al administrador.");
            }
        } catch (e) {
            setIsWaitingDisconnect(false);
            if (showAlert) showAlert("Error", "Error de conexión al servidor.", "error");
            else alert("Error de conexión al servidor.");
        }
    };

    const handleSendComplaint = async (reason) => {
        setComplaintModalVisible(false);
        setIsSendingComplaint(true);
        try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
            const response = await fetch(`${API_URL}/complaints`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ subject: "Queja General", description: reason })
            });
            const data = await response.json();
            setIsSendingComplaint(false);
            if (!response.ok) {
                if (showAlert) showAlert("Error", data.error || data.message || "No se pudo enviar la queja.", "error");
                else alert(data.error || data.message || "No se pudo enviar la queja.");
            } else {
                if (showAlert) showAlert("Enviado", "Tu queja ha sido registrada con éxito.", "success");
                else alert("Tu queja ha sido registrada con éxito.");
            }
        } catch (e) {
            setIsSendingComplaint(false);
            if (showAlert) showAlert("Error", "Error de conexión al servidor.", "error");
            else alert("Error de conexión al servidor.");
        }
    };

    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Profile Section */}
                <View style={styles.profileHeader}>
                    <View style={[styles.avatarGlow, { borderColor: theme.colors.primary }]}>
                        <Avatar.Text 
                            size={100} 
                            label={getInitials(user?.name || user?.nombre)} 
                            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                            labelStyle={styles.avatarLabel}
                        />
                    </View>
                    <Text variant="headlineSmall" style={[styles.userName, { color: theme.colors.onSurface }]}>
                        {user?.name || user?.nombre || "Usuario"}
                    </Text>
                    <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                        <MaterialCommunityIcons 
                            name={user?.role === 'conductor' ? 'steering' : 'account'} 
                            size={14} 
                            color={theme.colors.primary} 
                            style={{ marginRight: 6 }} 
                        />
                        <Text style={[styles.roleText, { color: theme.colors.primary }]}>
                            {(user?.rol || user?.role || "Pasajero").toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Profile Details Card */}
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content style={styles.cardContent}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Información Personal
                        </Text>
                        <List.Item
                            title="Correo electrónico"
                            description={user?.email || user?.correo || "-"}
                            left={(props) => <MaterialCommunityIcons name="email-outline" size={24} color={theme.colors.primary} style={styles.listIcon} />}
                        />
                        <Divider style={styles.divider} />
                        <List.Item
                            title="Fecha de ingreso"
                            description={user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : (user?.ingreso || "-")}
                            left={(props) => <MaterialCommunityIcons name="calendar-month-outline" size={24} color={theme.colors.primary} style={styles.listIcon} />}
                        />
                    </Card.Content>
                </Card>

                {/* Settings & Preferences Card */}
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content style={styles.cardContent}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Preferencias
                        </Text>
                        <List.Item
                            title="Tema oscuro"
                            description="Activa o desactiva el modo nocturno"
                            left={(props) => <MaterialCommunityIcons name="theme-light-dark" size={24} color={theme.colors.primary} style={styles.listIcon} />}
                            right={() => <Switch value={isDarkTheme} onValueChange={toggleTheme} color={theme.colors.primary} />}
                        />
                        <Divider style={styles.divider} />
                        <List.Item
                            title="Notificaciones"
                            description="Alertas de viajes y solicitudes"
                            left={(props) => <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.primary} style={styles.listIcon} />}
                            right={() => <Switch value={notificationsEnabled} onValueChange={toggleNotifications} color={theme.colors.primary} />}
                        />
                    </Card.Content>
                </Card>

                {/* Acciones de Rol (Conductor / Pasajero) */}
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content style={styles.cardContent}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Acciones
                        </Text>
                        
                        {(user?.role?.toLowerCase() === 'conductor' || user?.rol?.toLowerCase() === 'conductor') ? (
                            <List.Item
                                title={isWaitingDisconnect ? "Desconexión Solicitada..." : "Solicitar Desconexión"}
                                description="Pide permiso al administrador para salir de línea"
                                left={(props) => <MaterialCommunityIcons name="power-plug-off" size={24} color="#EF4444" style={styles.listIcon} />}
                                onPress={() => !isWaitingDisconnect && setDisconnectModalVisible(true)}
                            />
                        ) : (
                            <List.Item
                                title={isSendingComplaint ? "Enviando queja..." : "Reportar una Queja"}
                                description="Envía un reporte sobre tu experiencia"
                                left={(props) => <MaterialCommunityIcons name="alert-octagon-outline" size={24} color="#F59E0B" style={styles.listIcon} />}
                                onPress={() => !isSendingComplaint && setComplaintModalVisible(true)}
                            />
                        )}
                    </Card.Content>
                </Card>

                {/* Logout Button */}
                <Button
                    mode="outlined"
                    onPress={() => setShowLogoutDialog(true)}
                    icon="logout"
                    textColor={theme.colors.error}
                    style={[styles.logoutButton, { borderColor: theme.colors.error + '40' }]}
                    contentStyle={styles.logoutButtonContent}
                >
                    Cerrar Sesión
                </Button>

                {/* Dialog Confirm */}
                <Portal>
                    <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)} style={styles.dialog}>
                        <Dialog.Icon icon="alert-circle-outline" color={theme.colors.error} size={40} />
                        <Dialog.Title style={styles.dialogTitle}>¿Cerrar Sesión?</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph style={styles.dialogText}>
                                ¿Estás seguro de que deseas cerrar sesión en el dispositivo? Tendrás que introducir tus credenciales la próxima vez.
                            </Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setShowLogoutDialog(false)} textColor={theme.colors.onSurfaceVariant}>
                                Cancelar
                            </Button>
                            <Button onPress={handleLogout} textColor={theme.colors.error} mode="contained-tonal" buttonColor={theme.colors.error + '12'}>
                                Sí, Cerrar Sesión
                            </Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>

                <ReasonModal
                    visible={disconnectModalVisible}
                    onDismiss={() => setDisconnectModalVisible(false)}
                    title="Motivo de Desconexión"
                    placeholder="Ej. Terminé mi turno, Problema mecánico..."
                    onConfirm={handleRequestDisconnect}
                />

                <ReasonModal
                    visible={complaintModalVisible}
                    onDismiss={() => setComplaintModalVisible(false)}
                    title="Reportar Queja"
                    placeholder="Describe detalladamente tu problema..."
                    onConfirm={handleSendComplaint}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    profileHeader: {
        alignItems: 'center',
        marginVertical: 24,
    },
    avatarGlow: {
        borderWidth: 3,
        padding: 4,
        borderRadius: 60,
        ...SHADOWS.MEDIUM,
    },
    avatar: {
        ...SHADOWS.SMALL,
    },
    avatarLabel: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    userName: {
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    roleText: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: BORDER_RADIUS.XL,
        marginBottom: 20,
        ...SHADOWS.SMALL,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    cardContent: {
        paddingHorizontal: 8,
        paddingVertical: 12,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginLeft: 16,
        marginBottom: 8,
        opacity: 0.8,
    },
    listIcon: {
        alignSelf: 'center',
        marginRight: 8,
    },
    divider: {
        marginVertical: 4,
        opacity: 0.5,
    },
    logoutButton: {
        marginTop: 12,
        borderRadius: BORDER_RADIUS.LG,
        borderWidth: 1.5,
    },
    logoutButtonContent: {
        paddingVertical: 6,
    },
    dialog: {
        borderRadius: BORDER_RADIUS.XL,
    },
    dialogTitle: {
        textAlign: 'center',
        fontWeight: 'bold',
    },
    dialogText: {
        textAlign: 'center',
        opacity: 0.8,
    },
});