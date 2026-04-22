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
            transition: all 0.5s linear; /* suaviza movimiento */
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
            transition: all 0.5s linear; /* suaviza movimiento */
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
        }
        
        /* Estilar Puntos de Interés como punto rojo simple */
        .simple-red-dot {
            width: 14px;
            height: 14px;
            background-color: #d32f2f;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
        }

        .carrito-marker {
            font-family: 'Material Symbols Outlined';
            font-size: 46px;
            color: #1E88E5; /* Blue car icon */
            text-align: center;
        }
        .car-icon-transition {
            transition: transform 1.5s linear !important;
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

    // Desabilitar zoom con doble tap
    map.doubleClickZoom.disable();

    // Usamos CartoDB Voyager (Estilo limpio tipo Google Maps) que permite peticiones sin Referer desde WebViews
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
    }).addTo(map);

    function centerMap(lat, lon) {
        if (map && lat !== undefined && lon !== undefined) {
            // Si el mapa aún tiene el zoom inicial (mundo), hacemos un vuelo cinemático de acercamiento rápido
            if (map.getZoom() < 15) {
                map.flyTo([lat, lon], 17, { animate: true, duration: 1.5 });
            } else {
                // Empleamos panTo con duración extendida para deslizar la cámara suavemente
                map.panTo([lat, lon], { animate: true, duration: 1.5, easeLinearity: 0.25 });
            }
        } else {
            console.error("Error: Mapa no inicializado o coordenadas no válidas.");
        }
    }

    function placeUserMarker(lat, lon, photoBase64, isDriver) {
        if (map && lat !== undefined && lon !== undefined) {
            var iconToUse;
            var currentIconType = isDriver ? 'car' : (photoBase64 ? 'photo' : 'dot');
            
            // CRÍTICO PARA ANIMACIONES: Leaflet destruye el NODO visual si usamos setIcon innecesariamente.
            // Solo creamos iconToUse si de verdad necesitamos cambiar el TIPO visual del usuario, sino solo re-usamos su div CSS
            var demandsNewIcon = !userMarker || (userMarker._customIconType !== currentIconType);

            if (demandsNewIcon) {
                if (isDriver && carritoIconUrl) {
                    iconToUse = L.icon({
                        iconUrl: carritoIconUrl,
                        iconSize: [40, 40], // Mismo tamaño que updateNearbyDrivers
                        iconAnchor: [20, 20],
                        popupAnchor: [0, -20],
                        className: 'car-icon-transition'
                    });
                } else if (photoBase64 && !isDriver) {
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
            }

            if (userMarker) {
                // Este simple setLatLng detona la magia del CSS hardware 'transform' en vez de recargar texturas
                userMarker.setLatLng([lat, lon]);
                if (demandsNewIcon && iconToUse) {
                    userMarker.setIcon(iconToUse);
                    userMarker._customIconType = currentIconType;
                }
            } else {
                userMarker = L.marker([lat, lon], { icon: iconToUse }).addTo(map).bindPopup('Tu ubicación');
                userMarker._customIconType = currentIconType;
            }
        } else {
            console.error("Error: Coordenadas no válidas para el marcador.");
        }
    }

    function removeUserMarker() {
        if (userMarker && map) {
            map.removeLayer(userMarker);
            userMarker = null;
        }
    }

    function addDestinationMarkers(destinations) {
        clearDestinationMarkers();

        if (map && destinations) {
            destinations.forEach(dest => {
                var lat = dest.lat !== undefined ? dest.lat : dest.latitude;
                var lng = dest.lng !== undefined ? dest.lng : dest.longitude;
                var title = dest.nombre || dest.title || dest.name || 'Punto de Interés';
                
                if (lat === undefined || lng === undefined) return;

                var destinationIcon = L.divIcon({
                    html: '<div class="simple-red-dot"></div>',
                    className: '', // quitar clases de leaflet por defecto
                    iconSize: [14, 14],
                    iconAnchor: [7, 7], // Centro
                    popupAnchor: [0, -7]
                });

                var marker = L.marker([lat, lng], { icon: destinationIcon }).addTo(map)
                    .bindPopup(title);
                destinationMarkers.push(marker);
            });
        }
    }

    function clearDestinationMarkers() {
        destinationMarkers.forEach(marker => map.removeLayer(marker));
        destinationMarkers = [];
    }

    // --- GESTIÓN DE CONDUCTORES ---

    var driverMarkers = {};
    var carritoIconUrl = null;

    // Función para configurar la URL del icono del carrito
    function setCarritoIcon(iconUrl) {
        carritoIconUrl = iconUrl;
    }

    // Función para actualizar conductores cercanos en el mapa
    function updateNearbyDrivers(drivers) {
        if (!drivers || !Array.isArray(drivers)) return;

        // Si no hay conductores, limpiar todo
        if (drivers.length === 0) {
            clearDriverMarkers();
            return;
        }

        var currentDriverIds = drivers.map(d => d.id);
        
        // Remover conductores que ya no están
        Object.keys(driverMarkers).forEach(id => {
            if (!currentDriverIds.includes(parseInt(id)) && !currentDriverIds.includes(id)) {
                map.removeLayer(driverMarkers[id]);
                delete driverMarkers[id];
            }
        });

        // Agregar o actualizar conductores
        drivers.forEach(driver => {
            if (!driver.lat || !driver.lng) return;

            var iconUrl = carritoIconUrl || driver.iconUrl;
            if (!iconUrl) return;

            if (driverMarkers[driver.id]) {
                // Al igual que con placeUserMarker, solo actualizamos coordenadas para proteger la magia del CSS hardware!
                // NO usar setIcon() innecesariamente
                driverMarkers[driver.id].setLatLng([driver.lat, driver.lng]);
            } else {
                var carritoIcon = L.icon({
                    iconUrl: iconUrl,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                    popupAnchor: [0, -20],
                    className: 'car-icon-transition'
                });

                var marker = L.marker([driver.lat, driver.lng], { icon: carritoIcon })
                    .addTo(map);
                driverMarkers[driver.id] = marker;
            }
        });
    }

    // Función para limpiar todos los conductores
    function clearDriverMarkers() {
        Object.values(driverMarkers).forEach(marker => map.removeLayer(marker));
        driverMarkers = {};
    }

    // --- FIN GESTIÓN CONDUCTORES ---

    var customRouteLine = null;
    var fullRouteCoords = [];
    var lastTargetDest = null;

    // Función para dibujar ruta entre dos puntos
    function drawRoute(startLat, startLng, endLat, endLng, paddingBottom, animateZoom) {
        if (!map || !startLat || !startLng || !endLat || !endLng) return;

        var waypoints = [
            L.latLng(startLat, startLng),
            L.latLng(endLat, endLng)
        ];

        if (routingControl) {
            // Evaluamos contra nuestra propia variable inmutable en vez de oldPl.
            // OSRM modifica getWaypoints() ajustándolos (snapping) a la calle, 
            // lo que causaba que fallara el caché para el conductor si el pasajero estaba lejos de la calle.
            var destDistance = lastTargetDest ? lastTargetDest.distanceTo(waypoints[1]) : Infinity;
            
            if (destDistance < 5) {
                var isOffRoute = false;

                // El destino es el mismo.
                if (fullRouteCoords && fullRouteCoords.length > 0 && customRouteLine) {
                    var currentLatLng = L.latLng(startLat, startLng);
                    var closestIndex = 0;
                    var minDistance = Infinity;

                    for (var i = 0; i < fullRouteCoords.length; i++) {
                        var d = currentLatLng.distanceTo(fullRouteCoords[i]);
                        if (d < minDistance) {
                            minDistance = d;
                            closestIndex = i;
                        }
                    }

                    // Detector Inteligente: Si la distancia al punto más cercano de la ruta supera 15m
                    if (minDistance > 15) {
                        isOffRoute = true;
                    } else {
                        var slicedCoords = fullRouteCoords.slice(closestIndex);
                        slicedCoords.unshift(currentLatLng);
                        
                        customRouteLine.setLatLngs(slicedCoords);
                    }
                }

                // Si se mantuvo en el camino correcto o dentro del margen, evitamos usar internet.
                if (!isOffRoute) {
                    if (animateZoom !== false) {
                        doCameraFit([L.latLng(startLat, startLng), waypoints[1]], paddingBottom);
                    } else {
                        // En vez de congelar la cámara, deslizamos la vista lentamente hacia donde conduce el auto
                        map.panTo([startLat, startLng], { animate: true, duration: 1.0, easeLinearity: 0.25 });
                    }
                    return;
                }
            }
            routingControl.setWaypoints(waypoints);
            addDestinationMarkers([{lat: endLat, lng: endLng, title: 'Destino final'}]);
        } else {
            routingControl = L.Routing.control({
                waypoints: waypoints,
                routeWhileDragging: false, 
                showAlternatives: false,
                addWaypoints: false,
                fitSelectedRoutes: false, 
                // Matamos los marcadores A y B automáticos del plugin (los arrastrables y estáticos)
                createMarker: function() { return null; },
                // Ocultamos la línea original de OSRM pintándola transparente
                lineOptions: {
                    styles: [{color: 'transparent', opacity: 0, weight: 0}]
                }
            }).addTo(map);

            addDestinationMarkers([{lat: endLat, lng: endLng, title: 'Destino final'}]);

            // Al descargar la ruta la primera vez, extraemos sus coordenadas para manipularlas localmente!
            routingControl.on('routesfound', function(e) {
                var routes = e.routes;
                if (routes && routes.length > 0) {
                    fullRouteCoords = routes[0].coordinates;
                    if (!customRouteLine) {
                        customRouteLine = L.polyline(fullRouteCoords, {color: '#144985', opacity: 0.8, weight: 6}).addTo(map);
                    } else {
                        customRouteLine.setLatLngs(fullRouteCoords);
                    }
                }
            });
        }

        lastTargetDest = waypoints[1];
        if (animateZoom !== false) doCameraFit(waypoints, paddingBottom);
    }
    
    function doCameraFit(waypoints, paddingBottom) {
        var padBottom = paddingBottom || 50;
        map.fitBounds(waypoints, {
            paddingTopLeft: [50, 50],
            paddingBottomRight: [50, padBottom],
            animate: true,
            duration: 0.5
        });
    }

    // Función para limpiar ruta
    function clearRoute() {
        if (routingControl) {
            map.removeControl(routingControl);
            routingControl = null;
        }
        if (customRouteLine) {
            map.removeLayer(customRouteLine);
            customRouteLine = null;
        }
        fullRouteCoords = [];
    }

    // Capturar doble clic para seleccionar destino personalizado
    map.on('dblclick', function(e) {
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'MAP_DOUBLE_TAP',
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
            }));
        } else if (window.parent) {
            window.parent.postMessage(JSON.stringify({
                type: 'MAP_DOUBLE_TAP',
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
            }), '*');
        }
    });

    window.addEventListener('message', function(event) {
        try {
            if (event.data && event.data.type === 'EVAL') {
                eval(event.data.code);
            }
        } catch(e) {
            console.error('Error evaluando código inyectado en iframe:', e);
        }
    });

    </script>
    </body>
    </html>
`;
