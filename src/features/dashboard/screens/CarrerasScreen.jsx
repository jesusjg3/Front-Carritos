import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Text, useTheme } from "react-native-paper";

export default function CarrerasScreen() {
    const theme = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <Card style={styles.card}>
                <Card.Title title="Carreras" />
                <Card.Content>
                    <Text variant="bodyMedium">
                        Aquí se gestionarán las carreras.
                    </Text>
                </Card.Content>
            </Card>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
    },
    card: {
        elevation: 2,
    },
});
