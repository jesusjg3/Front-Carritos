// Script de ayuda para convertir imagen del carrito a base64
// Instrucciones: Guarda la imagen del carrito como 'carrito-marker.png' en la carpeta assets/
// Luego usa este código en tu app para obtener el base64

import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export const getCarritoMarkerBase64 = async () => {
    try {
        // Cargar el asset de la imagen del carrito
        const carritoAsset = Asset.fromModule(require('../../assets/carrito-marker.png'));
        await carritoAsset.downloadAsync();
        
        // Leer el archivo como base64
        const base64 = await FileSystem.readAsStringAsync(carritoAsset.localUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        
        return `data:image/png;base64,${base64}`;
    } catch (error) {
        console.error('Error al cargar imagen del carrito:', error);
        // Retornar un SVG de fallback
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgZmlsbD0iIzRDQUY1MCIvPjxwYXRoIGQ9Ik0yMCAxMGw1IDhIMTVsNS04eiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=';
    }
};
