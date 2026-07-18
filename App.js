import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PaperProvider, ActivityIndicator } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";

import { AppContextProvider, useAppContext } from "./src/shared/contexts/AppContext";
import { ROUTES } from "./src/core/constants/routes";
import { getUserRole } from "./src/core/utils/normalization";
import GlobalAlertDialog from "./src/shared/components/GlobalAlertDialog";
import { usePushNotifications } from "./src/shared/hooks/usePushNotifications";

import WelcomeScreen from "./src/features/auth/pages/welcome/WelcomeScreen";
import LoginScreen from "./src/features/auth/pages/login/LoginScreen";
import RegisterScreen from "./src/features/auth/pages/register/RegisterScreen";
import DashboardTabs from "./src/features/dashboard/navigation/DashboardTabs";

const Stack = createNativeStackNavigator();

function AppContent() {
  const { paperTheme, user, isLoading, alertConfig, hideAlert } = useAppContext();
  
  // Initialize Push Notifications when user is logged in
  usePushNotifications();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: paperTheme.colors.background }}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  const userRole = getUserRole(user);

  if (user) {
    console.log('Usuario logeado:', {
      name: user.name,
      role: userRole
    });
  }

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={ROUTES.WELCOME}
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
