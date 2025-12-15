import React, { createContext, useContext, useState } from "react";
import { PaperDarkTheme, PaperLightTheme } from "../styles/PaperTheme";

const AppContext = createContext();

export function AppContextProvider({ children }) {

    const [user, setUser] = useState(null);

    const [isDarkTheme, setIsDarkTheme] = useState(false);

    const toggleTheme = () => {
        setIsDarkTheme(!isDarkTheme);
    };

    const login = (rol = "Estudiante") => {
        setUser({
            nombre: "Sujeto de pruebas",
            correo: "prueba@correo.com",
            rol,
            ingreso: "10/12/2025",
            bio: "Este es un usuario de prueba del sistema.",
        });
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AppContext.Provider
            value={{
                user,
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
