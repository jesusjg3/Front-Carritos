import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { Text, Card, Button, useTheme, ActivityIndicator, IconButton } from "react-native-paper";
import { useAppContext } from "../../../shared/contexts/AppContext";

export default function UserManagement() {
  const { user } = useAppContext();
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/users", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setUsers([]);
    }
    setLoading(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers().then(() => setRefreshing(false));
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title
        title={item.name}
        subtitle={`Email: ${item.email} | Rol: ${item.role?.name || item.role}`}
        right={() => (
          <View style={{ flexDirection: "row" }}>
            <IconButton icon="pencil" onPress={() => {}} />
            <IconButton icon="delete" onPress={() => {}} />
          </View>
        )}
      />
    </Card>
  );

  if (loading) {
    return <ActivityIndicator animating size="large" style={{ marginTop: 32 }} />;
  }

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>Gestión de Usuarios</Text>
      <FlatList
        data={users}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 32 }}>No hay usuarios.</Text>}
      />
      <Button mode="contained" style={styles.addButton} onPress={() => {}}>
        Crear nuevo usuario
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    marginBottom: 12,
    borderRadius: 10,
    elevation: 2,
  },
  addButton: {
    marginTop: 24,
    borderRadius: 8,
  },
});
