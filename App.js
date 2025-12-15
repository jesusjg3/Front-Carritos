import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PaperProvider } from "react-native-paper";

import { AppContextProvider, useAppContext } from "./src/shared/contexts/AppContext";

import WelcomeScreen from "./src/features/auth/screens/WelcomeScreen";
import LoginScreen from "./src/features/auth/screens/LoginScreen";
import RegisterScreen from "./src/features/auth/screens/RegisterScreen";
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
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
            </>
          ) : (
            <Stack.Screen name="Dashboard" component={DashboardTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style={paperTheme.dark ? "light" : "dark"} />
    </PaperProvider>
  );
}

export default function App() {
  return (
    <AppContextProvider>
      <AppContent />
    </AppContextProvider>
  );
}