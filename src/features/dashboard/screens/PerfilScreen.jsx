import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Avatar, Divider, Switch, List, useTheme } from "react-native-paper";
import { useAppContext } from "../../../shared/contexts/AppContext";

export default function PerfilScreen() {
    const { user, isDarkTheme, toggleTheme } = useAppContext();
    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Card style={styles.card}>

                <Card.Content>
                    <List.Item
                        title="Tema oscuro"
                        description="Activa o desactiva el modo oscuro."
                        right={() => <Switch value={isDarkTheme} onValueChange={toggleTheme} />}
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
                    <Text style={styles.label}>Correo:</Text>
                    <Text>{user?.correo || "-"}</Text>
                    <Divider style={{ marginVertical: 10 }} />
                    <Text style={styles.label}>Fecha de ingreso:</Text>
                    <Text>{user?.ingreso || "-"}</Text>
                    <Divider style={{ marginVertical: 10 }} />
                    <Text style={styles.label}>Biografía:</Text>
                    <Text>{user?.bio || "-"}</Text>
                </Card.Content>
            </Card>


        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
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
});