import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { TextInput, Button, Text, Snackbar, Card, useTheme } from "react-native-paper";
import { FontAwesome } from "@expo/vector-icons";
import { useAppContext } from "../../../shared/contexts/AppContext";
import { useState } from "react";
import { ROUTES } from "../../../core/constants/routes";

export default function LoginScreen({ navigation }) {
    const { login } = useAppContext();
    const theme = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const handleLogin = () => {
        if (!email || !password) {
            setError("Todos los campos son obligatorios.");
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            login();
        }, 800);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.headerContainer}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                        <FontAwesome name="user" size={40} color={theme.colors.primary} />
                    </View>
                    <Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: 16 }}>Iniciar sesión</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>Acceso para estudiantes</Text>
                </View>

                <Card style={styles.card}>
                    <Card.Content>
                        <TextInput
                            label="Correo"
                            mode="outlined"
                            value={email}
                            onChangeText={setEmail}
                            style={styles.input}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            left={<TextInput.Icon icon="email" />}
                        />
                        <TextInput
                            label="Contraseña"
                            mode="outlined"
                            value={password}
                            onChangeText={setPassword}
                            style={styles.input}
                            secureTextEntry={secureTextEntry}
                            left={<TextInput.Icon icon="lock" />}
                            right={<TextInput.Icon
                                icon={secureTextEntry ? 'eye' : 'eye-off'}
                                onPress={() => setSecureTextEntry(!secureTextEntry)}
                            />
                            }
                        />
                        <Button
                            mode="contained"
                            loading={loading}
                            onPress={handleLogin}
                            style={styles.button}
                        >
                            Entrar
                        </Button>

                        <View style={styles.registerFooter}>
                            <Text variant="bodyMedium">¿No tienes una cuenta?</Text>
                            <Button mode="text" compact onPress={() => navigation.navigate(ROUTES.STUDENT_REGISTER)}>
                                Registrarse
                            </Button>
                        </View>
                            <View style={styles.backFooter}>
                                <Button mode="text" compact onPress={() => navigation.navigate(ROUTES.WELCOME)}>
                                    ← Volver a Inicio
                                </Button>
                            </View>
                    </Card.Content>
                </Card>
            </ScrollView>
            <Snackbar
                visible={!!error}
                onDismiss={() => setError("")}
                duration={3000}
            >
                {error}
            </Snackbar>
        </KeyboardAvoidingView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    headerContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
        color: '#144985',
    },
    card: {
        elevation: 4,
        borderRadius: 16,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
        borderRadius: 8,
        paddingVertical: 6,
    },
    registerFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    backFooter: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    }
});