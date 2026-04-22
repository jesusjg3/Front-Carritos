
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_ROUTES } from '../../Config/Routes';

window.Pusher = Pusher;

export const createEcho = (token) => {
    // Parse host from API_BASE_URL (http://192.168.0.176:8000/api -> 192.168.0.176)
    const apiBaseUrl = API_ROUTES.BASE_URL;
    const host = apiBaseUrl.split('://')[1].split(':')[0];

    return new Echo({
        broadcaster: 'reverb',
        key: process.env.EXPO_PUBLIC_REVERB_APP_KEY,
        wsHost: host,
        wsPort: parseInt(process.env.EXPO_PUBLIC_REVERB_PORT),
        wssPort: parseInt(process.env.EXPO_PUBLIC_REVERB_PORT),
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${API_ROUTES.BASE_URL}/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
    });
};
