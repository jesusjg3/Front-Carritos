import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import InicioScreen from "../screens/InicioScreen";
import PerfilScreen from "../screens/PerfilScreen";
import HistoryScreen from "../screens/HistoryScreen";
import CommentsScreen from "../screens/CommentsScreen";
import { ROUTES } from "../../../core/constants/routes";
import { useAppContext } from "../../../shared/contexts/AppContext";

const Tab = createBottomTabNavigator();

export default function DashboardTabs() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { user } = useAppContext();

    const isPasajero = user?.role === 'pasajero';

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
                tabBarLabelStyle: {
                    fontSize: 10,
                    marginBottom: 2,
                },
                tabBarStyle: {
                    height: 54 + insets.bottom,
                    paddingBottom: insets.bottom + 2,
                    backgroundColor: theme.colors.elevation.level2,
                    borderTopWidth: 0,
                    elevation: 5,
                },
                tabBarIcon: ({ color }) => {
                    let iconName = "home";

                    switch (route.name) {
                        case ROUTES.INICIO:
                            iconName = "home";
                            break;
                        case ROUTES.CARRERAS:
                            iconName = isPasajero ? "history" : "comment";
                            break;
                        case ROUTES.PERFIL:
                            iconName = "user";
                            break;
                    }

                    return (
                        <FontAwesome
                            name={iconName}
                            size={22}
                            color={color}
                            style={{ marginTop: 2 }}
                        />
                    );
                },
            })}
        >
            <Tab.Screen
                name={ROUTES.INICIO}
                component={InicioScreen}
                options={{ tabBarLabel: "Inicio" }}
            />
            <Tab.Screen
                name={ROUTES.CARRERAS}
                component={isPasajero ? HistoryScreen : CommentsScreen}
                options={{
                    tabBarLabel: isPasajero ? "Historial" : "Comentarios"
                }}
            />
            <Tab.Screen
                name={ROUTES.PERFIL}
                component={PerfilScreen}
                options={{ tabBarLabel: "Perfil" }}
            />
        </Tab.Navigator>
    );
}
