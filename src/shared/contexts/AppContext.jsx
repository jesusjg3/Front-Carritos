import React, { createContext, useContext, useState } from "react";
import { PaperDarkTheme, PaperLightTheme } from "../styles/PaperTheme";

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
            const response = await fetch('http://127.0.0.1:8000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
