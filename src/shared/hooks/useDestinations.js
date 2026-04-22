import { useState, useEffect } from 'react';
import { API_ROUTES } from '../../Config/Routes';

export const useDestinations = (user, isPasajero) => {
    const [destinos, setDestinos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user && isPasajero) {
            cargarDestinos();
        }
    }, [user, isPasajero]);

    const cargarDestinos = async () => {
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
        } catch (err) {
            console.error('Error cargando destinos:', err);
            setError(err.message || 'No se pudieron cargar los destinos disponibles');
        } finally {
            setCargando(false);
        }
    };

    return {
        destinos,
        cargandoDestinos: cargando,
        errorDestinos: error,
        cargarDestinos
    };
};
