import React, { createContext, useContext, useState } from "react";
import { PaperDarkTheme, PaperLightTheme } from "../styles/PaperTheme";
import { API_ROUTES } from "../../Config/Routes";

const AppContext = createContext();

export function AppContextProvider({ children }) {

    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isDarkTheme, setIsDarkTheme] = useState(false);

    const toggleTheme = () => {
        setIsDarkTheme(!isDarkTheme);
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
            const payload = JSON.parse(atob(data.access_token.split('.')[1]));
            const userData = {
                email,
                rol: payload.role,
                is_active: payload.is_active,
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
            const payload = JSON.parse(atob(data.access_token.split('.')[1]));
            const userData = {
                email,
                rol: payload.role,
                is_active: payload.is_active,
                token: data.access_token,
            };
            setUser(userData);
            return { success: true, user: userData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
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
                paperTheme: isDarkTheme ? PaperDarkTheme : PaperLightTheme,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export const useAppContext = () => useContext(AppContext);
