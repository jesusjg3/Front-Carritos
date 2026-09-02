import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import axios from 'axios';
import { useAppContext } from '../contexts/AppContext';

export const usePushNotifications = () => {
    const { user, token, isLoading } = useAppContext();
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        if (isLoading || !user || !token || Platform.OS === 'web') return;

        // Expo Go ya no soporta notificaciones remotas en Android desde SDK 53.
        // Evitamos solicitar el token y enviar una petición que siempre fallará.
        const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
        if (isExpoGo) {
            console.warn('Notificaciones push remotas requieren un development build; Expo Go fue omitido.');
            return;
        }

        let isMounted = true;
        const setupNotifications = async () => {
            try {
                // Se importa solo en development build/producción para evitar
                // que Expo Go inicialice el módulo remoto incompatible.
                const Notifications = await import('expo-notifications');
                if (!isMounted) return;

                Notifications.setNotificationHandler({
                    handleNotification: async () => ({
                        shouldShowBanner: true,
                        shouldShowList: true,
                        shouldPlaySound: true,
                        shouldSetBadge: false,
                    }),
                });

                const deviceToken = await registerForPushNotificationsAsync(Notifications);
                if (deviceToken && isMounted) {
                    setExpoPushToken(deviceToken);
                    sendTokenToBackend(deviceToken, token);
                }

                if (isMounted) {
                    notificationListener.current = Notifications.addNotificationReceivedListener(setNotification);
                    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                        console.log("Notification Clicked: ", response);
                    });
                }
            } catch (error) {
                console.warn('Notificaciones push no disponibles en esta compilación:', error.message);
            }
        };

        setupNotifications();

        return () => {
            isMounted = false;
            try {
                if (notificationListener.current && typeof notificationListener.current.remove === 'function') {
                    notificationListener.current.remove();
                }
                if (responseListener.current && typeof responseListener.current.remove === 'function') {
                    responseListener.current.remove();
                }
            } catch (e) {
                console.warn('Error removing notification subscription:', e);
            }
        };
    }, [isLoading, user?.id, token]);

    async function sendTokenToBackend(expoToken, userToken) {
        try {
            await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.10.96:8000/api'}/devices`,
                {
                    expo_token: expoToken,
                    device_name: Device.deviceName || 'Unknown Device',
                },
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log('Token de Expo enviado al backend exitosamente.');
        } catch (error) {
            console.error('Error enviando token de Expo al backend:', error.response?.data || error.message);
        }
    }

    async function registerForPushNotificationsAsync(Notifications) {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            
            if (finalStatus !== 'granted') {
                console.log('Permiso de notificaciones denegado.');
                return;
            }
            
            try {
                // Obtenemos el Expo Push Token con el projectId del app.json
                token = (await Notifications.getExpoPushTokenAsync({
                    projectId: "dcd105ec-ff3f-48eb-8d33-11cf9dbe647e"
                })).data;
                console.log("Expo Push Token obtenido: ", token);
            } catch (error) {
                console.error("Error al obtener Expo Push Token: ", error);
            }
        } else {
            console.log('Debes usar un dispositivo físico para recibir notificaciones Push');
        }

        return token;
    }

    return {
        expoPushToken,
        notification
    };
};
