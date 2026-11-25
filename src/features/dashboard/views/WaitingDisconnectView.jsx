import React from "react";
import { StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { DISCONNECT_TEXTS } from "../constants/dashboardConstants";
import Spinner from "../../../shared/components/Spinner";

/**
 * Vista mostrada al conductor mientras espera la aprobación del administrador
 * para desconectarse de la plataforma.
 */
export default function WaitingDisconnectView() {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
      edges={["top"]}
    >
      <Spinner
        size="large"
        color={theme.colors.primary}
        style={styles.spinner}
      />
      <Text
        variant="titleMedium"
        style={[styles.title, { color: theme.colors.onSurface }]}
      >
        {DISCONNECT_TEXTS.WAITING_TITLE}
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
      >
        {DISCONNECT_TEXTS.WAITING_DESCRIPTION}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    marginBottom: 20,
  },
  title: {
    fontWeight: "bold",
  },
  description: {
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
