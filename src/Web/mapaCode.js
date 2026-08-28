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
            position: relative;
            z-index: 1000;
        }

        .simple-blue-dot {
            width: 14px;
            height: 14px;
            background-color: #1976D2;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
            position: relative;
            z-index: 1000;
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
    var OSRM_URL = '${process.env.EXPO_PUBLIC_OSRM_URL || "http://router.project-osrm.org/route/v1"}';
    var map = L.map('map').setView([-0.9676533, -80.737754], 14);
    var userMarker;
    var destinationMarkers = [];
    var currentDestinationsStr = "";
    var routingControl;

    // Desabilitar zoom con doble tap
    map.doubleClickZoom.disable();

    // Usamos OpenStreetMap para no depender de una API key de un proveedor
    // comercial de mapas. La atribución es obligatoria para este servicio.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
            var isFallback = userMarker && userMarker._isFallback;
            var demandsNewIcon = !userMarker || (userMarker._customIconType !== currentIconType) || (isFallback && isDriver && carritoIconUrl);

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
                    
                    // Mark as fallback if we wanted a car but iconUrl wasn't ready
                    if (isDriver && !carritoIconUrl) {
                        iconToUse._isFallback = true;
                    }
                }
            }

            if (userMarker) {
                // Este simple setLatLng detona la magia del CSS hardware 'transform' en vez de recargar texturas
                userMarker.setLatLng([lat, lon]);
                if (demandsNewIcon && iconToUse) {
                    userMarker.setIcon(iconToUse);
                    userMarker._customIconType = currentIconType;
                    userMarker._isFallback = iconToUse._isFallback || false;
                }
            } else {
                userMarker = L.marker([lat, lon], { icon: iconToUse }).addTo(map).bindPopup('Tu ubicación');
                userMarker._customIconType = currentIconType;
                userMarker._isFallback = iconToUse._isFallback || false;
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
        if (!map || !destinations) return;
        
        var newDestStr = JSON.stringify(destinations);
        if (newDestStr === currentDestinationsStr && destinationMarkers.length > 0) {
            return; // No need to redraw identical markers, prevents DOM thrashing
        }
        
        destinationMarkers.forEach(marker => map.removeLayer(marker));
        destinationMarkers = [];
        currentDestinationsStr = newDestStr;

        destinations.forEach(dest => {
            var lat = dest.lat !== undefined ? dest.lat : dest.latitude;
            var lng = dest.lng !== undefined ? dest.lng : dest.longitude;
            var title = dest.nombre || dest.title || dest.name || 'Punto de Interés';
            var isPickup = dest.type === 'pickup';
            
            if (lat === undefined || lng === undefined) return;

            var colorClass = isPickup ? 'simple-blue-dot' : 'simple-red-dot';

            var destinationIcon = L.divIcon({
                html: '<div class="' + colorClass + '"></div>',
                className: '', 
                iconSize: [14, 14],
                iconAnchor: [7, 7],
                popupAnchor: [0, -7]
            });

            var marker = L.marker([lat, lng], { icon: destinationIcon }).addTo(map)
                .bindPopup(title);
            destinationMarkers.push(marker);
        });
    }

    function clearDestinationMarkers() {
        destinationMarkers.forEach(marker => map.removeLayer(marker));
        destinationMarkers = [];
        currentDestinationsStr = "";
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
                if (fullRouteCoords && fullRouteCoords.length > 1 && customRouteLine) {
                    var currentLatLng = L.latLng(startLat, startLng);
                    var currentPoint = map.project(currentLatLng, 18);
                    
                    var minDistancePx = Infinity;
                    var closestSegmentIndex = 0;

                    for (var i = 0; i < fullRouteCoords.length - 1; i++) {
                        var p1 = map.project(fullRouteCoords[i], 18);
                        var p2 = map.project(fullRouteCoords[i+1], 18);
                        var dPx = L.LineUtil.pointToSegmentDistance(currentPoint, p1, p2);
                        if (dPx < minDistancePx) {
                            minDistancePx = dPx;
                            closestSegmentIndex = i;
                        }
                    }

                    // Convertir la distancia mínima a metros reales
                    var cp1 = map.project(fullRouteCoords[closestSegmentIndex], 18);
                    var cp2 = map.project(fullRouteCoords[closestSegmentIndex+1], 18);
                    var closestPointPx = L.LineUtil.closestPointOnSegment(currentPoint, cp1, cp2);
                    var closestLatLng = map.unproject(closestPointPx, 18);
                    var distanceMeters = currentLatLng.distanceTo(closestLatLng);

                    // Detector Inteligente: Si se aleja más de 50 metros del segmento más cercano
                    if (distanceMeters > 50) {
                        isOffRoute = true;
                    } else {
                        // El auto está en el segmento [closestSegmentIndex, closestSegmentIndex+1].
                        // Eliminamos los puntos anteriores y reconstruimos la ruta desde la posición actual del auto.
                        var remainingRoute = fullRouteCoords.slice(closestSegmentIndex + 1);
                        var lineCoords = [currentLatLng].concat(remainingRoute);
                        
                        // Actualizamos permanentemente para que el próximo cálculo parta de aquí
                        fullRouteCoords = lineCoords;
                        customRouteLine.setLatLngs(lineCoords);
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
            clearDestinationMarkers();
            addDestinationMarkers([{lat: endLat, lng: endLng, title: 'Destino final'}]);
        } else {
            routingControl = L.Routing.control({
                router: new L.Routing.OSRMv1({
                    serviceUrl: OSRM_URL
                }),
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
                    
                    // Asegurar que la línea visual SIEMPRE conecte con el carrito, 
                    // incluso si OSRM hace "snap" a la calle más cercana.
                    // Usamos e.waypoints para evitar el bug de closure con la variable waypoints original.
                    var currentLatLng = L.latLng(e.waypoints[0].latLng.lat, e.waypoints[0].latLng.lng);
                    var lineCoords = [currentLatLng].concat(fullRouteCoords);
                    
                    // Aseguramos que fullRouteCoords tenga esta línea para futuros recálculos
                    fullRouteCoords = lineCoords;

                    if (!customRouteLine) {
                        customRouteLine = L.polyline(lineCoords, {color: '#144985', opacity: 0.8, weight: 6}).addTo(map);
                    } else {
                        customRouteLine.setLatLngs(lineCoords);
                    }
                }
            });
        }

        lastTargetDest = waypoints[1];
        if (animateZoom !== false) doCameraFit(waypoints, paddingBottom);
    }

    function drawMultiRoute(waypointsJSON, paddingBottom, animateZoom) {
        if (!map) return;
        var points = JSON.parse(waypointsJSON);
        if (!points || points.length < 2) return;

        var waypoints = points.map(function(p) { return L.latLng(p.lat, p.lng); });

        if (routingControl) {
            var currentWps = routingControl.getWaypoints();
            var wpChanged = false;
            if (!currentWps || currentWps.length === 0 || currentWps.length !== waypoints.length) {
                wpChanged = true;
            } else {
                // Check if any intermediate points changed (ignoring driver which is index 0)
                for (var i = 1; i < waypoints.length; i++) {
                    if (!currentWps[i].latLng || 
                        currentWps[i].latLng.lat !== waypoints[i].lat || 
                        currentWps[i].latLng.lng !== waypoints[i].lng) {
                        wpChanged = true;
                        break;
                    }
                }
            }
            var destDistance = lastTargetDest ? lastTargetDest.distanceTo(waypoints[waypoints.length - 1]) : Infinity;
            
            // Si el último destino no cambió, los waypoints intermedios son los mismos, verificamos si está en ruta
            if (!wpChanged && destDistance < 5) {
                var isOffRoute = false;
                if (fullRouteCoords && fullRouteCoords.length > 1 && customRouteLine) {
                    var currentLatLng = L.latLng(points[0].lat, points[0].lng);
                    var currentPoint = map.project(currentLatLng, 18);
                    
                    var minDistancePx = Infinity;
                    var closestSegmentIndex = 0;

                    for (var i = 0; i < fullRouteCoords.length - 1; i++) {
                        var p1 = map.project(fullRouteCoords[i], 18);
                        var p2 = map.project(fullRouteCoords[i+1], 18);
                        var dPx = L.LineUtil.pointToSegmentDistance(currentPoint, p1, p2);
                        if (dPx < minDistancePx) {
                            minDistancePx = dPx;
                            closestSegmentIndex = i;
                        }
                    }

                    var cp1 = map.project(fullRouteCoords[closestSegmentIndex], 18);
                    var cp2 = map.project(fullRouteCoords[closestSegmentIndex+1], 18);
                    var closestPointPx = L.LineUtil.closestPointOnSegment(currentPoint, cp1, cp2);
                    var closestLatLng = map.unproject(closestPointPx, 18);
                    var distanceMeters = currentLatLng.distanceTo(closestLatLng);

                    if (distanceMeters > 50) {
                        isOffRoute = true;
                    } else {
                        var remainingRoute = fullRouteCoords.slice(closestSegmentIndex + 1);
                        var lineCoords = [currentLatLng].concat(remainingRoute);
                        
                        fullRouteCoords = lineCoords;
                        customRouteLine.setLatLngs(lineCoords);
                    }
                }

                if (!isOffRoute) {
                    // Update markers if needed
                    clearDestinationMarkers();
                    addDestinationMarkers(points.slice(1));
                    if (animateZoom !== false) {
                        doCameraFit(waypoints, paddingBottom);
                    } else {
                        map.panTo([points[0].lat, points[0].lng], { animate: true, duration: 1.0, easeLinearity: 0.25 });
                    }
                    return;
                }
            }

            routingControl.setWaypoints(waypoints);
            clearDestinationMarkers();
            addDestinationMarkers(points.slice(1));
        } else {
            routingControl = L.Routing.control({
                router: new L.Routing.OSRMv1({
                    serviceUrl: OSRM_URL
                }),
                waypoints: waypoints,
                routeWhileDragging: false, 
                showAlternatives: false,
                addWaypoints: false,
                fitSelectedRoutes: false, 
                createMarker: function() { return null; },
                lineOptions: {
                    styles: [{color: 'transparent', opacity: 0, weight: 0}]
                }
            }).addTo(map);

            addDestinationMarkers(points.slice(1));

            routingControl.on('routesfound', function(e) {
                var routes = e.routes;
                if (routes && routes.length > 0) {
                    fullRouteCoords = routes[0].coordinates;
                    var currentLatLng = L.latLng(e.waypoints[0].latLng.lat, e.waypoints[0].latLng.lng);
                    var lineCoords = [currentLatLng].concat(fullRouteCoords);
                    fullRouteCoords = lineCoords;
                    if (!customRouteLine) {
                        customRouteLine = L.polyline(lineCoords, {color: '#144985', opacity: 0.8, weight: 6}).addTo(map);
                    } else {
                        customRouteLine.setLatLngs(lineCoords);
                    }
                }
            });
        }

        lastTargetDest = waypoints[waypoints.length - 1];
        if (animateZoom !== false) doCameraFit(waypoints, paddingBottom);
    }
    
    function doCameraFit(waypoints, paddingBottom) {
        var padBottom = paddingBottom || 50;
        map.fitBounds(waypoints, {
            paddingTopLeft: [50, 50],
            paddingBottomRight: [50, padBottom],
            animate: true,
            duration: 0.5,
            maxZoom: 16
        });
    }

    function clearRoute() {
        if (routingControl) {
            try {
                map.removeControl(routingControl);
            } catch (e) {
                console.warn('LRM removeControl error:', e);
            }
            routingControl = null;
        }
        if (customRouteLine) {
            map.removeLayer(customRouteLine);
            customRouteLine = null;
        }
        fullRouteCoords = [];
        lastTargetDest = null;
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
