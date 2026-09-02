import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme as NavigationLightTheme, DarkTheme as NavigationDarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PaperProvider, ActivityIndicator } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";

import { AppContextProvider, useAppContext } from "./src/shared/contexts/AppContext";
import { ROUTES } from "./src/core/constants/routes";
import GlobalAlertDialog from "./src/shared/components/GlobalAlertDialog";
import { usePushNotifications } from "./src/shared/hooks/usePushNotifications";

import WelcomeScreen from "./src/features/auth/pages/welcome/WelcomeScreen";
import LoginScreen from "./src/features/auth/pages/login/LoginScreen";
import RegisterScreen from "./src/features/auth/pages/register/RegisterScreen";
import DashboardTabs from "./src/features/dashboard/navigation/DashboardTabs";

const Stack = createNativeStackNavigator();

function AppContent() {
  const { paperTheme, user, isLoading, alertConfig, hideAlert } = useAppContext();
  const navigationBaseTheme = paperTheme.dark ? NavigationDarkTheme : NavigationLightTheme;
  const navigationTheme = {
    ...navigationBaseTheme,
    dark: paperTheme.dark,
    colors: {
      ...navigationBaseTheme.colors,
      primary: paperTheme.colors.primary,
      background: paperTheme.colors.background,
      card: paperTheme.colors.surface,
      text: paperTheme.colors.onSurface || paperTheme.colors.text,
      border: paperTheme.colors.outline,
      notification: paperTheme.colors.error,
    },
  };
  
  // Initialize Push Notifications when user is logged in
  usePushNotifications();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: paperTheme.colors.background }}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <View style={{ flex: 1, backgroundColor: paperTheme.colors.background }}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={user ? ROUTES.DASHBOARD : ROUTES.WELCOME}
          >
            {!user ? (
              <>
                <Stack.Screen name={ROUTES.WELCOME} component={WelcomeScreen} />
                <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
                <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
              </>
            ) : (
              <Stack.Screen
                name={ROUTES.DASHBOARD}
                component={DashboardTabs}
                options={{ animationEnabled: false }}
              />
            )}
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style={paperTheme.dark ? "light" : "dark"} />
        <GlobalAlertDialog config={alertConfig} onDismiss={hideAlert} />
      </View>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContextProvider>
        <AppContent />
      </AppContextProvider>
    </SafeAreaProvider>
  );
}
