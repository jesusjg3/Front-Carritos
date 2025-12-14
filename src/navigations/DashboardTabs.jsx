import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";

import InicioScreen from "../screens/InicioScreen";
import PerfilScreen from "../screens/PerfilScreen";
import CarrerasScreen from "../screens/CarrerasScreen";
const Tab = createBottomTabNavigator();

export default function DashboardTabs() {
    const theme = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
                tabBarLabelStyle: {
                    fontSize: 12,
                    marginBottom: 4,
                },
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 6,
                    backgroundColor: theme.colors.elevation.level2,
                    borderTopWidth: 0,
                    elevation: 5,
                },
                tabBarIcon: ({ color }) => {
                    let iconName = "home";

                    switch (route.name) {
                        case "Inicio":
                            iconName = "home";
                            break;
                        case "Carreras":
                            iconName = "plus";
                            break;
                        case "Perfil":
                            iconName = "user";
                            break;
                    }

                    return (
                        <FontAwesome
                            name={iconName}
                            size={26}
                            color={color}
                            style={{ marginTop: 4 }}
                        />
                    );
                },
            })}
        >
            <Tab.Screen name="Inicio" component={InicioScreen} />
            <Tab.Screen name="Carreras" component={CarrerasScreen} />
            <Tab.Screen name="Perfil" component={PerfilScreen} />
        </Tab.Navigator>
    );
}
