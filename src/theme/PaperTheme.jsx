import {
    MD3LightTheme as DefaultLightTheme,
    MD3DarkTheme as DefaultDarkTheme,
    MD3LightTheme as DefaultTheme,
} from "react-native-paper";

export const PaperTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: "#144985",
        secondary: "#1E88E5",
        background: "#ffffff",
        surface: "#ffffff",
        text: "#000000",
        error: "#f83737ff",
    },
};
export const PaperLightTheme = {
    ...DefaultLightTheme,
    colors: {
        ...DefaultLightTheme.colors,
        primary: "#144985",
        background: "#ffffff",
        text: "#333333",
    },
};
export const PaperDarkTheme = {
    ...DefaultDarkTheme,
    colors: {
        ...DefaultDarkTheme.colors,
        primary: "#90CAF9",
        background: "#121212",
        text: "#ffffff",
    },
}