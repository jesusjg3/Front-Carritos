import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Button, Card, useTheme } from "react-native-paper";
import { FontAwesome } from "@expo/vector-icons";
import { useAppContext } from "../../../shared/contexts/AppContext";
import { ROUTES } from "../../../core/constants/routes";

export default function WelcomeScreen({ navigation }) {
  const { user } = useAppContext();
  const theme = useTheme();

  const goToLoginAsStudent = () => {
    navigation.navigate(ROUTES.STUDENT_LOGIN);
  };
  const goToLoginAsDriver = () => {
    navigation.navigate(ROUTES.DRIVER_LOGIN);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome
            name="car"
            size={80}
            color={theme.colors.primary}
          />
        </View>
        <Text
          variant="displayMedium"
          style={[
            styles.title,
            { color: theme.colors.primary, fontWeight: "bold" },
          ]}
        >
          ¡Bienvenido a Carritos Uleam!
        </Text>
        <Text
          variant="titleMedium"
          style={[styles.roleTitle, { color: theme.colors.onSurfaceVariant }]}
        >
          ¿Cómo deseas ingresar?
        </Text>

        <View style={styles.rolesContainer}>
          <Card style={[styles.roleCard, { borderColor: theme.colors.primary }]}>
            <Card.Content>
              <View style={styles.roleInner}>
                <FontAwesome name="user" size={28} color={theme.colors.primary} />
                <Text variant="titleSmall" style={{ marginTop: 8, color: theme.colors.primary }}>Estudiante</Text>
                <Button mode="contained" style={styles.roleButton} onPress={goToLoginAsStudent}>
                  Ingresar
                </Button>
              </View>
            </Card.Content>
          </Card>

          <Card style={[styles.roleCard, { borderColor: theme.colors.secondary }]}>
            <Card.Content>
              <View style={styles.roleInner}>
                <FontAwesome name="id-badge" size={28} color={theme.colors.secondary} />
                <Text variant="titleSmall" style={{ marginTop: 8, color: theme.colors.secondary }}>Conductor</Text>
                <Button mode="contained" style={styles.roleButton} onPress={goToLoginAsDriver}>
                  Ingresar
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>


        {user && (
          <Card style={[styles.card, { marginBottom: 24 }]}>
            <Card.Content>
              <Text
                variant="labelLarge"
                style={{
                  color: theme.colors.primary,
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                Tu Información
              </Text>
              <View style={styles.userInfo}>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  <Text style={{ fontWeight: "bold" }}>Nombre:</Text> {user.nombre}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontWeight: "bold" }}>Rol:</Text> {user.rol}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 32,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  roleTitle: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  card: {
    elevation: 3,
    borderRadius: 16,
  },
  cardContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  rolesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
    width: "100%",
  },
  roleCard: {
    flex: 1,
    maxWidth: 160,
    borderRadius: 16,
    borderWidth: 2,
    elevation: 4,
  },
  roleInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  roleButton: {
    marginTop: 12,
    borderRadius: 8,
    width: "100%",
  },
  disclaimer: {
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
    paddingHorizontal: 32,
  },
  userInfo: {
    marginTop: 8,
  },
});
