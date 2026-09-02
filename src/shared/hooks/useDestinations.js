import { useState, useEffect, useCallback, useRef } from 'react';
import { API_ROUTES } from '../../Config/Routes';

export const useDestinations = (user, isPasajero) => {
    const [destinos, setDestinos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const loadedRef = useRef(false);

    const cargarDestinos = useCallback(async (force = true) => {
        if (!force && loadedRef.current) return;

        try {
            setCargando(true);
            setError(null);

            const response = await fetch(API_ROUTES.DESTINATIONS);

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const destinosTransformados = (data.destinations || data || []).map(destino => ({
                ...destino,
                nombre: destino.name || destino.nombre,
                latitude: parseFloat(destino.latitude || destino.lat),
                longitude: parseFloat(destino.longitude || destino.lng)
            }));

            setDestinos(destinosTransformados);
            loadedRef.current = true;
        } catch (err) {
            console.error('Error cargando destinos:', err);
            setError(err.message || 'No se pudieron cargar los destinos disponibles');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        if (user?.id && isPasajero) cargarDestinos(false);
    }, [user?.id, isPasajero, cargarDestinos]);

    return {
        destinos,
        cargandoDestinos: cargando,
        errorDestinos: error,
        cargarDestinos
    };
};
