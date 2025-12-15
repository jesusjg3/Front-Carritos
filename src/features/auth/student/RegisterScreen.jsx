import React, { useState } from "react";
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Button, Card, Snackbar, TextInput, Text, useTheme } from "react-native-paper";
import { FontAwesome } from "@expo/vector-icons";
import { ROUTES } from "../../../core/constants/routes";

export default function RegisterScreen({ navigation }) {
    const theme = useTheme();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmpassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.headerContainer}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                        <FontAwesome name="user-plus" size={40} color={theme.colors.primary} />
                    </View>
                    <Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: 16 }}>
                        Registrarse
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>Crear cuenta de estudiante</Text>
                </View>

                <Card style={styles.card}>
                    <Card.Content style={styles.cardContent}>
                        <TextInput
                            label="Nombre Completo"
                            mode="outlined"
                            value={name}
                            onChangeText={setName}
                            style={styles.input}
                            autoCapitalize="words"
                            left={<TextInput.Icon icon="account" />}
                        />

                        <TextInput
                            label="Correo Electrónico"
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
                            right={
                                <TextInput.Icon
                                    icon={secureTextEntry ? "eye" : "eye-off"}
                                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                                />
                            }
                        />

                        <TextInput
                            label="Confirmar Contraseña"
                            mode="outlined"
                            value={confirmpassword}
                            onChangeText={setConfirmPassword}
                            style={styles.input}
                            secureTextEntry={confirmSecureTextEntry}
                            left={<TextInput.Icon icon="lock-check" />}
                            right={
                                <TextInput.Icon
                                    icon={confirmSecureTextEntry ? "eye" : "eye-off"}
                                    onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
                                />
                            }
                        />

                        <Button
                            mode="contained"
                            loading={loading}
                            style={styles.button}
                            contentStyle={styles.buttonContent}
                            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                        >
                            Registrarse
                        </Button>

                        <View style={styles.loginFooter}>
                            <Text variant="bodyMedium">¿Ya tienes una cuenta?</Text>
                            <Button mode="text" compact onPress={() => navigation.navigate(ROUTES.STUDENT_LOGIN)}>
                                Iniciar Sesión
                            </Button>
                        </View>
                    </Card.Content>
                </Card>
                    <View style={styles.backFooter}>
                        <Button mode="text" compact onPress={() => navigation.navigate(ROUTES.WELCOME)}>
                            ← Volver a Inicio
                        </Button>
                    </View>
            </ScrollView>

            <Snackbar
                visible={!!error}
                onDismiss={() => setError("")}
                duration={3000}
                action={{
                    label: 'OK',
                    onPress: () => setError(""),
                }}
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
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        elevation: 4,
        borderRadius: 16,
    },
    cardContent: {
        paddingVertical: 16,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    loginFooter: {
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