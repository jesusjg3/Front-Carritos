import { View, StyleSheet } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { useAppContext } from "../../../shared/contexts/AppContext";

export default function CarrerasScreen() {
    const { user } = useAppContext();
    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Card style={styles.card}>
                <Card.Title title="Carreras" />
                <Card.Content>
                    <Text variant="bodyMedium">
                        Aquí se gestionarán las carreras.
                    </Text>
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
        elevation: 2,
    },
});
