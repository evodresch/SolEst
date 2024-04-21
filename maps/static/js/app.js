var map = L.map('mapid').setView([51.1657, 10.4515], 5.5); // Center map on Germany
var germanyLayer; // The layer with the German territory

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Fetch and add GeoJSON layer of Germany
fetch('/static/data/3_mittel.geo.json')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        germanyLayer = L.geoJSON(data, {

            style: function (feature) {
                return {
                    fillColor: '#ff7800',  // Color of the fill
                    fillOpacity: 0.1,      // Transparency of the fill
                    color: '#000',         // Color of the border
                    weight: 1,             // Thickness of the border
                    opacity: 0.8           // Transparency of the border
                };
            }
        }).addTo(map);
    });

map.on('click', function(e) {
    if (germanyLayer) {
        var clickPoint = turf.point([e.latlng.lng, e.latlng.lat]); // Create a point for the click location
        var features = germanyLayer.toGeoJSON();
        var isWithinGermany = false;

        if (features.type === 'FeatureCollection') {
            features.features.forEach(function(feature) {
                if (turf.booleanPointInPolygon(clickPoint, feature.geometry)) {
                    isWithinGermany = true;
                }
            });
        }

        if (isWithinGermany) {
            var coord = e.latlng;
            var lat = coord.lat.toFixed(2);
            var lng = coord.lng.toFixed(2);
            console.log('Fetching location for:', lat, lng);  // Log fetching operation
            fetch(`/maps/get-location/?lat=${lat}&lng=${lng}`)
                .then(response => response.json())
                .then(data => {
                    document.getElementById('info').innerHTML = "Last selected location";
                    document.getElementById('coordinates').innerHTML = "Latitude: " + lat + ", Longitude: " + lng;
                    document.getElementById('town_name').innerHTML = "Nearest town/city: " + data.location;
                })
                .catch(error => console.log('Error:', error));
        } else {
            document.getElementById('info').innerHTML = "Please select a location within Germany only.";
        }
    } else {
        console.log('GeoJSON layer is not ready or undefined.');
    }
});