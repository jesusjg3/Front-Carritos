# Carritos — aplicación móvil

Aplicación móvil para pasajeros y conductores, desarrollada con Expo, React Native y React Navigation.

## Requisitos

- Node.js LTS y npm.
- Expo Go para pruebas en dispositivo, o Android Studio para emulador.
- Backend de Carritos ejecutándose y accesible desde la red del dispositivo.

## Instalación

```bash
cd Front-Carritos
npm install
cp .env.example .env
```

Edita `.env` y reemplaza `tu_ip_local` por la IP del equipo donde corre la API. Un teléfono físico no puede usar `localhost` para acceder al computador.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | URL base de la API, incluyendo `/api`. |
| `EXPO_PUBLIC_REVERB_APP_KEY` | Clave pública de Reverb. |
| `EXPO_PUBLIC_REVERB_PORT` | Puerto de WebSockets. |
| `EXPO_PUBLIC_CAMPUS_CENTER_LAT` / `LNG` | Centro visual de la geocerca. |
| `EXPO_PUBLIC_CAMPUS_RADIUS_KM` | Radio visual permitido. La validación definitiva ocurre en el backend. |
| `EXPO_PUBLIC_OSRM_URL` | Servicio OSRM para calcular rutas. |

Los mapas usan mosaicos de OpenStreetMap y no requieren una API key de Google o CARTO. Debe conservarse la atribución visible del mapa.

## Ejecución

```bash
npx expo start
```

En la consola de Expo:

- `a`: emulador Android.
- `i`: simulador iOS en macOS.
- `w`: versión web.
- Escanear el QR: dispositivo físico en la misma red.

Para una compilación Android interna:

```bash
npx eas build --profile preview --platform android
```

## Estructura actual

- `App.js`: composición principal y navegación raíz.
- `src/core`: configuración, constantes, servicios y utilidades transversales.
- `src/features/auth`: bienvenida, inicio de sesión y registro.
- `src/features/dashboard`: inicio, viajes, historial, perfil y componentes del ciclo de viaje.
- `src/shared`: contexto global, hooks de ubicación/notificaciones y componentes compartidos.
- `src/Web`: mapa basado en WebView y código JavaScript del mapa.
- `assets`: iconos, splash y recursos gráficos.

> El punto de entrada real es `App.js`. Las pantallas administrativas heredadas
> fueron retiradas porque no estaban conectadas a la navegación actual.

## Funcionalidades principales

- Registro de pasajeros e inicio de sesión JWT.
- Solicitud, aceptación, inicio, cancelación y finalización de viajes.
- Viajes compartidos con control de pasajeros.
- Ubicación del conductor y seguimiento en tiempo real mediante canales privados de Reverb.
- Notificaciones push mediante Expo.
- Historial, calificaciones, comentarios y reporte de incidencias.

## Notificaciones Android

Para generar una aplicación Android con notificaciones push se requiere configurar el proyecto Firebase/Expo. `google-services.json` y las llaves de cuenta de servicio no deben subirse al repositorio. Consulta la configuración de credenciales de Expo y coloca únicamente los archivos locales ignorados por Git.

## Verificación

La exportación web permite comprobar que el bundle móvil compila:

```bash
npx expo export --platform web
```

Antes de probar un flujo completo, verifica que la API, Reverb, el worker de colas y OSRM estén disponibles.
