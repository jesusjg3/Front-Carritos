import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppContextProvider, useAppContext } from "./src/shared/contexts/AppContext";
import { ROUTES } from "./src/core/constants/routes";

import WelcomeScreen from "./src/features/auth/screens/WelcomeScreen";
import StudentLoginScreen from "./src/features/auth/student/LoginScreen";
import StudentRegisterScreen from "./src/features/auth/student/RegisterScreen";
import DriverLoginScreen from "./src/features/auth/driver/LoginScreen";
import DriverRegisterScreen from "./src/features/auth/driver/RegisterScreen";
import DashboardTabs from "./src/features/dashboard/navigation/DashboardTabs";

const Stack = createNativeStackNavigator();

function AppContent() {
  const { paperTheme, user } = useAppContext();

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <>
              <Stack.Screen name={ROUTES.WELCOME} component={WelcomeScreen} />
              <Stack.Screen name={ROUTES.STUDENT_LOGIN} component={StudentLoginScreen} />
              <Stack.Screen name={ROUTES.STUDENT_REGISTER} component={StudentRegisterScreen} />
              <Stack.Screen name={ROUTES.DRIVER_LOGIN} component={DriverLoginScreen} />
              <Stack.Screen name={ROUTES.DRIVER_REGISTER} component={DriverRegisterScreen} />
            </>
          ) : (
            <Stack.Screen name={ROUTES.DASHBOARD} component={DashboardTabs} />
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