
import { View, StyleSheet, Platform } from "react-native";
import { Card, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from 'react-native-webview';
import { useAppContext } from "../../../shared/contexts/AppContext";
import { useTheme } from "react-native-paper";
import { mapaHtml } from "../../../Web/mapaCode";

export default function InicioScreen() {
    const { user } = useAppContext();
    const theme = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <View style={styles.mapContainer}>
                {Platform.OS === 'web' ? (
                    <iframe
                        title="mapa"
                        srcDoc={mapaHtml}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                ) : (
                    <WebView
                        source={{ html: mapaHtml }}
                        style={styles.map}
                        originWhitelist={['*']}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'flex-start',
    },
    mapContainer: {
        flex: 1,
        overflow: 'hidden',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    map: {
        flex: 1,
    },
});