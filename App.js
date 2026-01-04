import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppContextProvider, useAppContext } from "./src/shared/contexts/AppContext";
import { ROUTES } from "./src/core/constants/routes";
import { getUserRole } from "./src/core/utils/normalization";

import WelcomeScreen from "./src/features/auth/pages/welcome/WelcomeScreen";
import LoginScreen from "./src/features/auth/pages/login/LoginScreen";
import RegisterScreen from "./src/features/auth/pages/register/RegisterScreen";
import DashboardTabs from "./src/features/dashboard/navigation/DashboardTabs";
import AdminDashboard from "./src/features/admin/pages/AdminDashboard";
import UserManagement from "./src/features/admin/pages/UserManagement";
import DriverManagement from "./src/features/admin/pages/DriverManagement";

const Stack = createNativeStackNavigator();

function AppContent() {
  const { paperTheme, user } = useAppContext();

  const userRole = getUserRole(user);
  const isAdmin = userRole === "admin";

  if (user) {
    console.log('Usuario logeado:', {
      name: user.name,
      role: userRole,
      is_admin: isAdmin
    });
  }

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.WELCOME}
        >
          {!user ? (
            <>
              <Stack.Screen name={ROUTES.WELCOME} component={WelcomeScreen} />
              <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
              <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
            </>
          ) : isAdmin ? (
            <>
              <Stack.Screen
                name={ROUTES.ADMIN_DASHBOARD}
                component={AdminDashboard}
                options={{ animationEnabled: false }}
              />
              <Stack.Screen name={ROUTES.USER_MANAGEMENT} component={UserManagement} />
              <Stack.Screen name={ROUTES.DRIVER_MANAGEMENT} component={DriverManagement} />
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
