import { View, StyleSheet } from "react-native";
import { Text, Button, Card, useTheme } from "react-native-paper";
import { FontAwesome } from "@expo/vector-icons";
import { useAppContext } from "../../../../shared/contexts/AppContext";
import { ROUTES } from "../../../../core/constants/routes";

export default function WelcomeScreen({ navigation }) {
  const { user } = useAppContext();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome
            name="car"
            size={64}
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
          ¡Bienvenido a Carritos!
        </Text>
        <Text
          variant="titleMedium"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Conexiones de transporte universitarias
        </Text>

        <View style={styles.buttonsContainer}>
          <Button
            mode="contained"
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            onPress={() => navigation.navigate(ROUTES.LOGIN)}
          >
            Iniciar Sesión
          </Button>
          <Button
            mode="outlined"
            style={styles.secondaryButton}
            contentStyle={styles.buttonContent}
            onPress={() => navigation.navigate(ROUTES.REGISTER)}
          >
            Registrarse
          </Button>
        </View>

        {user && (
          <Card style={[styles.card, { marginTop: 24 }]}>
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
    paddingHorizontal: 20,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: 27,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
    fontSize: 14,
  },
  buttonsContainer: {
    width: "100%",
    gap: 8,
  },
  primaryButton: {
    borderRadius: 8,
  },
  secondaryButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  card: {
    elevation: 3,
    borderRadius: 16,
  },
  userInfo: {
    marginTop: 8,
  },
});
