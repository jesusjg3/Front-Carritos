import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaperDarkTheme, PaperLightTheme } from "../styles/PaperTheme";
import { API_ROUTES } from "../../Config/Routes";

const AppContext = createContext();

export function AppContextProvider({ children }) {

    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initializeSession();
    }, []);

    const initializeSession = async () => {
        try {
            const savedToken = await AsyncStorage.getItem('authToken');
            const savedUser = await AsyncStorage.getItem('userData');
            if (savedToken && savedUser) {
                const parsedUser = JSON.parse(savedUser);
                setToken(savedToken);
                setUser(parsedUser);
                await refreshTokenIfNeeded(savedToken);
            }
        } catch (error) {
            console.error('Error al inicializar sesión:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSession = async (token, userData) => {
        try {
            await AsyncStorage.setItem('authToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
            console.error('Error guardando sesión:', error);
        }
    };

    const clearSession = async () => {
        try {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');
        } catch (error) {
            console.error('Error limpiando sesión:', error);
        }
    };

    const refreshTokenIfNeeded = async (currentToken) => {
        try {
            const response = await fetch(API_ROUTES.AUTH.REFRESH, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setToken(data.access_token);
                // Usar el objeto user devuelto por el backend, que incluye id, name, role, etc.
                const userData = {
                    ...data.user,
                    token: data.access_token,
                };
                setUser(userData);
                await saveSession(data.access_token, userData);
            }
        } catch (error) {
            console.error('Error refrescando token:', error);
        }
    };

    const toggleTheme = () => {
        setIsDarkTheme(!isDarkTheme);
    };

    const toggleNotifications = () => {
        setNotificationsEnabled(!notificationsEnabled);
    };

    const login = async (email, password) => {
        try {
            const response = await fetch(API_ROUTES.AUTH.LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error de autenticación');
            }
            setToken(data.access_token);
            const userData = {
                ...data.user,
                token: data.access_token,
            };
            setUser(userData);
            return { success: true, user: userData };
        } catch (error) {
            setUser(null);
            setToken(null);
            return { success: false, error: error.message };
        }
    };

    const register = async (name, email, password) => {
        try {
            const response = await fetch(API_ROUTES.AUTH.REGISTER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    password_confirmation: password,
                    role_id: 2
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error en el registro');
            }
            setToken(data.access_token);
            const userData = {
                ...data.user,
                token: data.access_token,
            };
            setUser(userData);
            return { success: true, user: userData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        setUser(null);
        setToken(null);
        await clearSession();
    };

    return (
        <AppContext.Provider
            value={{
                user,
                token,
                login,
                register,
                logout,
                isDarkTheme,
                toggleTheme,
                notificationsEnabled,
                toggleNotifications,
                isLoading,
                paperTheme: isDarkTheme ? PaperDarkTheme : PaperLightTheme,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export const useAppContext = () => useContext(AppContext);
