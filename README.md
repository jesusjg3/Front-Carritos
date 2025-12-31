# Estructura del Proyecto - Carritos App

## � Guía de Inicio Rápido

### Prerrequisitos

- **Node.js**: [Descargar e instalar](https://nodejs.org/) (versión LTS recomendada).
- **Expo Go**: Instala la aplicación en tu dispositivo ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/us/app/expo-go/id982107779)).
- **Git**: [Descargar e instalar](https://git-scm.com/).

### 📦 Instalación y Configuración

1.  **Clonar el repositorio**

    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd Front-Carritos
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

### ▶️ Ejecutar la aplicación

Para iniciar el servidor de desarrollo:

```bash
npx expo start
```

**Comandos disponibles en la terminal interactiva:**

- Presiona `a` para correr en **Android Emulator**.
- Presiona `i` para correr en **iOS Simulator** (solo macOS).
- Presiona `w` para correr en **Web Browser**.
- Escanea el código QR con la app **Expo Go** para probar en tu dispositivo físico.

---

## �📁 Arquitectura

Este proyecto sigue una arquitectura profesional inspirada en Angular, adaptada para React Native/Expo. La estructura está diseñada para ser escalable, mantenible y fácil de entender a largo plazo.

## 🏗️ Estructura de Carpetas

```
src/
├── core/                    # Funcionalidad transversal a toda la aplicación
│   ├── config/              # Configuraciones globales
│   │   └── app.config.js    # Configuración de la app (API, tema, etc.)
│   ├── constants/           # Constantes globales
│   │   └── routes.js        # Nombres de rutas para navegación
│   ├── hooks/               # Custom hooks reutilizables a nivel global
│   ├── services/            # Servicios de infraestructura
│   │   ├── api/             # Clientes HTTP y llamadas a API
│   │   └── storage/         # Wrappers de AsyncStorage
│   ├── types/               # Definiciones de tipos (TypeScript/JSDoc)
│   └── utils/               # Funciones utilitarias puras
│       ├── validators.js    # Validaciones (email, password, etc.)
│       ├── format.js        # Formateadores (fechas, textos, etc.)
│       └── index.js         # Barrel export
│
├── features/                # Módulos por dominio/funcionalidad
│   ├── auth/                # Feature de autenticación
│   │   ├── components/      # Componentes específicos de auth
│   │   └── screens/         # Pantallas de auth
│   │       ├── WelcomeScreen.jsx
│   │       ├── LoginScreen.jsx
│   │       ├── RegisterScreen.jsx
│   │       └── index.js     # Barrel export
│   │
│   └── dashboard/           # Feature principal de la app
│       ├── components/      # Componentes específicos del dashboard
│       ├── screens/         # Pantallas del dashboard
│       │   ├── InicioScreen.jsx
│       │   ├── CarrerasScreen.jsx
│       │   ├── PerfilScreen.jsx
│       │   └── index.js     # Barrel export
│       └── navigation/      # Navegación del dashboard
│           └── DashboardTabs.jsx
│
├── shared/                  # Recursos compartidos entre features
│   ├── components/          # Componentes UI reutilizables
│   │   ├── buttons/         # Componentes de botones personalizados
│   │   ├── cards/           # Componentes de tarjetas
│   │   ├── inputs/          # Inputs personalizados
│   │   └── layouts/         # Layouts compartidos
│   ├── contexts/            # Contextos de React globales
│   │   ├── AppContext.jsx   # Contexto principal (auth, theme)
│   │   └── index.js         # Barrel export
│   ├── hooks/               # Custom hooks compartidos
│   └── styles/              # Estilos y temas compartidos
│       ├── PaperTheme.jsx   # Configuración de temas Material Design
│       └── index.js         # Barrel export
│
└── Web/                     # Recursos web específicos
    ├── mapa.html            # HTML del mapa
    └── mapaCode.js          # Código JavaScript del mapa
```

## 🎯 Principios de Organización

### 1. **Separación de Responsabilidades**

- **core/**: Código que puede ser usado en cualquier parte de la app
- **features/**: Código específico de dominio, cada feature es independiente
- **shared/**: Código reutilizable entre features

### 2. **Escalabilidad**

- Añadir nuevas features es simple: crear una nueva carpeta en `features/`
- Cada feature contiene todo lo necesario: componentes, screens, navegación
- No se contamina la carpeta raíz con cada nueva funcionalidad

### 3. **Mantenibilidad**

- Los archivos están organizados por función y dominio
- Fácil encontrar dónde hacer cambios
- Barrel exports (`index.js`) simplifican las importaciones

### 4. **Convenciones de Importación**

```javascript
// ✅ Bueno - Usando barrel exports
import { useAppContext } from "../../../shared/contexts";
import { isValidEmail, formatDate } from "../../core/utils";
import { LoginScreen } from "../features/auth/screens";

// ❌ Evitar - Importaciones directas largas
import { useAppContext } from "../../../shared/contexts/AppContext";
```

## 📝 Guía de Uso

### Agregar una Nueva Feature

1. Crear carpeta en `src/features/mi-nueva-feature/`
2. Crear subcarpetas: `components/`, `screens/`, `hooks/`, etc.
3. Crear `index.js` para barrel exports
4. Importar donde sea necesario

### Agregar un Nuevo Screen

1. Crear el archivo en `src/features/{feature}/screens/NuevoScreen.jsx`
2. Exportarlo en `src/features/{feature}/screens/index.js`
3. Usarlo: `import { NuevoScreen } from '../features/{feature}/screens'`

### Agregar Utilidades

1. Crear función en `src/core/utils/`
2. Exportarla en `src/core/utils/index.js`
3. Usarla: `import { miFuncion } from '../../core/utils'`

## 🚀 Próximos Pasos

- [ ] Implementar servicio de API en `core/services/api/`
- [ ] Crear componentes reutilizables en `shared/components/`
- [ ] Agregar más utilidades de validación
- [ ] Implementar manejo de estado global más robusto
- [ ] Agregar tests unitarios por feature

## 📚 Referencias

Esta arquitectura está inspirada en:

- **Angular**: Estructura modular por features
- **Clean Architecture**: Separación de capas y responsabilidades
- **React Best Practices**: Hooks, Context API, composition

---

**Nota**: Esta estructura es flexible y puede adaptarse según las necesidades del proyecto. El objetivo es mantener el código organizado y fácil de escalar.
