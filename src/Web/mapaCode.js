export const mapaHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Mapa</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0" />
    <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
        .user-marker-container {
            position: relative;
            width: 46px;
            height: 56px;
        }
        .user-marker-icon {
            width: 40px;
            height: 40px;
            background-size: cover;
            border-radius: 50%;
            border: 3px solid #1E88E5; /* Blue border */
            box-shadow: 0 0 5px rgba(0,0,0,0.7);
            position: absolute;
            top: 0;
            left: 0;
        }
        .user-marker-tail {
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 10px solid #1E88E5; /* Blue tail */
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
        }
        .user-dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #1E88E5;
            border: 3px solid #ffffff;
            box-shadow: 0 0 8px rgba(0,0,0,0.35);
        }
        .destination-marker {
            font-family: 'Material Symbols Outlined';
            font-size: 40px;
            color: #d32f2f; /* Red color for the pin */
            text-align: center;
        }
        .carrito-marker {
            font-family: 'Material Symbols Outlined';
            font-size: 46px;
            color: #1E88E5; /* Blue car icon */
            text-align: center;
        }
        /* Hide the itinerary instructions */
        .leaflet-routing-container {
            display: none;
        }
    </style>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
</head>
<body>
<div id="map"></div>

<script>
    var map = L.map('map').setView([0, 0], 2);
    var userMarker;
    var destinationMarkers = [];
    var routingControl;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    function centerMap(lat, lon) {
        if (map && lat !== undefined && lon !== undefined) {
            map.setView([lat, lon], 17);
        } else {
            console.error("Error: Mapa no inicializado o coordenadas no válidas.");
        }
    }

    function placeUserMarker(lat, lon, photoBase64) {
        if (map && lat !== undefined && lon !== undefined) {
            var iconToUse;
            
            // Usar puntito azul para el usuario
            if (photoBase64) {
                iconToUse = L.divIcon({
                    html: \`
                        <div class="user-marker-container">
                            <div style="background-image: url(data:image/jpeg;base64,\${photoBase64});" class="user-marker-icon"></div>
                            <div class="user-marker-tail"></div>
                        </div>\`,
                    className: '',
                    iconSize: [46, 56],
                    iconAnchor: [23, 56]
                });
            } else {
                iconToUse = L.divIcon({
                    html: '<div class="user-dot"></div>',
                    className: '',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
            }

            if (userMarker) {
                userMarker.setLatLng([lat, lon]).setIcon(iconToUse);
            } else {
                userMarker = L.marker([lat, lon], { icon: iconToUse }).addTo(map)
                    .bindPopup('Tu ubicación actual');
            }
        } else {
            console.error("Error: Coordenadas no válidas para el marcador.");
        }
    }

    function addDestinationMarkers(destinations) {
        clearDestinationMarkers();
        var destinationIcon = L.divIcon({
            html: '<span class="material-symbols-outlined">home_pin</span>',
            className: 'destination-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 40], // Anchor at the bottom center
            popupAnchor: [0, -40]
        });

        if (map && destinations) {
            destinations.forEach(dest => {
                var marker = L.marker([dest.lat, dest.lng], { icon: destinationIcon }).addTo(map)
                    .bindPopup(dest.title);
                destinationMarkers.push(marker);
            });
        }
    }

    function clearDestinationMarkers() {
        destinationMarkers.forEach(marker => map.removeLayer(marker));
        destinationMarkers = [];
    }

    function drawRoute(startLat, startLng, endLat, endLng) {
        clearRoute();
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(startLat, startLng),
                L.latLng(endLat, endLng)
            ],
            routeWhileDragging: false,
            addWaypoints: false, // Do not allow adding new waypoints
            show: false, // Hide itinerary
            lineOptions: {
                styles: [{color: '#1E88E5', opacity: 0.8, weight: 6}]
            }
        }).addTo(map);
    }

    function clearRoute() {
        if (routingControl) {
            map.removeControl(routingControl);
            routingControl = null;
        }
    }

    // Variables para gestionar marcadores de conductores
    var driverMarkers = {};
    var carritoIconUrl = null;

    // Función para configurar la URL del icono del carrito para conductores
    function setCarritoIcon(iconUrl) {
        carritoIconUrl = iconUrl;
    }

    // Función para actualizar conductores cercanos en el mapa
    function updateNearbyDrivers(drivers) {
        if (!drivers || !Array.isArray(drivers)) {
            console.error("Drivers debe ser un array");
            return;
        }

        // IDs de conductores actuales
        var currentDriverIds = drivers.map(d => d.id);
        
        // Remover conductores que ya no están en la lista
        Object.keys(driverMarkers).forEach(id => {
            if (!currentDriverIds.includes(parseInt(id))) {
                map.removeLayer(driverMarkers[id]);
                delete driverMarkers[id];
            }
        });

        // Agregar o actualizar conductores
        drivers.forEach(driver => {
            if (!driver.lat || !driver.lng) return;

            // Usar SOLO la imagen PNG del carrito
            var iconUrl = carritoIconUrl || driver.iconUrl;
            if (!iconUrl) return;
            
            var carritoIcon = L.icon({
                iconUrl: iconUrl,
                iconSize: [120, 120],
                iconAnchor: [60, 60],
                popupAnchor: [0, -60]
            });

            if (driverMarkers[driver.id]) {
                driverMarkers[driver.id].setLatLng([driver.lat, driver.lng]).setIcon(carritoIcon);
            } else {
                var marker = L.marker([driver.lat, driver.lng], { icon: carritoIcon })
                    .addTo(map)
                    .bindPopup((driver.name || 'Conductor disponible') + '<br><small>' + (driver.distance ? driver.distance + ' km' : '') + '</small>');
                driverMarkers[driver.id] = marker;
            }
        });
    }

    // Función para limpiar todos los conductores del mapa
    function clearDriverMarkers() {
        Object.values(driverMarkers).forEach(marker => map.removeLayer(marker));
        driverMarkers = {};
    }

    </script>
    </body>
    </html>
`;
