import { View, StyleSheet, Platform, ScrollView } from "react-native";
import { Text, Button, Card, useTheme } from "react-native-paper";
import { FontAwesome } from "@expo/vector-icons";
import { useAppContext } from "../../../shared/contexts/AppContext";

export default function WelcomeScreen({ navigation }) {
  const { user } = useAppContext();
  const theme = useTheme();

  const handleStartExploring = () => {
    navigation.replace("Dashboard");
  };
  const goToLoginAsStudent = () => {
    navigation.navigate("Login");
  };
  const goToLoginAsDriver = () => {
    navigation.navigate("Login");
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        { backgroundColor: theme.colors.background },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View
          style={[
            styles.headerBanner,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <FontAwesome
            name="car"
            size={64}
            color="white"
            style={styles.carIcon}
          />
        </View>
        <View style={styles.content}>
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
            variant="bodyLarge"
            style={[
              styles.subtitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Tu plataforma para explorar carreras universitarias en la ULEAM
          </Text>
          <Text
            variant="titleMedium"
            style={{ textAlign: "center", marginTop: 8, color: theme.colors.onSurfaceVariant }}
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

          <Text
            variant="bodySmall"
            style={[
              styles.disclaimer,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Descubre qué carrera es perfecta para ti en la ULEAM
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerBanner: {
    paddingVertical: 48,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  carIcon: {
    marginTop: 8,
  },
  content: {
    padding: 24,
    paddingBottom: 32,
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
    fontSize: 32,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
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
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  roleInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  roleButton: {
    marginTop: 12,
    borderRadius: 10,
    width: 140,
    alignSelf: "center",
  },
  userInfo: {
    marginTop: 8,
  },
  button: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  disclaimer: {
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
});
