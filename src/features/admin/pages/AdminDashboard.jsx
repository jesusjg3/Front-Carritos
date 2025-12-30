import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Button, Card, useTheme, ActivityIndicator } from "react-native-paper";
import { useAppContext } from "../../../shared/contexts/AppContext";

export default function AdminDashboard({ navigation }) {
  const { user } = useAppContext();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    
    setLoading(false); 
  }, []);

  if (!user || user.role !== "admin") {
    return (
      <View style={styles.centered}>
        <Text variant="titleLarge" style={{ color: theme.colors.error }}>
          Acceso denegado
        </Text>
        <Text>Debes ser administrador para ver este panel.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }}>
      <View style={styles.container}>
        <Text variant="displayMedium" style={styles.title}>
          Panel de Administración
        </Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Gestión de usuarios y conductores
        </Text>
        {loading ? (
          <ActivityIndicator animating size="large" style={{ marginTop: 32 }} />
        ) : (
          <Card style={styles.card}>
            <Card.Content>
              <Text>Gestión de usuarios:</Text>
              <Button
                mode="contained"
                style={{ marginTop: 16 }}
                onPress={() => navigation.navigate("UserManagement")}
              >
                Ir a gestión de usuarios
              </Button>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 24,
    textAlign: "center",
  },
  card: {
    width: "100%",
    marginTop: 16,
    borderRadius: 12,
    elevation: 3,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
});
