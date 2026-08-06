import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import { API_ROUTES } from '../../core/constants/routes';
import { useAppContext } from '../contexts/AppContext';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const usePushNotifications = () => {
    const { user, token } = useAppContext();
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        if (!user || !token) return;

        registerForPushNotificationsAsync().then(deviceToken => {
            if (deviceToken) {
                setExpoPushToken(deviceToken);
                sendTokenToBackend(deviceToken, token);
            }
        });

        // This listener is fired whenever a notification is received while the app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        // This listener is fired whenever a user taps on or interacts with a notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log("Notification Clicked: ", response);
        });

        return () => {
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
    }, [user, token]);

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

    async function registerForPushNotificationsAsync() {
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
